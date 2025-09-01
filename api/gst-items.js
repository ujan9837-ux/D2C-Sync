import pg from 'pg';

const pool = process.env.DATABASE_URL ? new pg.Pool({ connectionString: process.env.DATABASE_URL }) : null;

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      if (!pool) {
        return res.status(500).json({ error: 'Database connection not available' });
      }
      const result = await pool.query('SELECT * FROM gst_items ORDER BY created_at DESC');
      // Transform snake_case to camelCase for frontend compatibility
      const transformedRows = result.rows.map(row => ({
        id: row.id,
        customerName: row.customer_name,
        invoiceDate: row.invoice_date,
        invoiceNumber: row.invoice_number,
        rtoDate: row.rto_date,
        products: row.products,
        orderValue: row.order_value,
        gstToReclaim: row.gst_to_reclaim,
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