"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { koboToNaira, type Order } from "@/lib/api";
import { addToCart, clearCart } from "@/lib/cart";
import { getUser } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, RefreshCw, AlertTriangle } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export default function OrderHistoryClient() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Safety timer to prevent infinite loading
    const timer = setTimeout(() => {
      if (isMounted && loading) {
        setLoading(false);
        setErrorMsg("The server took too long to respond. Please check your backend.");
      }
    }, 5000);

    async function loadOrders() {
      try {
        const user = getUser();
        if (!user || !user.id) {
          if (isMounted) {
            setLoading(false);
            router.push("/login");
          }
          return;
        }

        // Direct fetch bypasses the previous caching bug
        const res = await fetch(`${API_URL}/orders/user/${user.id}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load orders");
        
        const data = await res.json();
        if (isMounted) {
          setOrders(Array.isArray(data) ? data : []);
          setErrorMsg(null);
        }
      } catch (err: any) {
        if (isMounted) setErrorMsg(err.message || "Failed to load history");
      } finally {
        clearTimeout(timer);
        if (isMounted) setLoading(false);
      }
    }

    loadOrders();

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [router, loading]);

  const handleReorder = (order: Order) => {
    if (confirm("Do you want to add all items from this order back to your cart?")) {
      clearCart();
      order.items.forEach(item => {
        addToCart({
          product_id: item.product_id,
          product_name: item.product_name,
          product_brand: item.product_brand,
          product_unit: item.product_unit,
          quantity: item.quantity,
          unit_kind: "bulk", // Defaults to bulk for reorder
          unit_price_kobo: item.unit_price_kobo,
          image_url: null,
          category: "Reorder",
        });
      });
      toast.success("Items added to cart!");
      router.push("/cart");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-[#15803d] mb-4" />
        <p className="text-gray-500 font-medium">Loading your order history...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="bg-red-50 rounded-2xl border border-red-200 p-12 text-center">
        <AlertTriangle className="h-16 w-16 mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-red-800 mb-2">Could not load orders</h2>
        <p className="text-red-600 mb-6">{errorMsg}</p>
        <button onClick={() => window.location.reload()} className="bg-red-600 text-white px-6 py-2 rounded-md font-bold hover:bg-red-700">
          Try Again
        </button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
        <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-[#14532d] mb-2">No orders yet</h2>
        <p className="text-gray-500 mb-6">You haven't placed any orders. Start shopping to see them here.</p>
        <Link href="/products" className="inline-flex items-center justify-center rounded-md bg-[#15803d] hover:bg-[#14532d] text-white h-11 px-8 text-sm font-bold">
          Browse Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map(order => (
        <Card key={order.id} className="border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-0">
            {/* Header Bar */}
            <div className="bg-gray-50 px-6 py-4 flex flex-wrap justify-between items-center gap-4 border-b border-gray-100">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Order ID</p>
                <p className="font-mono text-sm font-semibold text-gray-900">#{order.id.slice(0, 8)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Delivery Date</p>
                <p className="text-sm font-semibold text-gray-900">
                  {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString() : "TBD"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Total</p>
                <p className="text-sm font-bold text-[#15803d]">{koboToNaira(order.total_kobo)}</p>
              </div>
              <Badge className={
                order.status === 'DELIVERED' ? 'bg-green-100 text-green-800 border-green-200' :
                order.status === 'DISPATCHED' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                order.status === 'PAID' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                order.status === 'CANCELLED' ? 'bg-red-100 text-red-800 border-red-200' :
                'bg-gray-100 text-gray-800 border-gray-200'
              }>
                {order.status}
              </Badge>
            </div>

            {/* Body */}
            <div className="px-6 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <p className="text-sm font-bold text-gray-800 mb-1">
                  {order.items.length} item{order.items.length > 1 ? 's' : ''}
                </p>
                <p className="text-sm text-gray-500 line-clamp-1">
                  {order.items.map(i => `${i.quantity}x ${i.product_name}`).join(", ")}
                </p>
              </div>
              
              <div className="flex gap-2 w-full md:w-auto shrink-0">
                <Link
                  href={`/orders/${order.id}`}
                  className="flex-1 md:flex-none text-center bg-[#15803d] hover:bg-[#14532d] text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm"
                >
                  View Details
                </Link>
                <button
                  onClick={() => handleReorder(order)}
                  className="flex-1 md:flex-none bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <RefreshCw className="h-4 w-4" /> Reorder
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}