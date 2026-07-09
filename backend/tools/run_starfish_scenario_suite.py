import argparse
import csv
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
import sys
from typing import Callable


BACKEND_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = BACKEND_ROOT.parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.models.simulation import (  # noqa: E402
    Boundary,
    DomainSettings,
    GeometryNode,
    GlobalSettings,
    Material,
    SimulationProject,
    Source,
)
from app.services.starfish_runner import StarfishRunResult, StarfishRunnerService  # noqa: E402
from app.services.xml_generator import XMLGeneratorService  # noqa: E402


@dataclass(frozen=True)
class Scenario:
    name: str
    description: str
    project_factory: Callable[[], SimulationProject]


def default_suite_dir() -> Path:
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return REPO_ROOT / "starfish_runs" / f"scenario_suite_{stamp}"


def channel_boundaries(length: float = 0.2, height: float = 0.1) -> list[Boundary]:
    return [
        Boundary(
            name="inlet",
            type="virtual",
            nodes=[GeometryNode(x=0.0, y=height), GeometryNode(x=0.0, y=0.0)],
        ),
        Boundary(
            name="bottom_wall",
            type="solid",
            nodes=[GeometryNode(x=0.0, y=0.0), GeometryNode(x=length, y=0.0)],
        ),
        Boundary(
            name="top_wall",
            type="solid",
            nodes=[GeometryNode(x=0.0, y=height), GeometryNode(x=length, y=height)],
        ),
        Boundary(
            name="outlet",
            type="virtual",
            nodes=[GeometryNode(x=length, y=0.0), GeometryNode(x=length, y=height)],
        ),
    ]


def channel_domain(length_nodes: int = 21, height_nodes: int = 11) -> DomainSettings:
    return DomainSettings(
        type="xy",
        mesh_name="mesh",
        origin=[0.0, 0.0],
        spacing=[0.01, 0.01],
        nodes=[length_nodes, height_nodes],
    )


def wall_material() -> Material:
    return Material(name="wall", type="solid", density=8000)


def oxygen_ion(spwt: float = 1e8) -> Material:
    return Material(name="O+", type="kinetic", molwt=15.999, charge=1, spwt=spwt)


def xenon_neutral(spwt: float = 1e8) -> Material:
    return Material(name="Xe", type="kinetic", molwt=131.293, charge=0, spwt=spwt)


def uniform_oxygen_beam() -> SimulationProject:
    return SimulationProject(
        settings=GlobalSettings(iterations=100, time_step=1e-6, solver_type="none", max_cores=1),
        domain=channel_domain(),
        boundaries=channel_boundaries(),
        materials=[oxygen_ion(), wall_material()],
        sources=[
            Source(
                name="ion_beam",
                type="uniform",
                material="O+",
                boundary="inlet",
                mdot=1e-10,
                temperature=300,
                v_drift=1000,
            )
        ],
    )


def ambient_oxygen_reservoir() -> SimulationProject:
    return SimulationProject(
        settings=GlobalSettings(iterations=80, time_step=1e-6, solver_type="none", max_cores=1),
        domain=channel_domain(),
        boundaries=channel_boundaries(),
        materials=[oxygen_ion(), wall_material()],
        sources=[
            Source(
                name="oxygen_reservoir",
                type="ambient",
                material="O+",
                boundary="inlet",
                enforce="density",
                density=1e14,
                drift_velocity="1000,0,0",
                temperature=300,
            )
        ],
    )


def electric_field_oxygen_beam() -> SimulationProject:
    return SimulationProject(
        settings=GlobalSettings(
            iterations=100,
            time_step=1e-6,
            solver_type="constant-ef",
            comps="100,0",
            max_cores=1,
        ),
        domain=channel_domain(),
        boundaries=channel_boundaries(),
        materials=[oxygen_ion(), wall_material()],
        sources=[
            Source(
                name="field_ion_beam",
                type="uniform",
                material="O+",
                boundary="inlet",
                mdot=1e-10,
                temperature=300,
                v_drift=1000,
            )
        ],
    )


def mixed_ion_neutral_background() -> SimulationProject:
    return SimulationProject(
        settings=GlobalSettings(iterations=80, time_step=1e-6, solver_type="none", max_cores=1),
        domain=channel_domain(),
        boundaries=channel_boundaries(),
        materials=[oxygen_ion(), xenon_neutral(), wall_material()],
        sources=[
            Source(
                name="oxygen_beam",
                type="uniform",
                material="O+",
                boundary="inlet",
                mdot=8e-11,
                temperature=300,
                v_drift=1000,
            ),
            Source(
                name="xenon_background",
                type="ambient",
                material="Xe",
                boundary="inlet",
                enforce="density",
                density=5e13,
                drift_velocity="200,0,0",
                temperature=300,
            ),
        ],
    )


def build_scenarios() -> list[Scenario]:
    return [
        Scenario(
            name="uniform_oxygen_beam",
            description="Single charged O+ uniform beam in a wall-bounded channel.",
            project_factory=uniform_oxygen_beam,
        ),
        Scenario(
            name="ambient_oxygen_reservoir",
            description="O+ ambient density source with drift, testing reservoir-style replenishment.",
            project_factory=ambient_oxygen_reservoir,
        ),
        Scenario(
            name="constant_ef_oxygen_beam",
            description="O+ uniform beam with Starfish constant electric field solver enabled.",
            project_factory=electric_field_oxygen_beam,
        ),
        Scenario(
            name="mixed_ion_neutral_background",
            description="Two-species case: O+ beam injected through Xe neutral ambient background.",
            project_factory=mixed_ion_neutral_background,
        ),
    ]


