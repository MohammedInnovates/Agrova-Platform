"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { getUser, saveAuth, type AuthUser } from "@/lib/auth";
import { fetchEstates, type Estate } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Save, User as UserIcon, MapPin } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [estates, setEstates] = useState<Estate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    estate_id: "",
    default_address_directions: "",
  });

  useEffect(() => {
    const u = getUser();
    if (!u) {
      router.push("/login");
      return;
    }
    setUser(u);
    setForm(prev => ({ ...prev, full_name: u.full_name || "" }));

    async function loadEstates() {
      try {
        const data = await fetchEstates();
        setEstates(data);
      } catch { }
      setLoading(false);
    }
    loadEstates();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("agrover_token")}`
        },
        body: JSON.stringify({
          full_name: form.full_name,
          estate_id: form.estate_id || null,
          default_address_directions: form.default_address_directions || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to update profile");
      const data = await res.json();

      const currentUser = getUser();
      if (currentUser) {
        saveAuth(localStorage.getItem("agrover_token") || "", {
          ...currentUser,
          full_name: data.full_name,
        });
      }

      toast.success("Profile updated successfully!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-green-600 h-10 w-10" /></div>;

  return (
    <main className="min-h-screen bg-[#faf7f0] py-12 px-4">
      <div className="max-w-xl mx-auto">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-[#15803d] font-bold mb-6 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        <Card className="border-green-100 shadow-lg">
          <CardHeader className="bg-[#14532d] text-white rounded-t-xl pb-8">
            <div className="flex items-center gap-3 mb-2">
              <UserIcon className="h-6 w-6 text-green-300" />
              <CardTitle className="text-2xl">My Profile</CardTitle>
            </div>
            <p className="text-green-200 text-sm">Update your delivery preferences.</p>
          </CardHeader>
          
          <CardContent className="pt-6">
            <form onSubmit={handleSave} className="space-y-6">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input type="text" disabled value={user.phone} className="w-full h-11 px-4 border border-gray-200 bg-gray-50 rounded-lg text-gray-500 cursor-not-allowed" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input type="text" required value={form.full_name} onChange={(e) => setForm({...form, full_name: e.target.value})} placeholder="e.g. John Doe" className="w-full h-11 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#15803d] outline-none" />
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-5 w-5 text-[#15803d]" />
                  <h3 className="font-bold text-gray-800">Delivery Address</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Estate (Optional)</label>
                  <select value={form.estate_id} onChange={(e) => setForm({...form, estate_id: e.target.value})} className="w-full h-11 px-3 border border-gray-300 rounded-lg bg-white">
                    <option value="">-- No default estate --</option>
                    {estates.map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.area})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street Address / Directions</label>
                  <textarea 
                    value={form.default_address_directions} 
                    onChange={(e) => setForm({...form, default_address_directions: e.target.value})} 
                    placeholder="e.g. No 5, Mabushi Road, opposite Total Filling Station..."
                    className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-[#15803d] outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">If you don't live in an estate, type your full address here.</p>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button type="submit" disabled={saving} className="bg-[#15803d] hover:bg-[#14532d] text-white">
                  {saving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Profile
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}