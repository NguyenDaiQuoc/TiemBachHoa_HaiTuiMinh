import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Clock, Search } from 'lucide-react';
import { BLOG_ARTICLES, BlogArticle, getArticleBySlug, getRelatedArticles } from '@/src/entities/content/blog-data';
import { Product } from '@/src/entities/product/model/types';
import { productService } from '@/src/entities/product/api/product-service';
import { ProductCard } from '@/src/entities/product/ui/product-card';
import { Button } from '@/src/shared/ui/button';
import { Seo, SITE_URL, storeStructuredData } from '@/src/shared/lib/seo';
import { cn } from '@/src/shared/lib/utils';

const categoryLabels = [
  { id: 'all', label: 'Tất cả' },
  { id: 'buying-guide', label: 'Buying guides' },
  { id: 'comparison', label: 'So sánh' },
  { id: 'tips', label: 'Tips & Tricks' },
  { id: 'how-to', label: 'How-to' },
];

const ArticleCard = ({ article, featured = false }: { article: BlogArticle; featured?: boolean }) => (
  <Link
    to={'/blog/' + article.slug}
    className={cn(
      'group block overflow-hidden rounded-[2rem] border border-border/60 bg-card shadow-soft transition-all hover:-translate-y-1 hover:border-primary/30',
      featured && 'lg:grid lg:grid-cols-[1.1fr_0.9fr]'
    )}
  >
    <div className={cn('overflow-hidden bg-muted', featured ? 'aspect-[16/10] lg:aspect-auto' : 'aspect-[16/11]')}>
      <img src={article.heroImage} alt={article.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
    </div>
    <div className="flex h-full flex-col justify-between gap-6 p-6 md:p-8">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
          <span className="rounded-full bg-primary/10 px-3 py-1">{article.categoryLabel}</span>
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" /> {article.readMinutes} phút đọc
          </span>
        </div>
        <h2 className={cn('font-black uppercase leading-tight tracking-tight group-hover:text-primary', featured ? 'text-3xl md:text-5xl' : 'text-2xl')}>
          {article.title}
        </h2>
        <p className="text-sm font-medium leading-relaxed text-muted-foreground md:text-base">{article.excerpt}</p>
      </div>
      <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary">
        Đọc bài viết <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </span>
    </div>
  </Link>
);

const useRelatedProducts = (article?: BlogArticle) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    let active = true;
    if (!article) return undefined;

    Promise.all(article.relatedProductQueries.slice(0, 3).map((query) => productService.searchProducts(query, 3)))
      .then((groups) => {
        if (!active) return;
        const seen = new Set<string>();
        const merged = groups.flat().filter((product) => {
          if (seen.has(product.id)) return false;
          seen.add(product.id);
          return true;
        });
        setProducts(merged.slice(0, 4));
      })
      .catch(() => {
        if (active) setProducts([]);
      });

    return () => {
      active = false;
    };
  }, [article]);

  return products;
};

export const BlogIndexPage = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [query, setQuery] = useState('');

  const filteredArticles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return BLOG_ARTICLES.filter((article) => {
      const matchCategory = activeCategory === 'all' || article.category === activeCategory;
      const matchQuery = !normalizedQuery || [article.title, article.excerpt, ...article.tags].join(' ').toLowerCase().includes(normalizedQuery);
      return matchCategory && matchQuery;
    });
  }, [activeCategory, query]);

  const [featured, ...rest] = filteredArticles;

  return (
    <div className="bg-background text-foreground">
      <Seo
        title="Cẩm nang mua sắm"
        description="Buying guides, so sánh sản phẩm, mẹo sử dụng và hướng dẫn mua hàng từ Tiệm Bách Hoá Hai Tụi Mình."
        path="/blog"
        structuredData={[storeStructuredData, { '@context': 'https://schema.org', '@type': 'Blog', name: 'Cẩm nang mua sắm Hai Tụi Mình', url: SITE_URL + '/blog' }]}
      />
      <section className="container mx-auto max-w-7xl space-y-10 px-4 py-12 md:py-16">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_0.45fr] lg:items-end">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-primary">
              <BookOpen className="h-4 w-4" /> Content Platform
            </span>
            <h1 className="max-w-4xl text-5xl font-black uppercase leading-[0.95] tracking-tight md:text-7xl">Cẩm nang mua sắm thông minh</h1>
            <p className="max-w-2xl text-base font-medium leading-relaxed text-muted-foreground md:text-lg">
              Hướng dẫn chọn sản phẩm, so sánh nhanh, mẹo dùng bền và câu trả lời thực tế trước khi bạn xuống tiền.
            </p>
          </div>
          <label className="flex h-14 items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 shadow-soft focus-within:border-primary/50">
            <Search className="h-5 w-5 text-primary" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm bài viết..."
              className="h-full flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-muted-foreground"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-2 pb-2">
          {categoryLabels.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategory(category.id)}
              className={cn(
                'whitespace-nowrap rounded-full border px-4 py-2 text-xs font-black uppercase tracking-widest transition-colors',
                activeCategory === category.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border/60 bg-card text-muted-foreground hover:text-foreground'
              )}
            >
              {category.label}
            </button>
          ))}
        </div>

        {featured ? <ArticleCard article={featured} featured /> : null}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rest.map((article) => <ArticleCard key={article.slug} article={article} />)}
        </div>
      </section>
    </div>
  );
};

