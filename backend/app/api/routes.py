"""
API路由配置
"""

from fastapi import APIRouter

from app.api.project import router as project_router

# 创建主路由器
router = APIRouter()

# 注册子路由
router.include_router(project_router, prefix="/project", tags=["project"])
