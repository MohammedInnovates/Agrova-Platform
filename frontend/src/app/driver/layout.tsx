"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, ShieldAlert, Truck } from "lucide-react";
import { getUser, clearAuth, type AuthUser } from "@/lib/auth";

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const u = getUser();
    // Strict Check: Only Admin or Driver can view this
    if (!u || (u.role !== "admin" && u.role !== "driver")) {
      router.push("/login");
    } else {
      setUser(u);
    }
    setIsChecking(false);
  }, [router]);

  if (isChecking) return <div className="min-h-screen flex items-center justify-center">Verifying...</div>;

  if (!user || (user.role !== "admin" && user.role !== "driver")) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-4">
        <ShieldAlert className="h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <button onClick={() => router.push("/")} className="bg-[#15803d] text-white px-6 py-2 rounded-md font-bold mt-4">Return to Store</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-[#15803d] text-white p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2">
          <Truck className="h-6 w-6" />
          <h1 className="font-bold text-lg">Agrova Driver</h1>
        </div>
        <button onClick={() => { clearAuth(); router.push("/"); }} className="flex items-center gap-1 text-sm bg-green-800 px-3 py-1.5 rounded-md">
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </header>
      <main className="flex-1 p-4 max-w-2xl mx-auto w-full">{children}</main>
    </div>
  );
}