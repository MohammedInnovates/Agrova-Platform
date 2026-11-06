import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import CartContent from "@/components/CartContent";

export default function CartPage() {
  return (
    <main className="min-h-screen bg-[#faf7f0]">
      <section className="bg-[#14532d] text-white py-8">
        <div className="container mx-auto px-4">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-green-200 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Continue Shopping
          </Link>
          <h1 className="text-3xl font-bold mt-4">Your Cart</h1>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        <CartContent />
      </section>
    </main>
  );
}