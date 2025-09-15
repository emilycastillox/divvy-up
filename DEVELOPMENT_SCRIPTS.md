# Development Scripts Guide

This document provides a comprehensive guide to all available development scripts in the DivvyUp project.

## Quick Reference

### Essential Commands
```bash
# Start development
npm run dev                    # Start both client and server
npm run dev:full              # Start with Docker services

# Build and test
npm run build                 # Build all workspaces
npm run test                  # Run all tests
npm run validate              # Run all quality checks

# Docker services
npm run docker:dev            # Start databases
npm run docker:stop           # Stop all services
```

## Root Scripts

### Development
| Script | Description |
|--------|-------------|
| `npm run dev` | Start both client and server in development mode |
| `npm run dev:client` | Start only the client development server |
| `npm run dev:server` | Start only the server development server |
| `npm run dev:full` | Start with Docker services and development servers |
| `npm run dev:client-only` | Alias for dev:client |
| `npm run dev:server-only` | Alias for dev:server |

### Building
| Script | Description |
|--------|-------------|
| `npm run build` | Build all workspaces (shared, client, server) |
| `npm run build:prod` | Production build with NODE_ENV=production |
| `npm run build:client` | Build only the client |
| `npm run build:server` | Build only the server |
| `npm run build:shared` | Build only the shared package |
| `npm run build:watch` | Watch mode build for all workspaces |
| `npm run build:analyze` | Analyze bundle sizes for client and server |

### Testing
| Script | Description |
|--------|-------------|
| `npm run test` | Run all tests across all workspaces |
| `npm run test:client` | Run client tests only |
| `npm run test:server` | Run server tests only |
| `npm run test:shared` | Run shared package tests only |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage reporting |
| `npm run test:ci` | CI-friendly test run with coverage and linting |
| `npm run test:debug` | Debug tests with Node.js inspector |

### Code Quality
| Script | Description |
|--------|-------------|
| `npm run lint` | Run ESLint on all workspaces |
| `npm run lint:fix` | Fix ESLint issues automatically |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check if code is properly formatted |
| `npm run type-check` | Run TypeScript type checking |
| `npm run validate` | Run all quality checks (type-check, lint, test, format) |
| `npm run validate:fix` | Fix all fixable issues |

### Docker
| Script | Description |
|--------|-------------|
| `npm run docker:dev` | Start PostgreSQL and Redis services |
| `npm run docker:fullstack` | Start all services in Docker |
| `npm run docker:stop` | Stop all Docker services |
| `npm run docker:restart` | Restart all Docker services |
| `npm run docker:logs` | View Docker service logs |
| `npm run docker:status` | Show Docker service status |
| `npm run docker:clean` | Clean up Docker containers and volumes |

### Utilities
| Script | Description |
|--------|-------------|
| `npm run clean` | Clean build artifacts from all workspaces |
| `npm run fresh` | Clean, reinstall, and build everything |
| `npm run fresh:dev` | Clean, reinstall, and start development |
| `npm run reset` | Complete reset (Docker clean + fresh install) |
| `npm run setup` | Full setup for new developers |
| `npm run setup:dev` | Development setup (install + Docker) |

### Health & Monitoring
| Script | Description |
|--------|-------------|
| `npm run health` | Check server health endpoint |
| `npm run status` | Show Docker service status |
| `npm run logs` | View Docker logs |
| `npm run ports` | Show processes using project ports |
| `npm run kill:ports` | Kill processes on project ports |
| `npm run db:status` | Check database status |
| `npm run redis:status` | Check Redis status |

### Debugging
| Script | Description |
|--------|-------------|
| `npm run debug:client` | Start client with debug flags |
| `npm run debug:server` | Start server with Node.js inspector |
| `npm run debug:full` | Start both with debugging enabled |
| `npm run test:debug` | Debug tests with inspector |

### Production
| Script | Description |
|--------|-------------|
| `npm run start` | Build and start production server |
| `npm run start:server` | Start production server only |
| `npm run start:client` | Start production client preview |
| `npm run profile:client` | Profile client build |
| `npm run profile:server` | Profile server performance |

### Release
| Script | Description |
|--------|-------------|
| `npm run release` | Full release process (validate + build + version) |
| `npm run release:version` | Patch version bump and push |
| `npm run release:minor` | Minor version bump and push |
| `npm run release:major` | Major version bump and push |

## Client-Specific Scripts

### Development
```bash
cd src/client
npm run dev                    # Start Vite dev server
npm run dev:debug              # Start with debug flags
npm run dev:host               # Start with host flag
npm run dev:open               # Start and open browser
npm run dev:force              # Force rebuild
npm run dev:clear-cache        # Clear Vite cache and start
```

### Building
```bash
npm run build                  # Build for production
npm run build:watch            # Watch mode TypeScript compilation
npm run build:analyze          # Analyze bundle size
```

