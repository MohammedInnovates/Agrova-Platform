"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { getUser, type AuthUser } from "@/lib/auth";
import { koboToNaira } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Wallet, Loader2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export default function WalletPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [balanceKobo, setBalanceKobo] = useState(0);
  const [loading, setLoading] = useState(true);
  const [topupAmount, setTopupAmount] = useState<number>(5000);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const u = getUser();
    if (!u) {
      router.push("/login");
      return;
    }
    setUser(u);

    // Fetch wallet balance
    async function fetchWallet() {
      try {
        const res = await fetch(`${API_URL}/wallet/${u!.id}`);
        if (res.ok) {
          const data = await res.json();
          setBalanceKobo(data.balance_kobo);
        }
      } catch {
        toast.error("Failed to load wallet");
      } finally {
        setLoading(false);
      }
    }
    fetchWallet();
  }, [router]);

  const handleTopUp = async () => {
    if (!user) return;
    if (topupAmount < 1000) return toast.error("Minimum top-up is ₦1,000");

    setProcessing(true);
    try {
      const res = await fetch(`${API_URL}/wallet/topup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          amount_kobo: topupAmount * 100, // Convert Naira to Kobo
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to initialize top-up");

      // If we have a real Paystack URL, redirect to it
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        toast.error("Could not connect to Paystack. Check your API keys.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setProcessing(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#faf7f0] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#15803d]" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf7f0] py-12 px-4">
      <div className="max-w-xl mx-auto">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-[#15803d] font-bold mb-6 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        <Card className="border-green-100 shadow-lg">
          <CardHeader className="bg-[#14532d] text-white rounded-t-xl pb-8">
            <div className="flex items-center gap-3 mb-2">
              <Wallet className="h-6 w-6 text-green-300" />
              <CardTitle className="text-2xl">My Wallet</CardTitle>
            </div>
            <p className="text-green-200 text-sm">Fund your wallet for faster, 1-click checkout.</p>
          </CardHeader>
          
          <CardContent className="pt-6 space-y-8">
            {/* Balance Display */}
            <div className="text-center bg-green-50 p-6 rounded-xl border border-green-100">
              <p className="text-sm text-gray-600 mb-1">Current Balance</p>
              <p className="text-4xl font-extrabold text-[#15803d]">
                {koboToNaira(balanceKobo)}
              </p>
            </div>

            {/* Top Up Form */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900">Top Up Wallet</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount (₦)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₦</span>
                  <input 
                    type="number" 
                    value={topupAmount} 
                    onChange={(e) => setTopupAmount(Number(e.target.value))}
                    min="1000"
                    step="1000"
                    className="w-full h-14 pl-10 pr-4 border border-gray-300 rounded-lg text-xl font-bold focus:ring-2 focus:ring-[#15803d] outline-none"
                  />
                </div>
              </div>

              {/* Quick Amounts */}
              <div className="grid grid-cols-4 gap-2">
                {[5000, 10000, 20000, 50000].map(amt => (
                  <button 
                    key={amt} 
                    onClick={() => setTopupAmount(amt)}
                    className={`py-2 rounded-md text-sm font-bold border transition-colors ${topupAmount === amt ? 'bg-[#15803d] text-white border-[#15803d]' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'}`}
                  >
                    ₦{amt / 1000}k
                  </button>
                ))}
              </div>

              <Button 
                onClick={handleTopUp} 
                disabled={processing}
                className="w-full h-14 bg-[#15803d] hover:bg-[#14532d] text-lg font-bold mt-4"
              >
                {processing ? <Loader2 className="h-5 w-5 animate-spin" /> : `Pay ₦${topupAmount.toLocaleString()} with Paystack`}
              </Button>
              
              <p className="text-xs text-center text-gray-500">
                You will be redirected to Paystack to complete this payment securely.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}