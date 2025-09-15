#!/bin/bash

# DivvyUp Development Utilities
# Collection of helpful development scripts

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# Check if we're in the right directory
check_project_root() {
    if [ ! -f "package.json" ]; then
        print_error "Not in project root directory"
        exit 1
    fi
}

# Show project status
status() {
    print_header "DivvyUp Project Status"
    
    echo -e "\n${PURPLE}📦 Dependencies:${NC}"
    if [ -d "node_modules" ]; then
        print_success "Root dependencies installed"
    else
        print_warning "Root dependencies not installed"
    fi
    
    echo -e "\n${PURPLE}🐳 Docker Services:${NC}"
    if command -v docker &> /dev/null; then
        if docker ps | grep -q "divvy-up"; then
            print_success "Docker services running"
            docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep divvy-up
        else
            print_warning "Docker services not running"
        fi
    else
        print_warning "Docker not installed"
    fi
    
    echo -e "\n${PURPLE}🌐 Services:${NC}"
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        print_success "Server running on port 3001"
    else
        print_warning "Server not running on port 3001"
    fi
    
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        print_success "Client running on port 3000"
    else
        print_warning "Client not running on port 3000"
    fi
    
    echo -e "\n${PURPLE}📊 Port Usage:${NC}"
    lsof -i :3000,3001,5432,6379 2>/dev/null || echo "No processes found on target ports"
}

# Quick setup for new developers
quick_setup() {
    print_header "Quick Setup for New Developers"
    
    print_info "Installing dependencies..."
    npm run install:all
    
    print_info "Starting Docker services..."
    npm run docker:dev
    
    print_info "Building project..."
    npm run build
    
    print_success "Setup complete! Run 'npm run dev' to start development"
}

# Clean everything and start fresh
fresh_start() {
    print_header "Fresh Start"
    
    print_info "Stopping all services..."
    npm run stop 2>/dev/null || true
    
    print_info "Cleaning Docker..."
    npm run docker:clean
    
    print_info "Cleaning build artifacts..."
    npm run clean
    
    print_info "Reinstalling dependencies..."
    npm run install:all
    
    print_info "Starting fresh development environment..."
    npm run setup:dev
    
    print_success "Fresh start complete!"
}

# Show available scripts
show_scripts() {
    print_header "Available Development Scripts"
    
    echo -e "\n${PURPLE}🚀 Development:${NC}"
    echo "  npm run dev              - Start both client and server"
    echo "  npm run dev:client       - Start client only"
    echo "  npm run dev:server       - Start server only"
    echo "  npm run dev:full         - Start with Docker services"
    
    echo -e "\n${PURPLE}🏗️  Building:${NC}"
    echo "  npm run build            - Build all workspaces"
    echo "  npm run build:prod       - Production build"
    echo "  npm run build:watch      - Watch mode build"
    echo "  npm run build:analyze    - Analyze bundle sizes"
    
    echo -e "\n${PURPLE}🧪 Testing:${NC}"
    echo "  npm run test             - Run all tests"
    echo "  npm run test:watch       - Watch mode tests"
    echo "  npm run test:coverage    - Run tests with coverage"
    echo "  npm run test:debug       - Debug tests"
    
    echo -e "\n${PURPLE}🔍 Quality:${NC}"
    echo "  npm run lint             - Run ESLint"
    echo "  npm run format           - Format code with Prettier"
    echo "  npm run type-check       - TypeScript type checking"
    echo "  npm run validate         - Run all quality checks"
    
    echo -e "\n${PURPLE}🐳 Docker:${NC}"
    echo "  npm run docker:dev       - Start database services"
    echo "  npm run docker:fullstack - Start everything in Docker"
    echo "  npm run docker:stop      - Stop Docker services"
    echo "  npm run docker:logs      - View Docker logs"
    
    echo -e "\n${PURPLE}🛠️  Utilities:${NC}"
    echo "  npm run health           - Check server health"
    echo "  npm run ports            - Show port usage"
    echo "  npm run kill:ports       - Kill processes on ports"
    echo "  npm run fresh            - Clean and rebuild everything"
}

# Debug common issues
debug() {
    print_header "Debugging Common Issues"
    
    echo -e "\n${PURPLE}🔍 Checking common issues...${NC}"
    
    # Check Node.js version
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_info "Node.js version: $NODE_VERSION"
        if [[ $NODE_VERSION < "v18.0.0" ]]; then
            print_warning "Node.js version should be 18 or higher"
        fi
    else
        print_error "Node.js not installed"
    fi
    
    # Check npm version
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_info "npm version: $NPM_VERSION"
    else
        print_error "npm not installed"
    fi
    
    # Check Docker
    if command -v docker &> /dev/null; then
        print_success "Docker installed"
        if docker ps > /dev/null 2>&1; then
            print_success "Docker daemon running"
        else
            print_warning "Docker daemon not running"
        fi
    else
        print_warning "Docker not installed"
    fi
    
    # Check ports
    print_info "Checking port availability..."
    for port in 3000 3001 5432 6379; do
        if lsof -i :$port > /dev/null 2>&1; then
            print_warning "Port $port is in use"
        else
            print_success "Port $port is available"
        fi
    done
    
    # Check environment files
    if [ -f ".env" ]; then
        print_success ".env file exists"
    else
        print_warning ".env file not found (copy from .env.example)"
    fi
    
    # Check dependencies
    if [ -d "node_modules" ]; then
        print_success "Dependencies installed"
    else
        print_warning "Dependencies not installed (run npm install)"
    fi
}

# Performance monitoring
perf() {
    print_header "Performance Monitoring"
    
    echo -e "\n${PURPLE}📊 System Resources:${NC}"
    if command -v top &> /dev/null; then
        echo "CPU and Memory usage:"
        top -l 1 | head -10
    fi
    
    echo -e "\n${PURPLE}🌐 Network Connections:${NC}"
    if command -v netstat &> /dev/null; then
        netstat -an | grep -E ":(3000|3001|5432|6379)" | head -10
    fi
    
    echo -e "\n${PURPLE}💾 Disk Usage:${NC}"
    if command -v du &> /dev/null; then
        echo "Project size:"
        du -sh . 2>/dev/null || echo "Unable to calculate"
        echo "Node modules size:"
        du -sh node_modules 2>/dev/null || echo "Node modules not found"
    fi
}

# Show help
show_help() {
    echo "DivvyUp Development Utilities"
    echo ""
    echo "Usage: ./scripts/dev-utils.sh [command]"
    echo ""
    echo "Commands:"
    echo "  status        Show project status"
    echo "  setup         Quick setup for new developers"
    echo "  fresh         Clean everything and start fresh"
    echo "  scripts       Show available npm scripts"
    echo "  debug         Debug common issues"
    echo "  perf          Show performance metrics"
    echo "  help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./scripts/dev-utils.sh status"
    echo "  ./scripts/dev-utils.sh setup"
    echo "  ./scripts/dev-utils.sh debug"
}

# Main script logic
check_project_root

case "${1:-help}" in
    status)
        status
        ;;
    setup)
        quick_setup
        ;;
    fresh)
        fresh_start
        ;;
    scripts)
        show_scripts
        ;;
    debug)
        debug
        ;;
    perf)
        perf
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
