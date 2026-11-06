import Link from "next/link";
import { fetchCategoryBySlug, koboToNaira } from "@/lib/api";
import { getProductImage, resolveImageUrl } from "@/lib/imageHelper";
import { ShoppingCart, ArrowLeft } from "lucide-react";

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  let category = null;
  let products = [];

  try {
    const data = await fetchCategoryBySlug(params.slug);
    category = data.category;
    products = data.products;
  } catch (error) {
    return <div className="text-center py-20 text-2xl font-bold">Category Not Found</div>;
  }

  return (
    <main className="min-h-screen bg-[#faf7f0] py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-[#15803d] font-bold mb-8 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <div className="flex items-center gap-6 mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          {category?.image_url && (
            <img src={resolveImageUrl(category.image_url)} alt={category.name} className="w-20 h-20 rounded-full object-cover border-4 border-[#15803d]" />
          )}
          <div>
            <h1 className="text-4xl font-extrabold text-[#14532d]">{category?.name}</h1>
            {category?.description && <p className="text-gray-600 mt-2">{category.description}</p>}
          </div>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20 text-gray-500">No products found in this category.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product: any) => (
              <div key={product.id} className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-shadow border border-gray-100 overflow-hidden flex flex-col">
                <div className="h-48 w-full overflow-hidden bg-gray-50">
                  <img src={getProductImage(product)} alt={product.name} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">{product.brand || "Local"}</p>
                    <h3 className="font-bold text-lg text-gray-900 mb-1">{product.name}</h3>
                    <p className="text-sm text-gray-500 mb-4">{product.bulk_unit}</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-[#15803d] mb-4">{koboToNaira(product.bulk_unit_price_kobo)}</p>
                    <Link href={`/products/${product.id}`} className="flex items-center justify-center gap-2 w-full bg-gray-50 text-gray-800 py-2.5 rounded-lg font-bold hover:bg-[#15803d] hover:text-white transition-colors border border-gray-200">
                      <ShoppingCart className="h-4 w-4" /> View Item
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}