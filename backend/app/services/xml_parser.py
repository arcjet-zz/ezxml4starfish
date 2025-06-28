"""
XML解析服务
将Starfish XML文件解析为JSON结构
"""

from typing import Dict, Any, List, Optional
from fastapi import UploadFile
import xml.etree.ElementTree as ET
import logging

from app.models.simulation import (
    SimulationProject, GlobalSettings, DomainSettings,
    Boundary, Material, Source, Interaction, GeometryNode
)

logger = logging.getLogger(__name__)

class XMLParserService:
    """XML解析服务类"""

    async def parse_files(self, file_dict: Dict[str, UploadFile]) -> SimulationProject:
        """
        解析上传的XML文件集

        Args:
            file_dict: 文件名到UploadFile对象的映射

        Returns:
            SimulationProject: 解析后的项目对象
        """
        logger.info("Starting XML file parsing")

        # 读取主配置文件
        starfish_content = await file_dict["starfish.xml"].read()
        starfish_root = ET.fromstring(starfish_content)

        # 初始化解析数据
        parsed_data = {
            "settings": self._parse_global_settings(starfish_root),
            "domain": self._parse_domain_settings(starfish_root),
            "boundaries": [],
            "materials": [],
            "sources": [],
            "interactions": []
        }

        # 解析边界文件
        if "boundaries.xml" in file_dict:
            logger.info("Parsing boundaries.xml")
            boundaries_content = await file_dict["boundaries.xml"].read()
            boundaries_root = ET.fromstring(boundaries_content)
            parsed_data["boundaries"] = self._parse_boundaries(boundaries_root)

        # 解析材料文件
        if "materials.xml" in file_dict:
            logger.info("Parsing materials.xml")
            materials_content = await file_dict["materials.xml"].read()
            materials_root = ET.fromstring(materials_content)
            parsed_data["materials"] = self._parse_materials(materials_root)

        # 解析源文件
        if "sources.xml" in file_dict:
            logger.info("Parsing sources.xml")
            sources_content = await file_dict["sources.xml"].read()
            sources_root = ET.fromstring(sources_content)
            parsed_data["sources"] = self._parse_sources(sources_root)

        # 解析相互作用文件
        if "interactions.xml" in file_dict:
            logger.info("Parsing interactions.xml")
            interactions_content = await file_dict["interactions.xml"].read()
            interactions_root = ET.fromstring(interactions_content)
            parsed_data["interactions"] = self._parse_interactions(interactions_root)

        # 从主文件中解析内联定义的元素
        self._parse_inline_elements(starfish_root, parsed_data)

        logger.info("XML parsing completed successfully")
        return SimulationProject(**parsed_data)
    
    def _parse_global_settings(self, root: ET.Element) -> Dict[str, Any]:
        """解析全局设置"""
        settings = {
            "iterations": 1000,
            "time_step": 1e-6,
            "solver_type": "SOR"
        }

        # 解析时间设置
        time_elem = root.find("time")
        if time_elem is not None:
            num_it_elem = time_elem.find("num_it")
            if num_it_elem is not None and num_it_elem.text:
                settings["iterations"] = int(num_it_elem.text.strip())

            dt_elem = time_elem.find("dt")
            if dt_elem is not None and dt_elem.text:
                settings["time_step"] = float(dt_elem.text.strip())

            steady_state_elem = time_elem.find("steady_state")
            if steady_state_elem is not None and steady_state_elem.text:
                settings["steady_state"] = int(steady_state_elem.text.strip())

        # 解析求解器设置
        solver_elem = root.find("solver")
        if solver_elem is not None:
            solver_type = solver_elem.get("type", "SOR")
            settings["solver_type"] = solver_type.upper()

            # 解析求解器参数
            method_elem = solver_elem.find("method")
            if method_elem is not None and method_elem.text:
                settings["method"] = method_elem.text.strip()

            n0_elem = solver_elem.find("n0")
            if n0_elem is not None and n0_elem.text:
                settings["n0"] = float(n0_elem.text.strip())

            te0_elem = solver_elem.find("Te0")
            if te0_elem is not None and te0_elem.text:
                settings["Te0"] = float(te0_elem.text.strip())

            phi0_elem = solver_elem.find("phi0")
            if phi0_elem is not None and phi0_elem.text:
                settings["phi0"] = float(phi0_elem.text.strip())

            max_it_elem = solver_elem.find("max_it")
            if max_it_elem is not None and max_it_elem.text:
                settings["max_it"] = int(max_it_elem.text.strip())

            tol_elem = solver_elem.find("tol")
            if tol_elem is not None and tol_elem.text:
                settings["tolerance"] = float(tol_elem.text.strip())

        # 解析starfish元素的属性
        starfish_elem = root.find("starfish")
        if starfish_elem is not None:
            randomize = starfish_elem.get("randomize")
            if randomize is not None:
                settings["randomize"] = randomize.lower() == "true"

            max_cores = starfish_elem.get("max_cores")
            if max_cores is not None:
                settings["max_cores"] = int(max_cores)

        return settings

    def _parse_domain_settings(self, root: ET.Element) -> Dict[str, Any]:
        """解析计算域设置"""
        domain_settings = {
            "type": "xy",
            "mesh_type": "uniform",
            "mesh_name": "mesh",
            "origin": [0.0, 0.0],
            "spacing": [0.02, 0.02],
            "nodes": [21, 11]
        }

        domain_elem = root.find("domain")
        if domain_elem is not None:
            domain_type = domain_elem.get("type", "xy")
            domain_settings["type"] = domain_type

            mesh_elem = domain_elem.find("mesh")
            if mesh_elem is not None:
                mesh_type = mesh_elem.get("type", "uniform")
                mesh_name = mesh_elem.get("name", "mesh")
                domain_settings["mesh_type"] = mesh_type
                domain_settings["mesh_name"] = mesh_name

                origin_elem = mesh_elem.find("origin")
                if origin_elem is not None and origin_elem.text:
                    origin_coords = [float(x.strip()) for x in origin_elem.text.split(",")]
                    domain_settings["origin"] = origin_coords

                spacing_elem = mesh_elem.find("spacing")
                if spacing_elem is not None and spacing_elem.text:
                    spacing_values = [float(x.strip()) for x in spacing_elem.text.split(",")]
                    domain_settings["spacing"] = spacing_values

                nodes_elem = mesh_elem.find("nodes")
                if nodes_elem is not None and nodes_elem.text:
                    node_counts = [int(x.strip()) for x in nodes_elem.text.split(",")]
                    domain_settings["nodes"] = node_counts

        return domain_settings
    
    def _parse_boundaries(self, root: ET.Element) -> List[Dict[str, Any]]:
        """解析边界定义 - 符合Starfish XML规范"""
        boundaries = []

        for boundary_elem in root.findall("boundary"):
            boundary_name = boundary_elem.get("name", f"boundary_{len(boundaries)}")
            boundary = {
                "id": boundary_name,
                "name": boundary_name,
                "type": boundary_elem.get("type", "solid"),  # 直接使用Starfish类型
                "nodes": []
            }

            # 解析value属性
            value = boundary_elem.get("value")
            if value is not None:
                boundary["value"] = value

            # 解析reverse属性
            reverse = boundary_elem.get("reverse")
            if reverse is not None:
                boundary["reverse"] = reverse.lower() == "true"

            # 解析材料
            material_elem = boundary_elem.find("material")
            if material_elem is not None and material_elem.text:
                boundary["material"] = material_elem.text.strip()

            # 解析路径
            path_elem = boundary_elem.find("path")
            if path_elem is not None and path_elem.text:
                boundary["path"] = path_elem.text.strip()

            # 解析温度
            temp_elem = boundary_elem.find("temp")
            if temp_elem is not None and temp_elem.text:
                boundary["temp"] = float(temp_elem.text.strip())

            temperature_elem = boundary_elem.find("temperature")
            if temperature_elem is not None and temperature_elem.text:
                boundary["temperature"] = float(temperature_elem.text.strip())

            # 解析点定义
            for point_elem in boundary_elem.findall("point"):
                if point_elem.text:
                    coords = point_elem.text.strip().split(",")
                    if len(coords) >= 2:
                        boundary["nodes"].append({
                            "x": float(coords[0].strip()),
                            "y": float(coords[1].strip())
                        })

            # 如果没有节点，创建默认边界
            if not boundary["nodes"]:
                boundary["nodes"] = [
                    {"x": 0.0, "y": 0.0},
                    {"x": 1.0, "y": 0.0},
                    {"x": 1.0, "y": 1.0},
                    {"x": 0.0, "y": 1.0}
                ]

            boundaries.append(boundary)

        return boundaries
    
    def _parse_materials(self, root: ET.Element) -> List[Dict[str, Any]]:
        """解析材料定义 - 符合Starfish XML规范"""
        materials = []

        for material_elem in root.findall("material"):
            material_name = material_elem.get("name", f"material_{len(materials)}")
            material_type = material_elem.get("type", "kinetic")

            material = {
                "id": material_name,
                "name": material_name,
                "type": material_type,  # 直接使用Starfish类型
                "charge": 0.0  # 默认值
            }

            # 解析基本属性
            molwt_elem = material_elem.find("molwt")
            if molwt_elem is not None and molwt_elem.text:
                material["molwt"] = float(molwt_elem.text.strip())

            mass_elem = material_elem.find("mass")
            if mass_elem is not None and mass_elem.text:
                material["mass"] = float(mass_elem.text.strip())

            charge_elem = material_elem.find("charge")
            if charge_elem is not None and charge_elem.text:
                material["charge"] = float(charge_elem.text.strip())

            # 动力学材料属性
            if material_type == "kinetic":
                spwt_elem = material_elem.find("spwt")
                if spwt_elem is not None and spwt_elem.text:
                    material["spwt"] = float(spwt_elem.text.strip())

                init_elem = material_elem.find("init")
                if init_elem is not None and init_elem.text:
                    material["init"] = init_elem.text.strip()

                ref_temp_elem = material_elem.find("ref_temp")
                if ref_temp_elem is not None and ref_temp_elem.text:
                    material["ref_temp"] = float(ref_temp_elem.text.strip())

                visc_temp_index_elem = material_elem.find("visc_temp_index")
                if visc_temp_index_elem is not None and visc_temp_index_elem.text:
                    material["visc_temp_index"] = float(visc_temp_index_elem.text.strip())

                vss_alpha_elem = material_elem.find("vss_alpha")
                if vss_alpha_elem is not None and vss_alpha_elem.text:
                    material["vss_alpha"] = float(vss_alpha_elem.text.strip())

                diam_elem = material_elem.find("diam")
                if diam_elem is not None and diam_elem.text:
                    material["diam"] = float(diam_elem.text.strip())

            # 玻尔兹曼电子属性
            elif material_type == "boltzmann_electrons":
                model_elem = material_elem.find("model")
                if model_elem is not None and model_elem.text:
                    material["model"] = model_elem.text.strip()

                kTe0_elem = material_elem.find("kTe0")
                if kTe0_elem is not None and kTe0_elem.text:
                    material["kTe0"] = float(kTe0_elem.text.strip())

            # 固体材料属性
            elif material_type == "solid":
                density_elem = material_elem.find("density")
                if density_elem is not None and density_elem.text:
                    material["density"] = float(density_elem.text.strip())

            materials.append(material)

        return materials

    def _parse_sources(self, root: ET.Element) -> List[Dict[str, Any]]:
        """解析源定义"""
        sources = []

        for source_elem in root.findall("source"):
            source_name = source_elem.get("name", f"source_{len(sources)}")
            source = {
                "id": source_name,
                "name": source_name,
                "type": source_elem.get("type", "volume")
            }

            # 解析材料关联
            material_elem = source_elem.find("material")
            if material_elem is not None and material_elem.text:
                source["material"] = material_elem.text.strip()

            # 解析生成率
            rate_elem = source_elem.find("rate")
            if rate_elem is not None and rate_elem.text:
                source["rate"] = float(rate_elem.text.strip())

            # 解析温度
            temperature_elem = source_elem.find("temperature")
            if temperature_elem is not None and temperature_elem.text:
                source["temperature"] = float(temperature_elem.text.strip())

            sources.append(source)

        # 解析边界源
        for boundary_source_elem in root.findall("boundary_source"):
            source_name = boundary_source_elem.get("name", f"boundary_source_{len(sources)}")
            source = {
                "id": source_name,
                "name": source_name,
                "type": boundary_source_elem.get("type", "uniform")
            }

            # 解析边界关联
            boundary_elem = boundary_source_elem.find("boundary")
            if boundary_elem is not None and boundary_elem.text:
                source["boundary"] = boundary_elem.text.strip()

            # 解析材料关联
            material_elem = boundary_source_elem.find("material")
            if material_elem is not None and material_elem.text:
                source["material"] = material_elem.text.strip()

            # 解析质量流率
            mdot_elem = boundary_source_elem.find("mdot")
            if mdot_elem is not None and mdot_elem.text:
                source["mdot"] = float(mdot_elem.text.strip())

            # 解析漂移速度
            v_drift_elem = boundary_source_elem.find("v_drift")
            if v_drift_elem is not None and v_drift_elem.text:
                source["v_drift"] = float(v_drift_elem.text.strip())

            # 解析温度
            temperature_elem = boundary_source_elem.find("temperature")
            if temperature_elem is not None and temperature_elem.text:
                source["temperature"] = float(temperature_elem.text.strip())

            sources.append(source)

        return sources

    def _parse_interactions(self, root: ET.Element) -> List[Dict[str, Any]]:
        """解析相互作用定义"""
        interactions = []

        for interaction_elem in root.findall("interaction"):
            interaction_name = interaction_elem.get("name", f"interaction_{len(interactions)}")
            interaction = {
                "id": interaction_name,
                "name": interaction_name,
                "type": interaction_elem.get("type", "collision"),
                "materials": []
            }

            # 解析参与的材料
            materials_elem = interaction_elem.find("materials")
            if materials_elem is not None and materials_elem.text:
                material_names = [m.strip() for m in materials_elem.text.split(",")]
                interaction["materials"] = material_names

            interactions.append(interaction)

        return interactions

    def _parse_inline_elements(self, root: ET.Element, parsed_data: Dict[str, Any]):
        """解析主文件中内联定义的元素"""

        # 解析内联材料定义
        materials_elem = root.find("materials")
        if materials_elem is not None:
            inline_materials = self._parse_materials(materials_elem)
            parsed_data["materials"].extend(inline_materials)

        # 解析内联源定义
        sources_elem = root.find("sources")
        if sources_elem is not None:
            inline_sources = self._parse_sources(sources_elem)
            parsed_data["sources"].extend(inline_sources)

        # 解析内联边界定义
        boundaries_elem = root.find("boundaries")
        if boundaries_elem is not None:
            inline_boundaries = self._parse_boundaries(boundaries_elem)
            parsed_data["boundaries"].extend(inline_boundaries)

        # 解析内联相互作用定义
        interactions_elem = root.find("interactions")
        if interactions_elem is not None:
            inline_interactions = self._parse_interactions(interactions_elem)
            parsed_data["interactions"].extend(inline_interactions)
