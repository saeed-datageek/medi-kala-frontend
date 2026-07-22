import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, Search, Sparkles, User, ShieldCheck, Heart, Menu, X } from "lucide-react";
import { digitsEnToFa } from "@persian-tools/persian-tools";

export default function Navbar({ cartCount, onOpenCart, searchQuery, setSearchQuery }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigate("/products");
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-xs transition-all duration-200" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Right: Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-1">
                  پارسین طب
                  <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full border border-teal-200/60 font-medium">پزشکی</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium tracking-wide">تجهیزات و ملزومات سلامت</span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 mr-4">
              <Link
                to="/"
                className="px-3.5 py-2 text-sm font-semibold text-slate-700 hover:text-teal-600 rounded-lg hover:bg-teal-50/50 transition-colors"
              >
                فروشگاه
              </Link>
              <Link
                to="/products"
                className="px-3.5 py-2 text-sm font-semibold text-slate-700 hover:text-teal-600 rounded-lg hover:bg-teal-50/50 transition-colors"
              >
                همه محصولات
              </Link>
            </nav>
          </div>

          {/* Center: Search Bar */}
          <div className="flex-1 max-w-md hidden sm:block">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery || ""}
                onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
                placeholder="جستجو در نام محصول، برند، دسته..."
                className="w-full bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-slate-800 text-sm pl-4 pr-10 py-2.5 rounded-xl border border-transparent focus:border-teal-400 focus:ring-4 focus:ring-teal-100 outline-none transition-all duration-200 placeholder:text-slate-400"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            </form>
          </div>

          {/* Left: Actions (Profile, Cart & Admin Portal) */}
          <div className="flex items-center gap-3">
            {/* User Profile Button */}
            <Link
              to="/profile"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 rounded-xl transition-colors"
              title="حساب کاربری"
            >
              <User className="w-4 h-4 text-teal-600" />
              <span className="hidden sm:inline">حساب کاربری</span>
            </Link>

            {/* Admin Portal Button */}
            <Link
              to="/admin"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200/80 hover:text-slate-900 rounded-xl transition-colors"
              title="پنل مدیریت"
            >
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span className="hidden sm:inline">پنل مدیریت</span>
            </Link>

            {/* Shopping Cart Drawer Trigger Button */}
            <button
              onClick={onOpenCart}
              className="relative p-2.5 text-slate-700 hover:text-teal-600 hover:bg-teal-50/60 rounded-xl transition-colors flex items-center justify-center border border-slate-200/60 cursor-pointer"
              aria-label="سبد خرید"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -left-1.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {digitsEnToFa(cartCount)}
                </span>
              )}
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Input */}
        <div className="sm:hidden pb-3 pt-1">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery || ""}
              onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
              placeholder="جستجو در محصولات..."
              className="w-full bg-slate-100 text-slate-800 text-sm pl-4 pr-10 py-2 rounded-xl border border-transparent focus:border-teal-400 outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          </form>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 py-3 space-y-1">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-teal-50 rounded-lg"
            >
              فروشگاه
            </Link>
            <Link
              to="/products"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-teal-50 rounded-lg"
            >
              همه محصولات
            </Link>
            <Link
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-teal-50 rounded-lg"
            >
              حساب کاربری و سفارش‌ها
            </Link>
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-teal-50 rounded-lg"
            >
              ورود به پنل مدیریت
            </Link>
          </div>
        )}

      </div>
    </header>
  );
}
