import pg from 'pg';

const pool = process.env.DATABASE_URL ? new pg.Pool({ connectionString: process.env.DATABASE_URL }) : null;

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'PUT') {
    try {
      if (!pool) {
        return res.status(500).json({ error: 'Database connection not available' });
      }
      const { status, creditNoteNumber, creditNoteDate } = req.body;

      let updateFields = [];
      let values = [];
      let paramIndex = 1;

      if (status !== undefined) {
        updateFields.push(`status = $${paramIndex}`);
        values.push(status);
        paramIndex++;
      }
      if (creditNoteNumber !== undefined) {
        updateFields.push(`credit_note_number = $${paramIndex}`);
        values.push(creditNoteNumber);
        paramIndex++;
      }
      if (creditNoteDate !== undefined) {
        updateFields.push(`credit_note_date = $${paramIndex}`);
        values.push(creditNoteDate);
        paramIndex++;
      }

      values.push(id); // Add id at the end

      const query = `
        UPDATE gst_items
        SET ${updateFields.join(', ')}, updated_at = NOW()
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'GST item not found' });
      }

      // Transform to camelCase for frontend
      const transformedRow = {
        id: result.rows[0].id,
        customerName: result.rows[0].customer_name,
        invoiceDate: result.rows[0].invoice_date,
        invoiceNumber: result.rows[0].invoice_number,
        rtoDate: result.rows[0].rto_date,
        products: result.rows[0].products,
        orderValue: result.rows[0].order_value,
        gstToReclaim: result.rows[0].gst_to_reclaim,
        placeOfSupply: result.rows[0].place_of_supply,
        status: result.rows[0].status,
        creditNoteNumber: result.rows[0].credit_note_number,
        creditNoteDate: result.rows[0].credit_note_date,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at
      };

      res.status(200).json(transformedRow);
    } catch (error) {
      console.error('Error updating GST item:', error);
      res.status(500).json({ error: 'Failed to update GST item' });
    }
  } else if (req.method === 'DELETE') {
    try {
      if (!pool) {
        return res.status(500).json({ error: 'Database connection not available' });
      }
      const result = await pool.query('DELETE FROM gst_items WHERE id = $1 RETURNING *', [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'GST item not found' });
      }

      res.status(200).json({ message: 'GST item deleted successfully' });
    } catch (error) {
      console.error('Error deleting GST item:', error);
      res.status(500).json({ error: 'Failed to delete GST item' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}