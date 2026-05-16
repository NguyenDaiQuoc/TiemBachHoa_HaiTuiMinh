import { AdminStats, Order, Customer } from '../model/types';

export const adminService = {
  getStats: async (): Promise<AdminStats> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      revenue: {
        total: 1250000000,
        growth: 12.5,
        chart: [
          { date: '2024-01-01', amount: 85000000 },
          { date: '2024-01-02', amount: 92000000 },
          { date: '2024-01-03', amount: 78000000 },
          { date: '2024-01-04', amount: 110000000 },
          { date: '2024-01-05', amount: 95000000 },
          { date: '2024-01-06', amount: 130000000 },
          { date: '2024-01-07', amount: 125000000 },
        ]
      },
      orders: {
        count: 1450,
        growth: 8.2,
        pending: 24,
      },
      customers: {
        count: 3200,
        growth: 5.4,
      },
      popularProducts: [
        { id: 'p1', name: 'iPhone 15 Pro Max', price: 34990000, orders: 450, image: '', category: 'MOBILES', description: '' } as any,
        { id: '1', name: 'Nến Thơm Đà Lạt', price: 350000, orders: 320, image: '', category: 'DECOR', description: '' } as any,
      ]
    };
  },

  getOrders: async (): Promise<Order[]> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    return [
      {
        id: 'ORD-12345',
        customerName: 'Hoàng Minh',
        customerEmail: 'minh.hoang@gmail.com',
        totalAmount: 35340000,
        status: 'PROCESSING',
        paymentStatus: 'PAID',
        shippingMethod: 'EXPRESS',
        createdAt: new Date().toISOString(),
        items: [],
        shippingAddress: { street: '123 Ba Tháng Hai', city: 'Hồ Chí Minh', phone: '0901234567' }
      },
      {
        id: 'ORD-12346',
        customerName: 'Linh Trần',
        customerEmail: 'linh.tran@yahoo.com',
        totalAmount: 180000,
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        shippingMethod: 'STANDARD',
        createdAt: new Date().toISOString(),
        items: [],
        shippingAddress: { street: '456 Lê Lợi', city: 'Đà Nẵng', phone: '0912345678' }
      }
    ];
  },

  getCustomers: async (): Promise<Customer[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
      {
        id: 'CUST-001',
        name: 'Hoàng Minh',
        email: 'minh.hoang@gmail.com',
        phone: '0901234567',
        totalOrders: 12,
        totalSpent: 85400000,
        lastOrderDate: '2024-05-10',
        status: 'ACTIVE'
      },
      {
        id: 'CUST-002',
        name: 'Linh Trần',
        email: 'linh.tran@yahoo.com',
        phone: '0912345678',
        totalOrders: 5,
        totalSpent: 1200000,
        lastOrderDate: '2024-05-08',
        status: 'ACTIVE'
      }
    ];
  }
};
