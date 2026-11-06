"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ShoppingBasket, Sparkles, Home, ShoppingCart, User, Search, LogOut, Menu, X } from "lucide-react";
import { useCart } from "@/lib/cart";
import { getUser, clearAuth, type AuthUser } from "@/lib/auth";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { itemCount, mounted } = useCart();
  
  const [user, setUser] = useState<AuthUser | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // This runs only on the client side, so localStorage is safe
    setUser(getUser());

    // Listen for login/logout events to update instantly
    const handler = () => setUser(getUser());
    window.addEventListener("auth-updated", handler);
    return () => window.removeEventListener("auth-updated", handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    router.push("/");
  };

  const links = [
    { href: "/", label: "Home", icon: Home },
    { href: "/products", label: "Catalog", icon: ShoppingBasket },
    { href: "/custom-list", label: "AI List", icon: Sparkles },
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-4">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <img 
            src="/agrover-logo.png" 
            alt="Agrova Logo" 
            className="h-10 w-auto object-contain" 
          />
          <span className="font-bold text-2xl text-green-800 tracking-tight hidden sm:block">Agrova</span>
        </Link>

        {/* Global Search Bar */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg mx-8 relative">
          <button type="submit" className="absolute left-4 top-3 text-gray-400 hover:text-[#15803d] transition-colors">
            <Search className="h-5 w-5" />
          </button>
          <input
            type="text"
            placeholder="Search rice, oil, beans..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-100 rounded-full py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#15803d] focus:bg-white transition-all"
          />
        </form>

        {/* Desktop Links */}
        <nav className="hidden lg:flex items-center gap-4">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.href} 
                href={link.href} 
                className={`flex items-center gap-2 text-sm font-semibold transition-colors ${
                  isActive ? "text-[#15803d]" : "text-gray-700 hover:text-[#15803d]"
                }`}
              >
                <Icon className="h-4 w-4" /> {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions (Auth, Cart, Mobile Toggle) */}
        <div className="flex items-center gap-3">
          
          {/* Auth Section */}
          {user ? (
            <div className="hidden sm:flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
              <Link 
                href={user.role === "admin" ? "/admin" : user.role === "driver" ? "/driver/orders" : "/dashboard"} 
                className="flex items-center gap-2 text-sm font-bold text-[#14532d] hover:text-[#15803d] transition-colors"
              >
                <User className="h-4 w-4" /> 
                <span className="hidden md:inline">{user.full_name?.split(" ")[0] || "Account"}</span>
              </Link>
              <div className="w-px h-4 bg-gray-300"></div>
              <button onClick={handleLogout} className="text-gray-500 hover:text-red-500 transition-colors" title="Log Out">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link href="/login" className="hidden sm:flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full text-sm font-bold text-gray-700 hover:bg-gray-200 transition-colors">
              <User className="h-4 w-4" /> <span>Log In</span>
            </Link>
          )}

          {/* Cart Button */}
          <Link href="/cart" className="flex items-center gap-2 bg-[#15803d] text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-[#14532d] transition-colors relative">
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Cart</span>
            {mounted && itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white">
                {itemCount}
              </span>
            )}
          </Link>

          {/* Mobile Menu Toggle */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 text-gray-700">
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 p-4 space-y-4 shadow-lg">
          {links.map((link) => (
            <Link 
              key={link.href} 
              href={link.href} 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-gray-700 py-2"
            >
              {link.label}
            </Link>
          ))}
          {!user && (
            <Link 
              href="/login" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-bold text-[#15803d] py-2"
            >
              Log In
            </Link>
          )}
        </div>
      )}
    </header>
  );
}