"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { fetchWithAuth } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CalendarDays, Plus, Lock } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

type Batch = {
  id: string;
  code: string;
  cutoff_at: string;
  delivery_date: string;
  status: string;
};

export default function AdminBatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [form, setForm] = useState({
    code: "", cutoff_date: "", delivery_date: ""
  });

  const loadBatches = async () => {
    try {
      const res = await fetchWithAuth(`${API_URL}/batches/admin/all`);
      if (!res.ok) throw new Error();
      setBatches(await res.json());
    } catch {
      toast.error("Failed to load batches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBatches(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchWithAuth(`${API_URL}/batches/admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail);
      }
      toast.success("New Batch Window Created!");
      setIsFormOpen(false);
      setForm({ code: "", cutoff_date: "", delivery_date: "" });
      loadBatches();
    } catch (err: any) {
      toast.error(err.message || "Error creating batch");
    }
  };

  const handleClose = async (id: string) => {
    if (!confirm("Are you sure you want to lock this batch? No new orders will be accepted.")) return;
    try {
      await fetchWithAuth(`${API_URL}/batches/admin/${id}/close`, { method: "PATCH" });
      toast.success("Batch Locked!");
      loadBatches();
    } catch {
      toast.error("Failed to close batch");
    }
  };

  return (
    <div className="max-w-5xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#14532d]">Batch Windows</h1>
          <p className="text-gray-500">Manage weekly cutoffs and delivery schedules.</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="bg-[#15803d]">
          <Plus className="h-4 w-4 mr-2" /> Create New Batch
        </Button>
      </div>

      {isFormOpen && (
        <Card className="mb-8 border-[#15803d] shadow-lg">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4">Create New Week</h2>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Batch Code (e.g. Week 45)</label>
                <input required value={form.code} onChange={e => setForm({...form, code: e.target.value})} className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="text-sm font-medium">Cutoff Date (Thursday)</label>
                <input type="date" required value={form.cutoff_date} onChange={e => setForm({...form, cutoff_date: e.target.value})} className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="text-sm font-medium">Delivery Date (Saturday)</label>
                <input type="date" required value={form.delivery_date} onChange={e => setForm({...form, delivery_date: e.target.value})} className="w-full border p-2 rounded" />
              </div>
              <div className="md:col-span-3 flex justify-end gap-2 mt-2">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-[#15803d]">Save Batch</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? <div className="text-center py-10"><Loader2 className="animate-spin mx-auto text-green-600" /></div> : (
        <div className="grid gap-4">
          {batches.map(batch => (
            <Card key={batch.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                    <CalendarDays className="h-6 w-6 text-[#15803d]" />
                  </div>
                  <div>
                    <p className="font-bold text-[#14532d] text-lg">{batch.code}</p>
                    <p className="text-sm text-gray-500">
                      Cutoff: {new Date(batch.cutoff_at).toLocaleString()} | Delivery: {new Date(batch.delivery_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge className={batch.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
                    {batch.status}
                  </Badge>
                  {batch.status === 'SCHEDULED' && (
                    <Button onClick={() => handleClose(batch.id)} variant="outline" size="sm" className="text-orange-600 border-orange-200 hover:bg-orange-50">
                      <Lock className="h-4 w-4 mr-2" /> Force Close
                    </Button>
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