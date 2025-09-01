import pg from 'pg';
import Papa from 'papaparse';

// Check for database URL in multiple possible environment variables
const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL_NON_POOLING;
const pool = dbUrl ? new pg.Pool({ connectionString: dbUrl }) : null;

export default async function handler(req, res) {
  console.log('API /api/process-file called with method:', req.method);
  // Database connection established
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { content, filename } = req.body;
    console.log('Processing file:', filename, 'content length:', content ? content.length : 'null');

    if (!content) {
      console.error('File content is required but not provided');
      return res.status(400).json({ error: 'File content is required' });
    }

    if (!filename) {
      console.error('Filename is required but not provided');
      return res.status(400).json({ error: 'Filename is required' });
    }

    const fileExt = filename.split('.').pop().toLowerCase();
    console.log('File extension:', fileExt);

    let parsedData;

    if (fileExt === 'csv') {
      const parsed = Papa.parse(content, {
        header: true,
        skipEmptyLines: true
      });

      if (parsed.errors.length > 0) {
        return res.status(400).json({ error: 'Error parsing CSV', details: parsed.errors });
      }

      parsedData = parsed.data;
    } else if (fileExt === 'json') {
      try {
        parsedData = JSON.parse(content);
        if (!Array.isArray(parsedData)) {
          return res.status(400).json({ error: 'JSON file must contain an array of objects' });
        }
      } catch (parseErr) {
        return res.status(400).json({ error: 'Error parsing JSON', details: parseErr.message });
      }
    } else {
      return res.status(400).json({ error: 'Unsupported file type. Only .csv and .json files are supported.' });
    }

    // Transform to GST action items
    let gstItems;
    if (parsedData.length > 0 && parsedData[0].customer && parsedData[0].line_items) {
      // Shopify format
      const stateCodeMap = {
        'Maharashtra': '27-Maharashtra',
        'Delhi': '07-Delhi',
        'Karnataka': '29-Karnataka',
        'Tamil Nadu': '33-Tamil Nadu',
        'Telangana': '36-Telangana',
        'Gujarat': '24-Gujarat',
        'Uttar Pradesh': '09-Uttar Pradesh'
      };

      gstItems = parsedData
        .filter(order => order.refunds && order.refunds.length > 0)
        .map((order, index) => {
          const customerName = `${order.customer.first_name} ${order.customer.last_name}`;
          const invoiceDate = order.created_at.split('T')[0];
          const invoiceNumber = order.name;
          const rtoDate = order.refunds[0].created_at.split('T')[0];
          const products = order.line_items.map(item => item.title).join(', ');
          const orderValue = order.line_items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
          const gstToReclaim = order.line_items.reduce((sum, item) => sum + item.tax_lines.reduce((taxSum, tax) => taxSum + parseFloat(tax.price), 0), 0);
          const province = order.shipping_address?.province;
          const placeOfSupply = stateCodeMap[province] || province;

          return {
            id: `gst_${Date.now()}_${index}`,
            customerName,
            invoiceDate,
            invoiceNumber,
            rtoDate,
            products,
            orderValue,
            gstToReclaim,
            placeOfSupply,
            status: 'Pending'
          };
        });
    } else {
      // Standard format
      gstItems = parsedData.map((row, index) => ({
        id: `gst_${Date.now()}_${index}`,
        customerName: row.customerName || '',
        invoiceDate: row.invoiceDate || row.originalInvoiceDate || '',
        invoiceNumber: row.invoiceNumber || row.originalInvoiceNumber || '',
        rtoDate: row.rtoDate || '',
        products: row.products || '',
        orderValue: parseFloat(row.orderValue) || 0,
        gstToReclaim: parseFloat(row.gstToReclaim) || 0,
        placeOfSupply: row.placeOfSupply || '',
        status: row.status || 'Pending'
      }));
    }

    // Insert into database
    if (gstItems.length > 0) {
      console.log(`Inserting ${gstItems.length} GST items into database`);
      if (!pool) {
        console.error('Database pool not available for insertion - no valid DATABASE_URL found');
        return res.status(500).json({ error: 'Database connection not available' });
      }

      // Ensure table exists with correct schema
      console.log('Ensuring gst_items table exists with correct schema...');
      await pool.query(`DROP TABLE IF EXISTS gst_items`);
      await pool.query(`
        CREATE TABLE gst_items (
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
      console.log('Table created with correct schema, proceeding with insertion');

      const query = `
        INSERT INTO gst_items (id, customer_name, invoice_date, invoice_number, rto_date, products, order_value, gst_to_reclaim, place_of_supply, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO UPDATE SET
          customer_name = EXCLUDED.customer_name,
          invoice_date = EXCLUDED.invoice_date,
          invoice_number = EXCLUDED.invoice_number,
          rto_date = EXCLUDED.rto_date,
          products = EXCLUDED.products,
          order_value = EXCLUDED.order_value,
          gst_to_reclaim = EXCLUDED.gst_to_reclaim,
          place_of_supply = EXCLUDED.place_of_supply,
          status = EXCLUDED.status,
          updated_at = NOW()
      `;
      for (const item of gstItems) {
        console.log('Inserting item:', item.id);
        await pool.query(query, [
          item.id, item.customerName, item.invoiceDate, item.invoiceNumber,
          item.rtoDate, item.products, item.orderValue, item.gstToReclaim,
          item.placeOfSupply, item.status
        ]);
      }
      console.log('All items inserted successfully');
    } else {
      console.log('No GST items to insert');
    }

    res.status(200).json({ gstItems, message: `${gstItems.length} GST items processed successfully` });
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({ error: 'Failed to process file' });
  }
}