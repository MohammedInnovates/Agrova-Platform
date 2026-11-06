import Link from "next/link";
import { fetchProducts, fetchCategories, koboToNaira, type Product } from "@/lib/api";
import { getProductImage, resolveImageUrl } from "@/lib/imageHelper";
import { ShoppingCart, Leaf, ShieldCheck, Truck, Handshake, ArrowRight, AlertCircle, Mail, Phone, MapPin, Facebook, Twitter, Instagram, MessageCircle } from "lucide-react";

function ProductCard({ product }: { product: Product }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col group min-w-[260px] md:min-w-[280px] w-full">
      <div className="h-44 w-full overflow-hidden bg-gray-50 relative">
        <img src={getProductImage(product)} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      </div>
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <p className="text-[10px] text-[#15803d] uppercase font-bold tracking-wider mb-1">{product.brand || "Agrova Local"}</p>
          <h3 className="font-bold text-base text-gray-900 mb-1 line-clamp-2 leading-tight">{product.name}</h3>
          <p className="text-xs text-gray-500 mb-3">{product.bulk_unit}</p>
        </div>
        <div>
          <p className="text-xl font-extrabold text-[#14532d] mb-3">{koboToNaira(product.bulk_unit_price_kobo)}</p>
          <Link href={`/products/${product.id}`} className="flex items-center justify-center gap-2 w-full bg-gray-50 text-gray-800 py-2.5 rounded-lg text-sm font-bold hover:bg-[#15803d] hover:text-white transition-colors border border-gray-200">
            <ShoppingCart className="h-4 w-4" /> View Item
          </Link>
        </div>
      </div>
    </div>
  );
}

