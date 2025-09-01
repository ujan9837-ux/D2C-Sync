const fs = require('fs');
const path = require('path');

const gstItemsFilePath = path.join(__dirname, '../../gst-items.json');

console.log('DEBUG: Using file-based storage at:', gstItemsFilePath);

exports.handler = async (event, context) => {
  console.log('API /api/gst-items/completed called with method:', event.httpMethod);

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'DELETE, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'DELETE') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'DELETE, OPTIONS'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('Deleting completed GST items from file storage');
    let gstItems = [];
    if (fs.existsSync(gstItemsFilePath)) {
      console.log('GST items file exists, reading...');
      const data = fs.readFileSync(gstItemsFilePath, 'utf8');
      gstItems = JSON.parse(data);
      console.log(`Found ${gstItems.length} GST items`);
    } else {
      console.log('GST items file does not exist');
    }

    const initialCount = gstItems.length;
    const remainingItems = gstItems.filter(item => item.status !== 'Completed');
    const deletedCount = initialCount - remainingItems.length;

    if (deletedCount > 0) {
      fs.writeFileSync(gstItemsFilePath, JSON.stringify(remainingItems, null, 2));
      console.log(`Deleted ${deletedCount} completed GST items`);
    } else {
      console.log('No completed GST items to delete');
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'DELETE, OPTIONS'
      },
      body: JSON.stringify({
        message: `${deletedCount} completed GST items deleted successfully`
      })
    };
  } catch (error) {
    console.error('Error deleting completed GST items:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'DELETE, OPTIONS'
      },
      body: JSON.stringify({ error: 'Failed to delete completed GST items' })
    };
  }
};