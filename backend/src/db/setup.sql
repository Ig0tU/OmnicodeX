-- Database setup for Autonomous Agent Platform
-- Run this SQL script to initialize the database schema

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create memories table
CREATE TABLE IF NOT EXISTS memories (
    id SERIAL PRIMARY KEY,
    run_id VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('observation', 'thought', 'action')),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for memories table
CREATE INDEX IF NOT EXISTS idx_memories_run_id ON memories (run_id);
CREATE INDEX IF NOT EXISTS idx_memories_type ON memories (type);
CREATE INDEX IF NOT EXISTS idx_memories_timestamp ON memories (timestamp);

-- Create tools table
CREATE TABLE IF NOT EXISTS tools (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    code TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'general',
    version VARCHAR(20) DEFAULT '1.0.0',
    author VARCHAR(255) DEFAULT 'system',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for tools table
CREATE INDEX IF NOT EXISTS idx_tools_name ON tools (name);
CREATE INDEX IF NOT EXISTS idx_tools_category ON tools (category);
CREATE INDEX IF NOT EXISTS idx_tools_active ON tools (is_active);

-- Create agent_runs table to track execution sessions
CREATE TABLE IF NOT EXISTS agent_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id VARCHAR(255) UNIQUE NOT NULL,
    goal TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'running', 'completed', 'error', 'stopped')),
    current_task TEXT DEFAULT '',
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ NULL,
    error_message TEXT NULL,
    total_memories INTEGER DEFAULT 0,
    total_actions INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for agent_runs table
CREATE INDEX IF NOT EXISTS idx_agent_runs_run_id ON agent_runs (run_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_status ON agent_runs (status);
CREATE INDEX IF NOT EXISTS idx_agent_runs_start_time ON agent_runs (start_time);

-- Insert some default tools
INSERT INTO tools (name, description, code, category) VALUES
(
    'screenshot',
    'Takes a screenshot of the current page',
    'async function screenshot(page, context) {
        const screenshot = await page.screenshot({ encoding: "base64" });
        await context.addMemory(`Screenshot taken: ${screenshot.length} bytes`, "action");
        return { success: true, screenshot };
    }',
    'browser'
),
(
    'scroll_to_element',
    'Scrolls to a specific element on the page',
    'async function scrollToElement(page, context, selector) {
        try {
            await page.evaluate((sel) => {
                const element = document.querySelector(sel);
                if (element) element.scrollIntoView({ behavior: "smooth" });
            }, selector);
            await context.addMemory(`Scrolled to element: ${selector}`, "action");
            return { success: true };
        } catch (error) {
            await context.addMemory(`Failed to scroll to element: ${error.message}`, "observation");
            return { success: false, error: error.message };
        }
    }',
    'browser'
),
(
    'wait_for_element',
    'Waits for an element to appear on the page',
    'async function waitForElement(page, context, selector, timeout = 5000) {
        try {
            await page.waitForSelector(selector, { timeout });
            await context.addMemory(`Element appeared: ${selector}`, "observation");
            return { success: true };
        } catch (error) {
            await context.addMemory(`Element did not appear: ${selector}`, "observation");
            return { success: false, error: error.message };
        }
    }',
    'browser'
),
(
    'extract_text',
    'Extracts text content from elements matching a selector',
    'async function extractText(page, context, selector) {
        try {
            const texts = await page.evaluate((sel) => {
                const elements = document.querySelectorAll(sel);
                return Array.from(elements).map(el => el.textContent?.trim()).filter(Boolean);
            }, selector);
            await context.addMemory(`Extracted ${texts.length} text elements from: ${selector}`, "observation");
            return { success: true, texts };
        } catch (error) {
            await context.addMemory(`Failed to extract text: ${error.message}`, "observation");
            return { success: false, error: error.message };
        }
    }',
    'data'
),
(
    'check_element_exists',
    'Checks if an element exists on the page',
    'async function checkElementExists(page, context, selector) {
        try {
            const element = await page.$(selector);
            const exists = element !== null;
            await context.addMemory(`Element ${exists ? "exists" : "does not exist"}: ${selector}`, "observation");
            return { success: true, exists };
        } catch (error) {
            await context.addMemory(`Error checking element: ${error.message}`, "observation");
            return { success: false, error: error.message };
        }
    }',
    'browser'
)
ON CONFLICT (name) DO NOTHING;

-- Update function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update timestamps
DROP TRIGGER IF EXISTS update_tools_updated_at ON tools;
CREATE TRIGGER update_tools_updated_at
    BEFORE UPDATE ON tools
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_agent_runs_updated_at ON agent_runs;
CREATE TRIGGER update_agent_runs_updated_at
    BEFORE UPDATE ON agent_runs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions (uncomment and adjust for your database user)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_username;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_username;