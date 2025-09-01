import React, { createContext, useState, useEffect, ReactNode } from 'react';
import {
    GstActionItem,
} from '../types';
import { mapShopifyOrderToGstActionItem, ShopifyOrder } from '../utils/shopifyMapper';
import {
  getGstData,
  uploadFile,
  processFile,
  updateGstItem,
  deleteGstItem as deleteGstItemApi,
  deleteAllGstItems,
  deleteCompletedGstItems,
} from '../services/apiService';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');

interface AppContextType {
  gstItems: GstActionItem[];
  loading: boolean;
  uploadAndProcessFile: (file: File) => Promise<void>;
  loadGstItemsFromFile: (filename: string) => Promise<void>;
  generateGstCreditNotes: (itemIds: string[]) => Promise<void>;
  deleteGstItem: (id: string) => Promise<void>;
  deleteAllGstItems: () => Promise<void>;
  deleteCompletedGstItems: () => Promise<void>;
}

export const AppContext = createContext<AppContextType>({
  gstItems: [],
  loading: false,
  uploadAndProcessFile: () => Promise.resolve(),
  loadGstItemsFromFile: () => Promise.resolve(),
  generateGstCreditNotes: () => Promise.resolve(),
  deleteAllGstItems: () => Promise.resolve(),
  deleteCompletedGstItems: () => Promise.resolve(),
});

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [gstItems, setGstItems] = useState<GstActionItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch existing GST data on app initialization
  useEffect(() => {
    const fetchExistingGstData = async () => {
      console.log('AppContext: Starting to fetch existing GST data for clean empty state');
      console.log('AppContext: API_BASE_URL:', API_BASE_URL);
      console.log('AppContext: import.meta.env.PROD:', import.meta.env.PROD);
      console.log('AppContext: import.meta.env.VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
      setLoading(true);
      try {
        console.log('AppContext: Calling getGstData');
        const existingItems = await getGstData();
        console.log('AppContext: Successfully fetched GST data, items count:', existingItems.length);
        if (existingItems.length === 0) {
          console.log('AppContext: Empty state confirmed - no existing GST items');
        }
        setGstItems(existingItems);
        console.log('AppContext: GST items set in state');
      } catch (error) {
        console.error('AppContext: Error fetching existing GST data:', error);
        console.error('AppContext: Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        // For empty state, set empty array instead of showing error
        console.log('AppContext: Setting empty array for clean empty state startup');
        setGstItems([]);
        toast.error('Failed to load existing GST data - starting with empty state');
      } finally {
        console.log('AppContext: Setting loading to false');
        setLoading(false);
      }
    };

    fetchExistingGstData();
  }, []);

  
  const generateGstCreditNotes = async (itemIds: string[]) => {
    console.log('generateGstCreditNotes called with itemIds:', itemIds);
    const currentDate = new Date().toISOString();
    let creditNoteCounter = gstItems.filter(item => item.status === 'Completed' && item.creditNoteNumber).length;
    console.log('Current credit note counter:', creditNoteCounter);

    const updatePromises = itemIds.map(async (id) => {
      creditNoteCounter++;
      const updates = {
        status: 'Completed' as const,
        creditNoteNumber: `CN-2425-${String(creditNoteCounter).padStart(3, '0')}`,
        creditNoteDate: currentDate,
      };
      console.log('Updating item', id, 'with:', updates);
      return updateGstItem(id, updates);
    });

    try {
      await Promise.all(updatePromises);
      // Refresh the data
      const updatedItems = await getGstData();
      setGstItems(updatedItems);
      toast.success(`Generated ${itemIds.length} credit note(s) successfully.`);
    } catch (error) {
      console.error('Error generating credit notes:', error);
      toast.error('Failed to generate credit notes.');
    }
  };

  const uploadAndProcessFile = async (file: File) => {
    console.log('AppContext: uploadAndProcessFile called with file:', file.name, 'size:', file.size, 'type:', file.type);
    try {
      console.log('AppContext: Attempting to read file content using FileReader (Safari-compatible)');
      const content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          console.log('AppContext: FileReader onload triggered');
          resolve(e.target?.result as string);
        };
        reader.onerror = (e) => {
          console.error('AppContext: FileReader error:', e);
          reject(new Error('Failed to read file'));
        };
        reader.readAsText(file);
      });
      console.log('AppContext: Successfully read file content, length:', content.length);
      console.log('AppContext: Calling processFile with content and filename');
      const processedData = await processFile(content, file.name);
      console.log('AppContext: processFile returned data, items count:', processedData.length);
      setGstItems(prev => [...prev, ...processedData]);
      console.log('AppContext: GST items updated in state');
      toast.success(`Processed ${processedData.length} GST action items from file.`);
    } catch (error) {
      console.error('AppContext: Error uploading and processing file:', error);
      console.error('AppContext: Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      toast.error('Failed to upload and process file. Please try again.');
    }
  };

  const loadGstItemsFromFile = async (filename: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/file/${filename}`);
      if (!response.ok) {
        throw new Error('Failed to fetch file');
      }
      const data = await response.json();
      const orders: ShopifyOrder[] = JSON.parse(data.content);
      const gstItems = orders.map(order => mapShopifyOrderToGstActionItem(order)).filter(item => item !== null) as GstActionItem[];
      setGstItems(gstItems);
      toast.success(`Loaded ${gstItems.length} GST action items from file.`);
    } catch (error) {
      console.error('Error loading GST items from file:', error);
      toast.error('Failed to load GST items from file. Please try again.');
    }
  };

  const deleteGstItem = async (id: string) => {
    try {
      await deleteGstItemApi(id);
      setGstItems(prev => prev.filter(item => item.id !== id));
      toast.success('GST item deleted successfully.');
    } catch (error) {
      console.error('Error deleting GST item:', error);
      toast.error('Failed to delete GST item. Please try again.');
    }
  };

  const deleteAllGstItemsFunc = async () => {
    console.log('deleteAllGstItemsFunc called');
    try {
      await deleteAllGstItems();
      setGstItems([]);
      toast.success('All GST items deleted successfully.');
    } catch (error) {
      console.error('Error deleting all GST items:', error);
      toast.error('Failed to delete all GST items. Please try again.');
    }
  };

  const deleteCompletedGstItemsFunc = async () => {
    try {
      await deleteCompletedGstItems();
      setGstItems(prev => prev.filter(item => item.status !== 'Completed'));
      toast.success('Completed GST items deleted successfully.');
    } catch (error) {
      console.error('Error deleting completed GST items:', error);
      toast.error('Failed to delete completed GST items. Please try again.');
    }
  };

  const value = {
    gstItems,
    loading,
    uploadAndProcessFile,
    loadGstItemsFromFile,
    generateGstCreditNotes,
    deleteGstItem,
    deleteAllGstItems: deleteAllGstItemsFunc,
    deleteCompletedGstItems: deleteCompletedGstItemsFunc,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
