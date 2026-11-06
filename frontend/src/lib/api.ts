const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export type Product = {
  id: string; name: string; category: string; phase: number; bulk_unit: string;
  bulk_unit_price_kobo: number; local_unit_name: string | null; local_unit_multiplier: number | null;
  local_unit_kg: number | null; brand: string | null; producer: string | null; grade: string | null;
  image_url: string | null; stock_quantity: number; supports_bulk_purchase: boolean; active: boolean;
  description: string | null;
};

export type Category = {
  id: string; name: string; slug: string; description: string | null;
  image_url: string | null; show_on_homepage: boolean; display_order: number;
  subcategories: { id: string; name: string; slug: string }[];
};

export type Estate = { id: string; name: string; area: string; };

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("agrover_token") : null;
  const headers = {
    ...options.headers,
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  
  return fetch(url, { 
    ...options, 
    headers,
    credentials: "include", // Critical for cross-origin deployment
  });
}

export async function fetchProducts(category?: string, brand?: string, search?: string): Promise<Product[]> {
  const params = new URLSearchParams();
  if (category) params.append("category", category);
  if (brand) params.append("brand", brand);
  if (search) params.append("search", search);
  const query = params.toString() ? `?${params.toString()}` : "";
  
  const res = await fetch(`${API_URL}/products/${query}`, { 
    cache: "no-store",
    credentials: "include", 
  });
  if (!res.ok) throw new Error(`Failed to fetch products: ${res.status}`);
  return res.json();
}

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${API_URL}/categories/`, { 
    cache: "no-store",
    credentials: "include", 
  });
  if (!res.ok) throw new Error(`Failed to fetch categories: ${res.status}`);
  return res.json();
}

export async function fetchEstates(): Promise<Estate[]> {
  const res = await fetch(`${API_URL}/estates/`, { 
    cache: "no-store",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to fetch estates: ${res.status}`);
  return res.json();
}

export async function fetchProduct(id: string): Promise<Product> {
  const res = await fetch(`${API_URL}/products/${id}`, { 
    cache: "no-store",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to fetch product: ${res.status}`);
  return res.json();
}

export async function fetchUserOrders(userId: string): Promise<any[]> {
  const res = await fetch(`${API_URL}/orders/user/${userId}`, { 
    cache: "no-store",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to fetch orders: ${res.status}`);
  return res.json();
}

export function koboToNaira(kobo: number): string {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(kobo / 100);
}

export function localUnitPrice(product: Product): number | null {
  if (!product.local_unit_multiplier) return null;
  return Math.round(product.bulk_unit_price_kobo * product.local_unit_multiplier);
}