import { useEffect } from 'react';

export const SITE_NAME = 'Tiệm Bách Hoá Hai Tụi Mình';
export const SITE_URL = 'https://haituiminh.vercel.app';
export const DEFAULT_DESCRIPTION = 'Tiệm Bách Hoá Hai Tụi Mình bán mỹ phẩm chính hãng, đồ gia dụng tiện ích và sản phẩm công nghệ với thông tin minh bạch, giao hàng toàn quốc.';

type StructuredData = Record<string, unknown> | Record<string, unknown>[];

interface SeoProps {
  title?: string;
  description?: string;
  image?: string;
  path?: string;
  type?: 'website' | 'article' | 'product';
  structuredData?: StructuredData;
}

const upsertMeta = (selector: string, attrs: Record<string, string>) => {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    document.head.appendChild(element);
  }

  Object.entries(attrs).forEach(([key, value]) => element?.setAttribute(key, value));
};

const upsertLink = (rel: string, href: string) => {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="' + rel + '"]');
  if (!element) {
    element = document.createElement('link');
    element.rel = rel;
    document.head.appendChild(element);
  }
  element.href = href;
};

export const buildPageTitle = (title?: string) => (title ? title + ' | ' + SITE_NAME : SITE_NAME);

export const Seo = ({ title, description = DEFAULT_DESCRIPTION, image = SITE_URL + '/readme-banner.svg', path = '/', type = 'website', structuredData }: SeoProps) => {
  useEffect(() => {
    const canonical = new URL(path, SITE_URL).toString();
    const pageTitle = buildPageTitle(title);

    document.title = pageTitle;
    upsertMeta('meta[name="description"]', { name: 'description', content: description });
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: pageTitle });
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description });
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: type });
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonical });
    upsertMeta('meta[property="og:image"]', { property: 'og:image', content: image });
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: pageTitle });
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description });
    upsertLink('canonical', canonical);

    const id = 'app-structured-data';
    document.getElementById(id)?.remove();
    if (structuredData) {
      const script = document.createElement('script');
      script.id = id;
      script.type = 'application/ld+json';
      script.text = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }
  }, [description, image, path, structuredData, title, type]);

  return null;
};

export const storeStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'Store',
  name: SITE_NAME,
  url: SITE_URL,
  telephone: '+84931454176',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '82/1E ấp Xuân Thới Đông 3',
    addressLocality: 'Hóc Môn',
    addressRegion: 'TP.HCM',
    addressCountry: 'VN',
  },
};
