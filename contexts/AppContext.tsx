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
      setLoading(true);
      try {
        const existingItems = await getGstData();
        setGstItems(existingItems);
      } catch (error) {
        console.error('Error fetching existing GST data:', error);
        toast.error('Failed to load existing GST data');
      } finally {
        setLoading(false);
      }
    };

    fetchExistingGstData();
  }, []);

  
  const generateGstCreditNotes = async (itemIds: string[]) => {
    const currentDate = new Date().toISOString();
    let creditNoteCounter = gstItems.filter(item => item.status === 'Completed' && item.creditNoteNumber).length;

    const updatePromises = itemIds.map(async (id) => {
      creditNoteCounter++;
      const updates = {
        status: 'Completed' as const,
        creditNoteNumber: `CN-2425-${String(creditNoteCounter).padStart(3, '0')}`,
        creditNoteDate: currentDate,
      };
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
    try {
      const content = await file.text();
      const processedData = await processFile(content, file.name);
      setGstItems(prev => [...prev, ...processedData]);
      toast.success(`Processed ${processedData.length} GST action items from file.`);
    } catch (error) {
      console.error('Error uploading and processing file:', error);
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
