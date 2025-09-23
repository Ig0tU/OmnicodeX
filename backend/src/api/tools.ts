import { Router, Request, Response } from 'express';
import { query } from '../db';

const router = Router();

interface Tool {
  id: number;
  name: string;
  description: string;
  code: string;
  category: string;
  version: string;
  author: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
}

interface CreateToolRequest {
  name: string;
  description: string;
  code: string;
  category?: string;
  version?: string;
  author?: string;
  is_active?: boolean;
  metadata?: Record<string, any>;
}

/**
 * GET /api/tools
 * Fetches all tools, optionally filtered by category or active status
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, active = 'true', limit = '100', offset = '0' } = req.query;

    let queryText = `
      SELECT id, name, description, code, category, version, author, is_active,
             created_at, updated_at, metadata
      FROM tools
      WHERE 1=1
    `;
    const queryParams: any[] = [];
    let paramIndex = 1;

    // Add filters
    if (category) {
      queryText += ` AND category = $${paramIndex++}`;
      queryParams.push(category);
    }

    if (active !== 'all') {
      queryText += ` AND is_active = $${paramIndex++}`;
      queryParams.push(active === 'true');
    }

    queryText += ` ORDER BY category, name LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    queryParams.push(parseInt(limit as string), parseInt(offset as string));

    const result = await query<Tool>(queryText, queryParams);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM tools WHERE 1=1';
    const countParams: any[] = [];
    let countParamIndex = 1;

    if (category) {
      countQuery += ` AND category = $${countParamIndex++}`;
      countParams.push(category);
    }

    if (active !== 'all') {
      countQuery += ` AND is_active = $${countParamIndex++}`;
      countParams.push(active === 'true');
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
    console.error('Error fetching tools:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch tools',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/tools/:id
 * Fetch a specific tool by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: 'Valid tool ID is required'
      });
    }

    const result = await query<Tool>(
      `SELECT id, name, description, code, category, version, author, is_active,
              created_at, updated_at, metadata
       FROM tools
       WHERE id = $1`,
      [parseInt(id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Tool not found'
      });
    }

    return res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error fetching tool:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch tool',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/tools
 * Creates a new tool
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      code,
      category = 'general',
      version = '1.0.0',
      author = 'user',
      is_active = true,
      metadata = {}
    }: CreateToolRequest = req.body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'name is required and must be a non-empty string'
      });
    }

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'description is required and must be a non-empty string'
      });
    }

    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'code is required and must be a non-empty string'
      });
    }

    // Basic code validation - check for function definition
    if (!code.includes('function') && !code.includes('=>')) {
      return res.status(400).json({
        success: false,
        error: 'code must contain a valid JavaScript function'
      });
    }

    // Check for duplicate names
    const existingTool = await query(
      'SELECT id FROM tools WHERE name = $1',
      [name.trim()]
    );

    if (existingTool.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: `Tool with name '${name}' already exists`
      });
    }

    // Insert new tool
    const result = await query<Tool>(
      `INSERT INTO tools (name, description, code, category, version, author, is_active, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, name, description, code, category, version, author, is_active,
                 created_at, updated_at, metadata`,
      [
        name.trim(),
        description.trim(),
        code.trim(),
        category,
        version,
        author,
        is_active,
        JSON.stringify(metadata)
      ]
    );

    if (result.rows.length === 0) {
      throw new Error('Failed to create tool');
    }

    return res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Tool created successfully'
    });

  } catch (error) {
    console.error('Error creating tool:', error);

    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return res.status(409).json({
        success: false,
        error: 'A tool with this name already exists'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to create tool',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/tools/:id
 * Updates an existing tool
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      code,
      category,
      version,
      author,
      is_active,
      metadata
    }: Partial<CreateToolRequest> = req.body;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: 'Valid tool ID is required'
      });
    }

    // Check if tool exists
    const existingTool = await query<Tool>(
      'SELECT id, name FROM tools WHERE id = $1',
      [parseInt(id)]
    );

    if (existingTool.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Tool not found'
      });
    }

    // Build update query dynamically
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'name must be a non-empty string'
        });
      }
      updateFields.push(`name = $${paramIndex++}`);
      updateValues.push(name.trim());
    }

    if (description !== undefined) {
      if (!description || typeof description !== 'string' || description.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'description must be a non-empty string'
        });
      }
      updateFields.push(`description = $${paramIndex++}`);
      updateValues.push(description.trim());
    }

    if (code !== undefined) {
      if (!code || typeof code !== 'string' || code.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'code must be a non-empty string'
        });
      }
      if (!code.includes('function') && !code.includes('=>')) {
        return res.status(400).json({
          success: false,
          error: 'code must contain a valid JavaScript function'
        });
      }
      updateFields.push(`code = $${paramIndex++}`);
      updateValues.push(code.trim());
    }

    if (category !== undefined) {
      updateFields.push(`category = $${paramIndex++}`);
      updateValues.push(category);
    }

    if (version !== undefined) {
      updateFields.push(`version = $${paramIndex++}`);
      updateValues.push(version);
    }

    if (author !== undefined) {
      updateFields.push(`author = $${paramIndex++}`);
      updateValues.push(author);
    }

    if (is_active !== undefined) {
      updateFields.push(`is_active = $${paramIndex++}`);
      updateValues.push(is_active);
    }

    if (metadata !== undefined) {
      updateFields.push(`metadata = $${paramIndex++}`);
      updateValues.push(JSON.stringify(metadata));
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }

    // Add updated_at timestamp
    updateFields.push(`updated_at = NOW()`);
    updateValues.push(parseInt(id));

    const updateQuery = `
      UPDATE tools
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, name, description, code, category, version, author, is_active,
                created_at, updated_at, metadata
    `;

    const result = await query<Tool>(updateQuery, updateValues);

    return res.json({
      success: true,
      data: result.rows[0],
      message: 'Tool updated successfully'
    });

  } catch (error) {
    console.error('Error updating tool:', error);

    if (error instanceof Error && error.message.includes('duplicate key')) {
      return res.status(409).json({
        success: false,
        error: 'A tool with this name already exists'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to update tool',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/tools/:id
 * Deletes a tool (or marks it as inactive)
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { hard_delete = 'false' } = req.query;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: 'Valid tool ID is required'
      });
    }

    if (hard_delete === 'true') {
      // Permanently delete the tool
      const result = await query(
        'DELETE FROM tools WHERE id = $1',
        [parseInt(id)]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          success: false,
          error: 'Tool not found'
        });
      }

    return res.json({
        success: true,
        message: 'Tool deleted permanently'
      });
    } else {
      // Soft delete - mark as inactive
      const result = await query<Tool>(
        `UPDATE tools
         SET is_active = FALSE, updated_at = NOW()
         WHERE id = $1
         RETURNING id, name, is_active`,
        [parseInt(id)]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Tool not found'
        });
      }

    return res.json({
        success: true,
        data: result.rows[0],
        message: 'Tool deactivated successfully'
      });
    }

  } catch (error) {
    console.error('Error deleting tool:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete tool',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/tools/categories
 * Get all tool categories
 */
router.get('/meta/categories', async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT category, COUNT(*) as count
      FROM tools
      WHERE is_active = TRUE
      GROUP BY category
      ORDER BY category
    `);

    return res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error fetching tool categories:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch tool categories',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as toolRoutes };