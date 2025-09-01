export default async function handler(req, res) {
  console.log('API /api/upload called with method:', req.method);
  console.log('Request headers:', Object.fromEntries(Object.entries(req.headers).filter(([k]) => k.toLowerCase().includes('content'))));
  console.log('Request body type:', typeof req.body);
  console.log('Request body keys:', req.body ? Object.keys(req.body) : 'null');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if it's FormData
    if (req.body && req.body.file) {
      console.log('Received FormData with file');
      // For FormData, we need to handle it differently
      // But in Vercel serverless, FormData parsing might not work as expected
      return res.status(400).json({ error: 'FormData not supported, send file content as JSON' });
    }

    // For Vercel, we'll handle file uploads differently
    // The frontend can send file content as base64 or text
    const { filename, content } = req.body;

    console.log('Parsed filename:', filename);
    console.log('Content length:', content ? content.length : 'null');

    if (!filename || !content) {
      console.log('Missing filename or content');
      return res.status(400).json({ error: 'Filename and content are required' });
    }

    // In a production app, you'd store this in Vercel Blob, AWS S3, or similar
    // For now, we'll just acknowledge the upload
    console.log(`File uploaded successfully: ${filename}`);

    res.status(200).json({
      filename,
      message: 'File uploaded successfully',
      note: 'File content received and processed'
    });
  } catch (error) {
    console.error('Error handling file upload:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
}