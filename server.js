import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import Papa from 'papaparse';
import dotenv from 'dotenv';
import pg from 'pg';


dotenv.config({ path: '.env.local' });

// Debug: Log available environment variables
console.log('Available DB env vars:', {
  DATABASE_URL: !!process.env.DATABASE_URL,
  POSTGRES_URL: !!process.env.POSTGRES_URL,
  POSTGRES_PRISMA_URL: !!process.env.POSTGRES_PRISMA_URL,
  POSTGRES_URL_NON_POOLING: !!process.env.POSTGRES_URL_NON_POOLING,
  NODE_ENV: process.env.NODE_ENV
});

// Create PostgreSQL pool for production
const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL_NON_POOLING;
console.log('Using DB URL:', !!dbUrl);
const pool = dbUrl ? new pg.Pool({ connectionString: dbUrl }) : null;

// In-memory storage for GST items
let inMemoryGstItems = [];

// Ensure uploads directory exists
if (!fs.existsSync('uploads/')) {
  fs.mkdirSync('uploads/', { recursive: true });
  console.log('Created uploads/ directory');
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

const app = express();
const PORT = process.env.PORT || 3001;
const SHOPIFY_WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET || 'your-shopify-webhook-secret-here';

// Middleware
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf; } })); // For webhook verification

// GST Item Storage Functions (using database for production, in-memory and local file for development)
async function saveGstItems(items) {
  try {
    if (process.env.NODE_ENV === 'production' && pool) {
      // Use PostgreSQL pool for production
      const query = `
        INSERT INTO gst_items (
          id, customer_name, invoice_date, invoice_number, rto_date, products,
          order_value, gst_to_reclaim, place_of_supply, status, credit_note_number, credit_note_date, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
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
          credit_note_number = EXCLUDED.credit_note_number,
          credit_note_date = EXCLUDED.credit_note_date,
          updated_at = NOW()
      `;
      for (const item of items) {
        await pool.query(query, [
          item.id, item.customerName, item.invoiceDate, item.invoiceNumber,
          item.rtoDate, item.products, item.orderValue, item.gstToReclaim,
          item.placeOfSupply, item.status, item.creditNoteNumber || null, item.creditNoteDate || null
        ]);
      }
      console.log(`Saved ${items.length} GST items to database`);
    } else {
      // For local development, use in-memory and file
      inMemoryGstItems = [...inMemoryGstItems, ...items];
      console.log(`Saved ${items.length} GST items to in-memory storage`);

      const filePath = 'gst-items.json';
      await fs.promises.writeFile(filePath, JSON.stringify(inMemoryGstItems, null, 2));
      console.log(`Saved GST items to local file`);
    }

    return 'gst-items';
  } catch (error) {
    console.error('Error saving GST items:', error);
    throw error;
  }
}

async function getGstItems() {
  try {
    if (process.env.NODE_ENV === 'production' && pool) {
      console.log('getGstItems: Production mode, checking database');
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
        return [];
      }

      // Query from PostgreSQL pool
      const result = await pool.query('SELECT * FROM gst_items ORDER BY created_at DESC');
      console.log(`Retrieved ${result.rows.length} GST items from database`);
      return result.rows.map(row => ({
        id: row.id,
        customerName: row.customer_name,
        invoiceDate: row.invoice_date,
        invoiceNumber: row.invoice_number,
        rtoDate: row.rto_date,
        products: row.products,
        orderValue: parseFloat(row.order_value),
        gstToReclaim: parseFloat(row.gst_to_reclaim),
        placeOfSupply: row.place_of_supply,
        status: row.status,
        creditNoteNumber: row.credit_note_number,
        creditNoteDate: row.credit_note_date
      }));
    } else {
      console.log('getGstItems: Local development mode');
      // For local development, use in-memory and file
      if (inMemoryGstItems.length > 0) {
        console.log(`Returning ${inMemoryGstItems.length} items from in-memory storage`);
        return inMemoryGstItems;
      }

      const filePath = 'gst-items.json';
      console.log(`Checking if file exists: ${filePath}`);
      if (fs.existsSync(filePath)) {
        console.log('File exists, reading...');
        try {
          const data = await fs.promises.readFile(filePath, 'utf8');
          console.log(`File read successfully, parsing JSON...`);
          inMemoryGstItems = JSON.parse(data);
          console.log(`Parsed ${inMemoryGstItems.length} items from file`);
          return inMemoryGstItems;
        } catch (parseError) {
          console.error('Error parsing gst-items.json, treating as corrupted and returning empty array:', parseError);
          // Reset in-memory to empty and return empty for clean state
          inMemoryGstItems = [];
          return [];
        }
      }

      console.log('No file found, returning empty array for clean empty state');
      return [];
    }
  } catch (error) {
    console.error('Error retrieving GST items:', error);
    throw error;
  }
}

