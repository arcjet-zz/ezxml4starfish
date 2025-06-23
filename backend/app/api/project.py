"""
项目相关API端点
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import StreamingResponse
from typing import List, Dict
import io
import zipfile
import logging

from app.models.simulation import SimulationProject
from app.services.xml_parser import XMLParserService
from app.services.xml_generator import XMLGeneratorService

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/parse", response_model=SimulationProject)
async def parse_project(
    files: List[UploadFile] = File(...)
):
    """
    解析上传的XML文件集，返回结构化的项目JSON

    Args:
        files: 上传的XML文件列表，必须包含starfish.xml

    Returns:
        SimulationProject: 解析后的项目对象

    Raises:
        HTTPException: 当文件缺失或解析失败时
    """
    try:
        logger.info(f"Received {len(files)} files for parsing")

        # 验证文件并创建文件字典
        file_dict: Dict[str, UploadFile] = {}
        for file in files:
            if file.filename:
                file_dict[file.filename] = file
                logger.info(f"Processing file: {file.filename}")

        # 验证必需的文件
        if "starfish.xml" not in file_dict:
            raise HTTPException(
                status_code=400,
                detail="Missing required file: starfish.xml"
            )

        # 解析XML文件
        parser_service = XMLParserService()
        project = await parser_service.parse_files(file_dict)

        logger.info("Successfully parsed project files")
        return project

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"XML parsing error: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"XML parsing error: {str(e)}"
        )

@router.post("/generate")
async def generate_project(project: SimulationProject):
    """
    根据提供的项目JSON，生成并返回包含所有XML文件的ZIP压缩包

    Args:
        project: 项目配置对象

    Returns:
        StreamingResponse: ZIP文件流

    Raises:
        HTTPException: 当生成失败时
    """
    try:
        logger.info("Starting project generation")

        # 生成XML文件
        generator_service = XMLGeneratorService()
        xml_files = generator_service.generate_xml_files(project)

        logger.info(f"Generated {len(xml_files)} XML files")

        # 创建ZIP文件
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for filename, content in xml_files.items():
                zip_file.writestr(filename, content)
                logger.info(f"Added {filename} to ZIP")

        zip_buffer.seek(0)

        # 返回ZIP文件流
        return StreamingResponse(
            io.BytesIO(zip_buffer.read()),
            media_type="application/zip",
            headers={"Content-Disposition": "attachment; filename=starfish_project.zip"}
        )

    except Exception as e:
        logger.error(f"Project generation error: {str(e)}")
        raise HTTPException(
            status_code=422,
            detail=f"Project generation error: {str(e)}"
        )

@router.get("/template", response_model=SimulationProject)
async def get_project_template():
    """
    获取项目模板

    Returns:
        SimulationProject: 默认的项目模板
    """
    try:
        # 创建默认项目模板
        template = SimulationProject()
        logger.info("Generated project template")
        return template

    except Exception as e:
        logger.error(f"Template generation error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Template generation error: {str(e)}"
        )
