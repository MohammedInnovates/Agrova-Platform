import Link from "next/link";
import { fetchProducts, koboToNaira, type Product } from "@/lib/api";
import { getProductImage } from "@/lib/imageHelper";
import { ShoppingCart, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { search?: string; category?: string };
}) {
  // Read search and category from the URL
  const searchQuery = searchParams.search || "";
  const categoryQuery = searchParams.category || "";

  let products: Product[] = [];
  let errorMsg = null;

  try {
    // Fetch products with search/category filters
    products = await fetchProducts(
      categoryQuery || undefined, 
      undefined, 
      searchQuery || undefined
    );
  } catch (error) {
    errorMsg = error instanceof Error ? error.message : "Failed to load products";
  }

  return (
    <main className="min-h-screen bg-[#faf7f0] py-12 px-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-[#14532d] mb-4">
            {searchQuery ? `Search Results for "${searchQuery}"` : "Browse Full Catalog"}
          </h1>
          <p className="text-gray-600 text-lg">
            Fresh farm produce delivered directly to your doorstep.
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-md text-red-800 mb-8">
            <strong>Error:</strong> {errorMsg}
          </div>
        )}

        {/* Product Grid */}
        {products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">No products found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery ? `We couldn't find anything matching "${searchQuery}".` : "The catalog is currently empty."}
            </p>
            <Link href="/products" className="bg-[#15803d] text-white px-6 py-2 rounded-md font-bold hover:bg-[#14532d]">
              Clear Search
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border-gray-100 bg-white group flex flex-col">
                
                {/* Image */}
                <div className="relative h-52 w-full bg-gray-50 overflow-hidden">
                  <img 
                    src={getProductImage(product)} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-white/90 text-[#14532d] shadow-sm backdrop-blur-md">
                      {product.category}
                    </Badge>
                  </div>
                </div>

                {/* Details */}
                <CardContent className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] text-[#15803d] uppercase font-bold tracking-wider mb-1">
                      {product.brand || "Agrova Local"}
                    </p>
                    <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-2 leading-tight">
                      {product.name}
                    </h3>
                    <p className="text-xs text-gray-500 mb-3">{product.bulk_unit}</p>
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-2xl font-extrabold text-[#14532d] mb-4">
                      {koboToNaira(product.bulk_unit_price_kobo)}
                    </p>
                    <Link 
                      href={`/products/${product.id}`} 
                      className="flex items-center justify-center gap-2 w-full bg-gray-50 text-gray-800 py-3 rounded-xl text-sm font-bold hover:bg-[#15803d] hover:text-white transition-colors border border-gray-200 hover:border-transparent"
                    >
                      <ShoppingCart className="h-4 w-4" /> View Item
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}