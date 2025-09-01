import pg from 'pg';

// Direct database connection using Neon DATABASE_URL
const dbUrl = 'postgresql://neondb_owner:npg_A6yH3CuqXErI@ep-solitary-shadow-a1r1bs0n-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';
const pool = new pg.Pool({ connectionString: dbUrl });

export default async function handler(req, res) {
  console.log('API /api/gst-items called with method:', req.method);
  // Database connection established
  if (req.method === 'GET') {
    try {
      if (!pool) {
        console.error('Database pool not available - no valid DATABASE_URL found');
        return res.status(500).json({ error: 'Database connection not available' });
      }
      console.log('Checking if gst_items table exists...');
      // First check if table exists
      const tableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = 'gst_items'
        );
      `);

      if (!tableCheck.rows[0].exists) {
        console.log('gst_items table does not exist, creating it...');
        await pool.query(`
          CREATE TABLE IF NOT EXISTS gst_items (
            id TEXT PRIMARY KEY,
            customer_name TEXT,
            invoice_date DATE,
            invoice_number TEXT,
            rto_date DATE,
            products TEXT,
            order_value DECIMAL(10,2),
            gst_to_reclaim DECIMAL(10,2),
            place_of_supply TEXT,
            status TEXT DEFAULT 'Pending',
            credit_note_number TEXT,
            credit_note_date DATE,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
        `);
        console.log('gst_items table created successfully, returning empty array for empty state');
        return res.status(200).json({ gstItems: [] });
      }

      const result = await pool.query('SELECT * FROM gst_items ORDER BY created_at DESC');
      console.log(`Fetched ${result.rows.length} GST items from database`);
      // Transform snake_case to camelCase for frontend compatibility
      const transformedRows = result.rows.map(row => ({
        id: row.id,
        customerName: row.customer_name,
        invoiceDate: row.invoice_date,
        invoiceNumber: row.invoice_number,
        rtoDate: row.rto_date,
        products: row.products,
        orderValue: parseFloat(row.order_value) || 0,
        gstToReclaim: parseFloat(row.gst_to_reclaim) || 0,
        placeOfSupply: row.place_of_supply,
        status: row.status,
        creditNoteNumber: row.credit_note_number,
        creditNoteDate: row.credit_note_date,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
      res.status(200).json({ gstItems: transformedRows });
    } catch (error) {
      console.error('Error fetching GST items:', error);
      res.status(500).json({ error: 'Failed to fetch GST items' });
    }
  } else if (req.method === 'DELETE') {
    try {
      if (!pool) {
        console.error('Database pool not available for DELETE - no valid DATABASE_URL found');
        return res.status(500).json({ error: 'Database connection not available' });
      }
      const result = await pool.query('DELETE FROM gst_items RETURNING *');
      const deletedCount = result.rows.length;

      res.status(200).json({
        message: `${deletedCount} GST items deleted successfully`
      });
    } catch (error) {
      console.error('Error deleting all GST items:', error);
      res.status(500).json({ error: 'Failed to delete all GST items' });
    }
  } else if (req.method === 'POST') {
    // This would be for creating new items, but in your app it's handled by file processing
    res.status(405).json({ error: 'Method not allowed' });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}