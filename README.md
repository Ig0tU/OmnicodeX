# CloudIDE - Enterprise Cloud Development Environment

A comprehensive, cloud-native IDE platform providing intelligent builders, real-time collaboration, and enterprise-grade development tools.

## 🚀 Features

- **Intelligent Builder System**: AI-powered development environments with specialized builders for frontend, backend, DevOps, and security tasks
- **Real-time Collaboration**: WebSocket-based live collaboration with commenting and notification systems
- **Enterprise Security**: Advanced authentication, authorization, and audit trail capabilities
- **Performance Monitoring**: Comprehensive metrics tracking with Core Web Vitals and custom performance indicators
- **Scalable Architecture**: Containerized microservices with Kubernetes orchestration support
- **Advanced Developer Experience**: Integrated testing, linting, type checking, and AI-assisted code completion

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Development Setup](#development-setup)
- [Production Deployment](#production-deployment)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Monitoring](#monitoring)
- [Contributing](#contributing)
- [License](#license)

## ⚡ Quick Start

### Prerequisites

- **Node.js**: >= 20.0.0
- **Docker**: >= 24.0.0
- **Docker Compose**: >= 2.20.0
- **Git**: >= 2.40.0

### Development Environment

```bash
# Clone the repository
git clone https://github.com/your-org/cloudide.git
cd cloudide

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Start development services
docker-compose -f docker-compose.dev.yml up -d

# Start the development server
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **API Documentation**: http://localhost:5173/docs
- **Health Check**: http://localhost:3000/api/health

### Production Deployment

```bash
# Build production images
docker-compose build

# Deploy with production configuration
docker-compose up -d

# Verify deployment
curl http://localhost/api/health
```

## 🏗️ Architecture

CloudIDE follows a modern microservices architecture with the following components:

### Core Services

- **Frontend Service** (React + TypeScript): User interface and client-side logic
- **API Gateway** (Nginx): Request routing, load balancing, and SSL termination
- **Backend Services** (Node.js): Core business logic and API endpoints
- **Database** (PostgreSQL): Primary data persistence
- **Cache Layer** (Redis): Session storage and real-time data caching
- **Message Queue** (Redis): Asynchronous task processing

### Builder Ecosystem

- **Builder Orchestrator**: Manages builder lifecycle and task distribution
- **Specialized Builders**: Frontend, Backend, DevOps, Security, and AI/ML builders
- **Resource Manager**: Dynamic resource allocation and scaling
- **Artifact Storage**: Secure storage for build outputs and deployments

### Monitoring & Observability

- **Performance Monitoring**: Real-time metrics collection and analysis
- **Error Tracking**: Centralized error reporting and alerting
- **Audit Logging**: Comprehensive audit trail for compliance
- **Health Checks**: Service health monitoring and automatic recovery

## 🛠️ Development Setup

### Environment Variables

Copy `.env.example` to `.env` and configure the following variables:

```bash
# Application Configuration
NODE_ENV=development
PORT=5173
API_URL=http://localhost:3000/api
WS_URL=ws://localhost:3000/ws

# Database Configuration
DATABASE_URL=postgresql://cloudide:password@localhost:5432/cloudide_dev
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secure-jwt-secret
JWT_EXPIRY=24h
SESSION_SECRET=your-session-secret

# Cloud Provider Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key

# Monitoring
SENTRY_DSN=your-sentry-dsn
ANALYTICS_KEY=your-analytics-key

# Feature Flags
ENABLE_REAL_TIME_UPDATES=true
ENABLE_ADVANCED_EDITOR=true
ENABLE_PERFORMANCE_MONITORING=true
ENABLE_SECURITY_AUDIT=true
```

### Local Development Scripts

```bash
# Development
npm run dev              # Start development server with hot reload
npm run dev:api          # Start API server only
npm run dev:full         # Start full stack with Docker services

# Code Quality
npm run lint             # ESLint code analysis
npm run lint:fix         # Auto-fix linting issues
npm run typecheck        # TypeScript type checking
npm run format           # Prettier code formatting

# Testing
npm run test             # Run unit tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
npm run test:e2e         # Run end-to-end tests
npm run test:load        # Run load tests

# Build & Deployment
npm run build            # Production build
npm run preview          # Preview production build locally
npm run docker:build     # Build Docker images
npm run docker:dev       # Start development environment
```

### Database Setup

```bash
# Start PostgreSQL with Docker
docker-compose -f docker-compose.dev.yml up postgres -d

# Run migrations
npm run db:migrate

# Seed development data
npm run db:seed

# Reset database (development only)
npm run db:reset
```

## 🚀 Production Deployment

### Docker Deployment

```bash
# Build production images
docker-compose build --no-cache

# Deploy with production configuration
docker-compose up -d

# View logs
docker-compose logs -f

# Scale services
docker-compose up -d --scale backend=3
```

### Kubernetes Deployment

```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n cloudide

# View service logs
kubectl logs -f deployment/cloudide-frontend -n cloudide

# Access services
kubectl port-forward service/cloudide-frontend 8080:80 -n cloudide
```

### Environment-Specific Configurations

#### Staging Environment

```bash
# Use staging configuration
cp .env.staging .env
docker-compose -f docker-compose.yml -f docker-compose.staging.yml up -d
```

#### Production Environment

```bash
# Use production configuration
cp .env.production .env
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 📚 API Documentation

### Interactive Documentation

- **Swagger UI**: Available at `/docs` when running the application
- **OpenAPI Spec**: `docs/api/openapi.yml`
- **Redoc**: Available at `/redoc` for alternative documentation view

### Authentication

CloudIDE uses JWT-based authentication with the following flow:

1. **Login**: `POST /api/auth/login` with credentials
2. **Token**: Receive JWT token in response
3. **Authorization**: Include token in `Authorization: Bearer <token>` header
4. **Refresh**: Use refresh token to obtain new access tokens

### Core Endpoints

```bash
# Authentication
POST /api/auth/login          # User login
POST /api/auth/logout         # User logout
GET  /api/auth/me            # Get current user

# Builders
GET  /api/builders           # List all builders
POST /api/builders           # Create new builder
GET  /api/builders/{id}      # Get builder details
PUT  /api/builders/{id}      # Update builder
DELETE /api/builders/{id}    # Delete builder

# Tasks
GET  /api/tasks             # List tasks
POST /api/tasks             # Create new task
GET  /api/tasks/{id}        # Get task details
PUT  /api/tasks/{id}        # Update task

# Files
GET  /api/files             # List files
GET  /api/files/{path}      # Get file content
PUT  /api/files/{path}      # Update file
POST /api/files/{path}      # Create file
DELETE /api/files/{path}    # Delete file

# System
GET  /api/health            # Health check
```

## 🧪 Testing

### Test Structure

```
tests/
├── unit/                   # Unit tests
│   ├── components/         # React component tests
│   ├── utils/             # Utility function tests
│   └── services/          # Service layer tests
├── integration/           # Integration tests
│   ├── api/              # API endpoint tests
│   └── workflows/        # User workflow tests
├── e2e/                  # End-to-end tests
│   ├── auth/             # Authentication flows
│   ├── builders/         # Builder management
│   └── collaboration/    # Real-time features
└── performance/          # Performance tests
    ├── load/             # Load testing
    └── stress/           # Stress testing
```

### Running Tests

```bash
# Unit Tests
npm run test                 # Run all unit tests
npm run test:watch          # Watch mode for development
npm run test:coverage       # Generate coverage report

# Integration Tests
npm run test:integration    # API and service integration tests

# End-to-End Tests
npm run test:e2e           # Full user workflow tests
npm run test:e2e:headed    # Run with browser UI

# Performance Tests
npm run test:load          # Load testing with k6
npm run test:stress        # Stress testing scenarios

# Visual Regression Tests
npm run test:visual        # Screenshot comparison tests
```

### Test Configuration

- **Unit Tests**: Vitest with React Testing Library
- **E2E Tests**: Playwright with cross-browser support
- **Load Tests**: k6 for performance testing
- **Mocking**: MSW (Mock Service Worker) for API mocking

## 📊 Monitoring

### Application Metrics

CloudIDE includes comprehensive monitoring capabilities:

#### Performance Metrics
- **Core Web Vitals**: FCP, LCP, FID, CLS, TTFB
- **Custom Metrics**: API response times, builder performance, task completion rates
- **Resource Usage**: CPU, memory, disk, and network utilization

#### Error Tracking
- **Frontend Errors**: JavaScript errors, React error boundaries
- **API Errors**: HTTP errors, validation failures, system exceptions
- **Builder Errors**: Task failures, resource constraints, timeout errors

#### Business Metrics
- **User Activity**: Login frequency, feature usage, session duration
- **Builder Utilization**: Task distribution, success rates, resource efficiency
- **System Health**: Service availability, response times, error rates

### Monitoring Tools

```bash
# View application logs
docker-compose logs -f cloudide-frontend
docker-compose logs -f cloudide-backend

# Monitor resource usage
docker stats

# Health check endpoints
curl http://localhost/api/health
curl http://localhost/api/health/deep
```

### Alerts and Notifications

Configure alerts for:
- High error rates (>5% over 5 minutes)
- Slow response times (>2s average over 5 minutes)
- Resource utilization (>80% CPU/Memory)
- Failed deployments or builder crashes

## 🔒 Security

### Security Features

- **Authentication**: JWT-based with refresh tokens
- **Authorization**: Role-based access control (RBAC)
- **Data Protection**: Encryption at rest and in transit
- **Audit Logging**: Comprehensive audit trail for all actions
- **Security Headers**: CORS, CSP, HSTS, and other security headers
- **Rate Limiting**: API rate limiting and DDoS protection

### Security Best Practices

1. **Environment Variables**: Never commit secrets to repository
2. **Dependencies**: Regular security audits with `npm audit`
3. **Container Security**: Non-root users, minimal base images
4. **Network Security**: Private networks, encrypted communication
5. **Access Control**: Principle of least privilege

## 🤝 Contributing

### Development Workflow

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'Add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Submit** a Pull Request

### Code Standards

- **TypeScript**: Strict type checking enabled
- **ESLint**: Airbnb configuration with custom rules
- **Prettier**: Automated code formatting
- **Conventional Commits**: Semantic commit messages
- **Testing**: Minimum 80% code coverage required

### Pre-commit Hooks

```bash
# Install pre-commit hooks
npm run prepare

# Manual hook execution
npm run pre-commit
```

The pre-commit hooks will:
- Run ESLint and fix auto-fixable issues
- Format code with Prettier
- Run type checking
- Execute relevant tests
- Validate commit message format

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation

- **API Documentation**: `/docs` (when running)
- **Architecture Guide**: `docs/architecture.md`
- **Deployment Guide**: `docs/deployment.md`
- **Development Guide**: `docs/development.md`

### Getting Help

- **Issues**: [GitHub Issues](https://github.com/your-org/cloudide/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/cloudide/discussions)
- **Email**: support@cloudide.dev
- **Slack**: [CloudIDE Community](https://cloudide-community.slack.com)

### Reporting Bugs

When reporting bugs, please include:
- Operating system and version
- Node.js and npm versions
- Docker version (if applicable)
- Steps to reproduce the issue
- Expected vs actual behavior
- Screenshots or error messages

---

## 🗺️ Roadmap

### Upcoming Features

- **AI-Powered Code Completion**: Advanced code suggestions and generation
- **Multi-language Support**: Support for Python, Java, Go, and Rust builders
- **Advanced Collaboration**: Video calls, screen sharing, and pair programming
- **Plugin System**: Extensible architecture for third-party integrations
- **Mobile Support**: Progressive Web App with mobile-optimized interface

### Version History

- **v1.0.0**: Initial release with core features
- **v1.1.0**: Advanced builder system and performance monitoring
- **v1.2.0**: Real-time collaboration and audit system
- **v2.0.0**: Enterprise features and Kubernetes support (planned)

---

**Made with ❤️ by the CloudIDE Team**
