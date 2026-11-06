"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { koboToNaira } from "@/lib/api";
import { getUser, type AuthUser } from "@/lib/auth";
import { ArrowLeft, Package, Truck, CheckCircle2, Clock, Printer, XCircle, CreditCard, Wallet, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// HARDCODED URL to guarantee it connects
const API_URL = "http://127.0.0.1:8000/api/v1";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;
  
  const [order, setOrder] = useState<any>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payingWallet, setPayingWallet] = useState(false);

  useEffect(() => {
    const u = getUser();
    if (!u) {
      router.push("/login");
      return;
    }
    setUser(u);

    // 1. Force a timeout so the page NEVER hangs on "Loading..."
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seconds max

    async function fetchOrder() {
      try {
        // 2. Fetch with the abort signal
        const res = await fetch(`${API_URL}/orders/${orderId}`, { 
          signal: controller.signal,
          cache: "no-store" 
        });
        
        clearTimeout(timeoutId);

        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("This order was not found in the database. It might be an old order that was deleted. Please create a new order from the cart.");
          }
          throw new Error(`Server returned status: ${res.status}`);
        }
        
        const data = await res.json();
        setOrder(data);
        setErrorMsg(null);
      } catch (err: any) {
        if (err.name === 'AbortError') {
          setErrorMsg("The request timed out. This means the backend server is not responding or is offline.");
        } else if (err.message === "Failed to fetch") {
          setErrorMsg("Cannot connect to the backend. Make sure the backend server is running on port 8000.");
        } else {
          setErrorMsg(err.message);
        }
      } finally {
        setLoading(false);
      }
    }

    async function fetchWallet() {
      try {
        const res = await fetch(`${API_URL}/wallet/${u!.id}`);
        if (res.ok) {
          const data = await res.json();
          setWalletBalance(data.balance_kobo);
        }
      } catch { }
    }
    
    if (orderId) {
      fetchOrder();
      fetchWallet();
    }
  }, [orderId, router]);

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    setCancelling(true);
    try {
      await fetch(`${API_URL}/orders/${orderId}/cancel`, { method: "POST" });
      window.location.reload();
    } catch (err: any) {
      alert("Error cancelling order");
    } finally {
      setCancelling(false);
    }
  };

  const handlePayStack = async () => {
    setPaying(true);
    try {
      const res = await fetch(`${API_URL}/payments/initialize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: order.id, callback_url: `${window.location.origin}/payment/callback` }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed");
      window.location.href = data.authorization_url;
    } catch (err: any) {
      alert(err.message || "Payment failed.");
      setPaying(false);
    }
  };

  const handlePayWallet = async () => {
    if (!confirm(`Pay ${koboToNaira(order.total_kobo)} from your wallet?`)) return;
    setPayingWallet(true);
    try {
      const res = await fetch(`${API_URL}/orders/${order.id}/pay-with-wallet`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${localStorage.getItem("agrover_token")}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Payment failed");
      window.location.reload();
    } catch (err: any) {
      alert(err.message || "Wallet payment failed");
    } finally {
      setPayingWallet(false);
    }
  };

  // --- RENDER STATES ---

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-4">
        <Loader2 className="h-12 w-12 animate-spin text-[#15803d] mb-4" />
        <h2 className="text-xl font-bold text-gray-700">Loading your order...</h2>
        <p className="text-gray-500 mt-2">Order ID: {orderId}</p>
      </div>
    );
  }
  
  if (errorMsg) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-4 text-center">
        <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-3xl font-bold text-red-800 mb-2">Could not load order</h1>
        <p className="text-lg text-red-600 mb-8 max-w-lg font-medium">{errorMsg}</p>
        <Link href="/orders" className="bg-[#15803d] text-white px-8 py-3 rounded-md font-bold text-lg">
          Back to Orders
        </Link>
      </div>
    );
  }

  if (!order) return null;

  const stages = ["PAID", "PROCURED", "DISPATCHED", "DELIVERED"];
  const currentStageIndex = stages.indexOf(order.status);

  return (
    <main className="min-h-screen bg-[#faf7f0] py-12 px-4 print:bg-white print:py-0">
      
      <div className="max-w-3xl mx-auto print:hidden">
        <Link href="/orders" className="inline-flex items-center gap-2 text-[#15803d] font-bold mb-6 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Orders
        </Link>
      </div>

      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none print:border-none print:rounded-none">
        
        {order.status === "PENDING_PAYMENT" && (
          <div className="bg-orange-500 text-white p-6 text-center print:hidden flex flex-col items-center gap-3">
            <p className="font-bold text-lg">Action Required: Payment Pending</p>
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md mx-auto mt-2">
              <Button onClick={handlePayStack} disabled={paying} className="bg-white text-orange-600 hover:bg-gray-100 font-bold px-6 h-12 flex-1 shadow-lg">
                <CreditCard className="h-5 w-5 mr-2" /> {paying ? "Processing..." : "Pay with Card"}
              </Button>
              <Button onClick={handlePayWallet} disabled={payingWallet || walletBalance < order.total_kobo} className="bg-[#15803d] hover:bg-[#14532d] text-white font-bold px-6 h-12 flex-1 shadow-lg border-2 border-white">
                <Wallet className="h-5 w-5 mr-2" /> {payingWallet ? "Processing..." : `Pay with Wallet (₦${walletBalance/100})`}
              </Button>
            </div>
          </div>
        )}

        <div className="bg-[#14532d] text-white p-6 md:p-8 print:bg-white print:text-black print:border-b print:p-0 print:pb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2 print:text-2xl">Invoice</h1>
              <p className="text-green-200 print:text-gray-500">Order #{order.id.slice(0, 8).toUpperCase()}</p>
              <p className="text-green-200 print:text-gray-500">Date: {new Date(order.created_at).toLocaleDateString()}</p>
            </div>
            <div className="text-right flex flex-col items-end">
              <img src="/agrover-logo.png" alt="Agrova Logo" className="h-12 w-auto mb-2 bg-white p-1 rounded" />
              <p className="text-sm text-green-200 print:text-gray-500">Abuja, Nigeria</p>
              <p className="text-sm text-green-200 print:text-gray-500">support@agrova.ng</p>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 border-b border-gray-100 flex justify-between print:p-0 print:py-6">
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Billed To</p>
            <p className="font-bold text-gray-900">{user?.full_name || user?.phone || "Customer"}</p>
            <p className="text-sm text-gray-600">{user?.phone}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Delivery Address</p>
            <p className="text-sm text-gray-900 max-w-xs">{order.delivery_directions || "Estate Hub Pickup"}</p>
          </div>
        </div>

        {order.status !== "CANCELLED" && (
          <div className="p-6 md:p-8 border-b border-gray-100 print:hidden">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Order Tracking</h2>
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 z-0"></div>
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#15803d] z-0 transition-all duration-500" style={{ width: `${(Math.max(0, currentStageIndex) / (stages.length - 1)) * 100}%` }}></div>
              {stages.map((stage, idx) => {
                const isComplete = currentStageIndex >= idx;
                const Icon = stage === "PAID" ? Clock : stage === "PROCURED" ? Package : stage === "DISPATCHED" ? Truck : CheckCircle2;
                return (
                  <div key={stage} className="relative z-10 flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isComplete ? "bg-[#15803d] text-white shadow-md" : "bg-gray-200 text-gray-400"}`}><Icon className="h-5 w-5" /></div>
                    <span className={`text-xs font-bold ${isComplete ? "text-[#15803d]" : "text-gray-400"}`}>{stage}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {order.status === "DISPATCHED" && (
          <div className="p-6 md:p-8 bg-green-50 border-b border-green-100 text-center print:hidden">
            <h3 className="text-lg font-bold text-[#14532d] mb-2">Your Pickup PIN</h3>
            <div className="text-4xl font-extrabold tracking-[1em] text-[#15803d] bg-white inline-block px-8 py-4 rounded-xl shadow-md border-2 border-[#15803d]">{order.pickup_pin || "****"}</div>
          </div>
        )}

        <div className="p-6 md:p-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left font-bold text-gray-600 pb-3">Item</th>
                <th className="text-center font-bold text-gray-600 pb-3">Qty</th>
                <th className="text-right font-bold text-gray-600 pb-3">Price</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item: any) => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="py-3"><p className="font-semibold text-gray-900">{item.product_name}</p><p className="text-xs text-gray-500">{item.product_unit}</p></td>
                  <td className="text-center py-3 text-gray-700">{item.quantity}</td>
                  <td className="text-right py-3 font-semibold text-gray-900">{koboToNaira(item.line_total_kobo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="mt-6 flex justify-end">
            <div className="w-full md:w-1/2 space-y-2">
              <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>{koboToNaira(order.subtotal_kobo)}</span></div>
              <div className="flex justify-between text-sm text-gray-600"><span>Delivery</span><span>{koboToNaira(order.delivery_fee_kobo)}</span></div>
              <div className="flex justify-between text-sm text-gray-600"><span>Service Fee</span><span>{koboToNaira(order.service_fee_kobo)}</span></div>
              <div className="flex justify-between font-extrabold text-xl text-[#15803d] border-t-2 border-gray-200 pt-3 mt-3"><span>Total</span><span>{koboToNaira(order.total_kobo)}</span></div>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 bg-gray-50 flex flex-col sm:flex-row gap-3 print:hidden">
          <Button onClick={() => window.print()} className="bg-gray-800 hover:bg-gray-900 text-white h-12 flex-1 font-bold"><Printer className="h-4 w-4 mr-2" /> Print Receipt</Button>
          {order.status === "PENDING_PAYMENT" && (
            <Button onClick={handleCancel} disabled={cancelling} variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 h-12 flex-1 font-bold"><XCircle className="h-4 w-4 mr-2" /> Cancel Order</Button>
          )}
        </div>
      </div>
    </main>
  );
}