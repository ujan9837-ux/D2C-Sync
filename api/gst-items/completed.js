import pg from 'pg';

const pool = process.env.DATABASE_URL ? new pg.Pool({ connectionString: process.env.DATABASE_URL }) : null;

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!pool) {
      return res.status(500).json({ error: 'Database connection not available' });
    }
    const result = await pool.query('DELETE FROM gst_items WHERE status = $1 RETURNING *', ['Completed']);
    const deletedCount = result.rows.length;

    res.status(200).json({
      message: `${deletedCount} completed GST items deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting completed GST items:', error);
    res.status(500).json({ error: 'Failed to delete completed GST items' });
  }
}