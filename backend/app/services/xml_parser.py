"""
XML parsing service.

The parser accepts the split XML files produced by XMLGeneratorService and a
subset of hand-written Starfish project files. Its main contract is stable
round-tripping: generated XML should import back into SimulationProject without
losing the fields exposed by the UI.
"""

from pathlib import PurePath
from typing import Any, Dict, List, Optional, Tuple
import logging
import re
import xml.etree.ElementTree as ET

from fastapi import UploadFile

from app.models.simulation import SimulationProject

logger = logging.getLogger(__name__)


class XMLParserService:
    """Parse Starfish XML files into the application data model."""

    async def parse_files(self, file_dict: Dict[str, UploadFile]) -> SimulationProject:
        logger.info("Starting XML file parsing")

        starfish_file = self._find_file(file_dict, "starfish.xml")
        if starfish_file is None:
            raise ValueError("Missing required file: starfish.xml")

        starfish_root = ET.fromstring(await starfish_file.read())
        parsed_data: Dict[str, Any] = {
            "settings": self._parse_global_settings(starfish_root),
            "domain": self._parse_domain_settings(starfish_root),
            "boundaries": [],
            "materials": [],
            "sources": [],
            "interactions": [],
        }

        domain_file = self._find_file(file_dict, "domain.xml")
        if domain_file is not None:
            logger.info("Parsing domain.xml")
            domain_root = ET.fromstring(await domain_file.read())
            parsed_data["domain"] = self._parse_domain_settings(domain_root)

        boundaries_file = self._find_file(file_dict, "boundaries.xml")
        if boundaries_file is not None:
            logger.info("Parsing boundaries.xml")
            boundaries_root = ET.fromstring(await boundaries_file.read())
            parsed_data["boundaries"] = self._parse_boundaries(boundaries_root)
            transform = self._parse_boundary_transform(boundaries_root)
            if transform:
                parsed_data["domain"]["boundary_transform"] = transform

        materials_file = self._find_file(file_dict, "materials.xml")
        if materials_file is not None:
            logger.info("Parsing materials.xml")
            materials_root = ET.fromstring(await materials_file.read())
            parsed_data["materials"] = self._parse_materials(materials_root)

        sources_file = self._find_file(file_dict, "sources.xml")
        if sources_file is not None:
            logger.info("Parsing sources.xml")
            sources_root = ET.fromstring(await sources_file.read())
            parsed_data["sources"] = self._parse_sources(sources_root)

        interactions_file = self._find_file(file_dict, "interactions.xml")
        if interactions_file is not None:
            logger.info("Parsing interactions.xml")
            interactions_root = ET.fromstring(await interactions_file.read())
            parsed_data["interactions"] = self._parse_interactions(interactions_root)

        self._parse_inline_elements(starfish_root, parsed_data)

        logger.info("XML parsing completed successfully")
        return SimulationProject(**parsed_data)

    def _find_file(
        self, file_dict: Dict[str, UploadFile], target_name: str
    ) -> Optional[UploadFile]:
        target_name = target_name.lower()
        for raw_name, upload in file_dict.items():
            normalized = PurePath(str(raw_name).replace("\\", "/")).name.lower()
            if normalized == target_name:
                return upload
        return None

    def _parse_global_settings(self, root: ET.Element) -> Dict[str, Any]:
        settings: Dict[str, Any] = {
            "iterations": 1000,
            "time_step": 1e-6,
            "solver_type": "poisson",
        }

        time_elem = root.find("time")
        if time_elem is not None:
            self._assign_int(settings, "iterations", time_elem.find("num_it"))
            self._assign_float(settings, "time_step", time_elem.find("dt"))
            self._assign_int(settings, "steady_state", time_elem.find("steady_state"))

        solver_elem = root.find("solver")
        if solver_elem is not None:
            raw_solver_type = solver_elem.get("type", "poisson")
            solver_type, implied_method = self._normalize_solver_type(raw_solver_type)
            settings["solver_type"] = solver_type

            method_text = self._child_text(solver_elem, "method") or implied_method
            method = self._normalize_solver_method(method_text)
            if method:
                settings["method"] = method

            self._assign_float(settings, "n0", solver_elem.find("n0"))
            self._assign_float(settings, "Te0", solver_elem.find("Te0"))
            self._assign_float(settings, "phi0", solver_elem.find("phi0"))
            self._assign_int(settings, "max_it", solver_elem.find("max_it"))
            self._assign_int(settings, "nl_max_it", solver_elem.find("nl_max_it"))
            self._assign_float(settings, "tol", solver_elem.find("tol"))
            self._assign_float(settings, "nl_tol", solver_elem.find("nl_tol"))
            self._assign_float(settings, "tolerance", solver_elem.find("tolerance"))
            self._assign_bool(settings, "linear", solver_elem.find("linear"))
            self._assign_bool(settings, "initial_only", solver_elem.find("initial_only"))

            comps = self._child_text(solver_elem, "comps")
            if comps:
                settings["comps"] = comps

        starfish_elem = root.find("starfish")
        if starfish_elem is not None:
            randomize = starfish_elem.get("randomize")
            if randomize is not None:
                settings["randomize"] = self._parse_bool_text(randomize)

            max_cores = starfish_elem.get("max_processors") or starfish_elem.get("max_cores")
            if max_cores:
                settings["max_cores"] = int(max_cores)

        restart_elem = root.find("restart")
        if restart_elem is not None:
            restart: Dict[str, Any] = {}
            self._assign_int(restart, "it_save", restart_elem.find("it_save"))
            self._assign_bool(restart, "save", restart_elem.find("save"))
            self._assign_bool(restart, "load", restart_elem.find("load"))
            self._assign_int(restart, "nt_add", restart_elem.find("nt_add"))
            if restart:
                settings["restart"] = restart

        outputs = []
        for output_elem in root.findall("output"):
            output = {
                "type": output_elem.get("type", "field"),
                "file_name": output_elem.get("file_name", "output"),
                "format": output_elem.get("format", "vtk"),
            }
            for field in ("variables", "scalars", "vectors"):
                value = self._child_text(output_elem, field)
                if value:
                    output[field] = value
            outputs.append(output)
        if outputs:
            settings["outputs"] = outputs

        return settings

    def _parse_domain_settings(self, root: ET.Element) -> Dict[str, Any]:
        domain_settings: Dict[str, Any] = {
            "type": "xy",
            "mesh_type": "uniform",
            "mesh_name": "mesh",
            "origin": [0.0, 0.0],
            "spacing": [0.02, 0.02],
            "nodes": [21, 11],
            "mesh_bcs": [],
        }

        domain_elem = root if root.tag == "domain" else root.find("domain")
        if domain_elem is None:
            return domain_settings

        domain_settings["type"] = domain_elem.get("type", domain_settings["type"])

        world_box = self._child_text(domain_elem, "world_box")
        if world_box:
            domain_settings["world_box"] = self._parse_float_list(world_box)

        mesh_elem = domain_elem.find("mesh")
        if mesh_elem is None:
            return domain_settings

        domain_settings["mesh_type"] = mesh_elem.get("type", domain_settings["mesh_type"])
        domain_settings["mesh_name"] = mesh_elem.get("name", domain_settings["mesh_name"])

        origin_text = self._child_text(mesh_elem, "origin")
        if origin_text:
            domain_settings["origin"] = self._parse_float_list(origin_text)

        spacing_text = self._child_text(mesh_elem, "spacing")
        if spacing_text:
            domain_settings["spacing"] = self._parse_float_list(spacing_text)

        nodes_text = self._child_text(mesh_elem, "nodes")
        if nodes_text:
            domain_settings["nodes"] = [int(value) for value in self._parse_float_list(nodes_text)]

        mesh_bcs = []
        for mesh_bc_elem in mesh_elem.findall("mesh-bc"):
            mesh_bcs.append(
                {
                    "wall": mesh_bc_elem.get("wall", ""),
                    "type": mesh_bc_elem.get("type", ""),
                    "value": mesh_bc_elem.get("value"),
                }
            )
        if mesh_bcs:
            domain_settings["mesh_bcs"] = mesh_bcs

        return domain_settings

    def _parse_boundary_transform(self, root: ET.Element) -> Optional[Dict[str, Any]]:
        transform_elem = root.find("transform")
        if transform_elem is None:
            return None

        transform: Dict[str, Any] = {}
        for field in ("scaling", "translation"):
            value = self._child_text(transform_elem, field)
            if value:
                transform[field] = value

        reverse = self._child_text(transform_elem, "reverse")
        if reverse is not None:
            transform["reverse"] = self._parse_bool_text(reverse)

        return transform or None

    def _parse_boundaries(self, root: ET.Element) -> List[Dict[str, Any]]:
        container = root.find("boundaries") if root.tag != "boundaries" else root
        if container is None:
            return []

        boundaries = []
        for index, boundary_elem in enumerate(container.findall("boundary")):
            boundary_name = boundary_elem.get("name", f"boundary_{index}")
            boundary: Dict[str, Any] = {
                "id": boundary_name,
                "name": boundary_name,
                "type": self._normalize_boundary_type(boundary_elem.get("type")),
                "nodes": [],
            }

            for attr_name in ("value", "reverse"):
                attr_value = boundary_elem.get(attr_name)
                if attr_value is None:
                    continue
                if attr_name == "reverse":
                    boundary[attr_name] = self._parse_bool_text(attr_value)
                else:
                    boundary[attr_name] = attr_value

            material = self._child_text(boundary_elem, "material")
            if material:
                boundary["material"] = material

            path_elem = boundary_elem.find("path")
            path_text = self._text_or_none(path_elem)
            path_points = self._parse_points_from_container(path_elem)
            direct_points = self._parse_points_from_container(boundary_elem)
            nodes_points = self._parse_nodes_element(boundary_elem.find("nodes"))
            nodes = nodes_points or direct_points or path_points

            if path_text:
                boundary["path"] = path_text
            elif nodes:
                boundary["path"] = self._path_from_nodes(nodes)

            if not nodes and boundary.get("path"):
                nodes = self._nodes_from_path(boundary["path"])

            boundary["nodes"] = nodes

            temp = self._child_text(boundary_elem, "temp")
            if temp:
                boundary["temp"] = float(temp)

            temperature = self._child_text(boundary_elem, "temperature")
            if temperature:
                boundary["temperature"] = float(temperature)

            boundaries.append(boundary)

        return boundaries

    def _parse_materials(self, root: ET.Element) -> List[Dict[str, Any]]:
        container = root.find("materials") if root.tag != "materials" else root
        if container is None:
            return []

        materials = []
        for index, material_elem in enumerate(container.findall("material")):
            material_name = material_elem.get("name", f"material_{index}")
            material_type = self._normalize_material_type(material_elem.get("type"))
            material: Dict[str, Any] = {
                "id": material_name,
                "name": material_name,
                "type": material_type,
                "charge": 0.0,
            }

            for field in (
                "molwt",
                "mass",
                "charge",
                "spwt",
                "ref_temp",
                "visc_temp_index",
                "vss_alpha",
                "diam",
                "ionization_energy",
                "kTe0",
                "density",
                "thermal_conductivity",
                "specific_heat",
                "work_function",
                "secondary_emission_yield",
            ):
                self._assign_float(material, field, material_elem.find(field))

            for field in ("init", "model"):
                value = self._child_text(material_elem, field)
                if value:
                    material[field] = value

            materials.append(material)

        return materials

    def _parse_sources(self, root: ET.Element) -> List[Dict[str, Any]]:
        container = root.find("sources") if root.tag != "sources" else root
        if container is None:
            return []

        sources = []
        for index, source_elem in enumerate(list(container)):
            if source_elem.tag not in {"source", "volume_source", "boundary_source"}:
                continue

            source_name = source_elem.get("name", f"source_{index}")
            source_type = self._normalize_source_type(source_elem.get("type"), source_elem.tag)
            source: Dict[str, Any] = {
                "id": source_name,
                "name": source_name,
                "type": source_type,
            }

            for field in ("material", "boundary", "enforce", "drift_velocity"):
                value = self._child_text(source_elem, field)
                if value:
                    source[field] = value

            for field in ("rate", "temperature", "mdot", "v_drift", "density", "total_pressure"):
                self._assign_float(source, field, source_elem.find(field))

            region_elem = source_elem.find("region")
            if region_elem is not None:
                source["region"] = ET.tostring(region_elem, encoding="unicode")

            sources.append(source)

        return sources

    def _parse_interactions(self, root: ET.Element) -> List[Dict[str, Any]]:
        container = root
        if root.tag not in {"material_interactions", "interactions"}:
            material_interactions = root.find("material_interactions")
            interactions = root.find("interactions")
            if material_interactions is not None:
                container = material_interactions
            elif interactions is not None:
                container = interactions

        interactions = []
        for index, elem in enumerate(list(container)):
            interaction = self._parse_interaction_element(elem, index)
            if interaction:
                interactions.append(interaction)

        return interactions

    def _parse_interaction_element(
        self, elem: ET.Element, index: int
    ) -> Optional[Dict[str, Any]]:
        tag = elem.tag
        if tag == "interaction":
            raw_type = elem.get("type", "dsmc")
        else:
            raw_type = tag

        interaction_type = self._normalize_interaction_type(raw_type)
        name = elem.get("name", f"{interaction_type}_{index}")
        interaction: Dict[str, Any] = {
            "id": name,
            "name": name,
            "type": interaction_type,
            "materials": [],
        }

        if interaction_type == "surface_hit":
            source = elem.get("source") or self._child_text(elem, "source")
            target = elem.get("target") or self._child_text(elem, "target")
            if source:
                interaction["source"] = source
            if target:
                interaction["target"] = target
            if source or target:
                interaction["materials"] = [value for value in (source, target) if value]

            for field in ("product", "model"):
                value = self._child_text(elem, field)
                if value:
                    interaction[field] = value
            for field in ("prob", "c_accom", "c_rest"):
                self._assign_float(interaction, field, elem.find(field))

        elif interaction_type == "dsmc":
            model = elem.get("model") or self._child_text(elem, "model")
            if model:
                interaction["model"] = model

            pair = self._child_text(elem, "pair")
            if pair:
                interaction["pair"] = pair
                interaction["materials"] = self._split_csv(pair)

            self._parse_sigma_fields(interaction, elem)
            self._assign_int(interaction, "frequency", elem.find("frequency"))
            self._assign_float(interaction, "sig_cr_max", elem.find("sig_cr_max"))

        elif interaction_type == "mcc":
            mcc_model = self._normalize_mcc_model(elem.get("model") or self._child_text(elem, "model"))
            if mcc_model:
                interaction["mcc_model"] = mcc_model

            source = self._child_text(elem, "source") or elem.get("source")
            target = self._child_text(elem, "target") or elem.get("target")
            if source:
                interaction["source"] = source
            if target:
                interaction["target"] = target
            interaction["materials"] = [value for value in (source, target) if value]

            self._parse_sigma_fields(interaction, elem)
            self._assign_float(interaction, "max_target_temp", elem.find("max_target_temp"))

        elif interaction_type == "chemistry":
            for field in ("sources", "products"):
                value = self._child_text(elem, field)
                if value:
                    interaction[field] = value
                    if field == "sources":
                        interaction["materials"] = self._split_csv(value)

            rate_elem = elem.find("rate")
            if rate_elem is not None:
                rate_type = rate_elem.get("type")
                if rate_type in {"const", "poly"}:
                    interaction["rate_type"] = rate_type
                is_sigma = rate_elem.get("is_sigma")
                if is_sigma is not None:
                    interaction["is_sigma"] = self._parse_bool_text(is_sigma)
                for field in ("coeffs", "output_wrappers", "dep_var"):
                    value = self._child_text(rate_elem, field)
                    if value:
                        interaction[field] = value

        elif interaction_type == "sputtering":
            pass

        else:
            return None

        materials_elem = elem.find("materials")
        if materials_elem is not None and materials_elem.text:
            interaction["materials"] = self._split_csv(materials_elem.text)

        return interaction

    def _parse_inline_elements(self, root: ET.Element, parsed_data: Dict[str, Any]) -> None:
        inline_domain = root.find("domain")
        if inline_domain is not None:
            parsed_data["domain"] = self._parse_domain_settings(inline_domain)

        inline_materials = root.find("materials")
        if inline_materials is not None:
            parsed_data["materials"].extend(self._parse_materials(inline_materials))

        inline_sources = root.find("sources")
        if inline_sources is not None:
            parsed_data["sources"].extend(self._parse_sources(inline_sources))

        inline_boundaries = root.find("boundaries")
        if inline_boundaries is not None:
            parsed_data["boundaries"].extend(self._parse_boundaries(inline_boundaries))

        inline_interactions = root.find("interactions")
        if inline_interactions is None:
            inline_interactions = root.find("material_interactions")
        if inline_interactions is not None:
            parsed_data["interactions"].extend(self._parse_interactions(inline_interactions))

    def _parse_sigma_fields(self, target: Dict[str, Any], elem: ET.Element) -> None:
        sigma = self._child_text(elem, "sigma")
        if sigma:
            target["sigma"] = self._normalize_sigma(sigma)

        sigma_coeffs = self._child_text(elem, "sigma_coeffs")
        if sigma_coeffs:
            target["sigma_coeffs"] = sigma_coeffs

    def _parse_nodes_element(self, nodes_elem: Optional[ET.Element]) -> List[Dict[str, float]]:
        if nodes_elem is None:
            return []

        nodes = []
        for node_elem in nodes_elem.findall("node"):
            x = node_elem.get("x")
            y = node_elem.get("y")
            if x is not None and y is not None:
                nodes.append({"x": float(x), "y": float(y)})
            elif node_elem.text:
                parsed = self._parse_point_text(node_elem.text)
                if parsed:
                    nodes.append(parsed)
        return nodes

    def _parse_points_from_container(self, elem: Optional[ET.Element]) -> List[Dict[str, float]]:
        if elem is None:
            return []

        points = []
        for point_elem in elem.findall("point"):
            parsed = self._parse_point_text(point_elem.text or "")
            if parsed:
                points.append(parsed)
        return points

    def _parse_point_text(self, text: str) -> Optional[Dict[str, float]]:
        values = self._parse_float_list(text)
        if len(values) < 2:
            return None
        return {"x": values[0], "y": values[1]}

    def _nodes_from_path(self, path: str) -> List[Dict[str, float]]:
        values = [
            float(match)
            for match in re.findall(r"[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?", path)
        ]
        return [
            {"x": values[index], "y": values[index + 1]}
            for index in range(0, len(values) - 1, 2)
        ]

    def _path_from_nodes(self, nodes: List[Dict[str, float]]) -> str:
        if not nodes:
            return ""
        head, *tail = nodes
        commands = [f"M {head['x']},{head['y']}"]
        commands.extend(f"L {node['x']},{node['y']}" for node in tail)
        return " ".join(commands)

    def _parse_float_list(self, text: str) -> List[float]:
        return [
            float(part)
            for part in re.split(r"[,\s]+", text.strip())
            if part
        ]

    def _split_csv(self, text: str) -> List[str]:
        return [part.strip() for part in text.split(",") if part.strip()]

    def _child_text(self, elem: ET.Element, child_name: str) -> Optional[str]:
        return self._text_or_none(elem.find(child_name))

    def _text_or_none(self, elem: Optional[ET.Element]) -> Optional[str]:
        if elem is None or elem.text is None:
            return None
        value = elem.text.strip()
        return value or None

    def _assign_float(self, target: Dict[str, Any], field: str, elem: Optional[ET.Element]) -> None:
        value = self._text_or_none(elem)
        if value is not None:
            target[field] = float(value)

    def _assign_int(self, target: Dict[str, Any], field: str, elem: Optional[ET.Element]) -> None:
        value = self._text_or_none(elem)
        if value is not None:
            target[field] = int(float(value))

    def _assign_bool(self, target: Dict[str, Any], field: str, elem: Optional[ET.Element]) -> None:
        value = self._text_or_none(elem)
        if value is not None:
            target[field] = self._parse_bool_text(value)

    def _parse_bool_text(self, text: str) -> bool:
        return text.strip().lower() in {"1", "true", "yes", "on"}

    def _normalize_solver_type(self, value: Optional[str]) -> Tuple[str, Optional[str]]:
        raw = (value or "poisson").strip().lower().replace("_", "-")
        mapping = {
            "poisson": ("poisson", None),
            "sor": ("poisson", "gs"),
            "gs": ("poisson", "gs"),
            "jacobi": ("poisson", "jacobi"),
            "cg": ("poisson", None),
            "multigrid": ("poisson", None),
            "pic": ("poisson", None),
            "constant-ef": ("constant-ef", None),
            "constant": ("constant-ef", None),
            "qn": ("qn", None),
            "none": ("none", None),
            "dsmc": ("none", None),
        }
        return mapping.get(raw, ("poisson", None))

    def _normalize_solver_method(self, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        raw = value.strip().lower()
        if raw in {"gs", "sor"}:
            return "gs"
        if raw == "jacobi":
            return "jacobi"
        return None

    def _normalize_boundary_type(self, value: Optional[str]) -> str:
        raw = (value or "solid").strip().lower()
        if raw in {"solid", "virtual"}:
            return raw
        if raw in {"dirichlet", "neumann"}:
            return "virtual"
        return "virtual"

    def _normalize_material_type(self, value: Optional[str]) -> str:
        raw = (value or "kinetic").strip().lower()
        return raw if raw in {"kinetic", "boltzmann_electrons", "solid"} else "kinetic"

    def _normalize_source_type(self, value: Optional[str], tag: str) -> str:
        if tag == "volume_source":
            fallback = "volume"
        elif tag == "boundary_source":
            fallback = "uniform"
        else:
            fallback = "volume"

        raw = (value or fallback).strip().lower()
        allowed = {"volume", "preload", "maxwellian", "uniform", "cosine", "ambient", "thermionic"}
        return raw if raw in allowed else fallback

    def _normalize_interaction_type(self, value: Optional[str]) -> str:
        raw = (value or "dsmc").strip().lower().replace("-", "_")
        mapping = {
            "surface_hit": "surface_hit",
            "surfacehit": "surface_hit",
            "dsmc": "dsmc",
            "collision": "dsmc",
            "mcc": "mcc",
            "chemistry": "chemistry",
            "sputtering": "sputtering",
        }
        return mapping.get(raw, "dsmc")

    def _normalize_mcc_model(self, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        raw = value.strip().lower()
        return raw if raw in {"cex", "mex", "ionization"} else None

    def _normalize_sigma(self, value: str) -> str:
        raw = value.strip().lower()
        mapping = {
            "bird463": "bird463",
            "bird": "bird463",
            "const": "const",
            "constant": "const",
            "inv": "inv",
            "tabulated": "tabulated",
            "poly": "poly",
            "ln": "ln",
            "table": "table",
        }
        return mapping.get(raw, "const")