async function saveUpdatedGstItems() {
  try {
    // For local development, save to file
    if (process.env.NODE_ENV !== 'production') {
      const filePath = 'gst-items.json';
      await fs.promises.writeFile(filePath, JSON.stringify(inMemoryGstItems, null, 2));
      console.log(`Saved updated GST items to local file`);
    }
    // For production, updates are already in DB
  } catch (error) {
    console.error('Error saving updated GST items:', error);
    throw error;
  }
}

async function deleteGstItem(itemId) {
  try {
    if (process.env.NODE_ENV === 'production' && pool) {
      // Delete from PostgreSQL pool
      const result = await pool.query('DELETE FROM gst_items WHERE id = $1', [itemId]);
      const deleted = result.rowCount > 0;
      if (deleted) {
        console.log(`Deleted GST item ${itemId} from database`);
      }
      return deleted;
    } else {
      // For local development, use in-memory and file
      if (inMemoryGstItems.length === 0) {
        await getGstItems();
      }

      const initialLength = inMemoryGstItems.length;
      inMemoryGstItems = inMemoryGstItems.filter(item => item.id !== itemId);
      const deleted = inMemoryGstItems.length < initialLength;
      if (deleted) {
        console.log(`Deleted GST item ${itemId} from in-memory storage`);
        await saveUpdatedGstItems();
      }

      return deleted;
    }
  } catch (error) {
    console.error('Error deleting GST item:', error);
    throw error;
  }
}

// Function to verify Shopify webhook
function verifyShopifyWebhook(req) {
  const hmac = req.get('X-Shopify-Hmac-Sha256');
  const body = req.rawBody;
  const hash = crypto.createHmac('sha256', SHOPIFY_WEBHOOK_SECRET).update(body, 'utf8').digest('base64');
  return hmac === hash;
}

// POST endpoint for Shopify refund creation webhooks
app.post('/api/webhooks/refunds/create', (req, res) => {
  if (!verifyShopifyWebhook(req)) {
    return res.status(401).send('Unauthorized');
  }

  const { order_id } = req.body;
  console.log(`Received refund webhook for order_id: ${order_id}`);
  res.status(200).send('OK');
});

// GET endpoint for mock RTO data
app.get('/api/rto-data', (req, res) => {
  const mockData = [
    {
      customerName: 'John Doe',
      invoiceNumber: 'INV-001',
      orderValue: 1500.00,
      gstAmount: 225.00
    },
    {
      customerName: 'Jane Smith',
      invoiceNumber: 'INV-002',
      orderValue: 2200.00,
      gstAmount: 330.00
    },
    {
      customerName: 'Bob Johnson',
      invoiceNumber: 'INV-003',
      orderValue: 800.00,
      gstAmount: 120.00
    }
  ];

  res.json(mockData);
});

// POST endpoint for file upload
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  // Ensure uploads directory exists
  if (!fs.existsSync('uploads/')) {
    fs.mkdirSync('uploads/', { recursive: true });
    console.log('Created uploads/ directory');
  }

  res.json({
    filename: req.file.filename,
    path: req.file.path || null // Path is null for memory storage
  });
});