export default async function HomePage() {
  let categories = [];
  let products: Product[] = [];
  let errorMsg = null;
  
  try {
    categories = await fetchCategories();
    products = await fetchProducts();
  } catch (error) {
    errorMsg = error instanceof Error ? error.message : "Failed to connect to backend";
  }

  const homepageCategories = categories.filter(c => c.show_on_homepage);
  const displayedProductIds = new Set<string>();

  const categorySections = homepageCategories.map((cat) => {
    const cleanCatName = cat.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    
    const catProducts = products.filter(p => {
      const cleanProdCat = (p.category || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      if (cleanProdCat === cleanCatName) {
        displayedProductIds.add(p.id);
        return true;
      }
      return false;
    });

    return { cat, products: catProducts };
  }).filter(section => section.products.length > 0);

  const uncategorizedProducts = products.filter(p => !displayedProductIds.has(p.id));

  return (
    <main className="min-h-screen bg-[#faf7f0] flex flex-col">
      {/* HERO & TRUST BAR */}
      <section className="relative w-full bg-[#0a3d1e]">
        <div className="absolute inset-0 z-0">
          <img src="/hero-bg.jpg" alt="Agrova Farm" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 md:py-28 flex flex-col justify-center min-h-[500px]">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 text-white leading-tight drop-shadow-lg">
              Your Food Supply, <br/><span className="text-yellow-400">Simplified.</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-100 mb-8 max-w-xl drop-shadow-md">
              From everyday food essentials to bulk agricultural supplies, Agrova makes it easier to find what you need.
            </p>
            <Link href="/products" className="inline-flex items-center justify-center gap-2 bg-[#15803d] text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-[#14532d] transition-transform hover:-translate-y-1 shadow-lg">
              Explore Full Catalog <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <div className="bg-[#0a3d1e] border-t border-green-800/50 py-4 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center md:justify-between items-center gap-4 text-white">
          <div className="flex items-center gap-2"><Leaf className="h-5 w-5 text-green-400" /><span>Fresh Products</span></div>
          <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-green-400" /><span>Trusted Quality</span></div>
          <div className="flex items-center gap-2"><Truck className="h-5 w-5 text-green-400" /><span>Reliable Delivery</span></div>
          <div className="flex items-center gap-2"><Handshake className="h-5 w-5 text-green-400" /><span>Support for Farmers</span></div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 max-w-7xl mx-auto px-6 py-16 w-full space-y-12">
        {errorMsg && (
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-md flex items-start gap-4">
            <AlertCircle className="h-6 w-6 text-red-500 shrink-0" />
            <div>
              <h3 className="font-bold text-red-800">Failed to load products</h3>
              <p className="text-sm text-red-700 mt-1">{errorMsg}</p>
            </div>
          </div>
        )}

        <h2 className="text-3xl font-bold text-[#14532d] mb-8 border-l-4 border-[#15803d] pl-4">Shop by Category</h2>
        
        {!errorMsg && categorySections.length === 0 && uncategorizedProducts.length === 0 && (
          <div className="text-center py-10 text-gray-500">No products found.</div>
        )}

        {!errorMsg && categorySections.map(({ cat, products: catProducts }) => (
          <section key={cat.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-12">
            <div className="flex justify-between items-end mb-6 border-b border-gray-100 pb-3">
              <div className="flex items-center gap-4">
                {cat.image_url && (
                  <img src={resolveImageUrl(cat.image_url)} alt={cat.name} className="w-12 h-12 rounded-full object-cover border-2 border-[#15803d]" />
                )}
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 capitalize">{cat.name}</h3>
                  {cat.description && <p className="text-sm text-gray-500">{cat.description}</p>}
                </div>
              </div>
              <Link href={`/categories/${cat.slug}`} className="text-[#15803d] font-semibold text-sm hover:underline flex items-center gap-1 shrink-0">
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory hide-scrollbar">
              {catProducts.map((product) => (
                <div key={product.id} className="snap-start shrink-0 w-[260px] md:w-[280px]">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </section>
        ))}

        {!errorMsg && uncategorizedProducts.length > 0 && (
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-end mb-6 border-b border-gray-100 pb-3">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-xl">🛒</div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">More Products</h3>
                  <p className="text-sm text-gray-500">Other available items</p>
                </div>
              </div>
            </div>
            <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory hide-scrollbar">
              {uncategorizedProducts.map((product) => (
                <div key={product.id} className="snap-start shrink-0 w-[260px] md:w-[280px]">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ================= PROFESSIONAL FOOTER ================= */}
      <footer className="bg-[#0a3d1e] text-gray-300">
        
        {/* WhatsApp Channel Section */}
        <div className="border-b border-green-900/50 bg-[#082f17]">
          <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-white text-lg font-bold mb-0.5">Get Daily Farm Updates</h3>
              <p className="text-sm text-green-200">Join our WhatsApp Channel for fresh produce, prices, and exclusive deals.</p>
            </div>
            <a 
              href="https://whatsapp.com/channel/YOUR_LINK_HERE" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#25D366] text-white px-6 py-2.5 rounded-full font-bold hover:bg-[#1ebd5a] transition-colors whitespace-nowrap shadow-md"
            >
              <MessageCircle className="h-5 w-5" /> Follow on WhatsApp
            </a>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Brand & Logo */}
          <div>
            <img 
              src="/agrover-logo.png" 
              alt="Agrova Logo" 
              className="h-7 w-auto mb-3"
            />
            <p className="text-sm text-green-200 mb-3 leading-relaxed">
              Agrova is Abuja's premier direct-from-farm procurement platform. We connect households directly to farmers.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-green-300 hover:text-white transition-colors"><Facebook className="h-4 w-4" /></a>
              <a href="#" className="text-green-300 hover:text-white transition-colors"><Twitter className="h-4 w-4" /></a>
              <a href="#" className="text-green-300 hover:text-white transition-colors"><Instagram className="h-4 w-4" /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold mb-3 uppercase tracking-wider text-xs">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/products" className="hover:text-white transition-colors">Shop Catalog</Link></li>
              <li><Link href="/custom-list" className="hover:text-white transition-colors">AI Shopping List</Link></li>
              <li><Link href="/orders" className="hover:text-white transition-colors">Track Your Order</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">My Account</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-white font-bold mb-3 uppercase tracking-wider text-xs">Customer Service</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-white font-bold mb-3 uppercase tracking-wider text-xs">Contact Us</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-[#15803d] shrink-0 mt-0.5" />
                <span>Abuja, FCT, Nigeria</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#15803d] shrink-0" />
                <span>+234 (0) 800 AGROVA</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#15803d] shrink-0" />
                <span>support@agrova.ng</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Payment & Copyright Bar */}
        <div className="border-t border-green-900/50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-green-300">
              © 2026 Agrova. All rights reserved. "From Farms to You, Made Easy."
            </p>
            <div className="flex items-center gap-2 text-xs text-green-300">
              <span>Secure Payments:</span>
              <div className="flex gap-1">
                <span className="bg-white text-[#0a3d1e] px-2 py-0.5 rounded text-[10px] font-bold">VISA</span>
                <span className="bg-white text-[#0a3d1e] px-2 py-0.5 rounded text-[10px] font-bold">Mastercard</span>
                <span className="bg-white text-[#0a3d1e] px-2 py-0.5 rounded text-[10px] font-bold">Paystack</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}