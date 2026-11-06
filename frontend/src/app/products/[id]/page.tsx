import { Suspense } from "react";
import Link from "next/link";
import ProductDetailClientRouter from "@/components/ProductDetailClientRouter";

function DetailSkeleton() {
  return (
    <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto animate-pulse">
      <div className="bg-gray-100 rounded-2xl aspect-square" />
      <div className="space-y-6">
        <div className="h-12 bg-gray-100 rounded" />
        <div className="h-32 bg-gray-100 rounded" />
        <div className="h-12 bg-gray-100 rounded" />
        <div className="h-14 bg-gray-100 rounded" />
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  return (
    <main className="min-h-screen bg-[#faf7f0]">
      <section className="bg-[#14532d] text-white py-8">
        <div className="container mx-auto px-4">
          <Link
            href="/products"
            className="inline-flex items-center text-green-200 hover:text-white text-sm transition-colors"
          >
            ← Back to Catalog
          </Link>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <Suspense fallback={<DetailSkeleton />}>
          <ProductDetailClientRouter />
        </Suspense>
      </section>
    </main>
  );
}