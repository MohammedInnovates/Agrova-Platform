"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { fetchWithAuth } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, PackageSearch, Printer } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

type ManifestItem = {
  product_name: string;
  product_unit: string;
  total_quantity: number;
  orders_count: number;
};

export default function ProcurementPage() {
  const [manifest, setManifest] = useState<ManifestItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadManifest = async () => {
    try {
      const res = await fetchWithAuth(`${API_URL}/orders/admin/procurement-manifest`);
      if (!res.ok) throw new Error("Failed to load manifest");
      const data = await res.json();
      setManifest(data);
    } catch {
      toast.error("Failed to load procurement list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadManifest(); }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl">
      <div className="flex justify-between items-end mb-8 print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-[#14532d]">Procurement Manifest</h1>
          <p className="text-gray-500">Master shopping list of all PAID orders ready for the farm.</p>
        </div>
        <Button onClick={handlePrint} disabled={manifest.length === 0} className="bg-gray-800 hover:bg-gray-900 text-white">
          <Printer className="h-4 w-4 mr-2" /> Print Manifest
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-10"><Loader2 className="animate-spin mx-auto text-green-600" /></div>
      ) : manifest.length === 0 ? (
        <Card className="text-center py-16 print:hidden">
          <PackageSearch className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-bold text-gray-700 mb-2">No paid orders yet</h3>
          <p className="text-gray-500">When customers pay for their orders, the items will aggregate here.</p>
        </Card>
      ) : (
        <Card className="print:shadow-none print:border-none">
          <CardHeader className="border-b print:hidden">
            <CardTitle className="text-[#14532d]">Items to Purchase</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b print:bg-white">
                <tr>
                  <th className="px-6 py-4 font-semibold text-gray-700">Product Name</th>
                  <th className="px-6 py-4 font-semibold text-gray-700">Selling Unit</th>
                  <th className="px-6 py-4 font-semibold text-gray-700 text-center">Total Quantity Needed</th>
                  <th className="px-6 py-4 font-semibold text-gray-700 text-center">From Orders</th>
                </tr>
              </thead>
              <tbody>
                {manifest.map((item, idx) => (
                  <tr key={idx} className="border-b last:border-0 hover:bg-gray-50 print:hover:bg-white">
                    <td className="px-6 py-4 font-bold text-[#14532d]">{item.product_name}</td>
                    <td className="px-6 py-4 text-gray-600">{item.product_unit}</td>
                    <td className="px-6 py-4 text-center text-xl font-extrabold text-[#15803d]">{item.total_quantity}</td>
                    <td className="px-6 py-4 text-center text-gray-500">{item.orders_count} customers</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}