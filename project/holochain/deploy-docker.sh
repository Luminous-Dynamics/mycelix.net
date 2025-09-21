#!/usr/bin/env bash

# Docker deployment script for Mycelix
set -e

echo "🐳 Mycelix Docker Deployment"
echo "============================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed"
    exit 1
fi

# Create necessary directories
print_info "Creating necessary directories..."
mkdir -p monitoring/grafana/dashboards
mkdir -p monitoring/grafana/datasources
mkdir -p ssl

# Check for SSL certificates (optional)
if [ ! -f ssl/cert.pem ] || [ ! -f ssl/key.pem ]; then
    print_warning "SSL certificates not found in ssl/ directory"
    print_info "To enable HTTPS, place cert.pem and key.pem in the ssl/ directory"
fi

# Deployment options
case "${1:-demo}" in
    "demo")
        print_info "Deploying in DEMO mode (without full Holochain)"
        
        # Start only the gateway and nginx
        docker-compose -f docker-compose.prod.yml up -d mycelix-gateway nginx
        
        print_success "Demo services started!"
        echo ""
        echo "Access points:"
        echo "  • Web interface: http://localhost"
        echo "  • WebSocket: ws://localhost/ws"
        echo "  • Health check: http://localhost/health"
        echo "  • Metrics: http://localhost/metrics"
        ;;
        
    "full")
        print_info "Deploying FULL stack with monitoring"
        
        # Start all services
        docker-compose -f docker-compose.prod.yml up -d
        
        print_success "All services started!"
        echo ""
        echo "Access points:"
        echo "  • Web interface: http://localhost"
        echo "  • WebSocket: ws://localhost/ws"
        echo "  • Prometheus: http://localhost:9090"
        echo "  • Grafana: http://localhost:3000 (admin/mycelix)"
        ;;
        
    "stop")
        print_info "Stopping all services..."
        docker-compose -f docker-compose.prod.yml down
        print_success "Services stopped"
        ;;
        
    "logs")
        docker-compose -f docker-compose.prod.yml logs -f
        ;;
        
    "status")
        docker-compose -f docker-compose.prod.yml ps
        ;;
        
    "clean")
        print_warning "This will remove all containers and volumes!"
        read -p "Are you sure? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker-compose -f docker-compose.prod.yml down -v
            print_success "All containers and volumes removed"
        fi
        ;;
        
    *)
        echo "Usage: $0 [demo|full|stop|logs|status|clean]"
        echo ""
        echo "  demo   - Start gateway and nginx only (default)"
        echo "  full   - Start all services including monitoring"
        echo "  stop   - Stop all services"
        echo "  logs   - Show logs (Ctrl+C to exit)"
        echo "  status - Show service status"
        echo "  clean  - Remove all containers and volumes"
        exit 1
        ;;
esac

echo ""
echo "Use '$0 logs' to view logs"
echo "Use '$0 status' to check service status"
echo "Use '$0 stop' to stop all services"