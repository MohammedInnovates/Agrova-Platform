"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, Package, Tags, MessageSquareQuote, LogOut, ArrowLeft, ClipboardList, ShieldAlert, ShoppingBag, CalendarDays, Settings } from "lucide-react";
import { getUser, clearAuth, type AuthUser } from "@/lib/auth";

const sidebarLinks = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Order Fulfillment", icon: ClipboardList },
  { href: "/admin/procurement", label: "Procurement", icon: ShoppingBag },
  { href: "/admin/batches", label: "Batch Windows", icon: CalendarDays },
  { href: "/admin/products", label: "Products & Inventory", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/lists", label: "Custom Quotes", icon: MessageSquareQuote },
  { href: "/admin/settings", label: "Global Settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const u = getUser();
    if (!u || u.role !== "admin") {
      router.push("/login");
    } else {
      setUser(u);
    }
    setIsChecking(false);
  }, [router]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 font-medium animate-pulse">Verifying Admin Access...</p>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-4">
        <ShieldAlert className="h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-500 mb-6">You do not have permission to view this page.</p>
        <button onClick={() => router.push("/")} className="bg-[#15803d] text-white px-6 py-2 rounded-md font-bold">
          Return to Store
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-[#14532d] text-white flex-col hidden md:flex fixed h-full z-10 print:hidden">
        <div className="p-6 flex items-center gap-3 border-b border-green-800">
          <span className="text-2xl">🌾</span>
          <div>
            <p className="font-bold text-lg leading-tight">Agrova</p>
            <p className="text-xs text-green-300">Admin Suite</p>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link key={link.href} href={link.href} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive ? "bg-white/10 text-white" : "text-green-100 hover:bg-white/5"}`}>
                <link.icon className="h-5 w-5" /> {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-green-800">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 text-sm text-green-200 hover:text-white transition-colors mb-2"><ArrowLeft className="h-4 w-4" /> Back to Store</Link>
          <button onClick={() => { clearAuth(); router.push("/"); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"><LogOut className="h-4 w-4" /> Log Out</button>
        </div>
      </aside>
      <main className="flex-1 md:ml-64 p-8">{children}</main>
    </div>
  );
}