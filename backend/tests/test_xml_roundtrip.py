import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.models.simulation import (  # noqa: E402
    Boundary,
    DomainSettings,
    GeometryNode,
    GlobalSettings,
    Interaction,
    Material,
    SimulationProject,
    Source,
)
from app.services.xml_generator import XMLGeneratorService  # noqa: E402
from app.services.xml_parser import XMLParserService  # noqa: E402


class MemoryUpload:
    def __init__(self, content: str):
        self._content = content.encode("utf-8")

    async def read(self) -> bytes:
        return self._content


def as_uploads(xml_files: dict[str, str]) -> dict[str, MemoryUpload]:
    return {name: MemoryUpload(content) for name, content in xml_files.items()}


@pytest.mark.asyncio
async def test_generated_project_round_trips_core_fields():
    project = SimulationProject(
        settings=GlobalSettings(
            iterations=250,
            time_step=2e-6,
            solver_type="poisson",
            method="gs",
            n0=1e10,
            Te0=1.5,
            max_cores=4,
            randomize=True,
        ),
        domain=DomainSettings(
            type="xy",
            mesh_name="mesh1",
            origin=[0.0, 0.0],
            spacing=[0.01, 0.02],
            nodes=[21, 11],
        ),
        boundaries=[
            Boundary(
                name="inlet",
                type="dirichlet",
                value="0",
                temp=0.0,
                nodes=[GeometryNode(x=0.0, y=0.0), GeometryNode(x=0.0, y=0.1)],
            )
        ],
        materials=[
            Material(name="O+", type="kinetic", molwt=16, charge=1, spwt=1e11)
        ],
        sources=[
            Source(
                name="ambient_O",
                type="ambient",
                material="O+",
                boundary="inlet",
                enforce="density",
                density=1e12,
                drift_velocity="0,0,0",
                temperature=300,
            ),
            Source(
                name="volume_O",
                type="volume",
                material="O+",
                rate=1e15,
                temperature=0.0,
                region="<region><box>0,0,0.1,0.1</box></region>",
            )
        ],
        interactions=[
            Interaction(
                name="o_o_dsmc",
                type="dsmc",
                materials=["O+", "O+"],
                model="elastic",
                sigma="bird463",
                frequency=1,
            )
        ],
    )

    generated = XMLGeneratorService().generate_xml_files(project)
    assert "<volume_source" in generated["sources.xml"]
    assert "<rate>1000000000000000.0</rate>" in generated["sources.xml"]

    parsed = await XMLParserService().parse_files(as_uploads(generated))
    sources_by_name = {source.name: source for source in parsed.sources}

    assert parsed.settings.solver_type == "poisson"
    assert parsed.settings.method == "gs"
    assert parsed.settings.max_cores == 4
    assert parsed.domain.mesh_name == "mesh1"
    assert parsed.domain.spacing == [0.01, 0.02]
    assert parsed.boundaries[0].temp == 0.0
    assert parsed.boundaries[0].nodes[1].y == 0.1
    assert parsed.materials[0].name == "O+"
    assert sources_by_name["ambient_O"].type == "ambient"
    assert sources_by_name["ambient_O"].density == 1e12
    assert sources_by_name["volume_O"].type == "volume"
    assert sources_by_name["volume_O"].rate == 1e15
    assert sources_by_name["volume_O"].temperature == 0.0
    assert "<box>0,0,0.1,0.1</box>" in sources_by_name["volume_O"].region
    assert parsed.interactions[0].type == "dsmc"
    assert parsed.interactions[0].materials == ["O+", "O+"]


@pytest.mark.asyncio
async def test_parser_accepts_legacy_split_starfish_files():
    xml_files = {
        "starfish.xml": """
        <simulation>
          <load>domain.xml</load>
          <load>sources.xml</load>
          <solver type="SOR"/>
          <time><num_it>100</num_it><dt>1e-6</dt></time>
          <starfish max_processors="2"/>
        </simulation>
        """,
        "domain.xml": """
        <domain type="xy">
          <mesh type="uniform" name="mesh1">
            <origin>0,0</origin>
            <spacing>0.01,0.02</spacing>
            <nodes>21,11</nodes>
          </mesh>
        </domain>
        """,
        "boundaries.xml": """
        <boundaries>
          <boundary name="left" type="dirichlet" value="0">
            <path>
              <point>0,0</point>
              <point>0,1</point>
            </path>
          </boundary>
        </boundaries>
        """,
        "sources.xml": """
        <sources>
          <volume_source name="plasma" type="volume">
            <material>O+</material>
            <rate>1e15</rate>
            <temperature>300</temperature>
          </volume_source>
        </sources>
        """,
    }

    parsed = await XMLParserService().parse_files(as_uploads(xml_files))

    assert parsed.settings.solver_type == "poisson"
    assert parsed.settings.method == "gs"
    assert parsed.settings.max_cores == 2
    assert parsed.domain.mesh_name == "mesh1"
    assert parsed.boundaries[0].nodes == [
        GeometryNode(x=0.0, y=0.0),
        GeometryNode(x=0.0, y=1.0),
    ]
    assert parsed.sources[0].type == "volume"
    assert parsed.sources[0].rate == 1e15
