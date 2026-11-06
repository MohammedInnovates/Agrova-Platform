import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#faf7f0] py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-100">
        <Link href="/" className="inline-flex items-center gap-2 text-[#15803d] font-bold mb-8 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>
        <h1 className="text-3xl font-bold text-[#14532d] mb-6">Terms of Service</h1>
        <div className="space-y-4 text-gray-700 text-sm leading-relaxed">
          <p><strong>1. Acceptance of Terms:</strong> By using Agrova, you agree to these terms. Agrova is a direct procurement platform connecting Abuja residents with agricultural suppliers.</p>
          <p><strong>2. Orders and Payment:</strong> All orders are subject to availability. Payments are processed securely via Paystack or Wallet. Orders are only confirmed upon successful payment.</p>
          <p><strong>3. Delivery:</strong> We deliver on Saturdays (Weekly Batch) or within 24-48 hours (Express). Delivery times are estimates and may be affected by weather or traffic.</p>
          <p><strong>4. Refunds and Cancellations:</strong> You may cancel unpaid orders. Once paid, orders can only be cancelled and refunded to your wallet at the discretion of the Admin (e.g., if the item is out of stock).</p>
          <p><strong>5. Pickup PIN:</strong> You must provide your 4-digit Pickup PIN to the delivery driver. Do not share this PIN with anyone else.</p>
        </div>
      </div>
    </main>
  );
}