import pg from 'pg';

// Check for database URL in multiple possible environment variables
const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL_NON_POOLING;
const pool = dbUrl ? new pg.Pool({ connectionString: dbUrl }) : null;

export default async function handler(req, res) {
  console.log('API /api/test-db called');

  const diagnostics = {
    environment: {
      DATABASE_URL: !!process.env.DATABASE_URL,
      POSTGRES_URL: !!process.env.POSTGRES_URL,
      POSTGRES_PRISMA_URL: !!process.env.POSTGRES_PRISMA_URL,
      POSTGRES_URL_NON_POOLING: !!process.env.POSTGRES_URL_NON_POOLING,
      resolvedDbUrl: !!dbUrl,
      poolAvailable: !!pool
    },
    database: null,
    error: null
  };

  if (!pool) {
    diagnostics.error = 'No database pool available - check environment variables';
    console.error(diagnostics.error);
    return res.status(500).json(diagnostics);
  }

  try {
    // Test basic connection
    const client = await pool.connect();
    diagnostics.database = { connection: 'successful' };

    // Test a simple query
    const result = await client.query('SELECT NOW() as current_time');
    diagnostics.database.query = 'successful';
    diagnostics.database.currentTime = result.rows[0].current_time;

    // Test if gst_items table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'gst_items'
      );
    `);
    diagnostics.database.tableExists = tableCheck.rows[0].exists;

    client.release();

    console.log('Database test successful:', diagnostics);
    res.status(200).json(diagnostics);
  } catch (error) {
    diagnostics.error = error.message;
    diagnostics.database = { connection: 'failed' };
    console.error('Database test failed:', error);
    res.status(500).json(diagnostics);
  }
}