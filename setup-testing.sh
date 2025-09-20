#!/bin/bash

# DivvyUp Application Testing Setup Script
# This script sets up the application for local testing

echo "🚀 Setting up DivvyUp for testing..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_info "Installing dependencies..."
npm install

print_info "Installing missing UI dependencies..."
npm install lucide-react react-feather

print_info "Creating environment file..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    print_warning "Created .env file from .env.example"
    print_warning "Please edit .env file with your configuration"
else
    print_status ".env file already exists"
fi

print_info "Starting Docker services..."
npm run docker:up

print_info "Waiting for services to be ready..."
sleep 10

print_info "Checking Docker status..."
npm run docker:status

print_info "Running database migrations..."
npm run db:migrate

print_info "Seeding database with test data..."
npm run db:seed

print_status "Setup complete!"
echo ""
print_info "Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Start the server: npm run dev:server"
echo "3. Start the client: npm run dev:client"
echo "4. Open http://localhost:3000 in your browser"
echo "5. Follow the TESTING_GUIDE.md for comprehensive testing"
echo ""
print_info "Default test user credentials:"
echo "Email: test@example.com"
echo "Password: Password123!"
echo ""
print_status "Happy testing! 🎉"
