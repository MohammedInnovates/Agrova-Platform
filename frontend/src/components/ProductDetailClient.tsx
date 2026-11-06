"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { koboToNaira, type Product } from "@/lib/api";
import { addToCart } from "@/lib/cart";
import { getProductImage } from "@/lib/imageHelper";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CartBadge from "./CartBadge";
import { Minus, Plus, ShoppingCart, Truck, Shield, Leaf } from "lucide-react";

type MeasurementMode = "bulk" | "local" | "kg";

export default function ProductDetailClient({ product }: { product: Product }) {
  const router = useRouter();
  const supportsLocal = !!product.local_unit_multiplier && !!product.local_unit_name;
  const [mode, setMode] = useState<MeasurementMode>("bulk");
  const [bulkQty, setBulkQty] = useState(1);
  const [localQty, setLocalQty] = useState(1);
  const [customKg, setCustomKg] = useState(1);

  const bulkPrice = product.bulk_unit_price_kobo;
  const localMultiplier = product.local_unit_multiplier || 0.05;
  const localKg = product.local_unit_kg || 2.5;
  const totalBulkWeight = localKg / localMultiplier;
  const pricePerKg = bulkPrice / totalBulkWeight;
  const pricePerLocalUnit = bulkPrice * localMultiplier;

  let finalPriceKobo = 0;
  let displayQty = 0;
  let cartUnitKind: "bulk" | "local" = "bulk";
  let cartUnitName = "";

  if (mode === "bulk") {
    finalPriceKobo = bulkPrice * bulkQty;
    displayQty = bulkQty;
    cartUnitKind = "bulk";
    cartUnitName = product.bulk_unit;
  } else if (mode === "local" && supportsLocal) {
    finalPriceKobo = pricePerLocalUnit * localQty;
    displayQty = localQty;
    cartUnitKind = "local";
    cartUnitName = product.local_unit_name!;
  } else if (mode === "kg" && supportsLocal) {
    finalPriceKobo = pricePerKg * customKg;
    displayQty = customKg;
    cartUnitKind = "local"; 
    cartUnitName = `${customKg}kg`;
  }

  const isOutOfStock = product.stock_quantity <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return toast.error("This item is out of stock.");
    let quantityToSend = displayQty;
    if (mode === "kg") quantityToSend = customKg / localKg; 

    addToCart({
      product_id: product.id, product_name: product.name, product_brand: product.brand,
      product_unit: cartUnitName, quantity: Number(quantityToSend.toFixed(3)),
      unit_kind: cartUnitKind, unit_price_kobo: Math.round(finalPriceKobo / quantityToSend),
      image_url: product.image_url, category: product.category,
    });
    toast.success(`Added ${displayQty} × ${cartUnitName} of ${product.name} to cart`);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return toast.error("This item is out of stock.");
    handleAddToCart();
    router.push("/cart");
  };

  return (
    <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
      <div>
        <div className="relative bg-gray-100 rounded-2xl overflow-hidden aspect-square border border-gray-200">
          <img src={getProductImage(product)} alt={product.name} className="w-full h-full object-cover" />
          <div className="absolute top-4 left-4 flex gap-2">
             <Badge className="bg-white/90 text-[#14532d] shadow-sm">{product.category}</Badge>
             {isOutOfStock && <Badge className="bg-red-500 text-white shadow-sm">Out of Stock</Badge>}
          </div>
        </div>
        {/* ... (trust icons) ... */}
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Badge className="bg-[#15803d]">{product.category}</Badge>
            {product.grade && <Badge variant="outline">{product.grade}</Badge>}
          </div>
          <h1 className="text-4xl font-bold text-[#14532d] mb-2">{product.name}</h1>
          {product.brand && <p className="text-lg text-gray-600">by {product.brand}</p>}
        </div>

        <div className="bg-green-50 rounded-xl p-6">
          <p className="text-sm text-gray-600 mb-1">Total Price</p>
          <p className="text-4xl font-bold text-[#15803d]">{koboToNaira(finalPriceKobo)}</p>
        </div>

        {supportsLocal ? (
          <div>
            <label className="block text-sm font-semibold text-[#14532d] mb-2">Select Measurement</label>
            <div className={`grid gap-2 mb-4 ${supportsLocal && localKg ? 'grid-cols-3' : 'grid-cols-2'}`}>
              <button onClick={() => setMode("bulk")} className={`p-3 rounded-lg border-2 text-center transition-all ${mode === "bulk" ? "border-[#15803d] bg-green-50" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                <p className="font-bold text-sm text-[#14532d]">Bulk</p>
                <p className="text-xs text-gray-500">{product.bulk_unit}</p>
              </button>
              
              <button onClick={() => setMode("local")} className={`p-3 rounded-lg border-2 text-center transition-all ${mode === "local" ? "border-[#15803d] bg-green-50" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                <p className="font-bold text-sm text-[#14532d]">{product.local_unit_name}</p>
                <p className="text-xs text-gray-500">~{localKg}kg</p>
              </button>

              {localKg && (
                <button onClick={() => setMode("kg")} className={`p-3 rounded-lg border-2 text-center transition-all ${mode === "kg" ? "border-[#15803d] bg-green-50" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                  <p className="font-bold text-sm text-[#14532d]">Custom</p>
                  <p className="text-xs text-gray-500">By KG</p>
                </button>
              )}
            </div>

            {/* ... (quantity inputs for bulk/local/kg) ... */}
          </div>
        ) : (
          <div>
             <label className="block text-sm font-semibold text-[#14532d] mb-2">Quantity</label>
             <div className="flex items-center gap-3">
              <button onClick={() => setBulkQty(Math.max(1, bulkQty - 1))} className="h-12 w-12 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"><Minus className="h-5 w-5" /></button>
              <input type="number" min="1" value={bulkQty} onChange={(e) => setBulkQty(Math.max(1, parseInt(e.target.value) || 1))} className="h-12 w-24 text-center border border-gray-300 rounded-lg text-lg font-semibold" />
              <button onClick={() => setBulkQty(bulkQty + 1)} className="h-12 w-12 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"><Plus className="h-5 w-5" /></button>
              <span className="text-gray-500 font-medium ml-2">{product.bulk_unit}</span>
            </div>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-3 pt-4">
          <Button onClick={handleAddToCart} disabled={isOutOfStock} variant="outline" className="h-14 text-base border-[#15803d] text-[#15803d] hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed">
            <ShoppingCart className="h-5 w-5 mr-2" /> {isOutOfStock ? "Out of Stock" : "Add to Cart"}
          </Button>
          <Button onClick={handleBuyNow} disabled={isOutOfStock} className="h-14 text-base bg-[#15803d] hover:bg-[#14532d] disabled:opacity-50 disabled:cursor-not-allowed">
            {isOutOfStock ? "Out of Stock" : "Buy Now"}
          </Button>
        </div>
        <div className="flex justify-center pt-2"><CartBadge /></div>
      </div>
    </div>
  );
}