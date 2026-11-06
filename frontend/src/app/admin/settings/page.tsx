"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { fetchWithAuth } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    delivery_fee_hub: 0,
    delivery_fee_home: 0,
    express_surcharge: 0,
    monthly_discount: 0,
    service_fee_percent: 0
  });

  const loadSettings = async () => {
    try {
      const res = await fetchWithAuth(`${API_URL}/settings/admin`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      
      setForm({
        delivery_fee_hub: data.delivery_fee_hub_kobo / 100,
        delivery_fee_home: data.delivery_fee_home_kobo / 100,
        express_surcharge: data.express_surcharge_kobo / 100,
        monthly_discount: data.monthly_discount_kobo / 100,
        service_fee_percent: data.service_fee_percent * 100
      });
    } catch {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSettings(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetchWithAuth(`${API_URL}/settings/admin`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          delivery_fee_hub_kobo: Math.round(form.delivery_fee_hub * 100),
          delivery_fee_home_kobo: Math.round(form.delivery_fee_home * 100),
          express_surcharge_kobo: Math.round(form.express_surcharge * 100),
          monthly_discount_kobo: Math.round(form.monthly_discount * 100),
          service_fee_percent: form.service_fee_percent / 100
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Settings saved successfully!");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-green-600 h-10 w-10" /></div>;

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#14532d]">Global Settings</h1>
        <p className="text-gray-500">Manage delivery fees and platform service fees dynamically.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-[#14532d]">Delivery & Service Fees</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estate Hub Pickup Fee (₦)</label>
                <input type="number" required value={form.delivery_fee_hub} onChange={(e) => setForm({...form, delivery_fee_hub: Number(e.target.value)})} className="w-full border p-2 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Home Delivery Fee (₦)</label>
                <input type="number" required value={form.delivery_fee_home} onChange={(e) => setForm({...form, delivery_fee_home: Number(e.target.value)})} className="w-full border p-2 rounded-md" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Express Delivery Surcharge (₦)</label>
                <input type="number" required value={form.express_surcharge} onChange={(e) => setForm({...form, express_surcharge: Number(e.target.value)})} className="w-full border p-2 rounded-md" />
                <p className="text-xs text-gray-500 mt-1">Added on top of the base delivery fee.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Batch Discount (₦)</label>
                <input type="number" required value={form.monthly_discount} onChange={(e) => setForm({...form, monthly_discount: Number(e.target.value)})} className="w-full border p-2 rounded-md" />
                <p className="text-xs text-gray-500 mt-1">Subtracted from the base delivery fee.</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Platform Service Fee (%)</label>
              <input type="number" step="0.01" required value={form.service_fee_percent} onChange={(e) => setForm({...form, service_fee_percent: Number(e.target.value)})} className="w-full border p-2 rounded-md" />
              <p className="text-xs text-gray-500 mt-1">Charged on the subtotal at checkout (e.g. 1.5).</p>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button type="submit" disabled={saving} className="bg-[#15803d] hover:bg-[#14532d] text-white">
                {saving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Settings
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}