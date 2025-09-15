# DivvyUp - Expense Splitting Made Easy

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

A modern, full-stack expense splitting application that makes it easy for friends, families, and groups to track and settle shared expenses. Built with React, Node.js, TypeScript, and PostgreSQL.

## 🚀 Features

- **Group Management**: Create and manage expense groups for different occasions
- **Expense Tracking**: Add, edit, and categorize shared expenses
- **Smart Splitting**: Automatically calculate who owes whom with equal or custom splits
- **Real-time Balances**: Live balance calculations and settlement suggestions
- **Payment Integration**: Connect with Venmo, PayPal, and Stripe for easy payments
- **Mobile Responsive**: Works seamlessly on desktop and mobile devices
- **Real-time Updates**: Live notifications and updates across all devices

## 🏗️ Architecture

DivvyUp is built as a modern monorepo with the following architecture:

```
divvy-up/
├── src/
│   ├── client/          # React frontend application
│   ├── server/          # Node.js/Express backend API
│   └── shared/          # Shared types and utilities
├── scripts/             # Development utilities
├── docs/               # Additional documentation
└── docker/             # Docker configuration
```

### Technology Stack

**Frontend (Client)**
- React 18 with TypeScript
- Vite for fast development and building
- React Router for navigation
- Axios for API communication
- Date-fns for date manipulation

**Backend (Server)**
- Node.js with Express.js
- TypeScript for type safety
- PostgreSQL for data persistence
- Redis for caching and sessions
- JWT for authentication
- Joi for validation

**Development & DevOps**
- Docker & Docker Compose
- ESLint & Prettier for code quality
- Jest for testing
- Git hooks for quality assurance
- Comprehensive npm scripts

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)
- **Docker Desktop** (for database services)
- **Git** (for version control)

### Optional but Recommended
- **VS Code** with recommended extensions
- **Postman** or similar API testing tool
- **pgAdmin** or similar PostgreSQL client

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd divvy-up
```

### 2. Install Dependencies

```bash
npm run install:all
```

### 3. Set Up Environment

```bash
# Copy environment files
cp .env.example .env
cp src/client/.env.example src/client/.env
cp src/server/.env.example src/server/.env

# Edit environment variables as needed
# See ENVIRONMENT.md for detailed configuration
```

### 4. Start Development Environment

```bash
# Start Docker services (PostgreSQL & Redis)
npm run docker:dev

# Start development servers
npm run dev
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/health

## 🛠️ Development

### Available Scripts

#### Essential Commands
```bash
npm run dev              # Start both client and server
npm run dev:full         # Start with Docker services
npm run build            # Build all workspaces
npm run test             # Run all tests
npm run validate         # Run all quality checks
```

#### Development Utilities
```bash
./scripts/dev-utils.sh status    # Show project status
./scripts/dev-utils.sh setup     # Quick setup for new developers
./scripts/dev-utils.sh debug     # Debug common issues
./scripts/dev-utils.sh fresh     # Clean and rebuild everything
```

#### Docker Management
```bash
npm run docker:dev       # Start database services
npm run docker:stop      # Stop all services
npm run docker:logs      # View service logs
npm run docker:clean     # Clean up containers
```

#### Code Quality
```bash
npm run lint             # Run ESLint
npm run format           # Format with Prettier
npm run type-check       # TypeScript checking
npm run validate         # All quality checks
```

### Development Workflow

1. **Start Development Environment**
   ```bash
   npm run dev:full
   ```

2. **Make Changes**
   - Edit files in `src/client/` for frontend changes
   - Edit files in `src/server/` for backend changes
   - Edit files in `src/shared/` for shared utilities

3. **Run Quality Checks**
   ```bash
   npm run validate
   ```

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   # Pre-commit hooks will run automatically
   ```

### Project Structure

```
src/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API services
│   │   ├── utils/         # Utility functions
│   │   ├── types/         # TypeScript types
│   │   └── styles/        # CSS styles
│   ├── public/            # Static assets
│   └── package.json       # Client dependencies
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── controllers/   # API controllers
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Express middleware
│   │   ├── services/      # Business logic
│   │   ├── utils/         # Utility functions
│   │   └── types/         # TypeScript types
│   └── package.json       # Server dependencies
└── shared/                 # Shared code
    ├── src/
    │   ├── types/         # Shared types
    │   ├── utils/         # Shared utilities
    │   └── config/        # Shared configuration
    └── package.json       # Shared dependencies
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific workspace tests
npm run test:client
npm run test:server
npm run test:shared
```

### Test Structure

- **Unit Tests**: Individual component and function tests
- **Integration Tests**: API endpoint and service tests
- **E2E Tests**: Full user workflow tests (planned)

## 🐳 Docker

### Development with Docker

```bash
# Start only database services
npm run docker:dev