export const BlogDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const article = getArticleBySlug(slug);
  const relatedArticles = article ? getRelatedArticles(article) : [];
  const relatedProducts = useRelatedProducts(article);

  if (!article) {
    return (
      <div className="container mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center gap-6 px-4 text-center">
        <Seo title="Không tìm thấy bài viết" path="/blog" />
        <h1 className="text-4xl font-black uppercase tracking-tight">Không tìm thấy bài viết</h1>
        <p className="text-muted-foreground">Bài viết có thể đã được đổi đường dẫn hoặc tạm ẩn.</p>
        <Button onClick={() => navigate('/blog')} className="rounded-2xl">Quay lại cẩm nang</Button>
      </div>
    );
  }

  const articleStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    image: article.heroImage,
    datePublished: article.publishedAt,
    author: { '@type': 'Organization', name: 'Tiệm Bách Hoá Hai Tụi Mình' },
    mainEntityOfPage: SITE_URL + '/blog/' + article.slug,
  };

  return (
    <article className="bg-background text-foreground">
      <Seo title={article.title} description={article.excerpt} image={article.heroImage} path={'/blog/' + article.slug} type="article" structuredData={[storeStructuredData, articleStructuredData]} />
      <div className="container mx-auto max-w-6xl px-4 py-10 md:py-16">
        <Link to="/blog" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Cẩm nang
        </Link>

        <header className="mt-8 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
              <span className="rounded-full bg-primary/10 px-3 py-1">{article.categoryLabel}</span>
              <span className="text-muted-foreground">{new Date(article.publishedAt).toLocaleDateString('vi-VN')}</span>
              <span className="text-muted-foreground">{article.readMinutes} phút đọc</span>
            </div>
            <h1 className="text-4xl font-black uppercase leading-[0.95] tracking-tight md:text-6xl">{article.title}</h1>
            <p className="text-lg font-medium leading-relaxed text-muted-foreground">{article.excerpt}</p>
          </div>
          <div className="overflow-hidden rounded-[2.5rem] border border-border/60 bg-card shadow-soft">
            <img src={article.heroImage} alt={article.title} className="aspect-[16/11] w-full object-cover" />
          </div>
        </header>

        <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_320px]">
          <div className="space-y-8">
            {article.sections.map((section, index) => (
              <section key={section.heading} className="rounded-[2rem] border border-border/60 bg-card p-6 shadow-soft md:p-8">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">0{index + 1}</span>
                <h2 className="mt-3 text-2xl font-black uppercase tracking-tight md:text-3xl">{section.heading}</h2>
                <p className="mt-4 text-base font-medium leading-8 text-muted-foreground">{section.body}</p>
              </section>
            ))}

            <section className="rounded-[2rem] border border-border/60 bg-card p-6 shadow-soft md:p-8">
              <h2 className="text-2xl font-black uppercase tracking-tight">FAQ</h2>
              <div className="mt-6 divide-y divide-border/60">
                {article.faq.map((item) => (
                  <div key={item.question} className="py-5 first:pt-0 last:pb-0">
                    <h3 className="flex items-start gap-2 text-base font-black"><CheckCircle2 className="mt-1 h-4 w-4 text-primary" /> {item.question}</h3>
                    <p className="mt-2 pl-6 text-sm leading-7 text-muted-foreground">{item.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[2rem] border border-border/60 bg-card p-6 shadow-soft">
              <h2 className="text-lg font-black uppercase tracking-tight">Bài liên quan</h2>
              <div className="mt-5 space-y-4">
                {relatedArticles.map((entry) => (
                  <Link key={entry.slug} to={'/blog/' + entry.slug} className="block rounded-2xl bg-background p-4 transition-colors hover:bg-muted">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">{entry.categoryLabel}</p>
                    <h3 className="mt-2 text-sm font-black leading-snug">{entry.title}</h3>
                  </Link>
                ))}
              </div>
            </div>

            {relatedProducts.length > 0 && (
              <div className="rounded-[2rem] border border-border/60 bg-card p-6 shadow-soft">
                <h2 className="text-lg font-black uppercase tracking-tight">Sản phẩm liên quan</h2>
                <div className="mt-5 grid gap-4">
                  {relatedProducts.slice(0, 2).map((product) => <ProductCard key={product.id} product={product} />)}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </article>
  );
};
