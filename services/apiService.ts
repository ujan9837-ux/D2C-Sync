import { GstActionItem } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// --- MOCK DATA GENERATION ---

// GST Automation Hub Data
const mockGstItems: GstActionItem[] = [
  { id: 'gst1', customerName: 'Rohan Sharma', invoiceDate: '2024-04-28', invoiceNumber: 'INV-2425-00123', rtoDate: '2024-05-02', products: 'T-Shirt, Cap', orderValue: 1299, gstToReclaim: 233.82, placeOfSupply: '27-Maharashtra', status: 'Pending' },
  { id: 'gst2', customerName: 'Priya Gupta', invoiceDate: '2024-04-30', invoiceNumber: 'INV-2425-00124', rtoDate: '2024-05-05', products: 'Hoodie', orderValue: 1999, gstToReclaim: 359.82, placeOfSupply: '07-Delhi', status: 'Pending' },
  { id: 'gst3', customerName: 'Amit Patel', invoiceDate: '2024-05-01', invoiceNumber: 'INV-2425-00125', rtoDate: '2024-05-06', products: 'Sneakers', orderValue: 2499, gstToReclaim: 449.82, placeOfSupply: '24-Gujarat', status: 'Pending' },
  { id: 'gst4', customerName: 'Sneha Singh', invoiceDate: '2024-03-25', invoiceNumber: 'INV-2324-08991', rtoDate: '2024-04-02', products: 'Jeans', orderValue: 2199, gstToReclaim: 395.82, placeOfSupply: '09-Uttar Pradesh', status: 'Completed', creditNoteNumber: 'CN-2425-001', creditNoteDate: '2024-04-05' },
  { id: 'gst5', customerName: 'Vikram Kumar', invoiceDate: '2024-03-28', invoiceNumber: 'INV-2324-09102', rtoDate: '2024-04-04', products: 'Watch', orderValue: 3499, gstToReclaim: 629.82, placeOfSupply: '29-Karnataka', status: 'Completed', creditNoteNumber: 'CN-2425-002', creditNoteDate: '2024-04-08' },
];


// --- MOCK API FUNCTIONS ---
const mockFetch = <T>(data: T, delay: number = 300): Promise<T> => new Promise(resolve => setTimeout(() => resolve(data), delay));

export const getGstData = async (): Promise<GstActionItem[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/gst-items`);
    if (!response.ok) {
      throw new Error('Failed to fetch GST data');
    }
    const data = await response.json();
    return data.gstItems || [];
  } catch (error) {
    console.error('Error fetching GST data:', error);
    // Fallback to mock data if server is unavailable
    return mockFetch(mockGstItems);
  }
};

export const uploadFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload file');
  }

  const data = await response.json();
  return data.filename;
};

export const processFile = async (content: string, filename: string): Promise<GstActionItem[]> => {
  const response = await fetch(`${API_BASE_URL}/api/process-file`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content, filename }),
  });

  if (!response.ok) {
    throw new Error('Failed to process file');
  }

  const data = await response.json();
  return data.gstItems;
};

export const updateGstItem = async (id: string, updates: Partial<GstActionItem>): Promise<GstActionItem> => {
  const response = await fetch(`${API_BASE_URL}/api/gst-items/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error('Failed to update GST item');
  }

  return await response.json();
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
