import { useQuery } from "@tanstack/react-query";
import { getAuthHeaders } from "@/src/shared/lib/auth-headers";

const BASE_URL = "/api/admin/categories";

const CATEGORY_LABELS: Record<string, { name: string; description: string }> = {
  "cong-nghe": {
    name: "Đồ công nghệ",
    description: "Thiết bị và phụ kiện công nghệ chính hãng.",
  },
  "gia-dung": {
    name: "Đồ gia dụng",
    description: "Sản phẩm gia dụng tiện ích cho cuộc sống hiện đại.",
  },
  "my-pham": {
    name: "Mỹ phẩm",
    description: "Mỹ phẩm chính hãng, chăm sóc da và làm đẹp mỗi ngày.",
  },
};

const normalizeCategory = (category: any) => {
  const label = CATEGORY_LABELS[category?.slug as string];
  if (!label) return category;

  return {
    ...category,
    name: label.name,
    description: category.description && !/[?\uFFFD]/.test(category.description) ? category.description : label.description,
  };
};

export const categoryKeys = {
  all: ["categories"] as const,
  lists: () => [...categoryKeys.all, "list"] as const,
};

export const fetchCategories = async () => {
  const response = await fetch(BASE_URL, { headers: getAuthHeaders({}, 'admin') });
  if (!response.ok) throw new Error("Failed to fetch categories");
  const result = await response.json();
  return Array.isArray(result.data) ? result.data.map(normalizeCategory) : result.data;
};

export const useCategories = () => {
  return useQuery({
    queryKey: categoryKeys.lists(),
    queryFn: fetchCategories,
  });
};
