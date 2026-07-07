
export enum ShippingStatus {
  PENDING_PICKUP = 'PENDING_PICKUP',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  ARRIVED_HUB = 'ARRIVED_HUB',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  DELIVERY_FAILED = 'DELIVERY_FAILED',
  RETURNING = 'RETURNING',
  RETURNED = 'RETURNED',
}

export enum ShippingProvider {
  GHN = 'GHN',
  GHTK = 'GHTK',
  VIETTEL_POST = 'VIETTEL_POST',
  SPX = 'SPX',
}

export enum ShippingMethodId {
  STANDARD = 'STANDARD',
  FAST = 'FAST',
  EXPRESS = 'EXPRESS',
}

export interface ShippingMethod {
  id: ShippingMethodId;
  name: string;
  description: string;
  basePrice: number;
  minDays: number;
  maxDays: number;
  provider: ShippingProvider;
}

export interface TrackingLocation {
  lat: number | null;
  lng: number | null;
  name: string;
  type: 'HUB' | 'COURIER' | 'ORIGIN' | 'DESTINATION' | 'CARRIER';
}

export interface TrackingEvent {
  id: string;
  status: ShippingStatus;
  location: TrackingLocation;
  timestamp: string;
  description: string;
  isCompleted: boolean;
  rawStatus?: string; // Original status from provider
}

export interface ShipmentDetails {
  trackingId: string;
  orderId: string;
  order?: any;
  provider: ShippingProvider;
  trackingMode?: 'SELF' | 'CARRIER';
  status: ShippingStatus;
  estimatedArrival: string;
  events: TrackingEvent[];
  currentLocation?: TrackingLocation;
  origin: TrackingLocation;
  destination: TrackingLocation;
  progress: number; // 0 to 1
  hasLiveLocation?: boolean;
  source?: string;
  carrier?: {
    mode?: 'SELF' | 'CARRIER';
    code?: string | null;
    trackingCode?: string | null;
    configured?: boolean;
    lastSyncAt?: string | null;
    error?: string | null;
    publicTrackingUrl?: string | null;
  };
}
