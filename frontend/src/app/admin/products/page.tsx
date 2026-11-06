"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Loader2, UploadCloud, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { koboToNaira, fetchCategories, fetchWithAuth, type Product, type Category } from "@/lib/api";
import { getProductImage, resolveImageUrl } from "@/lib/imageHelper";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({ name: "", category: "", description: "", bulk_unit: "50kg Bag", bulk_unit_price_kobo: 0, brand: "", stock_quantity: 10, image_url: "", local_unit_name: "", local_unit_multiplier: 0, local_unit_kg: 0 });

  const loadData = async () => {
    try {
      const [prodRes, catData] = await Promise.all([fetch(`${API_URL}/products`), fetchCategories()]);
      setProducts(await prodRes.json()); setCategories(catData);
    } catch { toast.error("Failed to load"); } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true); const formData = new FormData(); formData.append("file", file);
    try { const res = await fetch(`${API_URL}/uploads/image`, { method: "POST", body: formData }); const data = await res.json(); setForm(p => ({ ...p, image_url: data.url })); } catch { toast.error("Failed"); } finally { setUploading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `${API_URL}/products/admin/${editingId}` : `${API_URL}/products/admin`;
    try {
      const res = await fetchWithAuth(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, bulk_unit_price_kobo: Number(form.bulk_unit_price_kobo) * 100, local_unit_multiplier: form.local_unit_multiplier || null, local_unit_kg: form.local_unit_kg || null, local_unit_name: form.local_unit_name || null }),
      });
      if (!res.ok) throw new Error();
      toast.success("Saved"); setIsFormOpen(false); loadData();
    } catch { toast.error("Error saving"); }
  };

  return (
    <div className="max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-[#14532d]">Products & Inventory</h1>
        <Button onClick={() => { setEditingId(null); setForm({ name: "", category: "", description: "", bulk_unit: "50kg Bag", bulk_unit_price_kobo: 0, brand: "", stock_quantity: 10, image_url: "", local_unit_name: "", local_unit_multiplier: 0, local_unit_kg: 0 }); setIsFormOpen(true); }} className="bg-[#15803d]"><Plus className="h-4 w-4 mr-2" /> Add</Button>
      </div>

      {isFormOpen && (
        <Card className="mb-8 border-[#15803d]">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label>Name</label><input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border p-2" /></div>
              <div>
                <label>Category</label>
                <input list="cats" required value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full border p-2" />
                <datalist id="cats">{categories.map(c => <option key={c.id} value={c.name} />)}</datalist>
              </div>
              <div className="md:col-span-2"><label>Description</label><textarea required value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border p-2" /></div>
              
              <div className="md:col-span-2 bg-gray-50 p-4 rounded border flex gap-4 items-center">
                {form.image_url && <img src={resolveImageUrl(form.image_url)} className="w-16 h-16 object-cover rounded" />}
                <label className="cursor-pointer bg-white border px-4 py-2 rounded text-sm">
                  Upload
                  <input type="file" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </label>
                <input value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} placeholder="Or paste URL" className="flex-1 border p-1" />
              </div>
              
              <div><label>Bulk Unit</label><input required value={form.bulk_unit} onChange={e => setForm({...form, bulk_unit: e.target.value})} className="w-full border p-2" /></div>
              <div><label>Bulk Price (₦)</label><input type="number" required value={form.bulk_unit_price_kobo} onChange={e => setForm({...form, bulk_unit_price_kobo: Number(e.target.value)})} className="w-full border p-2" /></div>
              <div><label>Stock</label><input type="number" required value={form.stock_quantity} onChange={e => setForm({...form, stock_quantity: Number(e.target.value)})} className="w-full border p-2" /></div>
              <div><label>Brand</label><input value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} className="w-full border p-2" /></div>
              
              <div className="md:col-span-2 border-t pt-4 mt-2 grid grid-cols-3 gap-4">
                <div><label>Local Unit</label><input value={form.local_unit_name} onChange={e => setForm({...form, local_unit_name: e.target.value})} className="w-full border p-2" /></div>
                <div><label>KG</label><input type="number" step="0.1" value={form.local_unit_kg} onChange={e => setForm({...form, local_unit_kg: Number(e.target.value)})} className="w-full border p-2" /></div>
                <div><label>Multiplier</label><input type="number" step="0.001" value={form.local_unit_multiplier} onChange={e => setForm({...form, local_unit_multiplier: Number(e.target.value)})} className="w-full border p-2" /></div>
              </div>

              <div className="md:col-span-2 flex justify-end gap-2 mt-4"><Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button><Button type="submit" className="bg-[#15803d]">Save</Button></div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b"><tr><th className="p-4">Product</th><th className="p-4">Category</th><th className="p-4">Price</th><th className="p-4 text-right">Actions</th></tr></thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} className="border-b">
                  <td className="p-4 flex items-center gap-3"><img src={getProductImage(p)} className="w-8 h-8 rounded object-cover" /><p className="font-bold">{p.name}</p></td>
                  <td className="p-4"><Badge>{p.category}</Badge></td>
                  <td className="p-4 font-bold text-[#15803d]">{koboToNaira(p.bulk_unit_price_kobo)}</td>
                  <td className="p-4 text-right">
                    <Button onClick={() => { setForm({...p, bulk_unit_price_kobo: p.bulk_unit_price_kobo / 100}); setEditingId(p.id); setIsFormOpen(true); }} size="sm" variant="outline" className="mr-2"><Edit className="h-4 w-4" /></Button>
                    <Button onClick={async () => { if(confirm("Delete?")) { await fetchWithAuth(`${API_URL}/products/admin/${p.id}`, { method: "DELETE" }); loadData(); } }} size="sm" variant="outline" className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}