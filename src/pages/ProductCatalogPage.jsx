import { useState, useEffect } from "react";
import { getPublicProducts, getProductCategories } from "../api";
import ProductCard from "../components/ProductCard";
import { SlidersHorizontal, Sparkles, ShieldCheck, Truck, Headphones, SearchX, RefreshCw } from "lucide-react";
import { digitsEnToFa } from "@persian-tools/persian-tools";

export default function ProductCatalogPage({ onAddToCart, searchQuery }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest"); // newest, price-asc, price-desc, rating
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, catData] = await Promise.all([
        getPublicProducts(),
        getProductCategories().catch(() => []),
      ]);
      setProducts(data || []);
      
      const allCats = Array.from(
        new Set([...(data || []).map((p) => p.category).filter(Boolean), ...(catData || []).filter(Boolean)])
      );
      setCategories(allCats);
    } catch (err) {
      console.error("Failed to load products", err);
      setError("خطا در دریافت لیست محصولات. لطفاً دوباره تلاش کنید.");
    } finally {
      setLoading(false);
    }
  };

  // Filter & Sort Logic
  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    const q = (searchQuery || "").trim().toLowerCase();
    const matchesSearch =
      !q ||
      product.name?.toLowerCase().includes(q) ||
      product.brand?.toLowerCase().includes(q) ||
      product.category?.toLowerCase().includes(q) ||
      product.description?.toLowerCase().includes(q);

    return matchesCategory && matchesSearch;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const priceA = a.current_discount?.is_active
      ? Math.round(Number(a.price) * (1 - Number(a.current_discount.discount_percentage) / 100))
      : Number(a.price);
    const priceB = b.current_discount?.is_active
      ? Math.round(Number(b.price) * (1 - Number(b.current_discount.discount_percentage) / 100))
      : Number(b.price);

    if (sortBy === "price-asc") return priceA - priceB;
    if (sortBy === "price-desc") return priceB - priceA;
    if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
    return b.id - a.id; // newest first
  });

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16" dir="rtl">
      
      {/* Hero Storefront Banner */}
      <section className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(20,184,166,0.15),transparent)]" />
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          
          <div className="space-y-4 max-w-2xl text-center md:text-right">
            <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 px-3 py-1 rounded-full text-teal-300 text-xs font-semibold">
              <Sparkles className="w-4 h-4 text-teal-400" />
              تضمین اصالت کالا و تاییدیه وزارت بهداشت
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              مرکز تخصصی تجهیزات و ملزومات پزشکی <span className="text-teal-400">مدی‌کالا</span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              دسترسی سریع به جدیدترین تجهیزات بیمارستانی، درمانگاهی و خانگی با بهترین قیمت و ضمانت کیفیت.
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800/80">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span className="text-xs text-slate-300 font-medium">ضمانت ۱۰۰٪ اصالت</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-teal-400" />
                <span className="text-xs text-slate-300 font-medium">ارسال فوری سراسری</span>
              </div>
              <div className="flex items-center gap-2">
                <Headphones className="w-5 h-5 text-cyan-400" />
                <span className="text-xs text-slate-300 font-medium">پشتیبانی ۲۴/۷</span>
              </div>
            </div>
          </div>

          {/* Banner Graphic badge */}
          <div className="hidden md:flex flex-col items-center p-6 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-teal-500/30">
              ٪
            </div>
            <span className="mt-3 text-sm font-bold text-white">تخفیف‌های ویژه پزشکی</span>
            <span className="text-xs text-slate-400">بهترین قیمت تجهیزات خانگی</span>
          </div>

        </div>
      </section>

      {/* Main Catalog Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Controls Toolbar: Categories & Sort */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-teal-600 text-white shadow-md shadow-teal-600/20"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              }`}
            >
              همه محصولات ({digitsEnToFa(products.length)})
            </button>

            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-teal-600 text-white shadow-md shadow-teal-600/20"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <SlidersHorizontal className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-500">مرتب‌سازی:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-100 text-slate-800 text-xs font-bold py-2 px-3 rounded-xl border border-transparent focus:border-teal-400 focus:bg-white outline-none cursor-pointer"
            >
              <option value="newest">جدیدترین</option>
              <option value="price-asc">ارزان‌ترین</option>
              <option value="price-desc">گران‌ترین</option>
              <option value="rating">محبوب‌ترین</option>
            </select>
          </div>

        </div>

        {/* Product Grid / Loading / Error */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-3xl p-4 border border-slate-100 space-y-3 animate-pulse">
                <div className="bg-slate-200 h-48 rounded-2xl" />
                <div className="bg-slate-200 h-4 w-3/4 rounded-md" />
                <div className="bg-slate-200 h-4 w-1/2 rounded-md" />
                <div className="bg-slate-200 h-8 w-full rounded-xl pt-2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center max-w-md mx-auto my-12 space-y-4">
            <p className="text-rose-600 font-bold text-sm">{error}</p>
            <button
              onClick={fetchData}
              className="inline-flex items-center gap-2 bg-rose-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-rose-700 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              تلاش مجدد
            </button>
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center max-w-md mx-auto my-12 space-y-3 shadow-xs">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <SearchX className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">هیچ محصولی یافت نشد!</h3>
            <p className="text-xs text-slate-400">عبارت جستجو یا فیلتر دسته‌بندی را تغییر دهید.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedProducts.map((product) => (
              <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
            ))}
          </div>
        )}

      </main>
    </div>
  );
}
