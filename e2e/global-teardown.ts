import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalTeardown(config: FullConfig) {
  try {
    // Clean up authentication files
    const authFile = path.join(__dirname, 'auth.json');
    if (fs.existsSync(authFile)) {
      fs.unlinkSync(authFile);
    }

    // Clean up any temporary test files
    const tempDir = path.join(__dirname, '../temp');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }

    console.log('✅ E2E global teardown completed');
  } catch (error) {
    console.warn('⚠️ Global teardown warning:', error);
  }
}

export default globalTeardown;