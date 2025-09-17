import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;

  // Launch browser for authentication setup
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Navigate to login page and perform authentication if needed
    await page.goto(`${baseURL}/login`);

    // Check if we need to login (if login page exists)
    const loginForm = await page.$('form');
    if (loginForm) {
      // Mock authentication - in real scenario, use test credentials
      await page.evaluate(() => {
        // Set mock authentication state
        localStorage.setItem('auth-token', 'mock-test-token');
        localStorage.setItem('user', JSON.stringify({
          id: 'test-user-1',
          username: 'testuser',
          email: 'test@example.com',
          roles: ['user'],
        }));
      });
    }

    // Save authentication state
    await page.context().storageState({ path: 'e2e/auth.json' });

    console.log('✅ E2E global setup completed');
  } catch (error) {
    console.warn('⚠️ Global setup warning:', error);
  } finally {
    await browser.close();
  }
}

export default globalSetup;