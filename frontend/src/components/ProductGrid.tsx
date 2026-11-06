"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchProducts, koboToNaira, localUnitPrice, type Product } from "@/lib/api";
import { getProductImage } from "@/lib/imageHelper";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Loader2 } from "lucide-react";

export default function ProductGrid({ limit }: { limit?: number }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchProducts();
        setProducts(limit ? data.slice(0, limit) : data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load products");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [limit]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><Loader2 className="h-8 w-8 animate-spin text-[#15803d]" /></div>;
  if (error) return <div style={{ textAlign: 'center', padding: '64px', color: 'red' }}>Could not load products. Make sure backend is running.</div>;
  if (products.length === 0) return <div style={{ textAlign: 'center', padding: '64px' }}>No products yet.</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
      {products.map((product) => {
        const localPrice = localUnitPrice(product);
        return (
          <Card key={product.id} style={{ overflow: 'hidden', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            
            {/* Image Container - Strictly Constrained */}
            <div style={{ position: 'relative', width: '100%', height: '224px', backgroundColor: '#f9fafb', overflow: 'hidden' }}>
              <img
                src={getProductImage(product)}
                alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
                <Badge style={{ backgroundColor: 'rgba(255,255,255,0.9)', color: '#14532d', border: 'none' }}>{product.category}</Badge>
              </div>
            </div>

            {/* Content */}
            <CardContent style={{ padding: '20px', display: 'flex', flexDirection: 'column', minHeight: '220px', justifyContent: 'space-between' }}>
              <div>
                {product.brand && <p style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>{product.brand}</p>}
                <h3 style={{ fontWeight: 'bold', fontSize: '18px', color: '#14532d', lineHeight: '1.2', marginBottom: '8px' }}>{product.name}</h3>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>{product.bulk_unit}</p>
              </div>

              <div>
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#15803d' }}>{koboToNaira(product.bulk_unit_price_kobo)}</p>
                  {localPrice && product.local_unit_name && (
                    <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                      Or {koboToNaira(localPrice)} / {product.local_unit_name}
                    </p>
                  )}
                </div>

                <Link 
                  href={`/products/${product.id}`} 
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', backgroundColor: '#f3f4f6', color: '#15803d', height: '44px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', textDecoration: 'none' }}
                >
                  <ShoppingCart className="h-4 w-4" /> View Details
                </Link>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}