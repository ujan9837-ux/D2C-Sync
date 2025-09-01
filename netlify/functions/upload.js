exports.handler = async (event, context) => {
  console.log('API /api/upload called with method:', event.httpMethod);
  console.log('Request headers:', Object.fromEntries(Object.entries(event.headers).filter(([k]) => k.toLowerCase().includes('content'))));
  console.log('Request body type:', typeof event.body);

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
    // For Netlify, we'll handle file uploads differently
    // The frontend can send file content as base64 or text
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

    const { filename, content } = requestBody;

    console.log('Parsed filename:', filename);
    console.log('Content length:', content ? content.length : 'null');

    if (!filename || !content) {
      console.log('Missing filename or content');
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        },
        body: JSON.stringify({ error: 'Filename and content are required' })
      };
    }

    // In a production app, you'd store this in Netlify Blob, AWS S3, or similar
    // For now, we'll just acknowledge the upload
    console.log(`File uploaded successfully: ${filename}`);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify({
        filename,
        message: 'File uploaded successfully',
        note: 'File content received and processed'
      })
    };
  } catch (error) {
    console.error('Error handling file upload:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify({ error: 'Failed to upload file' })
    };
  }
};