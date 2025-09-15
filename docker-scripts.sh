#!/bin/bash

# Docker convenience scripts for DivvyUp development

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker Desktop and try again."
        exit 1
    fi
}

# Function to start development environment
start_dev() {
    print_status "Starting DivvyUp development environment..."
    check_docker
    
    # Start only database services
    docker-compose up -d postgres redis
    
    print_status "Waiting for services to be ready..."
    sleep 10
    
    # Check if services are healthy
    if docker-compose ps | grep -q "healthy"; then
        print_success "Database services are ready!"
        print_status "PostgreSQL: localhost:5432"
        print_status "Redis: localhost:6379"
        print_status "You can now run 'npm run dev' to start the development servers"
    else
        print_warning "Services may still be starting up. Check with 'docker-compose ps'"
    fi
}

# Function to start full-stack development
start_fullstack() {
    print_status "Starting full-stack development environment..."
    check_docker
    
    # Start all services including client and server
    docker-compose --profile full-stack up -d
    
    print_status "Waiting for services to be ready..."
    sleep 15
    
    print_success "Full-stack environment is ready!"
    print_status "Client: http://localhost:3000"
    print_status "Server: http://localhost:3001"
    print_status "PostgreSQL: localhost:5432"
    print_status "Redis: localhost:6379"
}

# Function to stop all services
stop_all() {
    print_status "Stopping all DivvyUp services..."
    docker-compose down
    print_success "All services stopped!"
}

# Function to restart services
restart() {
    print_status "Restarting DivvyUp services..."
    docker-compose restart
    print_success "Services restarted!"
}

# Function to view logs
logs() {
    if [ -z "$1" ]; then
        docker-compose logs -f
    else
        docker-compose logs -f "$1"
    fi
}

# Function to clean up
clean() {
    print_status "Cleaning up DivvyUp Docker environment..."
    docker-compose down -v
    docker system prune -f
    print_success "Cleanup complete!"
}

# Function to show status
status() {
    print_status "DivvyUp Docker services status:"
    docker-compose ps
}

# Function to show help
show_help() {
    echo "DivvyUp Docker Management Scripts"
    echo ""
    echo "Usage: ./docker-scripts.sh [command]"
    echo ""
    echo "Commands:"
    echo "  dev         Start development environment (databases only)"
    echo "  fullstack   Start full-stack development environment"
    echo "  stop        Stop all services"
    echo "  restart     Restart all services"
    echo "  logs [service]  View logs (optionally for specific service)"
    echo "  status      Show services status"
    echo "  clean       Clean up Docker environment"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./docker-scripts.sh dev"
    echo "  ./docker-scripts.sh logs postgres"
    echo "  ./docker-scripts.sh clean"
}

# Main script logic
case "$1" in
    dev)
        start_dev
        ;;
    fullstack)
        start_fullstack
        ;;
    stop)
        stop_all
        ;;
    restart)
        restart
        ;;
    logs)
        logs "$2"
        ;;
    status)
        status
        ;;
    clean)
        clean
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
