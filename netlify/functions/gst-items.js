const fs = require('fs');
const path = require('path');

const gstItemsFilePath = path.join(__dirname, '../../gst-items.json');

console.log('DEBUG: Using file-based storage at:', gstItemsFilePath);

exports.handler = async (event, context) => {
  console.log('API /api/gst-items called with method:', event.httpMethod);

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS'
      },
      body: ''
    };
  }

  try {
    if (event.httpMethod === 'GET') {
      console.log('getGstItems: Reading from file storage');
      try {
        let gstItems = [];
        if (fs.existsSync(gstItemsFilePath)) {
          console.log('GST items file exists, reading...');
          const data = fs.readFileSync(gstItemsFilePath, 'utf8');
          gstItems = JSON.parse(data);
          console.log(`Retrieved ${gstItems.length} GST items from file`);
        } else {
          console.log('GST items file does not exist, returning empty array');
        }

        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS'
          },
          body: JSON.stringify({ gstItems })
        };
      } catch (error) {
        console.error('Error reading GST items file:', error);
        return {
          statusCode: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS'
          },
          body: JSON.stringify({ error: 'Failed to read GST items from file' })
        };
      }
    } else if (event.httpMethod === 'DELETE') {
      console.log('Deleting all GST items from file storage');
      try {
        if (fs.existsSync(gstItemsFilePath)) {
          fs.writeFileSync(gstItemsFilePath, JSON.stringify([], null, 2));
          console.log('GST items file cleared successfully');
        } else {
          console.log('GST items file does not exist, nothing to delete');
        }
        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS'
          },
          body: JSON.stringify({ message: 'All GST items deleted successfully' })
        };
      } catch (error) {
        console.error('Error deleting GST items file:', error);
        return {
          statusCode: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS'
          },
          body: JSON.stringify({ error: 'Failed to delete GST items' })
        };
      }
    } else {
      return {
        statusCode: 405,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS'
        },
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }
  } catch (error) {
    console.error('Error in gst-items handler:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS'
      },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};