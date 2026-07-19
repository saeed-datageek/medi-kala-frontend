import { Link } from "react-router-dom";
import { Star, ShoppingCart, Eye, CheckCircle, AlertCircle, Tag } from "lucide-react";
import { digitsEnToFa } from "@persian-tools/persian-tools";

export default function ProductCard({ product, onAddToCart }) {
  const { id, name, price, image, images, category, rating = 4.5, stock = 10, brand, size, current_discount } = product;

  const mainImage = image || (images && images.length > 0 ? images[0] : null) || "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80";

  const originalPrice = Number(price) || 0;
  const isDiscountActive = Boolean(current_discount?.is_active);
  const discountPercent = isDiscountActive ? Number(current_discount.discount_percentage) : 0;
  const finalPrice = discountPercent > 0 ? Math.round(originalPrice * (1 - discountPercent / 100)) : originalPrice;

  const sizesList = Array.isArray(size) ? size : (size ? [size] : []);

  return (
    <div className="group bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden relative" dir="rtl">
      
      {/* Top Badges */}
      <div className="relative aspect-4/3 bg-slate-50 overflow-hidden">
        <img
          src={mainImage}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Discount Badge */}
        {isDiscountActive && discountPercent > 0 && (
          <div className="absolute top-3 right-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-black px-2.5 py-1 rounded-xl shadow-md flex items-center gap-1">
            <Tag className="w-3.5 h-3.5" />
            <span>٪{digitsEnToFa(discountPercent)} تخفیف</span>
          </div>
        )}

        {/* Stock Status Badge */}
        <div className="absolute bottom-3 right-3">
          {stock > 0 ? (
            <span className="bg-emerald-500/90 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
              <CheckCircle className="w-3 h-3" />
              موجود
            </span>
          ) : (
            <span className="bg-slate-700/90 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
              <AlertCircle className="w-3 h-3 text-rose-400" />
              ناموجود
            </span>
          )}
        </div>

        {/* Quick View Floating Button */}
        <Link
          to={`/products/${id}`}
          className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        >
          <span className="bg-white/90 backdrop-blur-md text-slate-800 font-bold text-xs px-4 py-2 rounded-xl shadow-lg flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <Eye className="w-4 h-4 text-teal-600" />
            مشاهده جزئیات
          </span>
        </Link>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        
        <div className="space-y-1.5">
          {/* Brand & Category */}
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
            {brand && <span className="text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">{brand}</span>}
            {category && <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">{category}</span>}
          </div>

          {/* Product Title */}
          <Link to={`/products/${id}`}>
            <h3 className="text-sm font-bold text-slate-800 group-hover:text-teal-600 transition-colors line-clamp-2 leading-snug">
              {name}
            </h3>
          </Link>
        </div>

        {/* Size chips & Rating */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100/80">
          {/* Rating */}
          <div className="flex items-center gap-1 text-amber-400">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span className="text-xs font-bold text-slate-700">{digitsEnToFa(rating)}</span>
          </div>

          {/* Sizes */}
          {sizesList.length > 0 && (
            <div className="flex items-center gap-1">
              {sizesList.slice(0, 3).map((s, idx) => (
                <span key={idx} className="text-[10px] bg-slate-100 text-slate-600 font-medium px-1.5 py-0.5 rounded">
                  {s}
                </span>
              ))}
              {sizesList.length > 3 && <span className="text-[10px] text-slate-400">...</span>}
            </div>
          )}
        </div>

        {/* Price & Action */}
        <div className="pt-2 flex items-end justify-between border-t border-slate-100">
          
          {/* Price */}
          <div className="flex flex-col">
            {isDiscountActive && discountPercent > 0 && (
              <span className="text-[11px] text-slate-400 line-through font-medium">
                {digitsEnToFa(originalPrice.toLocaleString())}
              </span>
            )}
            <div className="flex items-baseline gap-1">
              <span className="text-base font-black text-slate-900">
                {digitsEnToFa(finalPrice.toLocaleString())}
              </span>
              <span className="text-[10px] font-bold text-slate-500">تومان</span>
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={() => onAddToCart && onAddToCart(product)}
            disabled={stock <= 0}
            className="bg-slate-900 hover:bg-teal-600 disabled:bg-slate-200 text-white p-2.5 rounded-xl shadow-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
            title="افزودن به سبد خرید"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>

        </div>

      </div>
    </div>
  );
}
