import { Router, Request, Response } from 'express';
import { AgentRunner } from '../services/agentRunner';
import { query } from '../db';

const router = Router();

/**
 * POST /api/agent/start
 * Starts a new agent execution run
 */
router.post('/start', async (req: Request, res: Response) => {
  try {
    const { goal } = req.body;

    // Validation
    if (!goal || typeof goal !== 'string' || goal.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'goal is required and must be a non-empty string'
      });
    }

    if (goal.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'goal must be less than 1000 characters'
      });
    }

    const agentRunner = AgentRunner.getInstance();

    // Check if an agent is already running
    const currentStatus = agentRunner.getAgentStatus();
    if (currentStatus.status === 'running') {
      return res.status(409).json({
        success: false,
        error: 'An agent is already running. Stop the current agent before starting a new one.',
        currentRun: {
          status: currentStatus.status,
          currentTask: currentStatus.currentTask,
          runId: currentStatus.runId
        }
      });
    }

    // Start the agent
    const runId = await agentRunner.startAgent(goal.trim());

    return res.status(201).json({
      success: true,
      data: {
        runId,
        goal: goal.trim(),
        status: 'running',
        startTime: new Date().toISOString()
      },
      message: 'Agent started successfully'
    });

  } catch (error) {
    console.error('Error starting agent:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to start agent',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/agent/stop
 * Stops the currently running agent
 */
router.post('/stop', async (req: Request, res: Response) => {
  try {
    const agentRunner = AgentRunner.getInstance();

    // Check if an agent is running
    const currentStatus = agentRunner.getAgentStatus();
    if (currentStatus.status !== 'running') {
      return res.status(409).json({
        success: false,
        error: 'No agent is currently running',
        currentStatus
      });
    }

    // Stop the agent
    await agentRunner.stopAgent();

    return res.json({
      success: true,
      message: 'Agent stopped successfully',
      data: {
        runId: currentStatus.runId,
        status: 'stopped',
        stoppedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error stopping agent:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to stop agent',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/agent/status
 * Gets the current status of the agent
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const agentRunner = AgentRunner.getInstance();
    const status = agentRunner.getAgentStatus();

    // If there's a current run, get additional details from database
    let runDetails = null;
    if (status.runId) {
      const result = await query(
        `SELECT run_id, goal, status, current_task, start_time, end_time,
                error_message, total_memories, total_actions, metadata
         FROM agent_runs
         WHERE run_id = $1`,
        [status.runId]
      );

      if (result.rows.length > 0) {
        runDetails = result.rows[0];
      }
    }

    return res.json({
      success: true,
      data: {
        status: status.status,
        currentTask: status.currentTask,
        runId: status.runId,
        runDetails
      }
    });

  } catch (error) {
    console.error('Error getting agent status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get agent status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/agent/runs
 * Gets a list of all agent runs with pagination
 */
router.get('/runs', async (req: Request, res: Response) => {
  try {
    const { limit = '20', offset = '0', status } = req.query;

    let queryText = `
      SELECT run_id, goal, status, current_task, start_time, end_time,
             error_message, total_memories, total_actions, created_at
      FROM agent_runs
      WHERE 1=1
    `;
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (status) {
      queryText += ` AND status = $${paramIndex++}`;
      queryParams.push(status);
    }

    queryText += ` ORDER BY start_time DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    queryParams.push(parseInt(limit as string), parseInt(offset as string));

    const result = await query(queryText, queryParams);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM agent_runs WHERE 1=1';
    const countParams: any[] = [];
    let countParamIndex = 1;

    if (status) {
      countQuery += ` AND status = $${countParamIndex++}`;
      countParams.push(status);
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
    console.error('Error fetching agent runs:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch agent runs',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/agent/runs/:runId
 * Gets detailed information about a specific agent run
 */
router.get('/runs/:runId', async (req: Request, res: Response) => {
  try {
    const { runId } = req.params;

    if (!runId) {
      return res.status(400).json({
        success: false,
        error: 'runId is required'
      });
    }

    // Get run details
    const runResult = await query(
      `SELECT run_id, goal, status, current_task, start_time, end_time,
              error_message, total_memories, total_actions, metadata, created_at
       FROM agent_runs
       WHERE run_id = $1`,
      [runId]
    );

    if (runResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Agent run not found'
      });
    }

    const runDetails = runResult.rows[0];

    // Get memories for this run
    const memoriesResult = await query(
      `SELECT id, content, type, timestamp
       FROM memories
       WHERE run_id = $1
       ORDER BY timestamp ASC
       LIMIT 100`,
      [runId]
    );

    return res.json({
      success: true,
      data: {
        run: runDetails,
        memories: memoriesResult.rows
      }
    });

  } catch (error) {
    console.error('Error fetching agent run details:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch agent run details',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/agent/runs/:runId
 * Deletes an agent run and all associated memories
 */
router.delete('/runs/:runId', async (req: Request, res: Response) => {
  try {
    const { runId } = req.params;

    if (!runId) {
      return res.status(400).json({
        success: false,
        error: 'runId is required'
      });
    }

    // Check if the run exists
    const runResult = await query(
      'SELECT run_id, status FROM agent_runs WHERE run_id = $1',
      [runId]
    );

    if (runResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Agent run not found'
      });
    }

    // Don't allow deletion of currently running agents
    if (runResult.rows[0].status === 'running') {
      return res.status(409).json({
        success: false,
        error: 'Cannot delete a currently running agent. Stop the agent first.'
      });
    }

    // Delete memories first (due to foreign key constraints)
    await query('DELETE FROM memories WHERE run_id = $1', [runId]);

    // Delete the agent run
    const deleteResult = await query(
      'DELETE FROM agent_runs WHERE run_id = $1',
      [runId]
    );

    return res.json({
      success: true,
      message: `Agent run ${runId} and all associated memories deleted successfully`
    });

  } catch (error) {
    console.error('Error deleting agent run:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete agent run',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/agent/stats
 * Gets overall statistics about agent runs
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    // Get run statistics
    const runStatsResult = await query(`
      SELECT
        status,
        COUNT(*) as count,
        AVG(EXTRACT(EPOCH FROM (end_time - start_time))) as avg_duration_seconds
      FROM agent_runs
      WHERE end_time IS NOT NULL
      GROUP BY status
      ORDER BY status
    `);

    // Get total counts
    const totalStatsResult = await query(`
      SELECT
        COUNT(*) as total_runs,
        SUM(total_memories) as total_memories,
        SUM(total_actions) as total_actions,
        AVG(total_memories) as avg_memories_per_run,
        AVG(total_actions) as avg_actions_per_run
      FROM agent_runs
    `);

    // Get recent activity
    const recentActivityResult = await query(`
      SELECT run_id, goal, status, start_time
      FROM agent_runs
      ORDER BY start_time DESC
      LIMIT 5
    `);

    return res.json({
      success: true,
      data: {
        runsByStatus: runStatsResult.rows,
        totalStats: totalStatsResult.rows[0] || {},
        recentActivity: recentActivityResult.rows
      }
    });

  } catch (error) {
    console.error('Error fetching agent stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch agent statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as agentRoutes };