"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get("reference") || searchParams.get("trxref");
  const [countdown, setCountdown] = useState(5);

  // Auto-redirect to the orders page after 5 seconds
  useEffect(() => {
    if (countdown <= 0) {
      router.push("/orders");
      return;
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, router]);

  return (
    <main className="min-h-screen bg-[#faf7f0] flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl border border-green-100 p-8 text-center">
        
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-10 w-10 text-[#15803d]" />
        </div>

        <h1 className="text-3xl font-extrabold text-[#14532d] mb-2">Payment Successful!</h1>
        <p className="text-gray-600 mb-8">
          Thank you for your order. We have received your payment and are preparing your food for dispatch.
        </p>

        {reference && (
          <div className="bg-gray-50 p-4 rounded-lg mb-8 border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Payment Reference</p>
            <p className="font-mono font-bold text-gray-800">{reference}</p>
          </div>
        )}

        <div className="space-y-3">
          <Button 
            onClick={() => router.push("/orders")} 
            className="w-full h-12 bg-[#15803d] hover:bg-[#14532d] text-base font-bold"
          >
            View My Orders <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          
          <p className="text-xs text-gray-500">
            Redirecting to your orders in {countdown} seconds...
          </p>
        </div>
      </div>
    </main>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-[#faf7f0] flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#15803d]" />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}