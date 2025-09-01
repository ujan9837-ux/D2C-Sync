const fs = require('fs');
const path = require('path');

const gstItemsFilePath = path.join(__dirname, '../../gst-items.json');

exports.handler = async (event, context) => {
  console.log('API /api/test-db called (now testing file storage)');

  const diagnostics = {
    environment: {
      gstItemsFilePath: gstItemsFilePath,
      fileExists: fs.existsSync(gstItemsFilePath)
    },
    storage: null,
    error: null
  };

  try {
    // Test file access
    diagnostics.storage = { fileAccess: 'successful' };

    if (diagnostics.environment.fileExists) {
      const data = fs.readFileSync(gstItemsFilePath, 'utf8');
      const gstItems = JSON.parse(data);
      diagnostics.storage.itemCount = gstItems.length;
      diagnostics.storage.sampleItem = gstItems.length > 0 ? gstItems[0] : null;
      console.log(`File storage test successful: ${gstItems.length} items found`);
    } else {
      diagnostics.storage.message = 'GST items file does not exist, will be created on first write';
      console.log('File storage test: file does not exist yet');
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify(diagnostics)
    };
  } catch (error) {
    diagnostics.error = error.message;
    diagnostics.storage = { fileAccess: 'failed' };
    console.error('File storage test failed:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify(diagnostics)
    };
  }
};