"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Edit, Loader2, Save, X, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fetchCategories, fetchWithAuth, type Category } from "@/lib/api";
import { resolveImageUrl } from "@/lib/imageHelper";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({ id: "", name: "", slug: "", description: "", image_url: "", display_order: 0, show_on_homepage: true });

  const load = async () => {
    try { const data = await fetchCategories(); setCategories(data); } catch { toast.error("Failed"); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true); const formData = new FormData(); formData.append("file", file);
    try {
      const res = await fetch(`${API_URL}/uploads/image`, { method: "POST", body: formData });
      const data = await res.json(); setForm(p => ({ ...p, image_url: data.url })); toast.success("Uploaded");
    } catch { toast.error("Upload failed"); } finally { setUploading(false); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = form.id ? "PUT" : "POST";
    const url = form.id ? `${API_URL}/categories/admin/${form.id}` : `${API_URL}/categories/admin`;
    try {
      const res = await fetchWithAuth(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, subcategories: [] }),
      });
      if (!res.ok) throw new Error();
      toast.success("Saved"); setIsEditing(false); load();
    } catch { toast.error("Error saving"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return;
    try { await fetchWithAuth(`${API_URL}/categories/admin/${id}`, { method: "DELETE" }); toast.success("Deleted"); load(); } catch { toast.error("Failed"); }
  };

  return (
    <div className="max-w-5xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-[#14532d]">Category Manager</h1>
        <Button onClick={() => { setForm({ id: "", name: "", slug: "", description: "", image_url: "", display_order: 0, show_on_homepage: true }); setIsEditing(true); }} className="bg-[#15803d]"><Plus className="h-4 w-4 mr-2" /> Add</Button>
      </div>

      {isEditing && (
        <Card className="mb-8 border-[#15803d]">
          <CardContent className="p-6">
            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label>Name</label><input required value={form.name} onChange={e => setForm({...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/ /g, '-')})} className="w-full border p-2" /></div>
              <div><label>Slug</label><input required value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} className="w-full border p-2 bg-gray-50" /></div>
              <div className="md:col-span-2"><label>Description</label><input value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border p-2" /></div>
              
              <div className="md:col-span-2 bg-gray-50 p-4 rounded border">
                <div className="flex items-center gap-4">
                  {form.image_url && <img src={resolveImageUrl(form.image_url)} className="w-16 h-16 rounded object-cover" />}
                  <label className="cursor-pointer bg-white border px-4 py-2 rounded text-sm font-medium">
                    {uploading ? "Uploading..." : "Upload Image"}
                    <input type="file" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                  </label>
                  <input value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} placeholder="Or paste URL" className="flex-1 border p-1 text-sm" />
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" checked={form.show_on_homepage} onChange={e => setForm({...form, show_on_homepage: e.target.checked})} className="w-4 h-4" />
                <label className="text-sm">Show on Homepage</label>
              </div>
              
              <div className="md:col-span-2 flex justify-end gap-2 mt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button type="submit" className="bg-[#15803d]">Save</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map(cat => (
          <Card key={cat.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {cat.image_url && <img src={resolveImageUrl(cat.image_url)} className="w-10 h-10 rounded-full object-cover" />}
                <div><p className="font-bold">{cat.name}</p><p className="text-xs text-gray-500">Order: {cat.display_order} | {cat.show_on_homepage ? "Visible" : "Hidden"}</p></div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => { setForm(cat); setIsEditing(true); }} size="sm" variant="outline"><Edit className="h-4 w-4" /></Button>
                <Button onClick={() => handleDelete(cat.id)} size="sm" variant="outline" className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}