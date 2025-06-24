#!/bin/bash

# EzXML4Starfish 生产环境部署脚本
# 使用方法: ./deploy.sh [start|stop|restart|logs|status]

set -e

PROJECT_NAME="ezxml4starfish"
COMPOSE_FILE="docker-compose.prod.yml"
NETWORK_NAME="mynetwork"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查Docker和Docker Compose
check_dependencies() {
    log_info "检查依赖..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装或未在PATH中"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose 未安装或未在PATH中"
        exit 1
    fi
    
    log_success "依赖检查通过"
}

# 检查网络是否存在
check_network() {
    log_info "检查网络 ${NETWORK_NAME}..."
    
    if ! docker network ls | grep -q "${NETWORK_NAME}"; then
        log_warning "网络 ${NETWORK_NAME} 不存在，正在创建..."
        docker network create ${NETWORK_NAME}
        log_success "网络 ${NETWORK_NAME} 创建成功"
    else
        log_success "网络 ${NETWORK_NAME} 已存在"
    fi
}

# 构建镜像
build_images() {
    log_info "构建Docker镜像..."
    docker-compose -f ${COMPOSE_FILE} build --no-cache
    log_success "镜像构建完成"
}

# 启动服务
start_services() {
    log_info "启动服务..."
    docker-compose -f ${COMPOSE_FILE} up -d
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 10
    
    # 检查服务状态
    if docker-compose -f ${COMPOSE_FILE} ps | grep -q "Up"; then
        log_success "服务启动成功"
        show_status
    else
        log_error "服务启动失败"
        docker-compose -f ${COMPOSE_FILE} logs
        exit 1
    fi
}

# 停止服务
stop_services() {
    log_info "停止服务..."
    docker-compose -f ${COMPOSE_FILE} down
    log_success "服务已停止"
}

# 重启服务
restart_services() {
    log_info "重启服务..."
    stop_services
    start_services
}

# 显示日志
show_logs() {
    docker-compose -f ${COMPOSE_FILE} logs -f
}

# 显示状态
show_status() {
    log_info "服务状态:"
    docker-compose -f ${COMPOSE_FILE} ps
    
    echo ""
    log_info "访问地址:"
    echo "  前端应用: http://localhost:3000"
    echo "  API文档:  http://localhost:3000/api/v1/docs"
    echo ""
    
    log_info "健康检查:"
    echo "  前端: curl -f http://localhost:3000/"
    echo "  后端: docker exec ezxml-backend curl -f http://localhost:8000/health"
}

# 清理资源
cleanup() {
    log_info "清理Docker资源..."
    docker-compose -f ${COMPOSE_FILE} down --rmi all --volumes --remove-orphans
    docker system prune -f
    log_success "清理完成"
}

# 主函数
main() {
    case "${1:-start}" in
        "build")
            check_dependencies
            check_network
            build_images
            ;;
        "start")
            check_dependencies
            check_network
            build_images
            start_services
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            restart_services
            ;;
        "logs")
            show_logs
            ;;
        "status")
            show_status
            ;;
        "cleanup")
            cleanup
            ;;
        *)
            echo "使用方法: $0 [build|start|stop|restart|logs|status|cleanup]"
            echo ""
            echo "命令说明:"
            echo "  build   - 只构建镜像"
            echo "  start   - 构建并启动服务（默认）"
            echo "  stop    - 停止服务"
            echo "  restart - 重启服务"
            echo "  logs    - 查看日志"
            echo "  status  - 查看服务状态"
            echo "  cleanup - 清理所有资源"
            exit 1
            ;;
    esac
}

main "$@"
