"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { koboToNaira } from "@/lib/api";
import { ArrowLeft, Package, Truck, CheckCircle2, Clock } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      try {
        const res = await fetch(`${API_URL}/orders/${orderId}`);
        if (!res.ok) throw new Error("Order not found");
        const data = await res.json();
        setOrder(data);
      } catch {
        router.push("/orders");
      } finally {
        setLoading(false);
      }
    }
    if (orderId) loadOrder();
  }, [orderId, router]);

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  if (!order) return null;

  // Status Mapping
  const stages = ["PAID", "PROCURED", "DISPATCHED", "DELIVERED"];
  const currentStageIndex = stages.indexOf(order.status);

  return (
    <main className="min-h-screen bg-[#faf7f0] py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/orders" className="inline-flex items-center gap-2 text-[#15803d] font-bold mb-6 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Orders
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-[#14532d] text-white p-6 md:p-8">
            <h1 className="text-3xl font-bold mb-2">Order #{order.id.slice(0, 8)}</h1>
            <p className="text-green-200">Placed on {new Date(order.created_at).toLocaleDateString()}</p>
          </div>

          {/* Live Tracking Bar */}
          <div className="p-6 md:p-8 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Order Tracking</h2>
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 z-0"></div>
              <div 
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#15803d] z-0 transition-all duration-500"
                style={{ width: `${(Math.max(0, currentStageIndex) / (stages.length - 1)) * 100}%` }}
              ></div>
              
              {stages.map((stage, idx) => {
                const isComplete = currentStageIndex >= idx;
                const Icon = stage === "PAID" ? Clock : stage === "PROCURED" ? Package : stage === "DISPATCHED" ? Truck : CheckCircle2;
                return (
                  <div key={stage} className="relative z-10 flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isComplete ? "bg-[#15803d] text-white" : "bg-gray-200 text-gray-400"}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className={`text-xs font-bold ${isComplete ? "text-[#15803d]" : "text-gray-400"}`}>{stage}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pickup PIN (Only show if Dispatched) */}
          {order.status === "DISPATCHED" && (
            <div className="p-6 md:p-8 bg-green-50 border-b border-green-100 text-center">
              <h3 className="text-lg font-bold text-[#14532d] mb-2">Your Pickup PIN</h3>
              <p className="text-sm text-gray-600 mb-4">Show this 4-digit code to the delivery driver/hub coordinator.</p>
              <div className="text-4xl font-extrabold tracking-[1em] text-[#15803d] bg-white inline-block px-8 py-4 rounded-xl shadow-md border-2 border-[#15803d]">
                {order.pickup_pin || "****"}
              </div>
            </div>
          )}

          {/* Items */}
          <div className="p-6 md:p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Items</h2>
            <div className="space-y-4">
              {order.items.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center border-b border-gray-50 pb-3 last:border-0">
                  <div>
                    <p className="font-semibold text-gray-900">{item.product_name}</p>
                    <p className="text-sm text-gray-500">{item.quantity} × {item.product_unit}</p>
                  </div>
                  <p className="font-bold text-[#15803d]">{koboToNaira(item.line_total_kobo)}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
              <span className="text-lg font-bold text-gray-900">Total</span>
              <span className="text-2xl font-extrabold text-[#15803d]">{koboToNaira(order.total_kobo)}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}