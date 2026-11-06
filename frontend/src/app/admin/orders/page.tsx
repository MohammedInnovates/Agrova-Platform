"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, KeyRound, CheckCircle2, DollarSign, Undo2, PackageCheck, Truck, Phone, MapPin, User } from "lucide-react";
import { fetchWithAuth, koboToNaira } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState("");

  const loadOrders = async () => {
    try {
      const res = await fetchWithAuth(`${API_URL}/orders/admin/all`);
      if (!res.ok) throw new Error();
      setOrders(await res.json());
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, []);

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      await fetchWithAuth(`${API_URL}/orders/${orderId}/status`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status })
      });
      toast.success(`Order marked as ${status}`); loadOrders();
    } catch { toast.error("Failed to update status"); }
  };

  const handleGeneratePin = async (orderId: string) => {
    try {
      const res = await fetchWithAuth(`${API_URL}/orders/${orderId}/generate-pin`, { method: "POST" });
      const data = await res.json();
      toast.success(data.message, { duration: 10000 }); loadOrders();
    } catch { toast.error("Failed to generate PIN"); }
  };

  const handleVerifyPin = async (orderId: string) => {
    if (pinInput.length !== 4) return toast.error("PIN must be 4 digits");
    try {
      await fetchWithAuth(`${API_URL}/orders/${orderId}/verify-pin`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin: pinInput })
      });
      toast.success("Delivered!"); setVerifyingId(null); setPinInput(""); loadOrders();
    } catch { toast.error("Invalid PIN"); }
  };

  const handleCancelRefund = async (order: any) => {
    if (!confirm(`Refund ${koboToNaira(order.total_kobo)} to customer wallet and restore stock?`)) return;
    try {
      await fetchWithAuth(`${API_URL}/orders/admin/${order.id}/cancel-and-refund`, { method: "PATCH" });
      toast.success("Order cancelled, stock restored, funds refunded."); loadOrders();
    } catch { toast.error("Failed to cancel and refund"); }
  };

  const handleForceDeliver = async (orderId: string) => {
    if (!confirm("Force mark this order as delivered? (Bypasses PIN)")) return;
    try {
      await fetchWithAuth(`${API_URL}/orders/admin/${orderId}/force-deliver`, { method: "PATCH" });
      toast.success("Order forced to DELIVERED"); loadOrders();
    } catch { toast.error("Failed"); }
  };

  return (
    <div className="max-w-6xl">
      <h1 className="text-3xl font-bold text-[#14532d] mb-8">Order Fulfillment</h1>
      {loading ? <div className="text-center py-10"><Loader2 className="animate-spin mx-auto text-green-600" /></div> : (
        <div className="grid grid-cols-1 gap-4">
          {orders.map(order => (
            <Card key={order.id}>
              <CardHeader className="pb-3 flex flex-row items-center justify-between bg-gray-50 rounded-t-xl border-b">
                <div>
                  <CardTitle className="text-lg text-[#14532d]">Order #{order.id.slice(0,8)}</CardTitle>
                  <p className="text-sm text-gray-500">{order.items.length} items · {koboToNaira(order.total_kobo)}</p>
                </div>
                <Badge>{order.status}</Badge>
              </CardHeader>
              <CardContent className="pt-4">
                
                {/* CUSTOMER DETAILS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 bg-green-50 p-4 rounded-lg border border-green-100">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><User className="h-3 w-3" /> Customer</p>
                    <p className="font-semibold text-gray-900">{order.customer_name}</p>
                    <a href={`tel:${order.customer_phone}`} className="text-sm text-[#15803d] font-bold flex items-center gap-1 hover:underline">
                      <Phone className="h-3 w-3" /> {order.customer_phone}
                    </a>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><MapPin className="h-3 w-3" /> Delivery Location</p>
                    <p className="font-semibold text-gray-900">{order.estate_name}</p>
                    <p className="text-sm text-gray-600">{order.delivery_directions || "No extra directions provided"}</p>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {order.status === 'PENDING_PAYMENT' && <Button onClick={() => handleUpdateStatus(order.id, "PAID")} className="bg-blue-600"><DollarSign className="h-4 w-4 mr-2" /> Force Paid</Button>}
                  
                  {order.status === 'PAID' && (
                    <>
                      <Button onClick={() => handleUpdateStatus(order.id, "PROCURED")} className="bg-purple-600"><PackageCheck className="h-4 w-4 mr-2" /> Mark as Procured</Button>
                      <Button onClick={() => handleCancelRefund(order)} variant="outline" className="border-red-200 text-red-600 hover:bg-red-50"><Undo2 className="h-4 w-4 mr-2" /> Cancel & Refund</Button>
                    </>
                  )}

                  {order.status === 'PROCURED' && (
                    <>
                      <Button onClick={() => handleGeneratePin(order.id)} className="bg-[#15803d]"><Truck className="h-4 w-4 mr-2" /> Dispatch & Generate PIN</Button>
                      <Button onClick={() => handleCancelRefund(order)} variant="outline" className="border-red-200 text-red-600 hover:bg-red-50"><Undo2 className="h-4 w-4 mr-2" /> Cancel & Refund</Button>
                    </>
                  )}
                  
                  {order.status === 'DISPATCHED' && (
                    verifyingId === order.id ? (
                      <div className="flex items-center gap-2">
                        <input type="text" maxLength={4} value={pinInput} onChange={(e) => setPinInput(e.target.value)} className="border p-2 w-24 text-center font-bold" placeholder="PIN" />
                        <Button onClick={() => handleVerifyPin(order.id)} size="sm" className="bg-[#15803d]">Verify</Button>
                        <Button onClick={() => setVerifyingId(null)} size="sm" variant="outline">Cancel</Button>
                      </div>
                    ) : (
                      <>
                        <Button onClick={() => setVerifyingId(order.id)} className="bg-orange-500"><CheckCircle2 className="h-4 w-4 mr-2" /> Verify PIN</Button>
                        <Button onClick={() => handleForceDeliver(order.id)} variant="outline" className="border-orange-200 text-orange-600 hover:bg-orange-50">Force Deliver</Button>
                      </>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}