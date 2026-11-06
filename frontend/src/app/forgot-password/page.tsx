"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Phone number verified. Please set a new password.");
      setStep(2);
    } catch {
      toast.error("Error verifying phone number");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone, new_password: newPassword }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Password updated! Please log in.");
      router.push("/login");
    } catch {
      toast.error("Error resetting password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#faf7f0] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-green-100">
        <h1 className="text-3xl font-bold text-[#14532d] mb-2 text-center">Reset Password</h1>
        <p className="text-gray-500 text-center mb-8">Recover access to your Agrova account.</p>

        {step === 1 ? (
          <form onSubmit={handleRequest} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input type="text" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08012345678" className="w-full h-11 px-4 border rounded-lg focus:ring-2 focus:ring-[#15803d] outline-none" />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-11 bg-[#15803d]">
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Verify Phone Number"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className="w-full h-11 px-4 border rounded-lg focus:ring-2 focus:ring-[#15803d] outline-none" />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-11 bg-[#15803d]">
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Save New Password"}
            </Button>
          </form>
        )}
        <p className="text-center text-sm mt-4"><Link href="/login" className="text-[#15803d] hover:underline">Back to Login</Link></p>
      </div>
    </main>
  );
}