// GET endpoint to list uploaded files
app.get('/api/uploads', (req, res) => {
  if (!fs.existsSync('uploads/')) {
    console.log('uploads/ directory does not exist, returning empty array');
    return res.json([]);
  }
  fs.readdir('uploads/', (err, files) => {
    if (err) {
      console.error('Error reading uploads directory:', err);
      return res.status(500).send('Unable to scan directory.');
    }
    res.json(files);
  });
});

// GET endpoint to retrieve file content
app.get('/api/file/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join('uploads', filename);

  console.log(`Attempting to read file: ${filePath}`);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return res.status(404).json({ error: 'File not found' });
  }

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(`Error reading file ${filePath}:`, err);
      return res.status(500).json({ error: 'Error reading file' });
    }
    console.log(`Successfully read file: ${filePath}, length: ${data.length}`);
    res.json({ content: data });
  });
});

// POST endpoint to process file into GST action items
app.post('/api/process-file', async (req, res) => {
  const { content, filename } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'File content is required' });
  }

  if (!filename) {
    return res.status(400).json({ error: 'Filename is required' });
  }

  const fileExt = path.extname(filename).toLowerCase();

  let data = content;

  try {
    let parsedData;

    if (fileExt === '.csv') {
      // Parse CSV
      const parsed = Papa.parse(data, {
        header: true,
        skipEmptyLines: true
      });

      if (parsed.errors.length > 0) {
        return res.status(400).json({ error: 'Error parsing CSV', details: parsed.errors });
      }

      parsedData = parsed.data;
    } else if (fileExt === '.json') {
      // Parse JSON
      try {
        parsedData = JSON.parse(data);
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
      gstItems = parsedData.filter(order => order.refunds && order.refunds.length > 0).map((order, index) => {
        const customerName = `${order.customer.first_name} ${order.customer.last_name}`;
        const invoiceDate = order.created_at.split('T')[0];
        const invoiceNumber = order.name;
        const rtoDate = order.refunds[0].created_at.split('T')[0];
        const products = order.line_items.map(item => item.title).join(', ');
        const orderValue = order.line_items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
        const gstToReclaim = order.line_items.reduce((sum, item) => sum + item.tax_lines.reduce((taxSum, tax) => taxSum + parseFloat(tax.price), 0), 0);
        const province = order.shipping_address.province;
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

    // Save GST items to storage
    const storageKey = await saveGstItems(gstItems);
    res.json({ gstItems, storageKey });
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({ error: 'Failed to process file' });
  }
});

// GET endpoint to retrieve all GST items
app.get('/api/gst-items', async (req, res) => {
  try {
    const gstItems = await getGstItems();
    res.json({ gstItems });
  } catch (error) {
    console.error('Error retrieving GST items:', error);
    res.status(500).json({ error: 'Failed to retrieve GST items' });
  }
});

// PUT endpoint to update a GST item
app.put('/api/gst-items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, creditNoteNumber, creditNoteDate } = req.body;
    console.log('PUT /api/gst-items/:id called with id:', id, 'body:', req.body);

    if (process.env.NODE_ENV === 'production' && pool) {
      // Update in PostgreSQL pool
      const updateFields = [];
      const values = [id];
      let paramIndex = 2;

      if (status) {
        updateFields.push(`status = $${paramIndex++}`);
        values.push(status);
      }
      if (creditNoteNumber !== undefined) {
        updateFields.push(`credit_note_number = $${paramIndex++}`);
        values.push(creditNoteNumber);
      }
      if (creditNoteDate !== undefined) {
        updateFields.push(`credit_note_date = $${paramIndex++}`);
        values.push(creditNoteDate);
      }

      if (updateFields.length > 0) {
        updateFields.push('updated_at = NOW()');
        const query = `UPDATE gst_items SET ${updateFields.join(', ')} WHERE id = $1 RETURNING *`;
        const result = await pool.query(query, values);
        if (result.length === 0) {
          return res.status(404).json({ error: 'GST item not found' });
        }
        const row = result[0];
        const updatedItem = {
          id: row.id,
          customerName: row.customer_name,
          invoiceDate: row.invoice_date,
          invoiceNumber: row.invoice_number,
          rtoDate: row.rto_date,
          products: row.products,
          orderValue: parseFloat(row.order_value),
          gstToReclaim: parseFloat(row.gst_to_reclaim),
          placeOfSupply: row.place_of_supply,
          status: row.status,
          creditNoteNumber: row.credit_note_number,
          creditNoteDate: row.credit_note_date
        };
        console.log('Updated item in DB:', updatedItem);
        res.json(updatedItem);
      } else {
        // No fields to update, just return current item
        const result = await pool.query('SELECT * FROM gst_items WHERE id = $1', [id]);
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'GST item not found' });
        }
        const row = result.rows[0];
        res.json({
          id: row.id,
          customerName: row.customer_name,
          invoiceDate: row.invoice_date,
          invoiceNumber: row.invoice_number,
          rtoDate: row.rto_date,
          products: row.products,
          orderValue: parseFloat(row.order_value),
          gstToReclaim: parseFloat(row.gst_to_reclaim),
          placeOfSupply: row.place_of_supply,
          status: row.status,
          creditNoteNumber: row.credit_note_number,
          creditNoteDate: row.credit_note_date
        });
      }
    } else {
      // For local development, use in-memory and file
      if (inMemoryGstItems.length === 0) {
        await getGstItems();
      }

      const item = inMemoryGstItems.find(item => item.id === id);
      if (!item) {
        console.log('GST item not found for id:', id);
        return res.status(404).json({ error: 'GST item not found' });
      }
      console.log('Found item:', item);
      if (status) item.status = status;
      if (creditNoteNumber) item.creditNoteNumber = creditNoteNumber;
      if (creditNoteDate) item.creditNoteDate = creditNoteDate;
      console.log('Updated item:', item);

      await saveUpdatedGstItems();

      res.json(item);
    }
  } catch (error) {
    console.error('Error updating GST item:', error);
    res.status(500).json({ error: 'Failed to update GST item' });
  }
});

