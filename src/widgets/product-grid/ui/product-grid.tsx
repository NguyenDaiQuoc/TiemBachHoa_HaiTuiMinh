import { Link } from 'react-router-dom';
import { ProductCard } from '@/src/entities/product/ui/product-card';
import { Product } from '@/src/entities/product/model/types';

interface ProductGridProps {
  products: Product[];
  title?: string;
}

export const ProductGrid = ({ products, title }: ProductGridProps) => {
  return (
    <section className="space-y-8">
      {title && (
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-heading font-bold">{title}</h2>
          <Link to="/products" className="text-sm font-medium text-primary hover:underline">Xem tất cả</Link>
        </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};

