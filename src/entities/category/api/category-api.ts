import { useQuery } from "@tanstack/react-query";
import { getAuthHeaders } from "@/src/shared/lib/auth-headers";

const BASE_URL = "/api/admin/categories";

export const categoryKeys = {
  all: ["categories"] as const,
  lists: () => [...categoryKeys.all, "list"] as const,
};

export const fetchCategories = async () => {
  const response = await fetch(BASE_URL, { headers: getAuthHeaders({}, 'admin') });
  if (!response.ok) throw new Error("Failed to fetch categories");
  const result = await response.json();
  return result.data;
};

export const useCategories = () => {
  return useQuery({
    queryKey: categoryKeys.lists(),
    queryFn: fetchCategories,
  });
};
