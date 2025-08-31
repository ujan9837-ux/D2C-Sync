import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import Papa from 'papaparse';
import dotenv from 'dotenv';
import { kv } from '@vercel/kv';

dotenv.config({ path: '.env.local' });

// Check if KV is available
let isKvAvailable = !!process.env.KV_URL;

// In-memory storage for GST items (fallback when no KV or file storage)
let inMemoryGstItems = [];

const storage = isKvAvailable ? multer.memoryStorage() : multer.diskStorage({
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
app.use(cors());
app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf; } })); // For webhook verification

// GST Item Storage Functions (using in-memory, KV, or local file)
async function saveGstItems(items) {
  try {
    // Always update in-memory storage
    inMemoryGstItems = [...inMemoryGstItems, ...items];
    console.log(`Saved ${items.length} GST items to in-memory storage`);

    if (isKvAvailable) {
      try {
        await kv.set('gst-items', inMemoryGstItems);
        console.log(`Saved GST items to KV`);
        return 'gst-items';
      } catch (kvError) {
        console.warn('KV not available, using in-memory only:', kvError.message);
        isKvAvailable = false; // Disable KV for future calls
      }
    }

    // For local development, also save to file
    if (process.env.NODE_ENV !== 'production') {
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
    // If in-memory has items, return them
    if (inMemoryGstItems.length > 0) {
      return inMemoryGstItems;
    }

    if (isKvAvailable) {
      try {
        const items = await kv.get('gst-items') || [];
        inMemoryGstItems = items; // Load into memory
        return items;
      } catch (kvError) {
        console.warn('KV not available, falling back to local storage:', kvError.message);
        isKvAvailable = false; // Disable KV for future calls
      }
    }

    // For local development, load from file
    if (process.env.NODE_ENV !== 'production') {
      const filePath = 'gst-items.json';
      if (fs.existsSync(filePath)) {
        const data = await fs.promises.readFile(filePath, 'utf8');
        inMemoryGstItems = JSON.parse(data);
        return inMemoryGstItems;
      }
    }

    return [];
  } catch (error) {
    console.error('Error retrieving GST items:', error);
    throw error;
  }
}

async function saveUpdatedGstItems() {
  try {
    if (isKvAvailable) {
      try {
        await kv.set('gst-items', inMemoryGstItems);
        console.log(`Saved updated GST items to KV`);
      } catch (kvError) {
        console.warn('KV not available, using in-memory only:', kvError.message);
        isKvAvailable = false; // Disable KV for future calls
      }
    }

    // For local development, also save to file
    if (process.env.NODE_ENV !== 'production') {
      const filePath = 'gst-items.json';
      await fs.promises.writeFile(filePath, JSON.stringify(inMemoryGstItems, null, 2));
      console.log(`Saved updated GST items to local file`);
    }
  } catch (error) {
    console.error('Error saving updated GST items:', error);
    throw error;
  }
}

async function deleteGstItem(itemId) {
  try {
    // Update in-memory storage
    const initialLength = inMemoryGstItems.length;
    inMemoryGstItems = inMemoryGstItems.filter(item => item.id !== itemId);
    const deleted = inMemoryGstItems.length < initialLength;
    if (deleted) {
      console.log(`Deleted GST item ${itemId} from in-memory storage`);
      // Save updated items to persistent storage
      await saveUpdatedGstItems();
    }

    return deleted;
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

  // If using KV and memory storage, save file content to KV
  if (isKvAvailable) {
    try {
      await kv.set('upload:' + req.file.filename, req.file.buffer);
    } catch (kvError) {
      console.warn('Failed to save upload to KV:', kvError.message);
      return res.status(500).send('Failed to save file.');
    }
  }

  res.json({
    filename: req.file.filename,
    path: req.file.path || null // Path is null for memory storage
  });
});

// GET endpoint to list uploaded files
app.get('/api/uploads', (req, res) => {
  fs.readdir('uploads/', (err, files) => {
    if (err) {
      return res.status(500).send('Unable to scan directory.');
    }
    res.json(files);
  });
});

// GET endpoint to retrieve file content
app.get('/api/file/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join('uploads', filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Error reading file' });
    }
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

    // Save GST items to KV
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

    // Ensure data is loaded
    if (inMemoryGstItems.length === 0) {
      await getGstItems();
    }

    const item = inMemoryGstItems.find(item => item.id === id);
    if (!item) {
      return res.status(404).json({ error: 'GST item not found' });
    }
    if (status) item.status = status;
    if (creditNoteNumber) item.creditNoteNumber = creditNoteNumber;
    if (creditNoteDate) item.creditNoteDate = creditNoteDate;

    // Save updated items to persistent storage
    await saveUpdatedGstItems();

    res.json(item);
  } catch (error) {
    console.error('Error updating GST item:', error);
    res.status(500).json({ error: 'Failed to update GST item' });
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
    inMemoryGstItems = [];
    // Save updated (empty) items to persistent storage
    await saveUpdatedGstItems();
    res.json({ message: 'All GST items deleted successfully' });
  } catch (error) {
    console.error('Error deleting all GST items:', error);
    res.status(500).json({ error: 'Failed to delete all GST items' });
  }
});

// DELETE endpoint to delete completed GST items
app.delete('/api/gst-items/completed', async (req, res) => {
  try {
    const initialLength = inMemoryGstItems.length;
    inMemoryGstItems = inMemoryGstItems.filter(item => item.status !== 'Completed');
    const deletedCount = initialLength - inMemoryGstItems.length;

    if (deletedCount > 0) {
      // Save updated items to persistent storage
      await saveUpdatedGstItems();
      res.json({ message: `${deletedCount} completed GST items deleted successfully` });
    } else {
      res.json({ message: 'No completed GST items found to delete' });
    }
  } catch (error) {
    console.error('Error deleting completed GST items:', error);
    res.status(500).json({ error: 'Failed to delete completed GST items' });
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