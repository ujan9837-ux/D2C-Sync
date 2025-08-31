import React, { createContext, useState, useEffect, ReactNode } from 'react';
import {
    GstActionItem,
} from '../types';
import { mapShopifyOrderToGstActionItem, ShopifyOrder } from '../utils/shopifyMapper';
import {
    getGstData,
    uploadFile,
    processFile,
} from '../services/apiService';
import toast from 'react-hot-toast';

interface AppContextType {
  gstItems: GstActionItem[];
  loading: boolean;
  uploadAndProcessFile: (file: File) => Promise<void>;
  loadGstItemsFromFile: (filename: string) => Promise<void>;
  generateGstCreditNotes: (itemIds: string[]) => Promise<void>;
}

export const AppContext = createContext<AppContextType>({
  gstItems: [],
  loading: false,
  uploadAndProcessFile: () => Promise.resolve(),
  loadGstItemsFromFile: () => Promise.resolve(),
  generateGstCreditNotes: () => Promise.resolve(),
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
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

    const currentDate = new Date().toISOString();
    let creditNoteCounter = gstItems.filter(item => item.status === 'Completed' && item.creditNoteNumber).length;

    const updatedGstItems = gstItems.map(item => {
      if (itemIds.includes(item.id)) {
        creditNoteCounter++;
        return {
          ...item,
          status: 'Completed' as const,
          creditNoteNumber: `CN-2425-${String(creditNoteCounter).padStart(3, '0')}`,
          creditNoteDate: currentDate,
        };
      }
      return item;
    });
    setGstItems(updatedGstItems);
    toast.success(`Generated ${itemIds.length} credit note(s) successfully.`);
  };

  const uploadAndProcessFile = async (file: File) => {
    try {
      const filename = await uploadFile(file);
      const processedData = await processFile(filename);
      setGstItems(prev => [...prev, ...processedData]);
      toast.success(`Processed ${processedData.length} GST action items from file.`);
    } catch (error) {
      console.error('Error uploading and processing file:', error);
      toast.error('Failed to upload and process file. Please try again.');
    }
  };

  const loadGstItemsFromFile = async (filename: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/file/${filename}`);
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

  const value = {
    gstItems,
    loading,
    uploadAndProcessFile,
    loadGstItemsFromFile,
    generateGstCreditNotes,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
