// --- Shopify Data Types ---
export interface ShopifyTaxLine {
    price: string;
    rate: number;
    title: string;
}

export interface ShopifyLineItem {
    id: number;
    title: string;
    price: string;
    quantity: number;
    tax_lines: ShopifyTaxLine[];
}

export interface ShopifyRefundLineItem {
    id: number;
    quantity: number;
    line_item_id: number;
    subtotal: number;
    total_tax: number;
    restock_type?: string;
}

export interface ShopifyRefund {
    id: number;
    created_at: string;
    refund_line_items: ShopifyRefundLineItem[];
    note?: string;
    processed_at?: string;
}

export interface ShopifyCustomer {
    first_name: string;
    last_name: string;
}

export interface ShopifyShippingAddress {
    city: string;
    province: string;
    country?: string;
    zip?: string;
}

export interface ShopifyOrder {
    id: number;
    name: string;
    created_at: string;
    total_price: string;
    customer: ShopifyCustomer;
    line_items: ShopifyLineItem[];
    refunds: ShopifyRefund[];
    shipping_address?: ShopifyShippingAddress;
}

// --- GST Automation Hub Types ---
export interface GstActionItem {
    id: string;
    customerName: string;
    invoiceDate: string;
    invoiceNumber: string;
    rtoDate: string;
    products: string;
    orderValue: number;
    gstToReclaim: number;
    placeOfSupply: string;
    status: 'Pending' | 'In Process' | 'Completed';
    creditNoteNumber?: string;
    creditNoteDate?: string;
}
