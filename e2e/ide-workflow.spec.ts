import { test, expect } from '@playwright/test';

test.describe('CloudIDE Core Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the IDE
    await page.goto('/');

    // Wait for the application to load
    await expect(page.locator('[data-testid="ide-header"]')).toBeVisible();
  });

  test('should load the IDE interface successfully', async ({ page }) => {
    // Check main components are visible
    await expect(page.locator('[data-testid="file-explorer"]')).toBeVisible();
    await expect(page.locator('[data-testid="code-editor"]')).toBeVisible();
    await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();
    await expect(page.locator('[data-testid="terminal"]')).toBeVisible();

    // Verify header information
    await expect(page.locator('h1')).toContainText('CloudIDE');
    await expect(page.locator('[data-testid="connection-status"]')).toContainText('Connected to AWS Cloud');
  });

  test('should create and edit a new file', async ({ page }) => {
    // Click create new file button
    await page.locator('[data-testid="create-file-btn"]').click();

    // Enter filename
    await page.locator('[data-testid="filename-input"]').fill('test-file.ts');
    await page.locator('[data-testid="create-confirm-btn"]').click();

    // Wait for editor to show the new file
    await expect(page.locator('[data-testid="editor-tab"]')).toContainText('test-file.ts');

    // Type some code
    const editor = page.locator('[data-testid="monaco-editor"]');
    await editor.click();
    await page.keyboard.type('const hello = "Hello, World!";');

    // Verify code was typed
    await expect(editor).toContainText('const hello = "Hello, World!";');
  });

  test('should interact with AI chat interface', async ({ page }) => {
    // Open chat interface
    const chatInput = page.locator('[data-testid="chat-input"]');
    await expect(chatInput).toBeVisible();

    // Send a message
    await chatInput.fill('Create a simple React component');
    await page.locator('[data-testid="send-message-btn"]').click();

    // Wait for response
    await expect(page.locator('[data-testid="chat-messages"]')).toContainText('Create a simple React component');

    // Check that AI is processing (loading state)
    await expect(page.locator('[data-testid="ai-thinking"]')).toBeVisible();
  });

  test('should use terminal functionality', async ({ page }) => {
    // Click on terminal area
    const terminal = page.locator('[data-testid="terminal"]');
    await expect(terminal).toBeVisible();

    // Type a command
    await terminal.click();
    await page.keyboard.type('ls -la');
    await page.keyboard.press('Enter');

    // Check for command execution
    await expect(terminal).toContainText('ls -la');
  });

  test('should toggle theme between light and dark', async ({ page }) => {
    // Find theme toggle button
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    await expect(themeToggle).toBeVisible();

    // Get initial theme
    const body = page.locator('body');
    const initialClass = await body.getAttribute('class');

    // Toggle theme
    await themeToggle.click();

    // Wait for theme change
    await page.waitForTimeout(500);

    // Verify theme changed
    const newClass = await body.getAttribute('class');
    expect(newClass).not.toBe(initialClass);
  });

  test('should show builder status and orchestration', async ({ page }) => {
    // Check builder panel is visible
    await expect(page.locator('[data-testid="builder-panel"]')).toBeVisible();

    // Verify builder metrics
    await expect(page.locator('[data-testid="active-builders"]')).toBeVisible();
    await expect(page.locator('[data-testid="builder-status"]')).toContainText('builders active');

    // Check status bar information
    await expect(page.locator('[data-testid="status-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="memory-usage"]')).toContainText('Memory:');
    await expect(page.locator('[data-testid="uptime"]')).toContainText('Uptime:');
  });

  test('should handle file operations', async ({ page }) => {
    // Test file selection
    const fileItem = page.locator('[data-testid="file-item"]').first();
    await fileItem.click();

    // Verify file is selected
    await expect(fileItem).toHaveClass(/selected/);

    // Test file context menu
    await fileItem.click({ button: 'right' });
    await expect(page.locator('[data-testid="file-context-menu"]')).toBeVisible();

    // Test rename functionality
    await page.locator('[data-testid="rename-file"]').click();
    const renameInput = page.locator('[data-testid="rename-input"]');
    await expect(renameInput).toBeVisible();
    await renameInput.fill('renamed-file.ts');
    await page.keyboard.press('Enter');
  });

  test('should show real-time collaboration features', async ({ page }) => {
    // Check for presence indicators
    await expect(page.locator('[data-testid="collaboration-panel"]')).toBeVisible();

    // Test cursor tracking (if implemented)
    const editor = page.locator('[data-testid="monaco-editor"]');
    await editor.click();

    // Move cursor and verify position tracking
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
  });

  test('should handle responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check that mobile layout adjustments work
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    // Verify layout adapts
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();

    // Return to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('[data-testid="full-layout"]')).toBeVisible();
  });
});