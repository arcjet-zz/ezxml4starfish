@echo off
setlocal enabledelayedexpansion

REM EzXML4Starfish 生产环境部署脚本 (Windows)
REM 使用方法: deploy.bat [start|stop|restart|logs|status|cleanup]

set PROJECT_NAME=ezxml4starfish
set COMPOSE_FILE=docker-compose.prod.yml
set NETWORK_NAME=mynetwork

REM 获取命令参数，默认为start
set COMMAND=%1
if "%COMMAND%"=="" set COMMAND=start

echo [INFO] EzXML4Starfish 部署脚本
echo ================================

REM 检查Docker和Docker Compose
:check_dependencies
echo [INFO] 检查依赖...

docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker 未安装或未在PATH中
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Compose 未安装或未在PATH中
    exit /b 1
)

echo [SUCCESS] 依赖检查通过

REM 检查网络是否存在
:check_network
echo [INFO] 检查网络 %NETWORK_NAME%...

docker network ls | findstr %NETWORK_NAME% >nul
if errorlevel 1 (
    echo [WARNING] 网络 %NETWORK_NAME% 不存在，正在创建...
    docker network create %NETWORK_NAME%
    if errorlevel 1 (
        echo [ERROR] 网络创建失败
        exit /b 1
    )
    echo [SUCCESS] 网络 %NETWORK_NAME% 创建成功
) else (
    echo [SUCCESS] 网络 %NETWORK_NAME% 已存在
)

REM 根据命令执行相应操作
if "%COMMAND%"=="build" goto build_images
if "%COMMAND%"=="start" goto start_services
if "%COMMAND%"=="stop" goto stop_services
if "%COMMAND%"=="restart" goto restart_services
if "%COMMAND%"=="logs" goto show_logs
if "%COMMAND%"=="status" goto show_status
if "%COMMAND%"=="cleanup" goto cleanup
goto show_help

:build_images
echo [INFO] 构建Docker镜像...
docker-compose -f %COMPOSE_FILE% build --no-cache
if errorlevel 1 (
    echo [ERROR] 镜像构建失败
    exit /b 1
)
echo [SUCCESS] 镜像构建完成
goto end

:start_services
call :build_images
echo [INFO] 启动服务...
docker-compose -f %COMPOSE_FILE% up -d
if errorlevel 1 (
    echo [ERROR] 服务启动失败
    docker-compose -f %COMPOSE_FILE% logs
    exit /b 1
)

echo [INFO] 等待服务启动...
timeout /t 10 /nobreak >nul

REM 检查服务状态
docker-compose -f %COMPOSE_FILE% ps | findstr "Up" >nul
if errorlevel 1 (
    echo [ERROR] 服务启动失败
    docker-compose -f %COMPOSE_FILE% logs
    exit /b 1
) else (
    echo [SUCCESS] 服务启动成功
    call :show_status
)
goto end

:stop_services
echo [INFO] 停止服务...
docker-compose -f %COMPOSE_FILE% down
echo [SUCCESS] 服务已停止
goto end

:restart_services
echo [INFO] 重启服务...
call :stop_services
call :start_services
goto end

:show_logs
docker-compose -f %COMPOSE_FILE% logs -f
goto end

:show_status
echo [INFO] 服务状态:
docker-compose -f %COMPOSE_FILE% ps
echo.
echo [INFO] 访问地址:
echo   前端应用: http://localhost:3000
echo   API文档:  http://localhost:3000/api/v1/docs
echo.
echo [INFO] 健康检查:
echo   前端: curl -f http://localhost:3000/
echo   后端: docker exec ezxml-backend curl -f http://localhost:8000/health
goto end

:cleanup
echo [INFO] 清理Docker资源...
docker-compose -f %COMPOSE_FILE% down --rmi all --volumes --remove-orphans
docker system prune -f
echo [SUCCESS] 清理完成
goto end

:show_help
echo 使用方法: %0 [build^|start^|stop^|restart^|logs^|status^|cleanup]
echo.
echo 命令说明:
echo   build   - 只构建镜像
echo   start   - 构建并启动服务（默认）
echo   stop    - 停止服务
echo   restart - 重启服务
echo   logs    - 查看日志
echo   status  - 查看服务状态
echo   cleanup - 清理所有资源
goto end

:end
echo.
echo 操作完成！
pause