# Start full-stack in Docker
npm run docker:fullstack

# View service status
npm run docker:status

# View logs
npm run docker:logs
```

### Docker Services

- **PostgreSQL**: Database server on port 5432
- **Redis**: Cache and session store on port 6379
- **Client**: React development server on port 3000
- **Server**: Express API server on port 3001

## 🔧 Configuration

### Environment Variables

The application uses environment variables for configuration. See [ENVIRONMENT.md](./ENVIRONMENT.md) for detailed configuration options.

Key environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `CLIENT_URL`: Frontend URL for CORS
- `PAYMENT_PROVIDER`: Payment integration provider

### Database Configuration

The application uses PostgreSQL with the following default settings:
- **Host**: localhost
- **Port**: 5432
- **Database**: divvyup
- **User**: divvyup_user
- **Password**: divvyup_password

## 📚 Documentation

- [Environment Configuration](./ENVIRONMENT.md) - Detailed environment setup
- [Docker Setup](./DOCKER.md) - Docker configuration and usage
- [Development Scripts](./DEVELOPMENT_SCRIPTS.md) - Complete script reference
- [Git Workflow](./GIT_WORKFLOW.md) - Git workflow and best practices

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](./CONTRIBUTING.md) for details.

### Development Setup for Contributors

1. Fork the repository
2. Clone your fork
3. Create a feature branch
4. Make your changes
5. Run quality checks: `npm run validate`
6. Commit your changes: `git commit -m "feat: add new feature"`
7. Push to your fork
8. Create a Pull Request

### Code Quality Standards

- All code must pass ESLint and Prettier checks
- All tests must pass
- TypeScript types must be properly defined
- Commit messages must follow conventional commit format
- Code must be properly documented

## 🚀 Deployment

### Production Build

```bash
# Build for production
npm run build:prod

# Start production server
npm run start
```

### Environment Setup

1. Set up production environment variables
2. Configure database and Redis connections
3. Set up reverse proxy (nginx recommended)
4. Configure SSL certificates
5. Set up monitoring and logging

### Docker Deployment

```bash
# Build production images
docker build -f src/client/Dockerfile -t divvy-up-client .
docker build -f src/server/Dockerfile -t divvy-up-server .

# Run with docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

## 📊 Monitoring & Health Checks

### Health Endpoints

- **API Health**: `GET /health` - Server status and basic info
- **Database Health**: `GET /health/db` - Database connection status
- **Redis Health**: `GET /health/redis` - Redis connection status

### Monitoring Scripts

```bash
# Check application health
npm run health

# Check service status
npm run status

# View logs
npm run logs

# Monitor performance
./scripts/dev-utils.sh perf
```

## 🐛 Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   npm run ports              # Check port usage
   npm run kill:ports         # Kill conflicting processes
   ```

2. **Docker Issues**
   ```bash
   npm run docker:clean       # Clean Docker environment
   npm run docker:dev         # Restart services
   ```

3. **Build Issues**
   ```bash
   npm run clean              # Clean build artifacts
   npm run fresh              # Complete rebuild
   ```

4. **Dependency Issues**
   ```bash
   npm run install:all        # Reinstall dependencies
   npm run reset              # Complete reset
   ```

### Getting Help

- Check the [troubleshooting section](./DEVELOPMENT_SCRIPTS.md#troubleshooting)
- Run `./scripts/dev-utils.sh debug` for automated diagnostics
- Review logs with `npm run logs`
- Check service status with `npm run status`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by Splitwise and Venmo's group payment features
- Community contributions and feedback

## 📞 Support

- **Documentation**: Check the docs/ directory
- **Issues**: Create an issue on GitHub
- **Discussions**: Use GitHub Discussions for questions

---

**Happy coding! 🎉**

For more detailed information, check out our comprehensive documentation in the `docs/` directory.