import { VM } from 'vm2';

/**
 * Secure code execution service using VM2 sandbox
 * Replaces unsafe eval() and new Function() calls
 */

export interface ExecutionContext {
  page?: any;
  context?: any;
  addMemory?: Function;
  getMemories?: Function;
  getTools?: Function;
  geminiAI?: any;
  runId?: string;
  browser?: any;
}

export interface ExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
}

class SecureExecutor {
  private static instance: SecureExecutor;

  private constructor() {}

  public static getInstance(): SecureExecutor {
    if (!SecureExecutor.instance) {
      SecureExecutor.instance = new SecureExecutor();
    }
    return SecureExecutor.instance;
  }

  /**
   * Execute a tool function safely in a VM2 sandbox
   */
  public async executeTool(
    toolCode: string,
    toolName: string,
    context: ExecutionContext,
    ...args: any[]
  ): Promise<ExecutionResult> {
    try {
      // Create a new VM with restricted access
      const vm = new VM({
        timeout: 30000, // 30 second timeout
        sandbox: {
          // Provide safe access to necessary context
          page: context.page,
          context: {
            addMemory: context.addMemory,
            getMemories: context.getMemories,
            runId: context.runId
          },
          // Provide safe utility functions
          console: {
            log: (...args: any[]) => console.log(`[Tool ${toolName}]:`, ...args),
            error: (...args: any[]) => console.error(`[Tool ${toolName}]:`, ...args),
            warn: (...args: any[]) => console.warn(`[Tool ${toolName}]:`, ...args)
          },
          // Additional safe globals
          JSON,
          setTimeout,
          clearTimeout
        },
        wasm: false, // Disable WebAssembly for security
        eval: false, // Disable eval in sandbox
      });

      // Wrap the tool code in a safe execution wrapper
      const wrappedCode = `
        (async function() {
          try {
            ${toolCode}

            // Extract function name from code (simple heuristic)
            const functionMatch = \`${toolCode}\`.match(/function\\s+(\\w+)|const\\s+(\\w+)\\s*=|let\\s+(\\w+)\\s*=/);
            const functionName = functionMatch ? (functionMatch[1] || functionMatch[2] || functionMatch[3]) : '${toolName}';

            // Execute the function if it exists
            if (typeof eval(functionName) === 'function') {
              return await eval(functionName)(page, context, ...arguments);
            } else {
              throw new Error('Tool function not found or not a function');
            }
          } catch (error) {
            return { success: false, error: error.message };
          }
        })
      `;

      const toolFunction = vm.run(wrappedCode);
      const result = await toolFunction.apply(null, args);

      return {
        success: true,
        result
      };

    } catch (error) {
      console.error(`Tool execution error for ${toolName}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown execution error'
      };
    }
  }

  /**
   * Execute the core agent script safely
   */
  public async executeAgentScript(
    scriptCode: string,
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    try {
      // Create a more restricted VM for agent script execution
      const vm = new VM({
        timeout: 300000, // 5 minute timeout for agent execution
        sandbox: {
          // Provide controlled access to context
          browser: context.browser,
          page: context.page,
          goal: context.runId, // Assuming goal is passed via runId for simplicity
          addMemory: context.addMemory,
          getMemories: context.getMemories,
          getTools: context.getTools,
          geminiAI: context.geminiAI,
          runId: context.runId,

          // Safe globals
          console: {
            log: (...args: any[]) => console.log('[Agent]:', ...args),
            error: (...args: any[]) => console.error('[Agent]:', ...args),
            warn: (...args: any[]) => console.warn('[Agent]:', ...args)
          },
          JSON,
          setTimeout,
          clearTimeout,
          Promise,

          // Safe utilities
          crypto: {
            randomUUID: () => require('crypto').randomUUID()
          }
        },
        wasm: false,
        eval: false,
      });

      // Wrap the agent script for safe execution
      const wrappedScript = `
        (async function() {
          try {
            ${scriptCode}

            // Look for executeAgent function
            if (typeof executeAgent === 'function') {
              const agentContext = {
                browser,
                page,
                goal,
                addMemory,
                getMemories,
                getTools,
                geminiAI,
                runId
              };

              return await executeAgent(agentContext);
            } else {
              throw new Error('executeAgent function not found in script');
            }
          } catch (error) {
            throw error;
          }
        })
      `;

      const agentFunction = vm.run(wrappedScript);
      const result = await agentFunction();

      return {
        success: true,
        result
      };

    } catch (error) {
      console.error('Agent script execution error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown execution error'
      };
    }
  }

  /**
   * Validate code before execution (basic safety checks)
   */
  public validateCode(code: string): { isValid: boolean; reason?: string } {
    // Basic security checks
    const dangerousPatterns = [
      /require\s*\(\s*['"`]fs['"`]\s*\)/, // File system access
      /require\s*\(\s*['"`]child_process['"`]\s*\)/, // Process execution
      /require\s*\(\s*['"`]os['"`]\s*\)/, // OS access
      /process\s*\./, // Process object access
      /global\s*\./, // Global object access
      /eval\s*\(/, // Eval usage
      /Function\s*\(/, // Function constructor
      /import\s*\(/, // Dynamic imports
      /__dirname/, // Directory access
      /__filename/, // File access
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        return {
          isValid: false,
          reason: `Code contains potentially dangerous pattern: ${pattern.source}`
        };
      }
    }

    // Check for minimum required structure
    if (!code.includes('function') && !code.includes('=>')) {
      return {
        isValid: false,
        reason: 'Code must contain a function definition'
      };
    }

    return { isValid: true };
  }
}

export { SecureExecutor };