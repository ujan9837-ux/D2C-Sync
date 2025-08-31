import { ShopifyOrder, ShopifyLineItem, ShopifyRefundLineItem } from '../types';
export type { ShopifyOrder };

// --- GST Automation Types ---
interface GstActionItem {
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

/**
  * Maps a Shopify order to a GST action item for RTO processing.
  * Only orders with refunds are processed for GST reclaim.
  * @param order The Shopify order to map
  * @returns The mapped GST action item, or null if no refunds
  */
export function mapShopifyOrderToGstActionItem(order: ShopifyOrder): GstActionItem | null {
    // Only process orders with refunds (RTO cases)
    if (!order.refunds || order.refunds.length === 0) {
        return null;
    }

    // Calculate GST to reclaim from refund line items
    const gstToReclaim = order.refunds.reduce((refundSum, refund) => {
        return refundSum + refund.refund_line_items.reduce((itemSum, rli) => {
            return itemSum + (rli.total_tax || 0);
        }, 0);
    }, 0);

    // If no GST to reclaim, skip
    if (gstToReclaim === 0) {
        return null;
    }

    // Get RTO date from the first refund
    const rtoDate = order.refunds[0].created_at.substring(0, 10);

    // Build products list from line items
    const products = order.line_items.map(item => item.title).join(', ');

    // Determine place of supply
    const placeOfSupply = order.shipping_address
        ? `${order.shipping_address.province}`
        : 'Unknown';

    return {
        id: order.id.toString(),
        customerName: `${order.customer.first_name} ${order.customer.last_name}`,
        invoiceDate: order.created_at.substring(0, 10),
        invoiceNumber: order.name,
        rtoDate,
        products,
        orderValue: parseFloat(order.total_price),
        gstToReclaim,
        placeOfSupply,
        status: 'Pending',
    };
}

// Sample order from shopify-mock.json
const sampleOrder: ShopifyOrder = {
    "id": 1001,
    "name": "#1001",
    "total_price": "1299.00",
    "customer": {
        "first_name": "Aarav",
        "last_name": "Sharma"
    },
    "created_at": "2024-07-15T10:30:00+05:30",
    "shipping_address": {
        "city": "Mumbai",
        "province": "Maharashtra"
    },
    "line_items": [
        {
            "id": 2001,
            "title": "Organic Cotton T-shirt",
            "quantity": 1,
            "price": "1299.00",
            "tax_lines": [
                {
                    "title": "IGST",
                    "price": "233.82",
                    "rate": 0.18
                }
            ]
        }
    ],
    "refunds": [
        {
            "id": 1,
            "created_at": "2024-07-22T14:00:00+05:30",
            "refund_line_items": [
                {
                    "id": 12345678901,
                    "quantity": 1,
                    "line_item_id": 2001,
                    "subtotal": 1299.00,
                    "total_tax": 233.82
                }
            ]
        }
    ]
};

const result = mapShopifyOrderToGstActionItem(sampleOrder);
console.log('Mapped GST Action Item:', JSON.stringify(result, null, 2));

// Test with no refunds
const orderNoRefunds: ShopifyOrder = { ...sampleOrder, refunds: [] };
const resultNoRefunds = mapShopifyOrderToGstActionItem(orderNoRefunds);
console.log('Order with no refunds:', resultNoRefunds);