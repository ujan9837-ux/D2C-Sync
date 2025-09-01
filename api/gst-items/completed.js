import pg from 'pg';

// Check for database URL in multiple possible environment variables
const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL_NON_POOLING;
const pool = dbUrl ? new pg.Pool({ connectionString: dbUrl }) : null;

export default async function handler(req, res) {
  console.log('API /api/gst-items/completed called with method:', req.method);
  console.log('Database URL available:', !!dbUrl);

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!pool) {
      console.error('Database pool not available for DELETE - no valid DATABASE_URL found');
      return res.status(500).json({ error: 'Database connection not available' });
    }

    console.log('Executing DELETE query for completed GST items');
    const result = await pool.query('DELETE FROM gst_items WHERE status = $1 RETURNING *', ['Completed']);
    const deletedCount = result.rows.length;
    console.log(`Deleted ${deletedCount} completed GST items`);

    res.status(200).json({
      message: `${deletedCount} completed GST items deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting completed GST items:', error);
    res.status(500).json({ error: 'Failed to delete completed GST items' });
  }
}