import { Link } from 'react-router-dom';
import { ProductCard } from '@/src/entities/product/ui/product-card';
import { Product } from '@/src/entities/product/model/types';

interface ProductGridProps {
  products: Product[];
  title?: string;
}

export const ProductGrid = ({ products, title }: ProductGridProps) => {
  return (
    <section className="space-y-5">
      {title && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-primary pb-3">
          <h2 className="market-section-title">{title}</h2>
          <Link
            to="/products"
            className="rounded-full border border-primary/25 bg-card px-4 py-2 text-xs font-black uppercase tracking-[0.08em] text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            Xem tất cả
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};
