import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import CustomListClient from "@/components/CustomListClient";

export default function CustomListPage() {
  return (
    <main className="min-h-screen bg-[#faf7f0]">
      <section className="bg-[#14532d] text-white py-8">
        <div className="container mx-auto px-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-green-200 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
          <h1 className="text-3xl font-bold mt-4">AI Shopping List</h1>
        </div>
      </section>
      <section className="container mx-auto px-4 py-8">
        <CustomListClient />
      </section>
    </main>
  );
}
