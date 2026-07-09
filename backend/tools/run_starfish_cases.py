import argparse
import logging
from pathlib import Path
import sys


BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.services.starfish_runner import StarfishRunnerService  # noqa: E402
from tools.starfish_case_matrix import (  # noqa: E402
    StarfishProjectCase,
    build_starfish_edge_cases,
    generate_case_xml,
)


def check_fragments(case: StarfishProjectCase, xml_files: dict[str, str]) -> list[str]:
    errors: list[str] = []
    for filename, fragment in case.expected_fragments:
        content = xml_files.get(filename)
        if content is None:
            errors.append(f"{case.name}: missing expected file {filename}")
        elif fragment not in content:
            errors.append(f"{case.name}: expected fragment not found in {filename}: {fragment}")

    for filename, fragment in case.rejected_fragments:
        content = xml_files.get(filename, "")
        if fragment in content:
            errors.append(f"{case.name}: rejected fragment found in {filename}: {fragment}")

    return errors


def run_case(
    case: StarfishProjectCase,
    runner: StarfishRunnerService,
    timeout: int,
) -> tuple[bool, str]:
    xml_files = generate_case_xml(case)
    fragment_errors = check_fragments(case, xml_files)
    if fragment_errors:
        return False, "\n".join(fragment_errors)

    result = runner.run_xml_files(xml_files, timeout=timeout)
    if not result.ok:
        return False, result.output

    return True, result.last_output_line


def main() -> int:
    logging.basicConfig(level=logging.ERROR)

    parser = argparse.ArgumentParser(description="Run StarfishCLI edge-case validation projects.")
    parser.add_argument("--timeout", type=int, default=20, help="Per-case timeout in seconds.")
    args = parser.parse_args()

    runner = StarfishRunnerService()
    try:
        runner.ensure_available()
    except (FileNotFoundError, RuntimeError) as exc:
        print(f"ERROR: {exc}")
        return 2

    print(f"Using {runner.java_version_line()}")
    print(f"Using Starfish CLI: {runner.starfish_jar}")

    failures: list[tuple[str, str]] = []
    for case in build_starfish_edge_cases():
        ok, detail = run_case(case, runner, args.timeout)
        status = "PASS" if ok else "FAIL"
        print(f"[{status}] {case.name} - {case.description}")
        if detail:
            print(f"       {detail}")
        if not ok:
            failures.append((case.name, detail))

    if failures:
        print(f"\n{len(failures)} Starfish edge case(s) failed.")
        return 1

    print("\nAll Starfish edge cases passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
