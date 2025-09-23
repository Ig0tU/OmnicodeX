import { Router, Request, Response } from 'express';
import { promises as fs } from 'fs';
import path from 'path';

const router = Router();
const CONFIG_PATH = path.join(__dirname, '../agent/config.json');

/**
 * GET /api/config
 * Reads and returns the agent configuration
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const configData = await fs.readFile(CONFIG_PATH, 'utf-8');
    const config = JSON.parse(configData);

    return res.json({
      success: true,
      config
    });
  } catch (error) {
    console.error('Error reading config file:', error);

    if (error instanceof SyntaxError) {
      return res.status(500).json({
        success: false,
        error: 'Invalid JSON in config file',
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to read config file',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/config
 * Updates the agent configuration
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const newConfig = req.body;

    if (!newConfig || typeof newConfig !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Configuration must be a valid JSON object'
      });
    }

    // Validate required configuration sections
    const requiredSections = ['browserSettings', 'agentSettings', 'geminiSettings'];
    for (const section of requiredSections) {
      if (!newConfig[section] || typeof newConfig[section] !== 'object') {
        return res.status(400).json({
          success: false,
          error: `Missing or invalid required section: ${section}`
        });
      }
    }

    // Validate specific required fields
    const validations = [
      { path: ['browserSettings', 'viewport', 'width'], type: 'number' },
      { path: ['browserSettings', 'viewport', 'height'], type: 'number' },
      { path: ['agentSettings', 'maxIterations'], type: 'number' },
      { path: ['geminiSettings', 'model'], type: 'string' }
    ];

    for (const validation of validations) {
      let current = newConfig;
      for (const key of validation.path) {
        if (!current[key]) {
          return res.status(400).json({
            success: false,
            error: `Missing required field: ${validation.path.join('.')}`
          });
        }
        current = current[key];
      }

      if (typeof current !== validation.type) {
        return res.status(400).json({
          success: false,
          error: `Field ${validation.path.join('.')} must be of type ${validation.type}`
        });
      }
    }

    // Backup current config
    const backupPath = `${CONFIG_PATH}.backup.${Date.now()}`;
    try {
      const currentConfig = await fs.readFile(CONFIG_PATH, 'utf-8');
      await fs.writeFile(backupPath, currentConfig);
    } catch (backupError) {
      console.warn('Failed to create config backup:', backupError);
    }

    // Write new configuration
    await fs.writeFile(CONFIG_PATH, JSON.stringify(newConfig, null, 2), 'utf-8');

    return res.json({
      success: true,
      message: 'Configuration updated successfully',
      config: newConfig,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating config file:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update config file',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as configRoutes };