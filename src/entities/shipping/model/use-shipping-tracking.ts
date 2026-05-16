import { useState, useEffect, useCallback } from 'react';
import { ShipmentDetails, ShippingProvider } from '../model/types';
import { ShippingAggregator } from '../lib/shipping-engine';
import { toast } from 'sonner';

interface UseShippingTrackingProps {
  trackingId?: string;
  provider?: ShippingProvider;
  pollingInterval?: number;
}

export function useShippingTracking({ trackingId, provider, pollingInterval = 30000 }: UseShippingTrackingProps) {
  const [shipment, setShipment] = useState<ShipmentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTracking = useCallback(async (isSilent = false) => {
    if (!trackingId || !provider) return;

    if (!isSilent) setIsLoading(true);
    setError(null);

    try {
      const details = await ShippingAggregator.getTracking(trackingId, provider);
      setShipment(details);
    } catch (err) {
      setError('Không thể tải thông tin vận chuyển. Vui lòng thử lại sau.');
      if (!isSilent) toast.error('Lỗi khi tải thông tin vận chuyển');
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, [trackingId, provider]);

  useEffect(() => {
    fetchTracking();

    if (pollingInterval > 0 && trackingId && provider) {
      const interval = setInterval(() => {
        fetchTracking(true);
      }, pollingInterval);
      return () => clearInterval(interval);
    }
  }, [fetchTracking, pollingInterval, trackingId, provider]);

  return {
    shipment,
    isLoading,
    error,
    refresh: () => fetchTracking(),
  };
}
