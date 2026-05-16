
/**
 * Generates an 8-character uppercase alphanumeric Order ID.
 */
export function generateOrderId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generates the transfer content for payment QR.
 * Format: [ORDER_ID]-[CUSTOMER_NAME]-[DDMMYYYY]
 */
export function generateTransferContent(orderId: string, customerName: string): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  
  // Clean name from accents/special chars if needed, but for mock keep it simple
  const cleanName = customerName.toUpperCase().replace(/\s+/g, '');
  
  return `${orderId}-${cleanName}-${day}${month}${year}`;
}
