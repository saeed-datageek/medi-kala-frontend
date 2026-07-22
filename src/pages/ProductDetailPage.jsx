import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getPublicProductDetails, getPublicProducts } from "../api";
import ProductCard from "../components/ProductCard";
import {
  Star,
  ShoppingCart,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Tag,
  ArrowRight,
  Plus,
  Minus,
  Check,
  Share2,
  Heart,
  RefreshCw,
} from "lucide-react";
import { digitsEnToFa } from "@persian-tools/persian-tools";

export default function ProductDetailPage({ onAddToCart }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [activeImage, setActiveImage] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addedToast, setAddedToast] = useState(false);

  useEffect(() => {
    fetchProductDetails();
    window.scrollTo(0, 0);
  }, [id]);

  const fetchProductDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPublicProductDetails(id);
      setProduct(data);

      const allImages = [
        data.image,
        ...(Array.isArray(data.images) ? data.images : []),
      ].filter(Boolean);

      setActiveImage(allImages[0] || "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80");

      const sizesList = Array.isArray(data.size) ? data.size : (data.size ? [data.size] : []);
      if (sizesList.length > 0) {
        setSelectedSize(sizesList[0]);
      }

      // Fetch related products from same category
      if (data.category) {
        getPublicProducts().then((all) => {
          const related = (all || []).filter((p) => p.category === data.category && p.id !== data.id);
          setRelatedProducts(related.slice(0, 4));
        });
      }
    } catch (err) {
      console.error("Error fetching product detail", err);
      setError("محصول مورد نظر یافت نشد یا در دسترس نیست.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6" dir="rtl">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-bold text-slate-600">در حال بارگذاری اطلاعات محصول...</span>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6" dir="rtl">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center max-w-md shadow-sm space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">{error || "خطا در پیدا کردن محصول"}</h3>
          <button
            onClick={() => navigate("/products")}
            className="inline-flex items-center gap-2 bg-teal-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-teal-700 transition-colors cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            بازگشت به فروشگاه
          </button>
        </div>
      </div>
    );
  }

  const { name, price, description, category, brand, stock = 10, rating = 4.5, size, current_discount } = product;

  const imagesList = Array.from(
    new Set([product.image, ...(Array.isArray(product.images) ? product.images : [])].filter(Boolean))
  );

  const sizesList = Array.isArray(size) ? size : (size ? [size] : []);

  const originalPrice = Number(price) || 0;
  const discountPercent = current_discount ? Number(current_discount.discount_percentage || 0) : 0;
  const hasDiscount = Boolean(current_discount) && discountPercent > 0;
  const finalPrice = hasDiscount ? Math.round(originalPrice * (1 - discountPercent / 100)) : originalPrice;
  const savedAmount = hasDiscount ? originalPrice - finalPrice : 0;

  const handleAdd = () => {
    if (onAddToCart) {
      for (let i = 0; i < quantity; i++) {
        onAddToCart({ ...product, selectedSize });
      }
    }
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20" dir="rtl">
      
      {/* Toast notification */}
      {addedToast && (
        <div className="fixed bottom-6 left-6 z-50 bg-emerald-600 text-white font-bold text-sm px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-bounce">
          <Check className="w-5 h-5 bg-white text-emerald-600 rounded-full p-0.5" />
          محصول با موفقیت به سبد خرید اضافه شد!
        </div>
      )}

      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <nav className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <Link to="/" className="hover:text-teal-600">فروشگاه</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-teal-600">محصولات</Link>
          {category && (
            <>
              <span>/</span>
              <span className="text-slate-600">{category}</span>
            </>
          )}
          <span>/</span>
          <span className="text-teal-600 font-bold truncate max-w-xs">{name}</span>
        </nav>
      </div>

      {/* Main Details Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Gallery (Right Column in RTL) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="aspect-square bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 relative group">
              <img
                src={activeImage}
                alt={name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />

              {hasDiscount && (
                <div className="absolute top-4 right-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-sm font-black px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1">
                  <Tag className="w-4 h-4" />
                  <span>٪{digitsEnToFa(discountPercent)} تخفیف ویژه</span>
                </div>
              )}
            </div>

            {/* Thumbnail switcher */}
            {imagesList.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {imagesList.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      activeImage === img ? "border-teal-600 scale-95 shadow-sm" : "border-slate-200 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details (Left Column in RTL) */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            
            <div className="space-y-4">
              {/* Category & Brand Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {brand && <span className="bg-teal-50 text-teal-700 font-bold text-xs px-3 py-1 rounded-lg">{brand}</span>}
                  {category && <span className="bg-slate-100 text-slate-600 font-bold text-xs px-3 py-1 rounded-lg">{category}</span>}
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-bold text-amber-800">{digitsEnToFa(rating)} از ۵</span>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-snug">
                {name}
              </h1>

              {/* Stock status */}
              <div className="flex items-center gap-2">
                {stock > 0 ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60">
                    <CheckCircle className="w-4 h-4" />
                    موجود در انبار ({digitsEnToFa(stock)} عدد)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200/60">
                    <AlertCircle className="w-4 h-4" />
                    اتمام موجودی
                  </span>
                )}
              </div>

              {/* Sizes Selection */}
              {sizesList.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-700">انتخاب سایز:</span>
                  <div className="flex flex-wrap gap-2">
                    {sizesList.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedSize(s)}
                        className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          selectedSize === s
                            ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Description Preview */}
              {description && (
                <div className="pt-3 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-slate-500 mb-1">توضیحات محصول:</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
                </div>
              )}
            </div>

            {/* Price & Cart Actions Block */}
            <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-100 space-y-4">
              
              {/* Price Row — Digikala style */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-500">قیمت محصول:</span>
                {hasDiscount ? (
                  <div className="space-y-1">
                    {/* percent pill + crossed original */}
                    <div className="flex items-center gap-2">
                      <span className="bg-rose-100 text-rose-600 text-xs font-black px-2 py-0.5 rounded-lg">
                        ٪{digitsEnToFa(discountPercent)}
                      </span>
                      <span className="text-sm text-slate-400 line-through font-medium">
                        {digitsEnToFa(originalPrice.toLocaleString())} تومان
                      </span>
                    </div>
                    {/* final price */}
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-rose-600">
                        {digitsEnToFa(finalPrice.toLocaleString())}
                      </span>
                      <span className="text-sm font-bold text-slate-500">تومان</span>
                    </div>
                    {/* savings callout */}
                    <div className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-lg">
                      {digitsEnToFa(savedAmount.toLocaleString())} تومان صرفه‌جویی
                    </div>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-teal-700">
                      {digitsEnToFa(finalPrice.toLocaleString())}
                    </span>
                    <span className="text-sm font-bold text-slate-500">تومان</span>
                  </div>
                )}
              </div>


              {/* Quantity and CTA */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                
                {/* Quantity Controls */}
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-2xs w-full sm:w-auto justify-center">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-bold text-slate-800 px-3">
                    {digitsEnToFa(quantity)}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={handleAdd}
                  disabled={stock <= 0}
                  className="w-full sm:flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 disabled:from-slate-300 disabled:to-slate-400 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>افزودن به سبد خرید</span>
                </button>

              </div>

            </div>

            {/* Trust Cards */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-white border border-slate-100 rounded-2xl text-center space-y-1">
                <ShieldCheck className="w-5 h-5 text-emerald-500 mx-auto" />
                <span className="text-[11px] font-bold text-slate-700 block">ضمانت اصالت</span>
              </div>
              <div className="p-3 bg-white border border-slate-100 rounded-2xl text-center space-y-1">
                <Truck className="w-5 h-5 text-teal-500 mx-auto" />
                <span className="text-[11px] font-bold text-slate-700 block">ارسال سریع</span>
              </div>
              <div className="p-3 bg-white border border-slate-100 rounded-2xl text-center space-y-1">
                <RotateCcw className="w-5 h-5 text-cyan-500 mx-auto" />
                <span className="text-[11px] font-bold text-slate-700 block">۷ روز ضمانت بازگشت</span>
              </div>
            </div>

          </div>

        </div>

        {/* Related Products Slider / Grid */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 space-y-6">
            <h2 className="text-xl font-bold text-slate-900 border-r-4 border-teal-600 pr-3">
              محصولات مرتبط
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} />
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
