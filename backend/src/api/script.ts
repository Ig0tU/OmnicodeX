import { Router, Request, Response } from 'express';
import { promises as fs } from 'fs';
import path from 'path';

const router = Router();
const SCRIPT_PATH = path.join(__dirname, '../agent/core.ts');

/**
 * GET /api/script
 * Reads and returns the content of the core agent script
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const content = await fs.readFile(SCRIPT_PATH, 'utf-8');
    return res.json({
      success: true,
      content
    });
  } catch (error) {
    console.error('Error reading script file:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to read script file',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/script
 * Updates the content of the core agent script
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { content } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Content is required and must be a string'
      });
    }

    // Basic TypeScript syntax validation (check for basic structure)
    if (!content.includes('export') || !content.includes('function')) {
      return res.status(400).json({
        success: false,
        error: 'Script must be a valid TypeScript file with exported functions'
      });
    }

    // Backup the current script before overwriting
    const backupPath = `${SCRIPT_PATH}.backup.${Date.now()}`;
    try {
      const currentContent = await fs.readFile(SCRIPT_PATH, 'utf-8');
      await fs.writeFile(backupPath, currentContent);
    } catch (backupError) {
      console.warn('Failed to create backup:', backupError);
    }

    // Write the new content
    await fs.writeFile(SCRIPT_PATH, content, 'utf-8');

    return res.json({
      success: true,
      message: 'Script updated successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating script file:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update script file',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as scriptRoutes };