// DELETE endpoint to delete completed GST items
app.delete('/api/gst-items/completed', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production' && pool) {
      // Delete from PostgreSQL pool
      const result = await pool.query('DELETE FROM gst_items WHERE status = $1', ['Completed']);
      const deletedCount = result.rowCount;
      res.json({ message: `${deletedCount} completed GST items deleted successfully` });
    } else {
      // For local development, use in-memory and file
      if (inMemoryGstItems.length === 0) {
        await getGstItems();
      }

      const initialLength = inMemoryGstItems.length;
      inMemoryGstItems = inMemoryGstItems.filter(item => item.status !== 'Completed');
      const deletedCount = initialLength - inMemoryGstItems.length;

      if (deletedCount > 0) {
        await saveUpdatedGstItems();
        res.json({ message: `${deletedCount} completed GST items deleted successfully` });
      } else {
        res.json({ message: 'No completed GST items found to delete' });
      }
    }
  } catch (error) {
    console.error('Error deleting completed GST items:', error);
    res.status(500).json({ error: 'Failed to delete completed GST items' });
  }
});

// DELETE endpoint to delete a GST item
app.delete('/api/gst-items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await deleteGstItem(id);
    if (success) {
      res.json({ message: 'GST item deleted successfully' });
    } else {
      res.status(404).json({ error: 'GST item not found' });
    }
  } catch (error) {
    console.error('Error deleting GST item:', error);
    res.status(500).json({ error: 'Failed to delete GST item' });
  }
});

// DELETE endpoint to delete all GST items
app.delete('/api/gst-items', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production' && pool) {
      // Delete all from PostgreSQL pool
      await pool.query('DELETE FROM gst_items');
      res.json({ message: 'All GST items deleted successfully' });
    } else {
      // For local development, clear in-memory and file
      inMemoryGstItems = [];
      await saveUpdatedGstItems();
      res.json({ message: 'All GST items deleted successfully' });
    }
  } catch (error) {
    console.error('Error deleting all GST items:', error);
    res.status(500).json({ error: 'Failed to delete all GST items' });
  }
});

// Export for Vercel serverless
export default app;

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}