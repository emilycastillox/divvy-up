# Docker Setup for DivvyUp

This document describes how to use Docker for local development of the DivvyUp expense splitting application.

## Prerequisites

- Docker Desktop installed and running
- Node.js 18+ and npm installed locally

## Quick Start

### 1. Start Database Services Only
```bash
# Start PostgreSQL and Redis
npm run docker:dev

# Or use the script directly
./docker-scripts.sh dev
```

### 2. Start Full-Stack Development
```bash
# Start all services including client and server in Docker
npm run docker:fullstack

# Or use the script directly
./docker-scripts.sh fullstack
```

### 3. Start Local Development (Recommended)
```bash
# Start databases in Docker
npm run docker:dev

# Start client and server locally
npm run dev
```

## Available Services

| Service | Port | Description |
|---------|------|-------------|
| PostgreSQL | 5432 | Main database |
| Redis | 6379 | Caching and sessions |
| Client (Dev) | 3000 | React development server |
| Server (Dev) | 3001 | Express API server |

## Docker Commands

### Using npm scripts:
```bash
npm run docker:dev        # Start databases only
npm run docker:fullstack  # Start all services
npm run docker:stop       # Stop all services
npm run docker:restart    # Restart all services
npm run docker:logs       # View logs
npm run docker:status     # Check service status
npm run docker:clean      # Clean up everything
```

### Using the script directly:
```bash
./docker-scripts.sh dev         # Start databases only
./docker-scripts.sh fullstack   # Start all services
./docker-scripts.sh stop        # Stop all services
./docker-scripts.sh restart     # Restart all services
./docker-scripts.sh logs        # View all logs
./docker-scripts.sh logs postgres  # View specific service logs
./docker-scripts.sh status      # Check service status
./docker-scripts.sh clean       # Clean up everything
```

## Environment Configuration

### For Docker Development
The Docker services use these default configurations:

**PostgreSQL:**
- Database: `divvyup`
- User: `divvyup_user`
- Password: `divvyup_password`
- Host: `localhost` (from host machine)
- Port: `5432`

**Redis:**
- Host: `localhost` (from host machine)
- Port: `6379`

### Environment Variables
Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL=postgresql://divvyup_user:divvyup_password@localhost:5432/divvyup
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

## Development Workflow

### Option 1: Hybrid Development (Recommended)
1. Start Docker services: `npm run docker:dev`
2. Start local development: `npm run dev`
3. Access client at: http://localhost:3000
4. Access server at: http://localhost:3001

### Option 2: Full Docker Development
1. Start all services: `npm run docker:fullstack`
2. Access client at: http://localhost:3000
3. Access server at: http://localhost:3001

## Troubleshooting

### Services Not Starting
```bash
# Check Docker status
docker ps

# Check service logs
./docker-scripts.sh logs

# Restart services
./docker-scripts.sh restart
```

### Port Conflicts
If ports 3000, 3001, 5432, or 6379 are already in use:

1. Stop conflicting services
2. Or modify ports in `docker-compose.yml`
3. Update environment variables accordingly

### Database Connection Issues
```bash
# Check PostgreSQL logs
./docker-scripts.sh logs postgres

# Check if database is ready
docker exec -it divvy-up-postgres psql -U divvyup_user -d divvyup -c "SELECT 1;"
```

### Clean Slate
```bash
# Stop and remove everything
./docker-scripts.sh clean

# Start fresh
./docker-scripts.sh dev
```

## Production Docker Images

The project includes production Dockerfiles:

- `src/client/Dockerfile` - Production React build with Nginx
- `src/server/Dockerfile` - Production Node.js server

### Building Production Images
```bash
# Build client image
docker build -f src/client/Dockerfile -t divvy-up-client .

# Build server image
docker build -f src/server/Dockerfile -t divvy-up-server .
```

## File Structure

```
divvy-up/
├── docker-compose.yml          # Docker Compose configuration
├── docker-scripts.sh           # Convenience scripts
├── .dockerignore               # Docker ignore file
├── DOCKER.md                   # This documentation
├── src/
│   ├── client/
│   │   ├── Dockerfile          # Production client image
│   │   ├── Dockerfile.dev      # Development client image
│   │   └── nginx.conf          # Nginx configuration
│   └── server/
│       ├── Dockerfile          # Production server image
│       └── Dockerfile.dev      # Development server image
└── .env.example                # Environment variables template
```

## Health Checks

All services include health checks:

- **PostgreSQL**: `pg_isready` command
- **Redis**: `redis-cli ping` command

Check service health:
```bash
./docker-scripts.sh status
```

## Data Persistence

- PostgreSQL data is persisted in Docker volume `divvy-up_postgres_data`
- Redis data is persisted in Docker volume `divvy-up_redis_data`

To reset data:
```bash
./docker-scripts.sh clean
```
