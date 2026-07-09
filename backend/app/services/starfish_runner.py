import argparse
from dataclasses import dataclass
import os
from pathlib import Path, PurePath
import shutil
import subprocess
import sys
import tempfile
import time
from typing import Mapping, Optional


BACKEND_ROOT = Path(__file__).resolve().parents[2]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.models.simulation import SimulationProject
from app.services.xml_generator import XMLGeneratorService


@dataclass(frozen=True)
class StarfishRunResult:
    returncode: int
    stdout: str
    stderr: str
    elapsed_seconds: float
    command: tuple[str, ...]
    run_dir: Optional[str] = None
    timed_out: bool = False

    @property
    def output(self) -> str:
        return f"{self.stdout}\n{self.stderr}".strip()

    @property
    def ok(self) -> bool:
        return self.returncode == 0 and not self.timed_out and "ERROR:" not in self.output

    @property
    def last_output_line(self) -> str:
        return next((line for line in reversed(self.output.splitlines()) if line.strip()), "")


class StarfishRunnerService:
    def __init__(
        self,
        starfish_jar: Optional[Path | str] = None,
        java_executable: Optional[str] = None,
    ):
        self.starfish_jar = self._resolve_starfish_jar(starfish_jar)
        self.java_executable = java_executable or shutil.which("java")

    def ensure_available(self) -> None:
        if not self.java_executable:
            raise RuntimeError("java was not found on PATH")
        if not self.starfish_jar.exists():
            raise FileNotFoundError(
                f"StarfishCLI.jar was not found at {self.starfish_jar}. "
                "Set STARFISH_JAR if the jar lives elsewhere."
            )

    def java_version_line(self) -> str:
        self.ensure_available()
        result = subprocess.run(
            [str(self.java_executable), "-version"],
            capture_output=True,
            text=True,
            timeout=10,
        )
        return next(iter((result.stderr or result.stdout).splitlines()), "java version: unknown")

    def run_project(
        self,
        project: SimulationProject,
        timeout: int = 60,
        work_dir: Optional[Path | str] = None,
        keep_work_dir: bool = False,
    ) -> StarfishRunResult:
        xml_files = XMLGeneratorService().generate_xml_files(project)
        return self.run_xml_files(
            xml_files,
            timeout=timeout,
            work_dir=work_dir,
            keep_work_dir=keep_work_dir,
        )

    def run_xml_files(
        self,
        xml_files: Mapping[str, str],
        timeout: int = 60,
        work_dir: Optional[Path | str] = None,
        keep_work_dir: bool = False,
    ) -> StarfishRunResult:
        self.ensure_available()
        if "starfish.xml" not in {self._safe_filename(name) for name in xml_files}:
            raise ValueError("xml_files must include starfish.xml")

        if work_dir is not None:
            run_dir = Path(work_dir)
            run_dir.mkdir(parents=True, exist_ok=True)
            self.write_xml_files(run_dir, xml_files)
            return self._run_in_dir(run_dir, timeout, keep_result_dir=True)

        if keep_work_dir:
            run_dir = Path(tempfile.mkdtemp(prefix="starfish_run_"))
            self.write_xml_files(run_dir, xml_files)
            return self._run_in_dir(run_dir, timeout, keep_result_dir=True)

        with tempfile.TemporaryDirectory(prefix="starfish_run_") as tmp_dir:
            run_dir = Path(tmp_dir)
            self.write_xml_files(run_dir, xml_files)
            return self._run_in_dir(run_dir, timeout, keep_result_dir=False)

    def run_directory(
        self,
        project_dir: Path | str,
        timeout: int = 60,
    ) -> StarfishRunResult:
        self.ensure_available()
        run_dir = Path(project_dir).expanduser().resolve()
        if not run_dir.is_dir():
            raise NotADirectoryError(f"Starfish project directory does not exist: {run_dir}")
        if not (run_dir / "starfish.xml").exists():
            raise FileNotFoundError(f"Missing required file: {run_dir / 'starfish.xml'}")
        return self._run_in_dir(run_dir, timeout, keep_result_dir=True)

    def write_xml_files(self, target_dir: Path, xml_files: Mapping[str, str]) -> None:
        target_dir.mkdir(parents=True, exist_ok=True)
        for filename, content in xml_files.items():
            safe_name = self._safe_filename(filename)
            (target_dir / safe_name).write_text(content, encoding="utf-8")

    def _run_in_dir(
        self,
        run_dir: Path,
        timeout: int,
        keep_result_dir: bool,
    ) -> StarfishRunResult:
        command = (str(self.java_executable), "-jar", str(self.starfish_jar))
        started = time.monotonic()
        try:
            result = subprocess.run(
                list(command),
                cwd=run_dir,
                capture_output=True,
                text=True,
                timeout=timeout,
            )
            elapsed = time.monotonic() - started
            return StarfishRunResult(
                returncode=result.returncode,
                stdout=result.stdout,
                stderr=result.stderr,
                elapsed_seconds=elapsed,
                command=command,
                run_dir=str(run_dir) if keep_result_dir else None,
            )
        except subprocess.TimeoutExpired as exc:
            elapsed = time.monotonic() - started
            stdout = self._decode_timeout_output(exc.stdout)
            stderr = self._decode_timeout_output(exc.stderr)
            stderr = f"{stderr}\nTimed out after {timeout} seconds".strip()
            return StarfishRunResult(
                returncode=124,
                stdout=stdout,
                stderr=stderr,
                elapsed_seconds=elapsed,
                command=command,
                run_dir=str(run_dir) if keep_result_dir else None,
                timed_out=True,
            )

    @staticmethod
    def _resolve_starfish_jar(starfish_jar: Optional[Path | str]) -> Path:
        if starfish_jar is not None:
            return Path(starfish_jar).expanduser().resolve()

        configured = os.environ.get("STARFISH_JAR")
        if configured:
            return Path(configured).expanduser().resolve()

        repo_root = Path(__file__).resolve().parents[3]
        return repo_root / "StarfishCLI.jar"

    @staticmethod
    def _safe_filename(filename: str) -> str:
        safe_name = PurePath(str(filename).replace("\\", "/")).name
        if not safe_name or safe_name in {".", ".."}:
            raise ValueError(f"Invalid XML filename: {filename}")
        return safe_name

    @staticmethod
    def _decode_timeout_output(value) -> str:
        if value is None:
            return ""
        if isinstance(value, bytes):
            return value.decode("utf-8", errors="replace")
        return str(value)


def main(argv: Optional[list[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Run StarfishCLI from ezxml4starfish.")
    parser.add_argument(
        "--project-dir",
        type=Path,
        help="Directory containing starfish.xml and the XML files it loads.",
    )
    parser.add_argument("--timeout", type=int, default=60, help="Run timeout in seconds.")
    args = parser.parse_args(argv)

    runner = StarfishRunnerService()
    try:
        runner.ensure_available()
    except (FileNotFoundError, RuntimeError) as exc:
        print(f"ERROR: {exc}")
        return 2

    print(f"Using {runner.java_version_line()}")
    print(f"Using Starfish CLI: {runner.starfish_jar}")

    if args.project_dir is None:
        print("Starfish runner is ready. Pass --project-dir to run a project directory.")
        return 0

    try:
        result = runner.run_directory(args.project_dir, timeout=args.timeout)
    except (FileNotFoundError, NotADirectoryError, ValueError) as exc:
        print(f"ERROR: {exc}")
        return 2

    if result.output:
        print(result.output)
    print(f"Starfish exit code: {result.returncode}")
    return 0 if result.ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
