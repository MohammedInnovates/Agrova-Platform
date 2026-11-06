"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { saveAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({ full_name: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Registration failed");

      saveAuth(data.access_token, data.user);
      toast.success("Account created successfully!");
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
        <input
          type="text" required value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          placeholder="John Doe"
          className="w-full h-11 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#15803d] outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
        <input
          type="text" required value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="08012345678"
          className="w-full h-11 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#15803d] outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
        <input
          type="password" required value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="Minimum 6 characters"
          className="w-full h-11 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#15803d] outline-none"
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full h-11 bg-[#15803d] hover:bg-[#14532d] text-base">
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create Account"}
      </Button>
      
      <p className="text-center text-sm text-gray-600 mt-4">
        Already have an account?{" "}
        <Link href="/login" className="text-[#15803d] font-semibold hover:underline">
          Log in here
        </Link>
      </p>
    </form>
  );
}