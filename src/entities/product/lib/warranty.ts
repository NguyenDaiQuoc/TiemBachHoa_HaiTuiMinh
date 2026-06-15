export const WARRANTY_TAG_PREFIX = 'Bảo hành:';

export const WARRANTY_OPTIONS = ['1 ngày', '3 ngày', '7 ngày', '1 tuần', '1 tháng', '3 tháng', '6 tháng', '12 tháng', '24 tháng'] as const;

export type WarrantyOption = (typeof WARRANTY_OPTIONS)[number];

export const isWarrantyTag = (tag: string) => tag.trim().toLowerCase().startsWith(WARRANTY_TAG_PREFIX.toLowerCase());

export const getWarrantyLabel = (tags?: string[] | null) => {
  const tag = tags?.find(isWarrantyTag);
  return tag?.slice(WARRANTY_TAG_PREFIX.length).trim() || null;
};

export const getWarrantyTag = (value: string) => `${WARRANTY_TAG_PREFIX} ${value}`;

export const setWarrantyTag = (tags: string[] = [], value?: string | null) => {
  const nextTags = tags.filter((tag) => !isWarrantyTag(tag));
  return value ? [...nextTags, getWarrantyTag(value)] : nextTags;
};
