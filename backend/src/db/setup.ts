import { promises as fs } from 'fs';
import path from 'path';
import { Client } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function setupDatabase(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    // Read and execute the setup SQL script
    const sqlPath = path.join(__dirname, 'setup.sql');
    const sqlScript = await fs.readFile(sqlPath, 'utf-8');

    console.log('📝 Executing database setup script...');
    await client.query(sqlScript);
    console.log('✅ Database schema created successfully');

    // Verify tables were created
    const tablesResult = await client.query(`
      SELECT tablename
      FROM pg_catalog.pg_tables
      WHERE schemaname = 'public'
      AND tablename IN ('memories', 'tools', 'agent_runs')
      ORDER BY tablename;
    `);

    console.log('📊 Created tables:', tablesResult.rows.map(row => row.tablename));

    // Check if default tools were inserted
    const toolsResult = await client.query('SELECT COUNT(*) FROM tools WHERE is_active = TRUE');
    console.log(`🛠️ Available tools: ${toolsResult.rows[0]?.count || 0}`);

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log('🎉 Database setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database setup failed:', error);
      process.exit(1);
    });
}

export { setupDatabase };