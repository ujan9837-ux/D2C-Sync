import React, { useState, useMemo, useContext, useRef, useEffect } from 'react';
import Card from '../components/ui/Card';
import { GstActionItem } from '../types';
import { AppContext } from '../contexts/AppContext';
import Button from '../components/ui/Button';
import { Checkbox } from '../components/ui/Checkbox';
import toast from 'react-hot-toast';
import { exportToCsv } from '../utils/reportUtils';
import { ArrowPathIcon, DocumentArrowDownIcon, ChevronUpIcon, ChevronDownIcon, ChevronUpDownIcon, XMarkIcon } from '../components/icons/Icons';

type SortableKeys = 'customerName' | 'originalInvoiceDate' | 'rtoDate' | 'orderValue' | 'gstToReclaim';

const GstAutomationHub: React.FC = () => {
    const { gstItems, generateGstCreditNotes, loading, uploadAndProcessFile, deleteGstItem, deleteAllGstItems, deleteCompletedGstItems } = useContext(AppContext);
    const [activeTab, setActiveTab] = useState<'Pending' | 'Completed'>('Pending');
    const [selectedItems, setSelectedItems] = useState(new Set<string>());
    const [processingItems, setProcessingItems] = useState(new Set<string>());
    const [sortConfig, setSortConfig] = useState<{ key: SortableKeys | null; direction: 'ascending' | 'descending' }>({ key: null, direction: 'ascending' });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const getAllPendingIds = () => gstItems.filter(item => item.status === 'Pending').map(item => item.id);

    useEffect(() => {
        if (activeTab === 'Pending') {
            setSelectedItems(new Set(getAllPendingIds()));
        }
    }, [gstItems, activeTab]);

    const filteredItems = useMemo(() => gstItems.filter(item => {
        if (activeTab === 'Pending') return item.status === 'Pending' || item.status === 'In Process';
        if (activeTab === 'Completed') return item.status === 'Completed';
        return false;
    }), [gstItems, activeTab]);

    const sortedItems = useMemo(() => {
        let sortableItems = [...filteredItems];
        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                const valA = a[sortConfig.key!];
                const valB = b[sortConfig.key!];

                if (valA < valB) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (valA > valB) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [filteredItems, sortConfig]);

    const requestSort = (key: SortableKeys) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handleImportData = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            await uploadAndProcessFile(file);
        }
    };

    const handleSelectItem = (itemId: string) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemId)) {
                newSet.delete(itemId);
            } else {
                newSet.add(itemId);
            }
            return newSet;
        });
    };
    
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const allPendingIds = filteredItems
                .filter(item => item.status === 'Pending')
                .map(item => item.id);
            setSelectedItems(new Set(allPendingIds));
        } else {
            setSelectedItems(new Set());
        }
    };

    const isAllSelected = useMemo(() => {
        const pendingItems = filteredItems.filter(i => i.status === 'Pending');
        return pendingItems.length > 0 && pendingItems.every(item => selectedItems.has(item.id));
    }, [selectedItems, filteredItems]);

    const handleGenerateCreditNotes = async (itemIds: string[]) => {
        const itemsToProcess = itemIds.filter(id => !processingItems.has(id));
        if (itemsToProcess.length === 0) return;

        setProcessingItems(prev => new Set([...prev, ...itemsToProcess]));

        const promise = generateGstCreditNotes(itemsToProcess);

        toast.promise(promise, {
            loading: `Generating ${itemsToProcess.length} credit note(s)...`,
            success: () => {
                setProcessingItems(prev => {
                    const newSet = new Set(prev);
                    itemsToProcess.forEach(id => newSet.delete(id));
                    return newSet;
                });
                setSelectedItems(new Set());
                return `${itemsToProcess.length} credit note(s) generated!`;
            },
            error: () => {
                 setProcessingItems(prev => {
                    const newSet = new Set(prev);
                    itemsToProcess.forEach(id => newSet.delete(id));
                    return newSet;
                });
                return "Some items failed to generate.";
            }
        });
    };
    
    const handleExport = async () => {
        if(sortedItems.length === 0) {
            toast.error("No data to export.");
            return;
        }

        const formatDate = (dateString?: string): string => {
            if (!dateString) return '';
            const date = new Date(dateString);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}-${month}-${year}`;
        };

        const gstr1Data = sortedItems.map(item => {
            const taxableValue = item.orderValue;
            const noteValue = item.orderValue + item.gstToReclaim;
            // Handle division by zero just in case
            const rate = taxableValue > 0 ? Math.round((item.gstToReclaim / taxableValue) * 100) : 0;
            
            return {
                'UR Type': 'B2CS',
                'Note/Refund Voucher Number': item.creditNoteNumber || '',
                'Note/Refund Voucher date': formatDate(item.creditNoteDate),
                'Document Type': 'C',
                'Original Invoice Number': item.originalInvoiceNumber,
                'Original Invoice date': formatDate(item.originalInvoiceDate),
                'Reason For Issuing Document': 'Sales Return',
                'Place Of Supply': item.placeOfSupply,
                'Note/Refund Voucher Value': noteValue.toFixed(2),
                'Rate': rate,
                'Taxable Value': taxableValue.toFixed(2),
                'Cess Amount': '0.00',
                'Pre GST': 'N'
            };
        });
        
        const today = new Date().toISOString().slice(0, 10);
        exportToCsv(`gstr1-cdnur-export-${today}.csv`, gstr1Data);
        toast.success("Export successful! The CSV is formatted for the GSTN Returns Offline Tool.");
        await deleteCompletedGstItems();
    }

    const handleExportZoho = async () => {
        if (sortedItems.length === 0) {
            toast.error("No data to export.");
            return;
        }

        const zohoData = sortedItems.map(item => ({
            'Customer Name': item.customerName,
            'Invoice Number': item.originalInvoiceNumber,
            'Invoice Date': item.originalInvoiceDate,
            'RTO Date': item.rtoDate,
            'Order Value': item.orderValue,
            'GST To Reclaim': item.gstToReclaim,
            'Status': item.status,
        }));

        const today = new Date().toISOString().slice(0, 10);
        exportToCsv(`zoho-books-export-${today}.csv`, zohoData);
        toast.success("Export successful for Zoho Books!");
        await deleteCompletedGstItems();
    }

    const handleExportKhatabook = async () => {
        if (sortedItems.length === 0) {
            toast.error("No data to export.");
            return;
        }

        const khatabookData = sortedItems.map(item => ({
            'Customer': item.customerName,
            'Invoice': item.originalInvoiceNumber,
            'Date': item.originalInvoiceDate,
            'Amount': item.orderValue,
            'GST Reclaim': item.gstToReclaim,
        }));

        const today = new Date().toISOString().slice(0, 10);
        exportToCsv(`khatabook-export-${today}.csv`, khatabookData);
        toast.success("Export successful for Khatabook!");
        await deleteCompletedGstItems();
    }

    const handleDeleteAllCompleted = async () => {
        if (window.confirm('Are you sure you want to delete all completed GST items? This action cannot be undone.')) {
            await deleteCompletedGstItems();
        }
    };

    const handleDeleteItem = async (itemId: string) => {
        if (window.confirm('Are you sure you want to delete this GST item? This action cannot be undone.')) {
            await deleteGstItem(itemId);
        }
    };
    
    const StatusBadge: React.FC<{ status: GstActionItem['status'] }> = ({ status }) => {
        const colorClasses: { [key in GstActionItem['status']]: string } = {
            'Pending': 'text-warning',
            'In Process': 'text-warning',
            'Completed': 'text-success'
        };
        return <span className={`text-xs font-semibold ${colorClasses[status]}`}>{status}</span>;
    };

    const SortIndicator = ({ sortKey }: { sortKey: SortableKeys }) => {
        if (sortConfig.key !== sortKey) {
            return <ChevronUpDownIcon className="w-4 h-4 text-light-grey opacity-0 group-hover:opacity-100 transition-opacity" />;
        }
        if (sortConfig.direction === 'ascending') {
            return <ChevronUpIcon className="w-4 h-4 text-charcoal" />;
        }
        return <ChevronDownIcon className="w-4 h-4 text-charcoal" />;
    };

    return (
        <div className="container mx-auto">
            <h2 className="text-3xl sm:text-4xl font-light mb-6 text-charcoal">GST Automation Hub</h2>
            <Card>
                <div className="border-b border-gray-200 mb-4">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button
                            onClick={() => { setActiveTab('Pending'); setSelectedItems(new Set(getAllPendingIds())); }}
                            className={`whitespace-nowrap pb-4 px-1 border-b-2 text-sm ${activeTab === 'Pending' ? 'border-primary text-primary font-semibold' : 'border-transparent text-light-grey hover:text-primary'}`}>
                            Pending Action ({gstItems.filter(i => i.status === 'Pending').length})
                        </button>
                        <button
                            onClick={() => { setActiveTab('Completed'); setSelectedItems(new Set()); }}
                            className={`whitespace-nowrap pb-4 px-1 border-b-2 text-sm ${activeTab === 'Completed' ? 'border-primary text-primary font-semibold' : 'border-transparent text-light-grey hover:text-primary'}`}>
                            Completed
                        </button>
                    </nav>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center my-4 gap-4 min-h-[40px]">
                    {activeTab === 'Pending' && (
                        <>
                            <Button onClick={handleImportData} variant="secondary" className="w-full sm:w-auto">
                                Import Data
                            </Button>
                            <Button onClick={() => deleteAllGstItems()} variant="secondary" className="w-full sm:w-auto">
                                Delete All
                            </Button>
                        </>
                    )}
                    <div className="flex flex-col sm:flex-row gap-4">
                        {activeTab === 'Pending' && selectedItems.size > 0 && (
                            <Button className="w-full sm:w-auto" onClick={() => handleGenerateCreditNotes(Array.from(selectedItems))} disabled={processingItems.size > 0}>
                                <ArrowPathIcon className="w-5 h-5 mr-2" />
                                Bulk Generate
                            </Button>
                        )}
                        {activeTab === 'Completed' && (
                            <>
                                <Button onClick={handleDeleteAllCompleted} variant="secondary" className="w-full sm:w-auto">
                                    Delete All
                                </Button>
                                <Button onClick={handleExport} variant="secondary" className="w-full sm:w-auto">
                                    <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
                                    Export for GSTR-1 Offline Tool
                                </Button>
                                <Button onClick={handleExportZoho} variant="secondary" className="w-full sm:w-auto">
                                    <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
                                    Export for Zoho Books
                                </Button>
                                <Button onClick={handleExportKhatabook} variant="secondary" className="w-full sm:w-auto">
                                    <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
                                    Export for Khatabook
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-light-grey">
                        <thead className="text-xs text-charcoal uppercase bg-white">
                            <tr>
                                {activeTab === 'Pending' && (
                                <th scope="col" className="p-2 sm:p-4">
                                    <Checkbox
                                        checked={isAllSelected}
                                        onChange={handleSelectAll}
                                        aria-label="Select all pending items"
                                    />
                                </th>
                                )}
                                <th scope="col" className="px-2 py-3 sm:px-6 font-medium">
                                    <button onClick={() => requestSort('customerName')} className="group inline-flex items-center gap-1">
                                        Order Details <SortIndicator sortKey="customerName" />
                                    </button>
                                </th>
                                <th scope="col" className="px-2 py-3 sm:px-6 font-medium">
                                    <button onClick={() => requestSort('originalInvoiceDate')} className="group inline-flex items-center gap-1">
                                        Invoice Date <SortIndicator sortKey="originalInvoiceDate" />
                                    </button>
                                </th>
                                <th scope="col" className="px-2 py-3 sm:px-6 font-medium">
                                    <button onClick={() => requestSort('rtoDate')} className="group inline-flex items-center gap-1">
                                        RTO Date <SortIndicator sortKey="rtoDate" />
                                    </button>
                                </th>
                                <th scope="col" className="px-2 py-3 sm:px-6 font-medium">
                                    <button onClick={() => requestSort('orderValue')} className="group inline-flex items-center gap-1">
                                        Value <SortIndicator sortKey="orderValue" />
                                    </button>
                                </th>
                                <th scope="col" className="px-2 py-3 sm:px-6 font-medium">
                                    <button onClick={() => requestSort('gstToReclaim')} className="group inline-flex items-center gap-1">
                                        GST To Reclaim <SortIndicator sortKey="gstToReclaim" />
                                    </button>
                                </th>
                                <th scope="col" className="px-2 py-3 sm:px-6 font-medium">Status</th>
                                {activeTab === 'Pending' && <th scope="col" className="px-2 py-3 sm:px-6 font-medium">Action</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <tr key={i} className="bg-white border-b border-gray-200">
                                        {activeTab === 'Pending' && <td className="p-2 sm:p-4"><div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div></td>}
                                        <td className="px-2 py-4 sm:px-6"><div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div></td>
                                        <td className="px-2 py-4 sm:px-6"><div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div></td>
                                        <td className="px-2 py-4 sm:px-6"><div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div></td>
                                        <td className="px-2 py-4 sm:px-6"><div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div></td>
                                        <td className="px-2 py-4 sm:px-6"><div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div></td>
                                        <td className="px-2 py-4 sm:px-6"><div className="h-6 bg-gray-200 rounded-full animate-pulse w-20"></div></td>
                                        {activeTab === 'Pending' && <td className="px-2 py-4 sm:px-6"><div className="h-8 bg-gray-200 rounded-md animate-pulse w-28"></div></td>}
                                    </tr>
                                ))
                            ) : (
                                sortedItems.map(item => (
                                    <tr key={item.id} className="bg-white border-b border-gray-200">
                                        {activeTab === 'Pending' && (
                                            <td className="p-2 sm:p-4">
                                                {item.status === 'Pending' && (
                                                    <Checkbox
                                                        checked={selectedItems.has(item.id)}
                                                        onChange={() => handleSelectItem(item.id)}
                                                        aria-label={`Select item ${item.id}`}
                                                    />
                                                )}
                                            </td>
                                        )}
                                        <td className="px-2 py-4 sm:px-6 font-medium text-charcoal">
                                            <div>{item.customerName}</div>
                                            <div className="text-xs text-light-grey">{item.products}</div>
                                        </td>
                                        <td className="px-2 py-4 sm:px-6 text-charcoal">{item.originalInvoiceDate}</td>
                                        <td className="px-2 py-4 sm:px-6 text-charcoal">{item.rtoDate}</td>
                                        <td className="px-2 py-4 sm:px-6 text-charcoal">₹{item.orderValue.toFixed(2)}</td>
                                        <td className="px-2 py-4 sm:px-6 font-semibold text-charcoal">₹{item.gstToReclaim.toFixed(2)}</td>
                                        <td className="px-2 py-4 sm:px-6"><StatusBadge status={item.status} /></td>
                                        {activeTab === 'Pending' && (
                                            <td className="px-2 py-4 sm:px-6">
                                                {item.status === 'Pending' && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleGenerateCreditNotes([item.id])}
                                                        isLoading={processingItems.has(item.id)}
                                                    >
                                                        Generate
                                                    </Button>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv,.json"
                style={{ display: 'none' }}
            />
        </div>
    );
};

export default GstAutomationHub;
