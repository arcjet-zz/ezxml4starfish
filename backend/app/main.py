"""
Starfish-ezxml Backend API
FastAPI应用主入口
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from app.api.routes import router as api_router

# 创建FastAPI应用实例
app = FastAPI(
    title="Starfish-ezxml API",
    description="为Starfish仿真软件提供可视化XML配置工具的后端API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# 配置CORS中间件
import os
environment = os.getenv("ENVIRONMENT", "development")
configured_origins = os.getenv("CORS_ORIGINS")

def parse_origins(value: str):
    """Parse comma-separated CORS origins from the environment."""
    return [origin.strip() for origin in value.split(",") if origin.strip()]

if configured_origins:
    allowed_origins = parse_origins(configured_origins)
elif environment == "production":
    # 生产环境默认通过前端nginx同源代理访问API，不开放跨源访问
    allowed_origins = []
else:
    # 开发环境：允许本地开发服务器
    allowed_origins = ["http://localhost:3000", "http://127.0.0.1:3000"]

allow_credentials = "*" not in allowed_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册API路由
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    """根路径健康检查"""
    return JSONResponse({
        "message": "Starfish-ezxml API is running",
        "version": "1.0.0",
        "docs": "/docs"
    })

@app.get("/health")
async def health_check():
    """健康检查端点"""
    return JSONResponse({"status": "healthy"})

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
