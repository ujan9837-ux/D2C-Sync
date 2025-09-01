const Papa = require('papaparse');
const fs = require('fs');
const path = require('path');

const gstItemsFilePath = path.join(__dirname, '../../gst-items.json');

console.log('DEBUG: Using file-based storage at:', gstItemsFilePath);

exports.handler = async (event, context) => {
  console.log('API /api/process-file called with method:', event.httpMethod);

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    let requestBody;
    try {
      requestBody = JSON.parse(event.body);
    } catch (parseError) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        },
        body: JSON.stringify({ error: 'Invalid JSON body' })
      };
    }

    const { content, filename } = requestBody;
    console.log('Processing file:', filename, 'content length:', content ? content.length : 'null');

    if (!content) {
      console.error('File content is required but not provided');
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        },
        body: JSON.stringify({ error: 'File content is required' })
      };
    }

    if (!filename) {
      console.error('Filename is required but not provided');
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        },
        body: JSON.stringify({ error: 'Filename is required' })
      };
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
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
          },
          body: JSON.stringify({ error: 'Error parsing CSV', details: parsed.errors })
        };
      }

      parsedData = parsed.data;
    } else if (fileExt === 'json') {
      console.log('DEBUG: Attempting to parse JSON content');
      try {
        parsedData = JSON.parse(content);
        console.log('DEBUG: JSON parsed successfully, type:', typeof parsedData, 'isArray:', Array.isArray(parsedData));
        if (!Array.isArray(parsedData)) {
          console.log('DEBUG: Parsed data is not an array, returning error');
          return {
            statusCode: 400,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': 'Content-Type',
              'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
            },
            body: JSON.stringify({ error: 'JSON file must contain an array of objects' })
          };
        }
      } catch (parseErr) {
        console.log('DEBUG: JSON parsing failed with error:', parseErr.message);
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
          },
          body: JSON.stringify({ error: 'Error parsing JSON', details: parseErr.message })
        };
      }
    } else {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        },
        body: JSON.stringify({ error: 'Unsupported file type. Only .csv and .json files are supported.' })
      };
    }

    // Transform to GST action items
    console.log('DEBUG: Starting data transformation, parsedData length:', parsedData.length);
    let gstItems;
    if (parsedData.length > 0 && parsedData[0].customer && parsedData[0].line_items) {
      console.log('DEBUG: Detected Shopify format');
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
          console.log(`DEBUG: Processing Shopify order ${index + 1}/${parsedData.length}, has refunds:`, !!order.refunds);
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
      console.log('DEBUG: Shopify transformation complete, gstItems count:', gstItems.length);
    } else {
      console.log('DEBUG: Using standard format transformation');
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
      console.log('DEBUG: Standard format transformation complete, gstItems count:', gstItems.length);
    }

    // Save to JSON file
    if (gstItems.length > 0) {
      console.log(`Saving ${gstItems.length} GST items to file storage`);
      try {
        let existingItems = [];
        if (fs.existsSync(gstItemsFilePath)) {
          console.log('Reading existing GST items from file');
          const data = fs.readFileSync(gstItemsFilePath, 'utf8');
          existingItems = JSON.parse(data);
          console.log(`Found ${existingItems.length} existing items`);
        } else {
          console.log('No existing GST items file, creating new one');
        }

        // Append new items
        const allItems = existingItems.concat(gstItems);
        console.log(`Writing ${allItems.length} total items to file`);

        fs.writeFileSync(gstItemsFilePath, JSON.stringify(allItems, null, 2));
        console.log('All items saved successfully to file');
      } catch (fileError) {
        console.error('Error saving to file:', fileError);
        return {
          statusCode: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
          },
          body: JSON.stringify({
            error: 'File storage error',
            details: 'Failed to save GST items to file system',
            troubleshooting: 'Check file system permissions and disk space'
          })
        };
      }
    } else {
      console.log('No GST items to save');
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify({ gstItems, message: `${gstItems.length} GST items processed successfully` })
    };
  } catch (error) {
    console.error('Error processing file:', error);
    console.error('Error stack:', error.stack);

    // Provide more specific error messages based on error type
    let errorMessage = 'Failed to process file';
    let errorDetails = error.message;

    if (error.message && error.message.includes('JSON')) {
      errorMessage = 'JSON parsing error';
      errorDetails = 'The uploaded file contains invalid JSON. Please check the file format.';
    } else if (error.code === 'ENOENT') {
      errorMessage = 'File system error';
      errorDetails = 'Unable to access file system for storage.';
    }

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify({
        error: errorMessage,
        details: errorDetails,
        troubleshooting: 'Check the uploaded file format and file system permissions'
      })
    };
  }
};