def read_stats(stats_file: Path) -> tuple[list[str], list[dict[str, str]]]:
    if not stats_file.exists():
        return [], []
    with stats_file.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        return list(reader.fieldnames or []), list(reader)


def final_particle_counts(final_row: dict[str, str]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for key, value in final_row.items():
        if key.startswith("mp."):
            try:
                counts[key.removeprefix("mp.")] = int(float(value))
            except ValueError:
                counts[key.removeprefix("mp.")] = 0
    return counts


def final_source_terms(final_row: dict[str, str]) -> dict[str, str]:
    return {key: value for key, value in final_row.items() if key.startswith("source.")}


def log_tail(log_file: Path, limit: int = 20) -> list[str]:
    if not log_file.exists():
        return []
    lines = [line for line in log_file.read_text(encoding="utf-8", errors="replace").splitlines() if line.strip()]
    return lines[-limit:]


def run_scenario(
    scenario: Scenario,
    suite_dir: Path,
    runner: StarfishRunnerService,
    timeout: int,
) -> dict[str, object]:
    output_dir = suite_dir / scenario.name
    output_dir.mkdir(parents=True, exist_ok=True)
    project = scenario.project_factory()
    xml_files = XMLGeneratorService().generate_xml_files(project)
    result = runner.run_xml_files(xml_files, timeout=timeout, work_dir=output_dir)

    headers, rows = read_stats(output_dir / "starfish_stats.csv")
    final_row = rows[-1] if rows else {}
    particle_counts = final_particle_counts(final_row)
    source_terms = final_source_terms(final_row)

    return {
        "scenario": scenario,
        "output_dir": output_dir,
        "result": result,
        "stats_columns": len(headers),
        "stats_rows": len(rows),
        "final_row": final_row,
        "particle_counts": particle_counts,
        "source_terms": source_terms,
        "log_tail": log_tail(output_dir / "starfish.log"),
        "xml_files": sorted(xml_files),
    }


def write_suite_outputs(suite_dir: Path, records: list[dict[str, object]]) -> None:
    csv_file = suite_dir / "scenario_summary.csv"
    with csv_file.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(
            [
                "scenario",
                "ok",
                "returncode",
                "stats_rows",
                "elapsed_seconds",
                "particle_counts",
                "output_dir",
            ]
        )
        for record in records:
            scenario = record["scenario"]
            result = record["result"]
            writer.writerow(
                [
                    scenario.name,
                    result.ok,
                    result.returncode,
                    record["stats_rows"],
                    f"{result.elapsed_seconds:.3f}",
                    "; ".join(f"{name}={count}" for name, count in record["particle_counts"].items()),
                    record["output_dir"],
                ]
            )

    lines = [
        "# Starfish Scenario Suite",
        "",
        f"- Suite directory: `{suite_dir}`",
        f"- Scenario count: `{len(records)}`",
        "",
        "## Summary",
        "",
        "| Scenario | Status | Rows | Final particles | Output directory |",
        "| --- | --- | ---: | --- | --- |",
    ]

    for record in records:
        scenario = record["scenario"]
        result = record["result"]
        particles = ", ".join(f"{name}={count}" for name, count in record["particle_counts"].items())
        status = "PASS" if result.ok else "FAIL"
        lines.append(
            f"| {scenario.name} | {status} | {record['stats_rows']} | {particles} | `{record['output_dir']}` |"
        )

    for record in records:
        scenario = record["scenario"]
        result = record["result"]
        lines.extend(
            [
                "",
                f"## {scenario.name}",
                "",
                scenario.description,
                "",
                f"- Exit code: `{result.returncode}`",
                f"- Elapsed seconds: `{result.elapsed_seconds:.3f}`",
                f"- Stats rows: `{record['stats_rows']}`",
                f"- XML files: `{', '.join(record['xml_files'])}`",
                f"- Final particles: `{', '.join(f'{name}={count}' for name, count in record['particle_counts'].items())}`",
                "",
                "Log tail:",
                "",
            ]
        )
        for line in record["log_tail"][-12:]:
            lines.append(f"- `{line}`")

    (suite_dir / "suite_summary.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def print_records(records: list[dict[str, object]], suite_dir: Path) -> None:
    print(f"Suite output directory: {suite_dir}")
    for record in records:
        scenario = record["scenario"]
        result = record["result"]
        particles = ", ".join(f"{name}={count}" for name, count in record["particle_counts"].items())
        status = "PASS" if result.ok else "FAIL"
        print(
            f"[{status}] {scenario.name}: rows={record['stats_rows']}, "
            f"particles={particles}, elapsed={result.elapsed_seconds:.3f}s"
        )
    print(f"Summary: {suite_dir / 'suite_summary.md'}")
    print(f"CSV: {suite_dir / 'scenario_summary.csv'}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Run several varied ezxml-generated Starfish scenarios.")
    parser.add_argument("--output-dir", type=Path, default=None, help="Directory for the scenario suite results.")
    parser.add_argument("--timeout", type=int, default=60, help="Per-scenario Starfish timeout in seconds.")
    args = parser.parse_args()

    suite_dir = (args.output_dir or default_suite_dir()).resolve()
    suite_dir.mkdir(parents=True, exist_ok=True)
    runner = StarfishRunnerService()

    records = [run_scenario(scenario, suite_dir, runner, args.timeout) for scenario in build_scenarios()]
    write_suite_outputs(suite_dir, records)
    print_records(records, suite_dir)

    return 0 if all(record["result"].ok for record in records) else 1


if __name__ == "__main__":
    raise SystemExit(main())
