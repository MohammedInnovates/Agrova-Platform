"use client";

import { useEffect, useState } from "react";
import { fetchWithAuth, koboToNaira } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Package, MessageSquareQuote, ClipboardList, TrendingUp, Loader2 } from "lucide-react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

type Stats = {
  total_products: number;
  pending_quotes: number;
  active_orders: number;
  total_revenue_kobo: number;
};

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetchWithAuth(`${API_URL}/orders/admin/stats`);
        if (res.ok) setStats(await res.json());
      } catch (err) {
        console.error("Failed to load stats");
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-green-600 h-10 w-10" /></div>;
  }

  const cards = [
    { title: "Total Revenue", value: koboToNaira(stats?.total_revenue_kobo || 0), icon: TrendingUp, color: "text-green-600", bg: "bg-green-50", link: "/admin/orders" },
    { title: "Active Orders", value: stats?.active_orders || 0, icon: ClipboardList, color: "text-blue-600", bg: "bg-blue-50", link: "/admin/orders" },
    { title: "Pending Quotes", value: stats?.pending_quotes || 0, icon: MessageSquareQuote, color: "text-orange-500", bg: "bg-orange-50", link: "/admin/lists" },
    { title: "Active Products", value: stats?.total_products || 0, icon: Package, color: "text-purple-600", bg: "bg-purple-50", link: "/admin/products" },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-[#14532d] mb-2">Mission Control</h1>
      <p className="text-gray-500 mb-8">Live overview of your store's performance.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <Link key={idx} href={card.link}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-gray-100">
              <CardContent className="p-6">
                <div className={`w-12 h-12 rounded-lg ${card.bg} flex items-center justify-center mb-4`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
                <p className="text-sm text-gray-500 font-medium">{card.title}</p>
                <p className="text-3xl font-extrabold text-gray-900 mt-1">{card.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}