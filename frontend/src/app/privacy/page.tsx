import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#faf7f0] py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-100">
        <Link href="/" className="inline-flex items-center gap-2 text-[#15803d] font-bold mb-8 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>
        <h1 className="text-3xl font-bold text-[#14532d] mb-6">Privacy Policy</h1>
        <div className="space-y-4 text-gray-700 text-sm leading-relaxed">
          <p><strong>1. Data We Collect:</strong> We collect your phone number, name, and delivery address to fulfill your orders.</p>
          <p><strong>2. How We Use Your Data:</strong> Your data is used strictly for order processing, delivery, and WhatsApp/SMS notifications regarding your order status.</p>
          <p><strong>3. Payment Security:</strong> We do not store your card details. All payments are processed securely by Paystack.</p>
          <p><strong>4. NDPA Compliance:</strong> We comply with the Nigeria Data Protection Act (NDPA). We do not sell your personal data to third parties.</p>
          <p><strong>5. Contact:</strong> For any privacy concerns, please contact support@agrova.ng.</p>
        </div>
      </div>
    </main>
  );
}