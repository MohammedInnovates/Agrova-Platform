import Link from "next/link";
import { redirect } from "next/navigation";
import { Package, Wallet, User } from "lucide-react";

// In a real app we'd check the cookie/token on the server here. 
// For now, we render a client component that checks localStorage.
import DashboardClient from "@/components/DashboardClient";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#faf7f0] p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <DashboardClient />
      </div>
    </main>
  );
}