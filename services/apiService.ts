import { GstActionItem } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');

// Removed mock data for clean empty state startup

export const getGstData = async (): Promise<GstActionItem[]> => {
  console.log('getGstData: Attempting to fetch from API_BASE_URL:', API_BASE_URL);
  const url = `${API_BASE_URL}/api/gst-items`;
  console.log('getGstData: Full URL:', url);
  try {
    console.log('getGstData: Making fetch request...');
    const response = await fetch(url);
    console.log('getGstData: Fetch response received');
    console.log('getGstData: Fetch response status:', response.status, 'ok:', response.ok);
    console.log('getGstData: Response headers:', Object.fromEntries(response.headers.entries()));
    if (!response.ok) {
      throw new Error(`Failed to fetch GST data: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    console.log('getGstData: Successfully fetched data, gstItems count:', data.gstItems ? data.gstItems.length : 0);
    return data.gstItems || [];
  } catch (error) {
    console.error('getGstData: Error fetching GST data:', error);
    console.error('getGstData: Error type:', error.constructor.name);
    console.error('getGstData: Error message:', error.message);
    console.log('getGstData: Server unavailable, but NOT falling back to mock data for clean empty state');
    // For empty state, do not fallback to mock data - return empty array
    return [];
  }
};

export const uploadFile = async (file: File): Promise<string> => {
  console.log('apiService: uploadFile called with file:', file.name, 'size:', file.size);

  try {
    // Read file content as text
    const content = await file.text();
    console.log('apiService: File content read, length:', content.length);

    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename: file.name,
        content: content,
      }),
    });

    console.log('apiService: Upload fetch response status:', response.status, 'ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('apiService: Upload failed with response:', errorText);
      throw new Error('Failed to upload file');
    }

    const data = await response.json();
    console.log('apiService: Upload response:', data);
    return data.filename;
  } catch (error) {
    console.error('apiService: Error in uploadFile:', error);
    throw error;
  }
};

export const processFile = async (content: string, filename: string): Promise<GstActionItem[]> => {
  console.log('apiService: processFile called with filename:', filename, 'content length:', content.length);
  console.log('apiService: API_BASE_URL:', API_BASE_URL);
  try {
    console.log('apiService: Making fetch request to /api/process-file');
    const response = await fetch(`${API_BASE_URL}/api/process-file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content, filename }),
    });

    console.log('apiService: Fetch response status:', response.status, 'ok:', response.ok);

    if (!response.ok) {
      console.error('apiService: Response not ok, status:', response.status, 'statusText:', response.statusText);
      throw new Error('Failed to process file');
    }

    console.log('apiService: Parsing response JSON');
    const data = await response.json();
    console.log('apiService: Response data:', data);
    console.log('apiService: Returning gstItems, count:', data.gstItems ? data.gstItems.length : 'undefined');
    return data.gstItems;
  } catch (error) {
    console.error('apiService: Error in processFile:', error);
    throw error;
  }
};

export const updateGstItem = async (id: string, updates: Partial<GstActionItem>): Promise<GstActionItem> => {
  console.log('updateGstItem called with id:', id, 'updates:', updates);
  const response = await fetch(`${API_BASE_URL}/api/gst-items/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    console.error('Failed to update GST item, response status:', response.status);
    throw new Error('Failed to update GST item');
  }

  const result = await response.json();
  console.log('updateGstItem result:', result);
  return result;
};

export const deleteGstItem = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/gst-items/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete GST item');
  }
};

export const deleteAllGstItems = async (): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/gst-items`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete all GST items');
  }
};

export const deleteCompletedGstItems = async (): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/gst-items/completed`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete completed GST items');
  }
};
