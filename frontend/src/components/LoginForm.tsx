"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { saveAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api/v1";

export default function LoginForm() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch(`${API_URL}/auth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.detail || "Invalid phone or password");
      
      saveAuth(data.access_token, data.user);
      toast.success(`Welcome back, ${data.user.full_name || "User"}!`);
      
      // Redirect based on role
      if (data.user.role === "admin") {
        window.location.href = "/admin";
      } else if (data.user.role === "driver") {
        window.location.href = "/driver/orders"; // <-- NEW DRIVER REDIRECT
      } else {
        window.location.href = "/dashboard";
      }
      
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        toast.error("The server took too long to respond. Is the backend running?");
      } else {
        toast.error(err.message || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
        <input type="text" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 08012345678" className="w-full h-11 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#15803d] outline-none" />
      </div>
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <Link href="/forgot-password" className="text-xs text-[#15803d] hover:underline font-semibold">Forgot?</Link>
        </div>
        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full h-11 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#15803d] outline-none" />
      </div>
      <Button type="submit" disabled={loading} className="w-full h-11 bg-[#15803d] hover:bg-[#14532d] text-base">
        {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Log In"}
      </Button>
      <p className="text-center text-sm text-gray-600 mt-4">
        Don't have an account? <Link href="/register" className="text-[#15803d] font-semibold hover:underline">Register here</Link>
      </p>
    </form>
  );
}