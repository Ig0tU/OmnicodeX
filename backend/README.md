# Autonomous Agent Backend

A complete backend server for the Autonomous Agent Platform, built with Node.js, TypeScript, PostgreSQL, and integrated with Google Gemini AI and Puppeteer for web automation.

## 🚀 Features

- **RESTful API** for agent management and control
- **PostgreSQL database** for persistent storage
- **Google Gemini AI integration** for intelligent decision-making
- **Puppeteer browser automation** for web interactions
- **Memory system** for agent context and learning
- **Tool library** for extensible agent capabilities
- **Real-time agent execution** with status monitoring

## 📋 Prerequisites

- **Node.js** >= 18.0.0
- **PostgreSQL** >= 13.0
- **Google Gemini API Key** (free tier available)

## ⚡ Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Setup

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Update `.env` with your configuration:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/autonomous_agent

# Google Gemini API Key (get from https://makersuite.google.com/app/apikey)
GEMINI_API_KEY=your-gemini-api-key-here

# Server Configuration
PORT=8081
NODE_ENV=development
```

### 3. Database Setup

Initialize the database schema:

```bash
npm run db:setup
```

This will create the necessary tables:
- `memories` - Agent memory storage
- `tools` - Available agent tools
- `agent_runs` - Execution session tracking

### 4. Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm run build
npm start
```

The server will start on `http://localhost:8081`

## 📁 Project Structure

```
backend/
├── src/
│   ├── api/           # API route handlers
│   │   ├── agent.ts   # Agent control endpoints
│   │   ├── config.ts  # Configuration management
│   │   ├── memory.ts  # Memory system API
│   │   ├── script.ts  # Core script management
│   │   └── tools.ts   # Tool library API
│   ├── services/      # Business logic
│   │   └── agentRunner.ts # Agent execution engine
│   ├── db/            # Database utilities
│   │   ├── index.ts   # Connection and query utilities
│   │   ├── setup.sql  # Database schema
│   │   └── setup.ts   # Database initialization
│   ├── agent/         # Agent core files
│   │   ├── core.ts    # Main agent script
│   │   └── config.json # Agent configuration
│   └── index.ts       # Express server entry point
├── package.json
├── tsconfig.json
└── README.md
```

## 🔌 API Endpoints

### Health Check
- `GET /health` - Server health status

### Core Script Management
- `GET /api/script` - Get the core agent script
- `POST /api/script` - Update the core agent script

### Configuration Management
- `GET /api/config` - Get agent configuration
- `POST /api/config` - Update agent configuration

### Agent Control
- `POST /api/agent/start` - Start agent execution
- `POST /api/agent/stop` - Stop running agent
- `GET /api/agent/status` - Get current agent status
- `GET /api/agent/runs` - List all agent runs
- `GET /api/agent/runs/:runId` - Get specific run details
- `DELETE /api/agent/runs/:runId` - Delete an agent run

### Memory System
- `GET /api/memory` - Get agent memories
- `POST /api/memory` - Add new memory
- `GET /api/memory/stats` - Memory statistics
- `DELETE /api/memory/:run_id` - Delete run memories

### Tool Library
- `GET /api/tools` - List available tools
- `POST /api/tools` - Create new tool
- `GET /api/tools/:id` - Get specific tool
- `PUT /api/tools/:id` - Update tool
- `DELETE /api/tools/:id` - Delete/deactivate tool
- `GET /api/tools/meta/categories` - Get tool categories

## 🤖 Agent Execution Flow

1. **Start Agent** - User provides a goal via POST `/api/agent/start`
2. **Initialize** - Agent loads configuration and launches browser
3. **Execute Loop** - Agent iteratively:
   - Observes current page state
   - Sends context to Gemini AI for decision-making
   - Executes decided actions (click, type, navigate, etc.)
   - Records memories of observations and actions
   - Uses available tools when appropriate
4. **Complete** - Agent finishes when goal is achieved or max iterations reached

## 🧠 Memory System

The agent maintains persistent memory across executions:

- **Observations** - What the agent sees/detects
- **Thoughts** - AI reasoning and decision-making process
- **Actions** - What the agent actually does

Memory is stored in PostgreSQL and can be queried for analysis or debugging.

## 🛠️ Tool System

Tools extend agent capabilities with custom JavaScript functions:

```javascript
// Example tool for extracting text
async function extractText(page, context, selector) {
  const texts = await page.evaluate((sel) => {
    const elements = document.querySelectorAll(sel);
    return Array.from(elements).map(el => el.textContent?.trim()).filter(Boolean);
  }, selector);
  await context.addMemory(`Extracted ${texts.length} text elements`, "observation");
  return { success: true, texts };
}
```

Tools are stored in the database and can be created/modified via the API.

## 🔧 Development

### Running Tests

```bash
# Install development dependencies first
npm install

# Run type checking
npx tsc --noEmit

# Manual API testing
curl http://localhost:8081/health
curl http://localhost:8081/api/config
```

### Database Management

```bash
# Reset database (development only)
npm run db:setup

# Connect to database directly
psql $DATABASE_URL
```

### Customizing the Agent

1. **Modify Core Script** - Edit `src/agent/core.ts` or use the API
2. **Update Configuration** - Edit `src/agent/config.json` or use the API
3. **Add Tools** - Create new tools via the API or insert into database
4. **Extend Memory** - Modify memory types and metadata as needed

## 🐛 Troubleshooting

### Common Issues

**Database Connection Error**
```
Error: DATABASE_URL environment variable is required
```
Solution: Ensure `.env` file has valid `DATABASE_URL`

**Gemini API Error**
```
Error: GEMINI_API_KEY environment variable is required
```
Solution: Get API key from Google AI Studio and add to `.env`

**Puppeteer Launch Error**
```
Error: Failed to launch browser
```
Solution: Install Chrome/Chromium dependencies:
```bash
# Ubuntu/Debian
sudo apt-get update && sudo apt-get install -y chromium-browser

# Or use Docker for consistent environment
```

**Agent Stuck in Loop**
- Check agent memories via `/api/memory?run_id=...`
- Review Gemini responses in logs
- Adjust `maxIterations` in config.json

### Debugging

Enable verbose logging:
```bash
NODE_ENV=development npm run dev
```

Monitor database activity:
```sql
-- Connect to database
\c autonomous_agent

-- View recent memories
SELECT * FROM memories ORDER BY timestamp DESC LIMIT 10;

-- Check agent runs
SELECT * FROM agent_runs ORDER BY start_time DESC LIMIT 5;
```

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

**Need help?** Check the API documentation at `http://localhost:8081/api` when the server is running, or review the source code for implementation details.