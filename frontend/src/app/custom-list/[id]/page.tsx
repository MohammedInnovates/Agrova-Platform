import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import CustomListDetailClient from "@/components/CustomListDetailClient";

export default function CustomListDetailPage() {
  return (
    <main className="min-h-screen bg-[#faf7f0]">
      <section className="bg-[#14532d] text-white py-8">
        <div className="container mx-auto px-4">
          <Link
            href="/custom-list"
            className="inline-flex items-center gap-2 text-green-200 hover:text-white text-sm transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" /> Back to AI List
          </Link>
          <h1 className="text-3xl font-bold">List Details</h1>
        </div>
      </section>
      <section className="container mx-auto px-4 py-8 max-w-3xl">
        <Suspense fallback={<div className="animate-pulse h-64 bg-gray-100 rounded-lg" />}>
          <CustomListDetailClient />
        </Suspense>
      </section>
    </main>
  );
}
