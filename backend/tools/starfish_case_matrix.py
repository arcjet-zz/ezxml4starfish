from dataclasses import dataclass
from typing import Callable

from app.models.simulation import (
    Boundary,
    DomainSettings,
    GeometryNode,
    GlobalSettings,
    Material,
    SimulationProject,
    Source,
)
from app.services.xml_generator import XMLGeneratorService


XmlFragment = tuple[str, str]


@dataclass(frozen=True)
class StarfishProjectCase:
    name: str
    description: str
    project_factory: Callable[[], SimulationProject]
    expected_fragments: tuple[XmlFragment, ...] = ()
    rejected_fragments: tuple[XmlFragment, ...] = ()


def _settings() -> GlobalSettings:
    return GlobalSettings(iterations=0, time_step=1e-6, solver_type="none")


def _domain() -> DomainSettings:
    return DomainSettings(
        type="xy",
        mesh_name="mesh",
        origin=[0.0, 0.0],
        spacing=[0.01, 0.01],
        nodes=[3, 3],
    )


def _node(x: float, y: float) -> GeometryNode:
    return GeometryNode(x=x, y=y)


def _virtual_boundary(name: str = "inlet") -> Boundary:
    return Boundary(
        name=name,
        type="virtual",
        nodes=[_node(0.0, 0.0), _node(0.0, 0.02)],
    )


def _volume_source_without_any_boundary() -> SimulationProject:
    return SimulationProject(
        settings=_settings(),
        domain=_domain(),
        materials=[Material(name="O+", type="kinetic", molwt=15.999, charge=1, spwt=1e11)],
        sources=[
            Source(
                name="free_volume",
                type="volume",
                material="O+",
                rate=5e14,
                temperature=42,
            )
        ],
    )


def _solid_boundaries_reuse_existing_material() -> SimulationProject:
    return SimulationProject(
        settings=_settings(),
        domain=_domain(),
        boundaries=[
            Boundary(
                name="bottom_plate",
                type="solid",
                nodes=[_node(0.0, 0.0), _node(0.02, 0.0)],
            ),
            Boundary(
                name="top_plate",
                type="solid",
                nodes=[_node(0.0, 0.02), _node(0.02, 0.02)],
            ),
        ],
        materials=[Material(name="graphite", type="solid", density=1800)],
    )


def _uniform_and_cosine_default_required_fields() -> SimulationProject:
    return SimulationProject(
        settings=_settings(),
        domain=_domain(),
        boundaries=[_virtual_boundary()],
        materials=[Material(name="Xe", type="kinetic", molwt=131.293, charge=0, spwt=1e10)],
        sources=[
            Source(
                name="uniform_missing_flux",
                type="uniform",
                material="Xe",
                boundary="inlet",
                temperature=300,
            ),
            Source(
                name="cosine_missing_flux",
                type="cosine",
                material="Xe",
                boundary="inlet",
                temperature=300,
            ),
        ],
    )


def _undefined_source_and_boundary_materials() -> SimulationProject:
    return SimulationProject(
        settings=_settings(),
        domain=_domain(),
        boundaries=[
            Boundary(
                name="custom_plate",
                type="solid",
                material="custom_metal",
                nodes=[_node(0.0, 0.0), _node(0.02, 0.0)],
            ),
            _virtual_boundary(),
        ],
        sources=[
            Source(
                name="implicit_ion",
                type="ambient",
                material="Ne+",
                boundary="inlet",
                enforce="density",
                density=2.5e11,
                drift_velocity="10,0,0",
                temperature=250,
            )
        ],
    )


def build_starfish_edge_cases() -> list[StarfishProjectCase]:
    return [
        StarfishProjectCase(
            name="volume_source_auto_virtual_boundary",
            description="A volume-like source in a project with no boundaries must create a usable virtual boundary.",
            project_factory=_volume_source_without_any_boundary,
            expected_fragments=(
                ("boundaries.xml", '<boundary name="default_boundary" type="virtual">'),
                ("sources.xml", '<boundary_source name="free_volume" type="ambient">'),
                ("sources.xml", "<boundary>default_boundary</boundary>"),
                ("sources.xml", "<density>1000000000000.0</density>"),
            ),
            rejected_fragments=(("sources.xml", "<volume_source"),),
        ),
        StarfishProjectCase(
            name="solid_boundaries_reuse_existing_material",
            description="Multiple solid boundaries without explicit material should reuse the existing solid material.",
            project_factory=_solid_boundaries_reuse_existing_material,
            expected_fragments=(
                ("boundaries.xml", "<material>graphite</material>"),
                ("materials.xml", '<material name="graphite" type="solid">'),
            ),
            rejected_fragments=(("materials.xml", '<material name="wall"'),),
        ),
        StarfishProjectCase(
            name="uniform_cosine_defaults",
            description="Uniform and cosine boundary sources must stay as boundary sources and receive required defaults.",
            project_factory=_uniform_and_cosine_default_required_fields,
            expected_fragments=(
                ("sources.xml", '<boundary_source name="uniform_missing_flux" type="uniform">'),
                ("sources.xml", '<boundary_source name="cosine_missing_flux" type="cosine">'),
                ("sources.xml", "<mdot>1e-12</mdot>"),
                ("sources.xml", "<v_drift>0</v_drift>"),
            ),
            rejected_fragments=(("sources.xml", 'type="ambient"'),),
        ),
        StarfishProjectCase(
            name="undefined_material_repairs",
            description="Missing solid and kinetic material definitions should be generated before CLI validation.",
            project_factory=_undefined_source_and_boundary_materials,
            expected_fragments=(
                ("materials.xml", '<material name="custom_metal" type="solid">'),
                ("materials.xml", '<material name="Ne+" type="kinetic">'),
                ("sources.xml", "<material>Ne+</material>"),
                ("sources.xml", "<drift_velocity>10,0,0</drift_velocity>"),
            ),
        ),
    ]


def generate_case_xml(case: StarfishProjectCase) -> dict[str, str]:
    project = case.project_factory()
    return XMLGeneratorService().generate_xml_files(project)
