"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchWithAuth, koboToNaira } from "@/lib/api";
import { Loader2, KeyRound, CheckCircle2, Phone, MapPin, User } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export default function DriverOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState("");

  const loadOrders = async () => {
    try {
      // Fetch only the orders the driver needs to see
      const res = await fetchWithAuth(`${API_URL}/orders/driver/all`);
      if (!res.ok) throw new Error();
      setOrders(await res.json());
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, []);

  const handleGeneratePin = async (orderId: string) => {
    try {
      const res = await fetchWithAuth(`${API_URL}/orders/${orderId}/generate-pin`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      toast.success(data.message, { duration: 10000 });
      loadOrders();
    } catch (err: any) { toast.error(err.message || "Failed to generate PIN"); }
  };

  const handleVerifyPin = async (orderId: string) => {
    if (pinInput.length !== 4) return toast.error("PIN must be 4 digits");
    try {
      const res = await fetchWithAuth(`${API_URL}/orders/${orderId}/verify-pin`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin: pinInput })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      toast.success("Delivery Verified! Food handed over.");
      setVerifyingId(null); setPinInput(""); loadOrders();
    } catch (err: any) { toast.error(err.message || "Invalid PIN"); }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-4">Today's Deliveries</h2>
      
      {loading ? <div className="text-center py-10"><Loader2 className="animate-spin mx-auto text-green-600" /></div> : 
       orders.length === 0 ? <div className="text-center text-gray-500 py-10 bg-white rounded-lg border">No dispatched orders right now.</div> : (
        <div className="space-y-4">
          {orders.map(order => (
            <Card key={order.id} className="border-gray-200 shadow-sm">
              <CardHeader className="pb-3 bg-gray-50 border-b flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-[#14532d]">Order #{order.id.slice(0,8)}</CardTitle>
                  <p className="text-xs text-gray-500">{order.items.length} items · {koboToNaira(order.total_kobo)}</p>
                </div>
                <Badge className={order.status === 'DISPATCHED' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}>
                  {order.status}
                </Badge>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                
                {/* CUSTOMER INFO */}
                <div className="bg-green-50 p-3 rounded-lg border border-green-100 text-sm">
                  <p className="flex items-center gap-2 font-bold text-gray-900 mb-1">
                    <User className="h-4 w-4" /> {order.customer_name}
                  </p>
                  <a href={`tel:${order.customer_phone}`} className="flex items-center gap-2 text-[#15803d] font-bold hover:underline mb-1">
                    <Phone className="h-4 w-4" /> {order.customer_phone}
                  </a>
                  <p className="flex items-start gap-2 text-gray-700">
                    <MapPin className="h-4 w-4 shrink-0 mt-0.5" /> 
                    <span>{order.estate_name} <br/> <span className="text-xs text-gray-500">{order.delivery_directions}</span></span>
                  </p>
                </div>

                {/* ACTIONS */}
                <div className="pt-2">
                  {order.status === 'PROCURED' && (
                    <Button onClick={() => handleGeneratePin(order.id)} className="w-full bg-[#15803d] h-12 text-base">
                      <KeyRound className="h-5 w-5 mr-2" /> Generate PIN & Dispatch
                    </Button>
                  )}

                  {order.status === 'DISPATCHED' && (
                    verifyingId === order.id ? (
                      <div className="flex flex-col gap-2 bg-gray-100 p-3 rounded-lg border">
                        <label className="text-sm font-bold text-gray-700 text-center">Enter Customer's 4-Digit PIN</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            maxLength={4} 
                            value={pinInput} 
                            onChange={(e) => setPinInput(e.target.value)} 
                            className="border-2 border-gray-300 rounded-md p-3 w-full text-center text-2xl font-bold tracking-widest focus:border-[#15803d] outline-none" 
                            placeholder="XXXX" 
                          />
                          <Button onClick={() => handleVerifyPin(order.id)} className="bg-[#15803d] h-14 px-6 text-base">Verify</Button>
                        </div>
                        <Button onClick={() => setVerifyingId(null)} variant="ghost" className="text-xs text-gray-500">Cancel</Button>
                      </div>
                    ) : (
                      <Button onClick={() => setVerifyingId(order.id)} className="w-full h-12 bg-orange-500 text-base">
                        <CheckCircle2 className="h-5 w-5 mr-2" /> Verify Delivery PIN
                      </Button>
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