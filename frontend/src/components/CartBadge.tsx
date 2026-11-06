"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart";

export default function CartBadge({ light = false }: { light?: boolean }) {
  const { itemCount, mounted } = useCart();

  return (
    <Link
      href="/cart"
      className={`relative inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
        light
          ? "bg-white text-[#14532d] hover:bg-gray-100"
          : "bg-[#15803d] text-white hover:bg-[#14532d]"
      }`}
    >
      <ShoppingCart className="h-4 w-4" />
      <span className="hidden sm:inline">Cart</span>
      {mounted && itemCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
          {itemCount}
        </span>
      )}
    </Link>
  );
}