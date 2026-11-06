"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { fetchProducts, koboToNaira, localUnitPrice, type Product } from "@/lib/api";
import { getProductImage } from "@/lib/imageHelper";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShoppingCart } from "lucide-react";

function CatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await fetchProducts(
          selectedCategory === "All" ? undefined : selectedCategory,
          undefined,
          initialSearch
        );
        setProducts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedCategory, initialSearch]);

  const categories = ["All", "Staples", "Oils", "Tubers", "Grains & Rice", "Pasta & Noodles"];

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#15803d]" /></div>;
  if (error) return <div className="text-center py-16 text-red-500">{error}</div>;

  return (
    <>
      {/* Category Pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setSelectedCategory(cat);
              router.push(cat === "All" ? "/products" : `/products?category=${cat}`);
            }}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
              selectedCategory === cat
                ? "bg-[#15803d] text-white shadow-md"
                : "bg-white text-gray-600 border border-gray-200 hover:border-[#15803d] hover:text-[#15803d]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {initialSearch && (
        <p className="text-sm text-gray-600 mb-6 bg-green-50 inline-block px-4 py-2 rounded-lg">
          Search results for: <strong>"{initialSearch}"</strong>
        </p>
      )}

      {products.length === 0 ? (
        <div className="text-center py-20 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
          <p className="text-lg font-semibold mb-2">No products found</p>
          <p className="text-sm">Try a different search term or category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => {
            const localPrice = localUnitPrice(product);
            return (
              <Card key={product.id} className="group overflow-hidden rounded-xl border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white">
                
                {/* Image Section */}
                <div className="relative aspect-[4/3] w-full bg-gray-50 overflow-hidden">
                  <Image
                    src={getProductImage(product)}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <Badge className="bg-white/90 text-[#14532d] backdrop-blur-md shadow-sm border-0">{product.category}</Badge>
                  </div>
                  {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-orange-500 text-white shadow-sm border-0">Only {product.stock_quantity} left</Badge>
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <CardContent className="p-5 flex flex-col h-[220px] justify-between">
                  <div>
                    {product.brand && <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{product.brand}</p>}
                    <h3 className="font-bold text-lg text-[#14532d] leading-tight mb-2 line-clamp-2">{product.name}</h3>
                    <p className="text-sm text-gray-500 mb-3">{product.bulk_unit}</p>
                  </div>

                  <div>
                    <div className="flex items-end justify-between mb-4">
                      <div>
                        <p className="text-2xl font-bold text-[#15803d]">{koboToNaira(product.bulk_unit_price_kobo)}</p>
                        {localPrice && product.local_unit_name && (
                          <p className="text-xs text-gray-500 mt-1">
                            Or {koboToNaira(localPrice)} / {product.local_unit_name}
                          </p>
                        )}
                      </div>
                    </div>

                    <Link 
                      href={`/products/${product.id}`} 
                      className="flex items-center justify-center gap-2 w-full rounded-lg bg-gray-50 hover:bg-[#15803d] text-[#15803d] hover:text-white h-11 text-sm font-semibold transition-colors border border-gray-200 hover:border-transparent"
                    >
                      <ShoppingCart className="h-4 w-4" /> View Details
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

export default function ProductCatalog() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#15803d]" /></div>}>
      <CatalogContent />
    </Suspense>
  );
}