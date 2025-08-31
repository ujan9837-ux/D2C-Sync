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
const PORT = 3001;
const SHOPIFY_WEBHOOK_SECRET = 'your-shopify-webhook-secret-here'; // Replace with actual secret in production

// Middleware
app.use(cors());
app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf; } })); // For webhook verification

// GST Item Storage Functions (using local file for testing)
const GST_STORAGE_FILE = 'gst_items.json';

async function saveGstItems(items) {
  try {
    let allItems = [];
    if (fs.existsSync(GST_STORAGE_FILE)) {
      try {
        const data = await fs.promises.readFile(GST_STORAGE_FILE, 'utf8');
        allItems = JSON.parse(data);
      } catch (parseError) {
        console.log('Existing data is not valid JSON, starting with empty array');
        allItems = [];
      }
    }
    allItems.push(...items);
    await fs.promises.writeFile(GST_STORAGE_FILE, JSON.stringify(allItems, null, 2));
    console.log(`Saved ${items.length} GST items to ${GST_STORAGE_FILE}`);
    return GST_STORAGE_FILE;
  } catch (error) {
    console.error('Error saving GST items:', error);
    throw error;
  }
}

async function getGstItems() {
  try {
    if (!fs.existsSync(GST_STORAGE_FILE)) return [];
    const data = await fs.promises.readFile(GST_STORAGE_FILE, 'utf8');
    try {
      return JSON.parse(data);
    } catch (parseError) {
      console.log('Stored data is not valid JSON, returning empty array');
      return [];
    }
  } catch (error) {
    console.error('Error retrieving GST items:', error);
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
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  res.json({
    filename: req.file.filename,
    path: req.file.path
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
  const { filename } = req.body;

  if (!filename) {
    return res.status(400).json({ error: 'Filename is required' });
  }

  const filePath = path.join('uploads', filename);
  const fileExt = path.extname(filename).toLowerCase();

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  // Read file content
  try {
    const data = await fs.promises.readFile(filePath, 'utf8');

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

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});