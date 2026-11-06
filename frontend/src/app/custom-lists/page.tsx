import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import CustomListClient from "@/components/CustomListClient";

export default function CustomListPage() {
  return (
    <main className="min-h-screen bg-[#faf7f0]">
      <section className="bg-gradient-to-r from-[#14532d] to-[#166534] text-white py-12">
        <div className="container mx-auto px-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-green-200 hover:text-white text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-4">
            <Sparkles className="h-10 w-10 text-yellow-300" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">AI Shopping List</h1>
              <p className="text-green-100 mt-1">
                Type, snap a photo, or send a voice note. We'll quote it instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <CustomListClient />
      </section>
    </main>
  );
}