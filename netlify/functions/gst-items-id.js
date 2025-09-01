const fs = require('fs');
const path = require('path');

const gstItemsFilePath = path.join(__dirname, '../../gst-items.json');

console.log('DEBUG: Using file-based storage at:', gstItemsFilePath);

exports.handler = async (event, context) => {
  const { id } = event.path.split('/').pop(); // Extract ID from path

  console.log('API /api/gst-items/[id] called with method:', event.httpMethod, 'id:', id);

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod === 'PUT') {
    try {
      console.log('PUT request body:', event.body);

      let requestBody;
      try {
        requestBody = JSON.parse(event.body);
      } catch (parseError) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS'
          },
          body: JSON.stringify({ error: 'Invalid JSON body' })
        };
      }

      const { status, creditNoteNumber, creditNoteDate } = requestBody;

      // Read existing items
      let gstItems = [];
      if (fs.existsSync(gstItemsFilePath)) {
        const data = fs.readFileSync(gstItemsFilePath, 'utf8');
        gstItems = JSON.parse(data);
      }

      // Find the item to update
      const itemIndex = gstItems.findIndex(item => item.id === id);
      if (itemIndex === -1) {
        return {
          statusCode: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS'
          },
          body: JSON.stringify({ error: 'GST item not found' })
        };
      }

      // Update the item
      const item = gstItems[itemIndex];
      if (status !== undefined) item.status = status;
      if (creditNoteNumber !== undefined) item.creditNoteNumber = creditNoteNumber;
      if (creditNoteDate !== undefined) item.creditNoteDate = creditNoteDate;
      item.updatedAt = new Date().toISOString();

      // Write back to file
      fs.writeFileSync(gstItemsFilePath, JSON.stringify(gstItems, null, 2));

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS'
        },
        body: JSON.stringify(item)
      };
    } catch (error) {
      console.error('Error updating GST item:', error);
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS'
        },
        body: JSON.stringify({ error: 'Failed to update GST item' })
      };
    }
  } else if (event.httpMethod === 'DELETE') {
    try {
      // Read existing items
      let gstItems = [];
      if (fs.existsSync(gstItemsFilePath)) {
        const data = fs.readFileSync(gstItemsFilePath, 'utf8');
        gstItems = JSON.parse(data);
      }

      const initialCount = gstItems.length;
      const remainingItems = gstItems.filter(item => item.id !== id);
      const deletedCount = initialCount - remainingItems.length;

      if (deletedCount === 0) {
        return {
          statusCode: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS'
          },
          body: JSON.stringify({ error: 'GST item not found' })
        };
      }

      // Write back to file
      fs.writeFileSync(gstItemsFilePath, JSON.stringify(remainingItems, null, 2));

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS'
        },
        body: JSON.stringify({ message: 'GST item deleted successfully' })
      };
    } catch (error) {
      console.error('Error deleting GST item:', error);
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS'
        },
        body: JSON.stringify({ error: 'Failed to delete GST item' })
      };
    }
  } else {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }
};