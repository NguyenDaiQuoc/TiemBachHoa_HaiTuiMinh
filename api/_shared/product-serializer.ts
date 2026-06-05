const CATEGORY_RATING_MAP: Record<string, number> = {
  'my-pham': 4.8,
  'gia-dung': 4.5,
  'cong-nghe': 4.6,
};

export const serializePublicProduct = (product: any) => {
  const categoryName = product.category?.name || 'Danh mục';
  const categorySlug = product.category?.slug ?? '';
  const rating = CATEGORY_RATING_MAP[categorySlug] ?? 4.7;
  const specifications = [
    { label: 'Danh mục', value: categoryName },
    product.subcategory ? { label: 'Loại sản phẩm', value: product.subcategory } : null,
    product.brand ? { label: 'Hãng', value: product.brand } : null,
    product.sku ? { label: 'SKU', value: product.sku } : null,
  ].filter(Boolean);

  return {
    ...product,
    image: product.images?.[0] || '',
    rating,
    reviewCount: Math.max(12, Math.round((product.soldCount || 0) * 0.18) || 24),
    isNew: Date.now() - new Date(product.createdAt).getTime() < 1000 * 60 * 60 * 24 * 21,
    variants: Array.isArray(product.variantsJson) && product.variantsJson.length ? [{ type: 'capacity', options: product.variantsJson }] : [],
    features: product.tags?.length ? product.tags : ['Sản phẩm chính hãng', 'Kiểm tra kỹ trước khi giao', 'Hỗ trợ đổi trả theo chính sách'],
    specifications,
  };
};
