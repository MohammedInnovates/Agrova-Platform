"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { koboToNaira, fetchProduct, fetchEstates, type Estate } from "@/lib/api";
import { useCart, updateQuantity, removeFromCart, clearCart } from "@/lib/cart";
import { getProductImage, resolveImageUrl } from "@/lib/imageHelper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, Truck, Zap, Package, MapPin } from "lucide-react";
import { getUser } from "@/lib/auth";

export default function CartContent() {
  const router = useRouter();
  const { cart, mounted, totalKobo } = useCart();

  const [estates, setEstates] = useState<Estate[]>([]);
  const [selectedEstate, setSelectedEstate] = useState<string>("");
  const [deliveryDirections, setDeliveryDirections] = useState<string>("");
  
  const [deliveryType, setDeliveryType] = useState<"WEEKLY_BATCH" | "MONTHLY_BATCH" | "EXPRESS_URGENT">("WEEKLY_BATCH");
  const [fulfillmentMethod, setFulfillmentMethod] = useState<"ESTATE_HUB" | "HOME_DELIVERY">("HOME_DELIVERY");
  const [substitutionPreference, setSubstitutionPreference] = useState<"AUTO_SUBSTITUTE" | "CONTACT_ME" | "CANCEL_ITEM">("AUTO_SUBSTITUTE");
  const [budget, setBudget] = useState<number>(50000);
  const [submitting, setSubmitting] = useState(false);

  const [productData, setProductData] = useState<Record<string, any>>({});

  // AUTO-FILL: Load user's saved address and estates
  useEffect(() => {
    const user = getUser();
    
    // 1. Pre-fill address from profile
    if (user) {
      if (user.estate_id) setSelectedEstate(user.estate_id);
      if (user.default_address_directions) setDeliveryDirections(user.default_address_directions);
    }

    // 2. Load available estates
    async function loadEstates() {
      try {
        const data = await fetchEstates();
        setEstates(data);
      } catch {
        console.error("Failed to load estates");
      }
    }
    loadEstates();
  }, []);

  useEffect(() => {
    async function fetchImages() {
      const missing = cart.filter(c => !c.image_url && !productData[c.product_id]);
      for (const item of missing) {
        try {
          const p = await fetchProduct(item.product_id);
          setProductData(prev => ({ ...prev, [item.product_id]: p }));
        } catch (e) {
          console.error("Failed to load product image");
        }
      }
    }
    if (mounted) fetchImages();
  }, [cart, mounted, productData]);

  const pricing = useMemo(() => {
    const deliveryBase = fulfillmentMethod === "ESTATE_HUB" ? 50_000 : 300_000;
    const deliverySurcharge = deliveryType === "WEEKLY_BATCH" ? 0 : deliveryType === "MONTHLY_BATCH" ? -20_000 : 500_000;
    const deliveryFee = deliveryBase + deliverySurcharge;
    const serviceFee = Math.round(totalKobo * 0.015);
    const total = totalKobo + serviceFee + deliveryFee;
    return { deliveryFee, serviceFee, discount: 0, total };
  }, [totalKobo, deliveryType, fulfillmentMethod]);

  const budgetKobo = budget * 100;
  const budgetPercent = budgetKobo > 0 ? Math.min((pricing.total / budgetKobo) * 100, 100) : 0;
  const budgetColor = budgetPercent >= 100 ? "bg-red-500" : budgetPercent >= 80 ? "bg-orange-500" : "bg-[#15803d]";

  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error("Your cart is empty");

    const user = getUser();
    if (!user) {
      toast.error("Please log in to complete your order");
      router.push("/login?redirect=/cart");
      return;
    }

    if (!selectedEstate) {
      return toast.error("Please select your delivery area.");
    }

    if (selectedEstate === "other" && !deliveryDirections.trim()) {
      return toast.error("Please type your full address since you selected 'Other'.");
    }

    setSubmitting(true);
    try {
      const items = cart.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_kind: item.unit_kind,
      }));

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"}/orders/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          items,
          delivery_type: deliveryType,
          fulfillment_method: fulfillmentMethod,
          substitution_preference: substitutionPreference,
          delivery_estate_id: selectedEstate === "other" ? null : selectedEstate,
          delivery_directions: deliveryDirections
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Checkout failed");
      }

      const order = await res.json();
      toast.success(`Order ${order.id.slice(0, 8)} created! ₦${order.total_kobo / 100} to pay.`);
      clearCart();
      router.push(`/orders/${order.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) return <div className="animate-pulse h-64 bg-gray-100 rounded-lg" />;

  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-2xl font-bold text-[#14532d] mb-2">Your cart is empty</h2>
        <p className="text-gray-600 mb-6">Browse our catalog and add your first item.</p>
        <Link href="/products" className="inline-flex items-center justify-center rounded-md bg-[#15803d] hover:bg-[#14532d] text-white h-11 px-8 text-sm font-medium">
          Browse Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
      <div className="lg:col-span-2 space-y-4">
        
        {/* CART ITEMS */}
        <Card>
          <CardHeader><CardTitle className="text-[#14532d]">Cart Items ({cart.length})</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {cart.map((item) => {
              let imgUrl = "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=600&auto=format&fit=crop";
              if (item.image_url) {
                imgUrl = resolveImageUrl(item.image_url);
              } else if (productData[item.product_id]) {
                imgUrl = getProductImage(productData[item.product_id]);
              }

              return (
                <div key={`${item.product_id}-${item.unit_kind}`} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                    <img src={imgUrl} alt={item.product_name} className="w-full h-full object-cover" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#14532d]">{item.product_name}</p>
                    <p className="text-sm text-gray-500">{item.product_brand} · {item.product_unit}</p>
                    <p className="text-sm text-gray-600 mt-1">{koboToNaira(item.unit_price_kobo)} each</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.product_id, item.unit_kind, item.quantity - 1)} className="h-8 w-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50"><Minus className="h-3 w-3" /></button>
                    <span className="w-8 text-center font-semibold">{Number(item.quantity.toFixed(2))}</span>
                    <button onClick={() => updateQuantity(item.product_id, item.unit_kind, item.quantity + 1)} className="h-8 w-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50"><Plus className="h-3 w-3" /></button>
                  </div>
                  
                  <div className="text-right min-w-[90px]">
                    <p className="font-bold text-[#14532d]">{koboToNaira(item.unit_price_kobo * item.quantity)}</p>
                    <button onClick={() => removeFromCart(item.product_id, item.unit_kind)} className="text-xs text-red-500 hover:text-red-700 mt-1 inline-flex items-center gap-1">
                      <Trash2 className="h-3 w-3" /> Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* DELIVERY ADDRESS */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#14532d] flex items-center gap-2">
              <MapPin className="h-5 w-5" /> Delivery Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select your Delivery Location</label>
              <select 
                value={selectedEstate} 
                onChange={(e) => setSelectedEstate(e.target.value)}
                className="w-full h-11 px-3 border border-gray-300 rounded-md bg-white"
              >
                <option value="" disabled>Select an estate or area...</option>
                {estates.map(e => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
                <option value="other" className="font-bold text-[#15803d]">Other (Not Listed / Type Custom Address)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {selectedEstate === "other" ? "Full Address (Required)" : "Additional Directions (Optional)"}
              </label>
              <textarea 
                value={deliveryDirections}
                onChange={(e) => setDeliveryDirections(e.target.value)}
                placeholder={selectedEstate === "other" ? "e.g., No 5, Mambushi Road, opposite Total Filling Station..." : "e.g., Block 4, House 12, behind the gate mosque..."}
                className="w-full h-24 p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-[#15803d] outline-none"
                required={selectedEstate === "other"}
              />
            </div>
          </CardContent>
        </Card>

        {/* DELIVERY OPTIONS & BUDGET METER */}
        {/* (Keep the rest of your code identical here) */}
        <Card>
          <CardHeader><CardTitle className="text-[#14532d]">🚚 Delivery Options</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Speed</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button onClick={() => setDeliveryType("WEEKLY_BATCH")} className={`p-3 rounded-lg border-2 text-left transition-all ${deliveryType === "WEEKLY_BATCH" ? "border-[#15803d] bg-green-50" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                  <Package className="h-5 w-5 mb-2 text-[#15803d]" /><p className="font-semibold text-sm text-[#14532d]">Weekly Batch</p><p className="text-xs text-gray-500">Saturday delivery</p>
                </button>
                <button onClick={() => setDeliveryType("MONTHLY_BATCH")} className={`p-3 rounded-lg border-2 text-left transition-all ${deliveryType === "MONTHLY_BATCH" ? "border-[#15803d] bg-green-50" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                  <Truck className="h-5 w-5 mb-2 text-[#15803d]" /><p className="font-semibold text-sm text-[#14532d]">Monthly Batch</p><p className="text-xs text-gray-500">Save ₦200</p>
                </button>
                <button onClick={() => setDeliveryType("EXPRESS_URGENT")} className={`p-3 rounded-lg border-2 text-left transition-all ${deliveryType === "EXPRESS_URGENT" ? "border-[#15803d] bg-green-50" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                  <Zap className="h-5 w-5 mb-2 text-orange-500" /><p className="font-semibold text-sm text-[#14532d]">Express</p><p className="text-xs text-gray-500">24-48h · +₦5,000</p>
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fulfillment Method</label>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setFulfillmentMethod("ESTATE_HUB")} className={`p-3 rounded-lg border-2 text-left transition-all ${fulfillmentMethod === "ESTATE_HUB" ? "border-[#15803d] bg-green-50" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                  <p className="font-semibold text-sm text-[#14532d]">Estate Hub</p><p className="text-xs text-gray-500">₦500 · pickup</p>
                </button>
                <button onClick={() => setFulfillmentMethod("HOME_DELIVERY")} className={`p-3 rounded-lg border-2 text-left transition-all ${fulfillmentMethod === "HOME_DELIVERY" ? "border-[#15803d] bg-green-50" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                  <p className="font-semibold text-sm text-[#14532d]">Home Delivery</p><p className="text-xs text-gray-500">₦3,000 · door</p>
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">If item is out of stock</label>
              <select value={substitutionPreference} onChange={(e) => setSubstitutionPreference(e.target.value as any)} className="w-full h-10 px-3 border border-gray-300 rounded-md">
                <option value="AUTO_SUBSTITUTE">Auto-substitute with equal quality</option>
                <option value="CONTACT_ME">Contact me on WhatsApp first</option>
                <option value="CANCEL_ITEM">Cancel the item</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-[#14532d]">💰 Smart Budget Meter</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Set your target budget</label>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-[#14532d]">₦</span>
                <input type="number" value={budget} onChange={(e) => setBudget(Number(e.target.value) || 0)} className="flex-1 h-10 px-3 border border-gray-300 rounded-md text-lg font-semibold" min="1000" step="1000" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">{koboToNaira(pricing.total)} of {koboToNaira(budgetKobo)}</span>
                <span className={`font-semibold ${budgetPercent >= 100 ? "text-red-500" : budgetPercent >= 80 ? "text-orange-500" : "text-[#15803d]"}`}>{Math.round(budgetPercent)}%</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full ${budgetColor} transition-all duration-300`} style={{ width: `${budgetPercent}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ORDER SUMMARY */}
      <div className="lg:col-span-1">
        <div className="sticky top-4">
          <Card>
            <CardHeader><CardTitle className="text-[#14532d]">Order Summary</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-gray-600">Subtotal</span><span className="font-semibold">{koboToNaira(totalKobo)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-600">Service fee (1.5%)</span><span className="font-semibold">{koboToNaira(pricing.serviceFee)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-600">Delivery</span><span className="font-semibold">{koboToNaira(pricing.deliveryFee)}</span></div>
              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <span className="font-bold text-[#14532d]">Total</span>
                <span className="font-bold text-2xl text-[#15803d]">{koboToNaira(pricing.total)}</span>
              </div>
              <Button onClick={handleCheckout} disabled={submitting} className="w-full h-12 bg-[#15803d] hover:bg-[#14532d] text-base mt-4">
                {submitting ? "Creating Order..." : "Proceed to Checkout"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}