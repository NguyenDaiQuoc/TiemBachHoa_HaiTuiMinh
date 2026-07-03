import { queryClient } from "@/src/shared/lib/react-query";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getAuthHeaders } from '@/src/shared/lib/auth-headers';

const BASE_URL = "/api/orders";
const ADMIN_BASE_URL = "/api/admin/orders";

export const orderKeys = {
  all: ["orders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  list: (filters: any) => [...orderKeys.lists(), filters] as const,
  details: () => [...orderKeys.all, "detail"] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
};

// User endpoints
export const fetchOrders = async () => {
  const response = await fetch(BASE_URL, { headers: getAuthHeaders({}, 'user') });
  if (!response.ok) throw new Error("Failed to fetch orders");
  const result = await response.json();
  return result.data;
};

export const fetchOrder = async (id: string) => {
  const response = await fetch(`${BASE_URL}/${id}`, { headers: getAuthHeaders({}, 'user') });
  if (!response.ok) throw new Error("Failed to fetch order");
  const result = await response.json();
  return result.data;
};

// Admin endpoints
export const fetchAdminOrders = async () => {
  const response = await fetch("/api/admin/orders", {
    headers: getAuthHeaders({}, 'admin'),
  });
  
  if (!response.ok) throw new Error("Failed to fetch admin orders");
  const result = await response.json();
  return result.data;
};

export const updateOrderStatus = async ({ id, status }: { id: string; status: string }) => {
  const response = await fetch(`${ADMIN_BASE_URL}/${id}/status`, {
    method: "PATCH",
    headers: getAuthHeaders({ "Content-Type": "application/json" }, 'admin'),
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update order status");
  }
  return response.json();
};

export const updateBatchOrderStatus = async ({ ids, status }: { ids: string[]; status: string }) => {
  const response = await fetch(`${ADMIN_BASE_URL}/batch-status`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }, 'admin'),
    body: JSON.stringify({ ids, status }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to batch update orders");
  }
  return response.json();
};

export const addDeliveryEvent = async ({
  id,
  status,
  lat,
  lng,
  address,
  note,
  mapUrl,
  proofImage,
}: {
  id: string;
  status: 'OUT_FOR_DELIVERY' | 'DELIVERED';
  lat?: number;
  lng?: number;
  address?: string;
  note?: string;
  mapUrl?: string;
  proofImage?: string | null;
}) => {
  const response = await fetch(`${ADMIN_BASE_URL}/${id}/delivery-event`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }, 'admin'),
    body: JSON.stringify({ status, lat, lng, address, note, mapUrl, proofImage }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || error?.error || 'Failed to update delivery tracking');
  }
  return response.json();
};

export const bindTraccarDevice = async ({
  id,
  traccarDeviceId,
  traccarUniqueId,
}: {
  id: string;
  traccarDeviceId?: string;
  traccarUniqueId?: string;
}) => {
  const response = await fetch(`${ADMIN_BASE_URL}/${id}/traccar-device`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }, 'admin'),
    body: JSON.stringify({ traccarDeviceId, traccarUniqueId }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || error?.error || 'Failed to bind Traccar device');
  }
  return response.json();
};

export const bindCarrierTracking = async ({
  id,
  carrier,
  trackingCode,
}: {
  id: string;
  carrier: 'SELF' | 'GHN' | 'GHTK' | 'VIETTEL_POST' | 'SPX';
  trackingCode?: string;
}) => {
  const response = await fetch(`${ADMIN_BASE_URL}/${id}/carrier-tracking`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }, 'admin'),
    body: JSON.stringify({ carrier, trackingCode }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || error?.error || 'Failed to bind carrier tracking');
  }
  return response.json();
};

export const reverseAdminGeocode = async ({ lat, lng }: { lat: number; lng: number }) => {
  const response = await fetch(`/api/admin/geocode/reverse?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`, {
    headers: getAuthHeaders({}, 'admin'),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || error?.error || 'Không thể lấy địa chỉ từ tọa độ');
  }
  const payload = await response.json();
  return payload.data as { address: string; provider: string; mapUrl: string };
};

export const useOrders = () => {
  return useQuery({
    queryKey: orderKeys.lists(),
    queryFn: fetchOrders,
  });
};

export const useAdminOrders = () => {
  return useQuery({
    queryKey: [...orderKeys.all, "admin-list"],
    queryFn: async () => {
       const res = await fetch("/api/admin/orders", {
         headers: getAuthHeaders({}, 'admin'),
       });
       
       if (!res.ok) throw new Error("Failed to fetch admin orders");
       const json = await res.json();
       return json.data;
    }
  });
};

export const useUpdateOrderStatus = () => {
  return useMutation({
    mutationFn: updateOrderStatus,
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(id) });
    },
  });
};

export const useUpdateBatchOrderStatus = () => {
  return useMutation({
    mutationFn: updateBatchOrderStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
};

export const useAddDeliveryEvent = () => {
  return useMutation({
    mutationFn: addDeliveryEvent,
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(id) });
    },
  });
};

export const useBindTraccarDevice = () => {
  return useMutation({
    mutationFn: bindTraccarDevice,
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(id) });
    },
  });
};

export const useBindCarrierTracking = () => {
  return useMutation({
    mutationFn: bindCarrierTracking,
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(id) });
    },
  });
};
