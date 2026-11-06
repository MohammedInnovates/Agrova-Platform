"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchProduct, type Product } from "@/lib/api";
import ProductDetailClient from "./ProductDetailClient";

export default function ProductDetailClientRouter() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string | undefined;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) return;

    async function load() {
      try {
        const data = await fetchProduct(productId);
        setProduct(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Product not found");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [productId]);

  if (loading) {
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

  if (error || !product) {
    return (
      <div className="text-center py-16">
        <p className="text-2xl font-bold text-red-500 mb-2">Product Not Found</p>
        <p className="text-gray-600 mb-6">
          {error || "This product doesn't exist"}
        </p>
        <button
          onClick={() => router.push("/products")}
          className="inline-flex items-center justify-center rounded-md bg-[#15803d] hover:bg-[#14532d] text-white h-10 px-6 text-sm font-medium"
        >
          Back to Catalog
        </button>
      </div>
    );
  }

  return <ProductDetailClient product={product} />;
}