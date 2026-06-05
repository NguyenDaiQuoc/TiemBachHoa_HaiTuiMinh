
import { 
  ShippingMethod, 
  ShippingMethodId, 
  ShippingStatus, 
  TrackingEvent, 
  ShippingProvider,
  ShipmentDetails,
  TrackingLocation
} from '../model/types';

export const SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: ShippingMethodId.STANDARD,
    name: 'Giao hàng Tiêu chuẩn',
    description: 'Tiết kiệm, phù hợp cho đơn hàng không gấp',
    basePrice: 20000,
    minDays: 5,
    maxDays: 7,
    provider: ShippingProvider.GHN,
  },
  {
    id: ShippingMethodId.FAST,
    name: 'Giao hàng Nhanh',
    description: 'Cân bằng giữa tốc độ và chi phí',
    basePrice: 35000,
    minDays: 3,
    maxDays: 5,
    provider: ShippingProvider.GHTK,
  },
  {
    id: ShippingMethodId.EXPRESS,
    name: 'Giao hàng Hỏa tốc',
    description: 'Nhận hàng ngay trong ngày hoặc ngày kế tiếp',
    basePrice: 55000,
    minDays: 1,
    maxDays: 2,
    provider: ShippingProvider.VIETTEL_POST,
  },
];

/**
 * Shipping Aggregator Service
 * Handles normalized tracking lookups across providers
 */
export class ShippingAggregator {
  static async getTracking(trackingId: string, provider: ShippingProvider): Promise<ShipmentDetails> {
    // In a real app, this would call specific provider API adapters
    // For now, we simulate a realistic response
    await new Promise(resolve => setTimeout(resolve, 800));

    const origin: TrackingLocation = { lat: 10.8953, lng: 106.5771, name: 'Tòa nhà văn phòng - 82/1E ấp Xuân Thới Đông 3, xã Xuân Thới Đông, Hóc Môn, TP.HCM', type: 'ORIGIN' };
    const destination: TrackingLocation = { lat: 10.7963, lng: 106.6675, name: 'Căn hộ khách hàng - Phường 6, Quận 3, TP.HCM', type: 'DESTINATION' };

    const mockEvents: TrackingEvent[] = [
      {
        id: '1',
        status: ShippingStatus.PENDING_PICKUP,
        location: origin,
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        description: 'Đơn hàng đã được xác nhận và chờ lấy hàng.',
        isCompleted: true,
      },
      {
        id: '2',
        status: ShippingStatus.PICKED_UP,
        location: origin,
        timestamp: new Date(Date.now() - 72000000).toISOString(),
        description: `Nhân viên ${provider} đã lấy hàng thành công.`,
        isCompleted: true,
      },
      {
        id: '3',
        status: ShippingStatus.IN_TRANSIT,
        location: { lat: 10.8447, lng: 106.6190, name: 'Kho phân loại Hóc Môn', type: 'HUB' },
        timestamp: new Date(Date.now() - 43200000).toISOString(),
        description: 'Đơn hàng đã rời kho và đang trên đường trung chuyển.',
        isCompleted: true,
      },
      {
        id: '4',
        status: ShippingStatus.OUT_FOR_DELIVERY,
        location: { lat: 10.8000, lng: 106.6500, name: 'Đang giao hàng tại Quận 3', type: 'HUB' },
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        description: 'Nhân viên giao hàng đang trên đường đến với bạn.',
        isCompleted: true,
      }
    ];

    return {
      trackingId,
      orderId: 'DEMO-' + trackingId.slice(-4),
      provider,
      status: ShippingStatus.OUT_FOR_DELIVERY,
      estimatedArrival: new Date(Date.now() + 3600000).toISOString(),
      events: mockEvents,
      currentLocation: mockEvents[mockEvents.length - 1].location,
      origin,
      destination,
      progress: 0.92,
    };
  }
}

/**
 * Calculates shipping price based on method and weight (mock)
 */
export function calculateShippingPrice(methodId: ShippingMethodId, weightKg: number = 0.5): number {
  const method = SHIPPING_METHODS.find(m => m.id === methodId);
  if (!method) return 0;
  return method.basePrice + (Math.max(0, weightKg - 1) * 5000);
}

/**
 * Estimates arrival date string
 */
export function estimateArrival(methodId: ShippingMethodId): string {
  const method = SHIPPING_METHODS.find(m => m.id === methodId);
  const days = method ? method.maxDays : 7;
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}
