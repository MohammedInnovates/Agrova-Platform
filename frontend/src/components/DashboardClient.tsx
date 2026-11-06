"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getUser, clearAuth, type AuthUser } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Wallet, LogOut, User as UserIcon, ShoppingBag, Settings } from "lucide-react";

export default function DashboardClient() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const u = getUser();
    if (!u) {
      router.push("/login");
    } else {
      setUser(u);
    }
  }, [router]);

  if (!mounted || !user) return null;

  const handleLogout = () => {
    clearAuth();
    router.push("/");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#14532d]">My Dashboard</h1>
          <p className="text-gray-500">Welcome back, {user.full_name || user.phone}</p>
        </div>
        <Button variant="outline" onClick={handleLogout} className="text-red-600 border-red-200 hover:bg-red-50">
          <LogOut className="h-4 w-4 mr-2" /> Log Out
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-600 to-green-800 text-white border-0">
          <CardContent className="p-6">
            <Wallet className="h-8 w-8 mb-4 text-green-200" />
            <p className="text-sm text-green-100 mb-1">Wallet Balance</p>
            <p className="text-3xl font-bold">₦0</p>
            <Link href="/wallet" className="text-xs text-green-200 hover:text-white underline mt-4 block">
              Top up wallet
            </Link>
          </CardContent>
        </Card>

        <Link href="/orders">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full border-green-100">
            <CardContent className="p-6">
              <Package className="h-8 w-8 mb-4 text-[#15803d]" />
              <p className="text-sm text-gray-500 mb-1">My Orders</p>
              <p className="text-xl font-bold text-[#14532d]">View History</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/profile">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full border-green-100">
            <CardContent className="p-6">
              <Settings className="h-8 w-8 mb-4 text-[#15803d]" />
              <p className="text-sm text-gray-500 mb-1">My Profile</p>
              <p className="font-bold text-[#14532d]">Manage Account</p>
              <p className="text-xs text-gray-400 capitalize">{user.role}</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Action Buttons */}
      <div className="bg-white p-8 rounded-xl border border-green-100 text-center shadow-sm">
        <h2 className="text-xl font-bold text-[#14532d] mb-2">Ready to shop?</h2>
        <p className="text-gray-500 mb-6">Explore our catalog or use the AI list to get a quote.</p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/products" className="inline-flex items-center justify-center gap-2 rounded-md bg-[#15803d] hover:bg-[#14532d] text-white h-11 px-8 text-sm font-medium transition-colors">
            <ShoppingBag className="h-4 w-4" /> Browse Catalog
          </Link>
          <Link href="/custom-list" className="inline-flex items-center justify-center rounded-md border border-gray-300 hover:bg-gray-50 text-gray-700 h-11 px-8 text-sm font-medium transition-colors">
            AI Shopping List
          </Link>
        </div>
      </div>
    </div>
  );
}