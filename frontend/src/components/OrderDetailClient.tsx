"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { koboToNaira, type Order } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Clock,
  Package,
  Truck,
  MapPin,
  CreditCard,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function OrderDetailClient() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string | undefined;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    async function load() {
      try {
        const res = await fetch(`${API_URL}/orders/${orderId}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`Order not found (${res.status})`);
        const data = await res.json();
        setOrder(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [orderId]);

  const handlePay = async () => {
    if (!order) return;
    setPaying(true);
    try {
      const res = await fetch(`${API_URL}/payments/initialize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: order.id,
          callback_url: `${window.location.origin}/payment/callback`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Payment init failed");

      toast.success("Redirecting to Paystack...");
      window.location.href = data.authorization_url;
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Payment initialization failed"
      );
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 animate-pulse">
        <div className="h-16 bg-gray-100 rounded-lg" />
        <div className="h-48 bg-gray-100 rounded-lg" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-2xl font-bold text-red-500 mb-2">Order Not Found</p>
        <p className="text-gray-600 mb-6">{error}</p>
        <Link
          href="/products"
          className="inline-flex items-center justify-center rounded-md bg-[#15803d] hover:bg-[#14532d] text-white h-10 px-6 text-sm font-medium"
        >
          Back to Catalog
        </Link>
      </div>
    );
  }

  const isPaid = order.status === "PAID";
  const isPending = order.status === "PENDING_PAYMENT";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ==== STATUS BANNER ==== */}
      <Card
        className={`border-2 ${
          isPaid
            ? "border-green-500 bg-green-50"
            : isPending
              ? "border-orange-500 bg-orange-50"
              : "border-gray-300"
        }`}
      >
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div
              className={`shrink-0 rounded-full p-2 ${
                isPaid ? "bg-green-500" : "bg-orange-500"
              } text-white`}
            >
              {isPaid ? (
                <CheckCircle2 className="h-6 w-6" />
              ) : (
                <Clock className="h-6 w-6" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-[#14532d] mb-1">
                {isPaid ? "Payment Confirmed!" : "Awaiting Payment"}
              </h2>
              <p className="text-sm text-gray-600 mb-3">
                {isPaid
                  ? "Your order is being processed. You'll receive delivery updates on WhatsApp."
                  : "Complete your payment to finalize this order."}
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="outline">Order #{order.id.slice(0, 8)}</Badge>
                <Badge variant="outline">{order.status}</Badge>
                <Badge variant="outline">{order.delivery_type}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ==== PAYMENT CARD (if pending) ==== */}
      {isPending && (
        <Card className="border-[#15803d]">
          <CardHeader>
            <CardTitle className="text-[#14532d] flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Amount to pay</p>
              <p className="text-3xl font-bold text-[#15803d]">
                {koboToNaira(order.total_kobo)}
              </p>
            </div>
            <Button
              onClick={handlePay}
              disabled={paying}
              className="w-full h-12 bg-[#15803d] hover:bg-[#14532d] text-base"
            >
              {paying ? "Opening Paystack..." : "Pay Now with Paystack"}
            </Button>
            <p className="text-xs text-gray-500 text-center">
              You'll be redirected to Paystack to complete payment securely
            </p>
          </CardContent>
        </Card>
      )}

      {/* ==== ORDER ITEMS ==== */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[#14532d] flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order Items ({order.items.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-4 pb-3 border-b border-gray-100 last:border-0 last:pb-0"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#14532d]">
                  {item.product_name}
                </p>
                <p className="text-sm text-gray-500">
                  {item.product_brand} · {item.product_unit}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {item.quantity} × {koboToNaira(item.unit_price_kobo)}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-semibold text-[#14532d]">
                  {koboToNaira(item.line_total_kobo)}
                </p>
                {item.line_discount_kobo > 0 && (
                  <p className="text-xs text-green-600">
                    Saved {koboToNaira(item.line_discount_kobo)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ==== DELIVERY INFO ==== */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[#14532d] flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Delivery Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Delivery Type</span>
            <span className="font-semibold">{order.delivery_type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Fulfillment</span>
            <span className="font-semibold">{order.fulfillment_method}</span>
          </div>
          {order.delivery_date && (
            <div className="flex justify-between">
              <span className="text-gray-600 flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                Delivery Date
              </span>
              <span className="font-semibold">
                {new Date(order.delivery_date).toLocaleDateString("en-NG", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Substitution if out of stock</span>
            <span className="font-semibold text-xs">
              {order.substitution_preference.replace(/_/g, " ")}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ==== PRICE BREAKDOWN ==== */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[#14532d]">Price Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span>{koboToNaira(order.subtotal_kobo)}</span>
          </div>
          {order.discount_kobo > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Bulk Discount</span>
              <span>-{koboToNaira(order.discount_kobo)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Service Fee</span>
            <span>{koboToNaira(order.service_fee_kobo)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Delivery Fee</span>
            <span>{koboToNaira(order.delivery_fee_kobo)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold">
            <span className="text-[#14532d]">Total</span>
            <span className="text-[#15803d]">
              {koboToNaira(order.total_kobo)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ==== ACTIONS ==== */}
      <div className="flex justify-center gap-3 pb-8">
        <Link
          href="/products"
          className="inline-flex items-center justify-center rounded-md border border-gray-300 hover:bg-gray-50 text-gray-700 h-10 px-6 text-sm font-medium"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}