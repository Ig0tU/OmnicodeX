import { Browser, Page } from 'puppeteer';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Core Agent Script - Autonomous Web Agent
 * This is the main execution script for the autonomous agent.
 * It receives a browser instance, goal, and utility functions to operate.
 */

interface AgentContext {
  browser: Browser;
  page: Page;
  goal: string;
  addMemory: (content: string, type: 'observation' | 'thought' | 'action') => Promise<void>;
  getMemories: () => Promise<Array<{ content: string; type: string; timestamp: string }>>;
  getTools: () => Promise<Array<{ name: string; description: string; code: string }>>;
  geminiAI: GoogleGenerativeAI;
  runId: string;
}

export async function executeAgent(context: AgentContext): Promise<void> {
  const { browser, page, goal, addMemory, getMemories, getTools, geminiAI, runId } = context;

  try {
    await addMemory(`Agent started with goal: ${goal}`, 'thought');

    // Initialize Gemini AI
    const model = geminiAI.getGenerativeModel({ model: 'gemini-pro' });

    // Get available tools
    const tools = await getTools();
    await addMemory(`Loaded ${tools.length} available tools`, 'observation');

    // Main execution loop
    let iterations = 0;
    const maxIterations = 20; // Prevent infinite loops

    while (iterations < maxIterations) {
      iterations++;

      // Take a screenshot and get page content
      const screenshot = await page.screenshot({ encoding: 'base64' });
      const pageTitle = await page.title();
      const currentUrl = page.url();

      await addMemory(`Current page: ${pageTitle} (${currentUrl})`, 'observation');

      // Get recent memories for context
      const recentMemories = await getMemories();
      const memoryContext = recentMemories
        .slice(-10) // Last 10 memories
        .map(m => `[${m.type.toUpperCase()}] ${m.content}`)
        .join('\\n');

      // Create prompt for Gemini
      const prompt = `
You are an autonomous web agent. Your goal is: "${goal}"

Current Context:
- Page Title: ${pageTitle}
- URL: ${currentUrl}
- Iteration: ${iterations}/${maxIterations}

Recent Memory:
${memoryContext}

Available Tools:
${tools.map(t => `- ${t.name}: ${t.description}`).join('\\n')}

Based on the current state and your goal, decide what action to take next.
Respond with a JSON object in this format:
{
  "thought": "Your reasoning about what to do next",
  "action": "click|type|navigate|scroll|wait|complete",
  "target": "CSS selector or URL (for navigate)",
  "value": "text to type (for type action)",
  "tool": "tool name to use (optional)",
  "complete": true/false
}

If you believe the goal has been achieved, set "complete": true.
`;

      // Get decision from Gemini
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      await addMemory(`Gemini response: ${responseText}`, 'thought');

      try {
        const decision = JSON.parse(responseText);

        await addMemory(`Decision: ${decision.thought}`, 'thought');

        // Execute the decided action
        if (decision.complete) {
          await addMemory('Agent completed successfully', 'thought');
          break;
        }

        switch (decision.action) {
          case 'click':
            if (decision.target) {
              await page.click(decision.target);
              await addMemory(`Clicked on: ${decision.target}`, 'action');
              await page.waitForTimeout(2000); // Wait for page to respond
            }
            break;

          case 'type':
            if (decision.target && decision.value) {
              await page.type(decision.target, decision.value);
              await addMemory(`Typed "${decision.value}" into: ${decision.target}`, 'action');
            }
            break;

          case 'navigate':
            if (decision.target) {
              await page.goto(decision.target);
              await addMemory(`Navigated to: ${decision.target}`, 'action');
              await page.waitForTimeout(3000); // Wait for page to load
            }
            break;

          case 'scroll':
            await page.evaluate(() => {
              (globalThis as any).window?.scrollBy(0, 500);
            });
            await addMemory('Scrolled down', 'action');
            break;

          case 'wait':
            await page.waitForTimeout(3000);
            await addMemory('Waited 3 seconds', 'action');
            break;

          default:
            await addMemory(`Unknown action: ${decision.action}`, 'observation');
        }

        // Execute tool if specified
        if (decision.tool) {
          const tool = tools.find(t => t.name === decision.tool);
          if (tool) {
            try {
              // Execute tool code (basic eval - in production, use a sandbox)
              const toolFunction = new Function('page', 'context', tool.code);
              await toolFunction(page, context);
              await addMemory(`Executed tool: ${decision.tool}`, 'action');
            } catch (toolError) {
              await addMemory(`Tool execution error: ${toolError}`, 'observation');
            }
          }
        }

      } catch (parseError) {
        await addMemory(`Failed to parse Gemini response: ${parseError}`, 'observation');
      }

      // Small delay between iterations
      await page.waitForTimeout(1000);
    }

    if (iterations >= maxIterations) {
      await addMemory('Agent reached maximum iterations limit', 'thought');
    }

  } catch (error) {
    await addMemory(`Agent execution error: ${error}`, 'observation');
    throw error;
  }
}