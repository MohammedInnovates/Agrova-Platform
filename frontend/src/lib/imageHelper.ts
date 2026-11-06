import { type Product } from "./api";

const IMAGE_MAP: Record<string, string> = {
  "staples": "https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=600&auto=format&fit=crop",
  "grains": "https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=600&auto=format&fit=crop",
  "oils": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?q=80&w=600&auto=format&fit=crop",
  "tubers": "https://images.unsplash.com/photo-1596097635121-14b63b7a0c19?q=80&w=600&auto=format&fit=crop",
  "beans": "https://images.unsplash.com/photo-1551462147-ff29053bfc14?q=80&w=600&auto=format&fit=crop",
};

// Ensure this points to your FastAPI backend, not the Next.js frontend
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "http://127.0.0.1:8000";

export function resolveImageUrl(url: string | null | undefined, fallback: string = "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=600&auto=format&fit=crop"): string {
  if (!url) return fallback;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${BACKEND_URL}${url}`;
}

export function getProductImage(product: Product): string {
  if (product.image_url) return resolveImageUrl(product.image_url);

  const name = product.name.toLowerCase();
  if (name.includes("rice") || name.includes("garri")) return IMAGE_MAP["staples"];
  if (name.includes("oil")) return IMAGE_MAP["oils"];
  if (name.includes("bean")) return IMAGE_MAP["beans"];
  if (name.includes("yam") || name.includes("potato")) return IMAGE_MAP["tubers"];

  const cat = (product.category || "").toLowerCase();
  if (IMAGE_MAP[cat]) return IMAGE_MAP[cat];

  return fallback;
}