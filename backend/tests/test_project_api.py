import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


client = TestClient(app)


def test_template_uses_frontend_field_names():
    response = client.get("/api/v1/project/template")

    assert response.status_code == 200
    payload = response.json()
    assert payload["settings"]["iterations"] == 1000
    assert payload["settings"]["time_step"] == 1e-6
    assert "num_it" not in payload["settings"]
    assert "dt" not in payload["settings"]


def test_parse_accepts_uploaded_paths_and_uses_frontend_field_names():
    response = client.post(
        "/api/v1/project/parse",
        files=[
            (
                "files",
                (
                    "project/starfish.xml",
                    b"""
                    <simulation>
                      <solver type="poisson" />
                      <time><num_it>25</num_it><dt>2e-6</dt></time>
                    </simulation>
                    """,
                    "text/xml",
                ),
            )
        ],
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["settings"]["iterations"] == 25
    assert payload["settings"]["time_step"] == 2e-6
    assert "num_it" not in payload["settings"]
    assert "dt" not in payload["settings"]