### Testing
```bash
npm run test                   # Run Jest tests
npm run test:watch             # Watch mode tests
npm run test:coverage          # Tests with coverage
npm run test:debug             # Debug tests
npm run test:ui                # Interactive test UI
```

### Preview
```bash
npm run preview                # Preview production build
npm run preview:prod           # Build and preview
npm run serve                  # Alias for preview
```

## Server-Specific Scripts

### Development
```bash
cd src/server
npm run dev                    # Start with tsx watch
npm run dev:debug              # Start with Node.js inspector
npm run dev:inspect            # Start with inspect-brk
npm run dev:clear-cache        # Clear cache and start
```

### Building
```bash
npm run build                  # Build TypeScript
npm run build:watch            # Watch mode compilation
npm run build:analyze          # Analyze bundle
```

### Testing
```bash
npm run test                   # Run Jest tests
npm run test:watch             # Watch mode tests
npm run test:coverage          # Tests with coverage
npm run test:debug             # Debug tests
npm run test:ui                # Interactive test UI
npm run test:integration       # Integration tests
npm run test:e2e               # End-to-end tests
```

### Production
```bash
npm run start                  # Start production server
npm run start:prod             # Start with NODE_ENV=production
npm run start:debug            # Start with inspector
npm run start:inspect          # Start with inspect-brk
```

### Database
```bash
npm run db:migrate             # Run database migrations
npm run db:seed                # Seed database with test data
npm run db:reset               # Migrate and seed
npm run db:status              # Check database status
```

### Utilities
```bash
npm run health-check           # Check server health
npm run benchmark              # Run performance benchmarks
npm run load-test              # Run load tests
npm run logs:tail              # Tail application logs
npm run logs:clear             # Clear log files
npm run docs                   # Generate API documentation
npm run swagger                # Generate Swagger documentation
```

## Development Utilities

### Using dev-utils.sh
```bash
# Show project status
./scripts/dev-utils.sh status

# Quick setup for new developers
./scripts/dev-utils.sh setup

# Clean everything and start fresh
./scripts/dev-utils.sh fresh

# Show all available scripts
./scripts/dev-utils.sh scripts

# Debug common issues
./scripts/dev-utils.sh debug

# Show performance metrics
./scripts/dev-utils.sh perf
```

## Common Workflows

### New Developer Setup
```bash
# Clone repository
git clone <repository-url>
cd divvy-up

# Quick setup
./scripts/dev-utils.sh setup

# Or manual setup
npm run install:all
npm run docker:dev
npm run build
npm run dev
```

### Daily Development
```bash
# Start development environment
npm run dev:full

# In another terminal, run tests
npm run test:watch

# Check code quality
npm run validate
```

### Before Committing
```bash
# Run all quality checks
npm run validate

# Or fix issues automatically
npm run validate:fix

# Commit (pre-commit hooks will run automatically)
git commit -m "feat: add new feature"
```

### Debugging Issues
```bash
# Check project status
./scripts/dev-utils.sh status

# Debug common issues
./scripts/dev-utils.sh debug

# Check specific service health
npm run health
npm run db:status
npm run redis:status
```

### Performance Testing
```bash
# Build for production
npm run build:prod

# Profile client
npm run profile:client

# Profile server
npm run profile:server

# Run benchmarks
npm run benchmark
```

### Release Process
```bash
# Full release (patch version)
npm run release

# Minor version release
npm run release:minor

# Major version release
npm run release:major
```

## Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   npm run ports              # Check what's using ports
   npm run kill:ports         # Kill conflicting processes
   ```

2. **Docker issues**
   ```bash
   npm run docker:status      # Check Docker services
   npm run docker:clean       # Clean up Docker
   npm run docker:dev         # Restart services
   ```

3. **Build issues**
   ```bash
   npm run clean              # Clean build artifacts
   npm run fresh              # Complete rebuild
   ```

4. **Test failures**
   ```bash
   npm run test:debug         # Debug specific tests
   npm run test:coverage      # Check test coverage
   ```

5. **Dependency issues**
   ```bash
   npm run install:all        # Reinstall all dependencies
   npm run reset              # Complete reset
   ```

### Getting Help

- Run `./scripts/dev-utils.sh help` for utility commands
- Run `npm run` to see all available scripts
- Check the logs with `npm run logs`
- Use `npm run debug` for debugging specific issues

## Best Practices

1. **Always run quality checks before committing**
   ```bash
   npm run validate
   ```

2. **Use watch mode during development**
   ```bash
   npm run test:watch
   npm run build:watch
   ```

3. **Keep Docker services running during development**
   ```bash
   npm run docker:dev
   ```

4. **Use debug mode for troubleshooting**
   ```bash
   npm run debug:server
   npm run test:debug
   ```

5. **Clean up regularly**
   ```bash
   npm run clean
   npm run docker:clean
   ```

This comprehensive script system ensures a smooth development experience with proper tooling, testing, and quality assurance at every step.
