import { Router, Request, Response } from 'express';
import { query } from '../db';

const router = Router();

interface Memory {
  id: number;
  run_id: string;
  content: string;
  type: 'observation' | 'thought' | 'action';
  timestamp: string;
  metadata: Record<string, any>;
}

interface CreateMemoryRequest {
  run_id: string;
  content: string;
  type: 'observation' | 'thought' | 'action';
  metadata?: Record<string, any>;
}

/**
 * GET /api/memory
 * Fetches all memories, optionally filtered by run_id
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { run_id, limit = '100', offset = '0', type } = req.query;

    let queryText = `
      SELECT id, run_id, content, type, timestamp, metadata
      FROM memories
      WHERE 1=1
    `;
    const queryParams: any[] = [];
    let paramIndex = 1;

    // Add filters
    if (run_id) {
      queryText += ` AND run_id = $${paramIndex++}`;
      queryParams.push(run_id);
    }

    if (type) {
      queryText += ` AND type = $${paramIndex++}`;
      queryParams.push(type);
    }

    queryText += ` ORDER BY timestamp DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    queryParams.push(parseInt(limit as string), parseInt(offset as string));

    const result = await query<Memory>(queryText, queryParams);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM memories WHERE 1=1';
    const countParams: any[] = [];
    let countParamIndex = 1;

    if (run_id) {
      countQuery += ` AND run_id = $${countParamIndex++}`;
      countParams.push(run_id);
    }

    if (type) {
      countQuery += ` AND type = $${countParamIndex++}`;
      countParams.push(type);
    }

    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0]?.count || '0');

    return res.json({
      success: true,
      data: result.rows,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: total > parseInt(offset as string) + result.rows.length
      }
    });

  } catch (error) {
    console.error('Error fetching memories:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch memories',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/memory
 * Creates a new memory record
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { run_id, content, type, metadata = {} }: CreateMemoryRequest = req.body;

    // Validation
    if (!run_id || typeof run_id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'run_id is required and must be a string'
      });
    }

    if (!content || typeof content !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'content is required and must be a string'
      });
    }

    if (!type || !['observation', 'thought', 'action'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'type is required and must be one of: observation, thought, action'
      });
    }

    // Insert memory record
    const result = await query<Memory>(
      `INSERT INTO memories (run_id, content, type, metadata)
       VALUES ($1, $2, $3, $4)
       RETURNING id, run_id, content, type, timestamp, metadata`,
      [run_id, content, type, JSON.stringify(metadata)]
    );

    if (result.rows.length === 0) {
      throw new Error('Failed to create memory record');
    }

    const newMemory = result.rows[0];

    // Update memory count in agent_runs table
    await query(
      `UPDATE agent_runs
       SET total_memories = (
         SELECT COUNT(*) FROM memories WHERE run_id = $1
       ),
       updated_at = NOW()
       WHERE run_id = $1`,
      [run_id]
    );

    return res.status(201).json({
      success: true,
      data: newMemory,
      message: 'Memory created successfully'
    });

  } catch (error) {
    console.error('Error creating memory:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create memory',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/memory/stats
 * Get memory statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { run_id } = req.query;

    let statsQuery = `
      SELECT
        type,
        COUNT(*) as count,
        MAX(timestamp) as latest_timestamp
      FROM memories
    `;
    const queryParams: any[] = [];

    if (run_id) {
      statsQuery += ' WHERE run_id = $1';
      queryParams.push(run_id);
    }

    statsQuery += ' GROUP BY type ORDER BY type';

    const result = await query(statsQuery, queryParams);

    // Calculate total memories
    const totalMemories = result.rows.reduce((sum, row) => sum + parseInt(row.count), 0);

    return res.json({
      success: true,
      data: {
        totalMemories,
        byType: result.rows.reduce((acc, row) => {
          acc[row.type] = parseInt(row.count);
          return acc;
        }, {} as Record<string, number>),
        detailed: result.rows
      }
    });

  } catch (error) {
    console.error('Error fetching memory stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch memory statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/memory/:run_id
 * Deletes all memories for a specific run
 */
router.delete('/:run_id', async (req: Request, res: Response) => {
  try {
    const { run_id } = req.params;

    if (!run_id) {
      return res.status(400).json({
        success: false,
        error: 'run_id is required'
      });
    }

    const result = await query(
      'DELETE FROM memories WHERE run_id = $1',
      [run_id]
    );

    // Update memory count in agent_runs table
    await query(
      `UPDATE agent_runs
       SET total_memories = 0, updated_at = NOW()
       WHERE run_id = $1`,
      [run_id]
    );

    return res.json({
      success: true,
      message: `Deleted ${result.rowCount} memories for run ${run_id}`
    });

  } catch (error) {
    console.error('Error deleting memories:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete memories',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as memoryRoutes };