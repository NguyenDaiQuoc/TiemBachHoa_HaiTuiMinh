import { queryClient } from "@/src/shared/lib/react-query";
import { useQuery, useMutation } from "@tanstack/react-query";

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
  const response = await fetch(BASE_URL);
  if (!response.ok) throw new Error("Failed to fetch orders");
  const result = await response.json();
  return result.data;
};

export const fetchOrder = async (id: string) => {
  const response = await fetch(`${BASE_URL}/${id}`);
  if (!response.ok) throw new Error("Failed to fetch order");
  const result = await response.json();
  return result.data;
};

// Admin endpoints
export const fetchAdminOrders = async () => {
  // We'll use the orders endpoint but with admin privileges if the backend supports it,
  // or a specific admin endpoint. Based on admin-router.ts, we need better order listing.
  // For now, let's assume we use a general order path but the admin needs more info.
  const response = await fetch("/api/admin/orders"); // This needs to exist in admin-router.ts
  if (!response.ok) throw new Error("Failed to fetch admin orders");
  const result = await response.json();
  return result.data;
};

export const updateOrderStatus = async ({ id, status }: { id: string; status: string }) => {
  const response = await fetch(`${ADMIN_BASE_URL}/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids, status }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to batch update orders");
  }
  return response.json();
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
       const res = await fetch("/api/admin/orders");
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
