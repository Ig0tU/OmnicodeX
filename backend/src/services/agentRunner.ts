import puppeteer, { Browser, Page } from 'puppeteer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { promises as fs } from 'fs';
import path from 'path';
import { query } from '../db';
import { SecureExecutor } from './secureExecutor';

interface AgentConfig {
  browserSettings: {
    headless: boolean;
    viewport: { width: number; height: number };
    userAgent: string;
    timeout: number;
  };
  agentSettings: {
    maxIterations: number;
    delayBetweenActions: number;
    screenshotOnEachStep: boolean;
    maxMemoryEntries: number;
  };
  geminiSettings: {
    model: string;
    temperature: number;
    maxTokens: number;
  };
}

interface AgentRun {
  id: string;
  runId: string;
  goal: string;
  status: 'idle' | 'running' | 'completed' | 'error' | 'stopped';
  currentTask: string;
  startTime: Date;
  endTime?: Date;
  errorMessage?: string;
  totalMemories: number;
  totalActions: number;
  browser?: Browser;
  page?: Page;
}

class AgentRunner {
  private static instance: AgentRunner;
  private currentRun: AgentRun | null = null;
  private geminiAI: GoogleGenerativeAI;

  private constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    this.geminiAI = new GoogleGenerativeAI(apiKey);
  }

  public static getInstance(): AgentRunner {
    if (!AgentRunner.instance) {
      AgentRunner.instance = new AgentRunner();
    }
    return AgentRunner.instance;
  }

  /**
   * Start a new agent run
   */
  public async startAgent(goal: string): Promise<string> {
    if (this.currentRun && this.currentRun.status === 'running') {
      throw new Error('An agent is already running. Stop the current agent before starting a new one.');
    }

    const runId = this.generateRunId();

    try {
      // Create database record for this run
      await query(
        `INSERT INTO agent_runs (run_id, goal, status, current_task)
         VALUES ($1, $2, $3, $4)`,
        [runId, goal, 'running', 'Initializing agent...']
      );

      // Initialize the run
      this.currentRun = {
        id: '',
        runId,
        goal,
        status: 'running',
        currentTask: 'Initializing agent...',
        startTime: new Date(),
        totalMemories: 0,
        totalActions: 0
      };

      // Start the agent execution in background
      this.executeAgent().catch(error => {
        console.error('Agent execution error:', error);
        this.handleAgentError(error);
      });

      return runId;

    } catch (error) {
      console.error('Error starting agent:', error);
      throw new Error(`Failed to start agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Stop the current agent run
   */
  public async stopAgent(): Promise<void> {
    if (!this.currentRun || this.currentRun.status !== 'running') {
      throw new Error('No agent is currently running');
    }

    try {
      // Clean up browser
      if (this.currentRun.browser) {
        await this.currentRun.browser.close();
      }

      // Update database
      await query(
        `UPDATE agent_runs
         SET status = $1, current_task = $2, end_time = NOW(), updated_at = NOW()
         WHERE run_id = $3`,
        ['stopped', 'Agent stopped by user', this.currentRun.runId]
      );

      // Add memory record
      await this.addMemory('Agent stopped by user', 'observation');

      this.currentRun.status = 'stopped';
      this.currentRun.currentTask = 'Agent stopped';

    } catch (error) {
      console.error('Error stopping agent:', error);
      throw new Error(`Failed to stop agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get the status of the current agent run
   */
  public getAgentStatus(): { status: string; currentTask: string; runId?: string } {
    if (!this.currentRun) {
      return {
        status: 'idle',
        currentTask: 'No agent running'
      };
    }

    return {
      status: this.currentRun.status,
      currentTask: this.currentRun.currentTask,
      runId: this.currentRun.runId
    };
  }

  /**
   * Main agent execution logic
   */
  private async executeAgent(): Promise<void> {
    if (!this.currentRun) {
      throw new Error('No current run to execute');
    }

    let browser: Browser | undefined;
    let page: Page | undefined;

    try {
      // Load configuration
      const config = await this.loadConfig();

      // Update status
      await this.updateStatus('Launching browser...');

      // Launch browser
      browser = await puppeteer.launch({
        headless: config.browserSettings.headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ],
        defaultViewport: {
          width: config.browserSettings.viewport.width,
          height: config.browserSettings.viewport.height
        }
      });

      page = await browser.newPage();

      // Set user agent
      await page.setUserAgent(config.browserSettings.userAgent);

      // Store references
      this.currentRun.browser = browser;
      this.currentRun.page = page;

      await this.updateStatus('Loading core script...');

      // Load and execute the core agent script
      const coreScriptPath = path.join(__dirname, '../agent/core.ts');
      let coreScript: string;

      try {
        coreScript = await fs.readFile(coreScriptPath, 'utf-8');
      } catch (error) {
        throw new Error(`Failed to load core script: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      await this.updateStatus('Starting agent execution...');
      await this.addMemory(`Agent started with goal: ${this.currentRun.goal}`, 'thought');

      // Create context for the agent
      const agentContext = {
        browser,
        page,
        goal: this.currentRun.goal,
        addMemory: this.addMemory.bind(this),
        getMemories: this.getMemories.bind(this),
        getTools: this.getTools.bind(this),
        geminiAI: this.geminiAI,
        runId: this.currentRun.runId
      };

      // Execute the core script using secure VM2 sandbox
      const secureExecutor = SecureExecutor.getInstance();

      // Validate the core script before execution
      const validation = secureExecutor.validateCode(coreScript);
      if (!validation.isValid) {
        throw new Error(`Core script validation failed: ${validation.reason}`);
      }

      await this.updateStatus('Executing agent script in secure sandbox...');

      const executionResult = await secureExecutor.executeAgentScript(coreScript, agentContext);

      if (!executionResult.success) {
        throw new Error(`Agent script execution failed: ${executionResult.error}`);
      }

      // Agent completed successfully
      await this.updateStatus('Agent execution completed');
      await this.addMemory('Agent execution completed successfully', 'thought');

      await query(
        `UPDATE agent_runs
         SET status = $1, current_task = $2, end_time = NOW(), updated_at = NOW()
         WHERE run_id = $3`,
        ['completed', 'Execution completed', this.currentRun.runId]
      );

      this.currentRun.status = 'completed';

    } catch (error) {
      console.error('Agent execution error:', error);
      await this.handleAgentError(error);
    } finally {
      // Clean up browser
      if (browser) {
        try {
          await browser.close();
        } catch (closeError) {
          console.error('Error closing browser:', closeError);
        }
      }
    }
  }

  /**
   * Handle agent execution errors
   */
  private async handleAgentError(error: any): Promise<void> {
    if (!this.currentRun) return;

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    try {
      await query(
        `UPDATE agent_runs
         SET status = $1, current_task = $2, error_message = $3, end_time = NOW(), updated_at = NOW()
         WHERE run_id = $4`,
        ['error', 'Agent encountered an error', errorMessage, this.currentRun.runId]
      );

      await this.addMemory(`Agent error: ${errorMessage}`, 'observation');

      this.currentRun.status = 'error';
      this.currentRun.currentTask = 'Error occurred';
      this.currentRun.errorMessage = errorMessage;

    } catch (dbError) {
      console.error('Error updating database with agent error:', dbError);
    }
  }

  /**
   * Update the current status
   */
  private async updateStatus(currentTask: string): Promise<void> {
    if (!this.currentRun) return;

    this.currentRun.currentTask = currentTask;

    try {
      await query(
        `UPDATE agent_runs
         SET current_task = $1, updated_at = NOW()
         WHERE run_id = $2`,
        [currentTask, this.currentRun.runId]
      );
    } catch (error) {
      console.error('Error updating status:', error);
    }
  }

  /**
   * Add a memory record
   */
  private async addMemory(content: string, type: 'observation' | 'thought' | 'action'): Promise<void> {
    if (!this.currentRun) return;

    try {
      await query(
        `INSERT INTO memories (run_id, content, type)
         VALUES ($1, $2, $3)`,
        [this.currentRun.runId, content, type]
      );

      this.currentRun.totalMemories++;

      if (type === 'action') {
        this.currentRun.totalActions++;
      }

    } catch (error) {
      console.error('Error adding memory:', error);
    }
  }

  /**
   * Get memories for the current run
   */
  private async getMemories(): Promise<Array<{ content: string; type: string; timestamp: string }>> {
    if (!this.currentRun) return [];

    try {
      const result = await query(
        `SELECT content, type, timestamp
         FROM memories
         WHERE run_id = $1
         ORDER BY timestamp DESC
         LIMIT 20`,
        [this.currentRun.runId]
      );

      return result.rows;
    } catch (error) {
      console.error('Error fetching memories:', error);
      return [];
    }
  }

  /**
   * Get available tools
   */
  private async getTools(): Promise<Array<{ name: string; description: string; code: string }>> {
    try {
      const result = await query(
        `SELECT name, description, code
         FROM tools
         WHERE is_active = TRUE
         ORDER BY name`
      );

      return result.rows;
    } catch (error) {
      console.error('Error fetching tools:', error);
      return [];
    }
  }

  /**
   * Load agent configuration
   */
  private async loadConfig(): Promise<AgentConfig> {
    const configPath = path.join(__dirname, '../agent/config.json');

    try {
      const configData = await fs.readFile(configPath, 'utf-8');
      return JSON.parse(configData);
    } catch (error) {
      console.warn('Failed to load config, using defaults:', error);

      // Return default configuration
      return {
        browserSettings: {
          headless: false,
          viewport: { width: 1280, height: 720 },
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          timeout: 30000
        },
        agentSettings: {
          maxIterations: 20,
          delayBetweenActions: 1000,
          screenshotOnEachStep: true,
          maxMemoryEntries: 100
        },
        geminiSettings: {
          model: 'gemini-pro',
          temperature: 0.7,
          maxTokens: 1024
        }
      };
    }
  }

  /**
   * Generate a unique run ID
   */
  private generateRunId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `run_${timestamp}_${random}`;
  }
}

export { AgentRunner };