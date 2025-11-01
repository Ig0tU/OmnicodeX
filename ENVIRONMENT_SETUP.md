# 🔧 Environment Setup Guide

This guide provides comprehensive instructions for setting up the Autonomous Agent Platform environment, including all required dependencies, environment variables, and deployment configurations.

## 📋 Prerequisites

### Required Software
- **Node.js**: >= 18.0.0 (LTS recommended)
- **npm**: >= 8.0.0 (comes with Node.js)
- **PostgreSQL**: >= 13.0
- **Git**: >= 2.40.0

### Optional for Development
- **Docker**: >= 24.0.0 (for containerized database)
- **Docker Compose**: >= 2.20.0
- **Visual Studio Code** (recommended IDE)

### External Services
- **Google Gemini API Key**: Free tier available at [Google AI Studio](https://makersuite.google.com/app/apikey)
- **PostgreSQL Database**: Local or cloud (Neon, Supabase, etc.)

## 🚀 Quick Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd autonomous-agent-platform

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 2. Environment Configuration

#### Frontend Environment (.env)
```bash
# Copy frontend environment template
cp .env.example .env
```

Edit `.env` with your settings:
```env
# API Configuration
VITE_API_URL=http://localhost:8081
VITE_WS_URL=ws://localhost:8081

# Feature Flags
VITE_ENABLE_REAL_TIME_UPDATES=true
VITE_ENABLE_ADVANCED_EDITOR=true
VITE_ENABLE_PERFORMANCE_MONITORING=true
```

#### Backend Environment (backend/.env)
```bash
# Copy backend environment template
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your settings:
```env
# Required Settings
DATABASE_URL=postgresql://username:password@localhost:5432/autonomous_agent
GEMINI_API_KEY=your-actual-api-key-here

# Optional Settings (can use defaults)
PORT=8081
NODE_ENV=development
```

### 3. Database Setup

#### Option A: Local PostgreSQL
```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE autonomous_agent;
CREATE USER agent_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE autonomous_agent TO agent_user;
\q

# Update DATABASE_URL in backend/.env
DATABASE_URL=postgresql://agent_user:secure_password@localhost:5432/autonomous_agent
```

#### Option B: Docker PostgreSQL
```bash
# Start PostgreSQL with Docker
docker run --name postgres-agent \
  -e POSTGRES_DB=autonomous_agent \
  -e POSTGRES_USER=agent_user \
  -e POSTGRES_PASSWORD=secure_password \
  -p 5432:5432 \
  -d postgres:15

# Update DATABASE_URL in backend/.env
DATABASE_URL=postgresql://agent_user:secure_password@localhost:5432/autonomous_agent
```

#### Option C: Cloud Database (Neon)
1. Sign up at [Neon](https://neon.tech)
2. Create a new database
3. Copy the connection string to `DATABASE_URL`

### 4. Initialize Database Schema

```bash
# Initialize database tables
cd backend
npm run db:setup
cd ..
```

### 5. Start Development Servers

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
npm run dev
```

## 🔑 Environment Variables Reference

### Frontend Variables (.env)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | Yes | - | Backend API URL |
| `VITE_WS_URL` | Yes | - | WebSocket server URL |
| `VITE_APP_VERSION` | No | development | Application version |
| `VITE_ENABLE_REAL_TIME_UPDATES` | No | true | Enable real-time features |
| `VITE_ENABLE_ADVANCED_EDITOR` | No | true | Enable Monaco editor |
| `VITE_ENABLE_PERFORMANCE_MONITORING` | No | true | Enable performance tracking |

### Backend Variables (backend/.env)

#### Required Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `GEMINI_API_KEY` | Google Gemini API key | `AIzaSy...` |

#### Server Configuration
| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 8081 | Server port |
| `NODE_ENV` | development | Environment mode |
| `CORS_ORIGINS` | localhost:5173,localhost:3000 | Allowed CORS origins |

#### Agent Configuration
| Variable | Default | Description |
|----------|---------|-------------|
| `AGENT_TIMEOUT` | 300000 | Max execution time (ms) |
| `MAX_BROWSER_INSTANCES` | 3 | Concurrent browser limit |
| `MAX_AGENT_ITERATIONS` | 20 | Max iterations per run |
| `AGENT_ACTION_DELAY` | 1000 | Delay between actions (ms) |

#### Browser Configuration
| Variable | Default | Description |
|----------|---------|-------------|
| `BROWSER_HEADLESS` | false | Run browser headlessly |
| `BROWSER_WIDTH` | 1280 | Browser viewport width |
| `BROWSER_HEIGHT` | 720 | Browser viewport height |
| `BROWSER_TIMEOUT` | 30000 | Browser operation timeout |

#### Security Configuration
| Variable | Default | Description |
|----------|---------|-------------|
| `ENABLE_CODE_VALIDATION` | true | Validate tool/script code |
| `TOOL_EXECUTION_TIMEOUT` | 30000 | Tool execution timeout |
| `ENABLE_SECURE_EXECUTION` | true | Use VM2 sandbox |

#### Database Configuration
| Variable | Default | Description |
|----------|---------|-------------|
| `DB_POOL_SIZE` | 10 | Connection pool size |
| `DB_CONNECTION_TIMEOUT` | 2000 | Connection timeout (ms) |
| `DB_IDLE_TIMEOUT` | 30000 | Idle connection timeout |

## 🏗️ Production Deployment

### Environment-Specific Configurations

#### Staging Environment
```env
NODE_ENV=staging
DATABASE_URL=postgresql://user:pass@staging-db:5432/agent_staging
GEMINI_API_KEY=your-staging-api-key
BROWSER_HEADLESS=true
LOG_LEVEL=info
DETAILED_ERRORS=false
```

#### Production Environment
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-db:5432/agent_production
GEMINI_API_KEY=your-production-api-key
BROWSER_HEADLESS=true
LOG_LEVEL=warn
DETAILED_ERRORS=false
ENABLE_SOURCE_MAPS=false
DB_POOL_SIZE=20
```

### Docker Deployment

#### Using Docker Compose
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### Environment Variables in Docker
```yaml
# docker-compose.yml
environment:
  - DATABASE_URL=${DATABASE_URL}
  - GEMINI_API_KEY=${GEMINI_API_KEY}
  - NODE_ENV=production
```

### Kubernetes Deployment

#### ConfigMap for Environment Variables
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: agent-config
data:
  PORT: "8081"
  NODE_ENV: "production"
  BROWSER_HEADLESS: "true"
  MAX_BROWSER_INSTANCES: "5"
```

#### Secret for Sensitive Data
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: agent-secrets
type: Opaque
stringData:
  DATABASE_URL: "postgresql://..."
  GEMINI_API_KEY: "AIzaSy..."
```

## 🔍 Troubleshooting

### Common Issues

#### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution**: Ensure PostgreSQL is running and DATABASE_URL is correct.

#### Gemini API Error
```
Error: GEMINI_API_KEY environment variable is required
```
**Solution**: Get API key from Google AI Studio and add to backend/.env.

#### Browser Launch Error
```
Error: Failed to launch browser
```
**Solution**: Install Chrome/Chromium dependencies:
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y chromium-browser

# Or use Docker for consistent environment
```

#### Permission Errors
```
Error: EACCES: permission denied
```
**Solution**: Ensure proper file permissions and avoid running as root.

### Environment Validation

#### Check Backend Environment
```bash
cd backend
node -e "
require('dotenv').config();
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Missing');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Set' : 'Missing');
console.log('PORT:', process.env.PORT || 'Using default');
"
```

#### Test Database Connection
```bash
cd backend
node -e "
require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW()')
  .then(() => console.log('✅ Database connection successful'))
  .catch(err => console.error('❌ Database connection failed:', err.message))
  .finally(() => pool.end());
"
```

#### Test API Endpoints
```bash
# Health check
curl http://localhost:8081/health

# Configuration
curl http://localhost:8081/api/config

# Agent status
curl http://localhost:8081/api/agent/status
```

## 📚 Additional Resources

- [PostgreSQL Installation Guide](https://www.postgresql.org/docs/current/installation.html)
- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [Node.js Environment Variables](https://nodejs.org/api/process.html#process_process_env)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Kubernetes Configuration](https://kubernetes.io/docs/concepts/configuration/)

## 🔒 Security Best Practices

1. **Never commit .env files** to version control
2. **Use strong database passwords** (minimum 16 characters)
3. **Rotate API keys regularly** (every 90 days)
4. **Use HTTPS in production** with valid SSL certificates
5. **Enable firewall rules** to restrict database access
6. **Monitor API usage** to detect anomalies
7. **Use secrets management** in production (Vault, AWS Secrets Manager)
8. **Enable audit logging** for compliance requirements

---

For additional help, please check the [README.md](README.md) or create an issue in the repository.