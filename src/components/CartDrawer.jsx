import { X, Trash2, Plus, Minus, ShoppingBag, ArrowLeft, CheckCircle2 } from "lucide-react";
import { digitsEnToFa } from "@persian-tools/persian-tools";
import { useState } from "react";

export default function CartDrawer({ isOpen, onClose, cartItems = [], onUpdateQuantity, onRemoveItem, onClearCart }) {
  const [isCheckedOut, setIsCheckedOut] = useState(false);

  if (!isOpen) return null;

  const calculateItemPrice = (item) => {
    const original = Number(item.price) || 0;
    const discount = item.current_discount?.is_active ? Number(item.current_discount.discount_percentage) : 0;
    return discount > 0 ? Math.round(original * (1 - discount / 100)) : original;
  };

  const totalPrice = cartItems.reduce((sum, item) => sum + calculateItemPrice(item) * item.quantity, 0);

  const handleCheckout = () => {
    setIsCheckedOut(true);
    setTimeout(() => {
      onClearCart && onClearCart();
      setIsCheckedOut(false);
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" dir="rtl">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 left-0 max-w-full flex pl-0">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-teal-100 text-teal-700 rounded-lg">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">سبد خرید شما</h2>
                <p className="text-xs text-slate-400">
                  {cartItems.length > 0 ? `${digitsEnToFa(cartItems.length)} کالا انتخاب شده` : "سبد خرید خالی است"}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {isCheckedOut ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <CheckCircle2 className="w-16 h-16 text-emerald-500 animate-bounce" />
                <h3 className="text-lg font-bold text-slate-800">سفارش شما با موفقیت ثبت شد!</h3>
                <p className="text-sm text-slate-500">با تشکر از خرید شما از مدی‌کالا.</p>
              </div>
            ) : cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                  <ShoppingBag className="w-10 h-10" />
                </div>
                <p className="text-slate-600 font-medium text-sm">سبد خرید شما خالی است!</p>
                <p className="text-slate-400 text-xs max-w-xs">محصولات مورد نیاز خود را به سبد خرید اضافه کنید.</p>
              </div>
            ) : (
              cartItems.map((item) => {
                const finalPrice = calculateItemPrice(item);
                return (
                  <div
                    key={`${item.id}-${item.selectedSize}`}
                    className="flex items-center gap-3 p-3 bg-slate-50/80 border border-slate-100 rounded-2xl hover:border-slate-200 transition-all"
                  >
                    {/* Item Image */}
                    <img
                      src={item.image || (item.images && item.images[0]) || "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80"}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-xl border border-slate-200/60 bg-white"
                    />

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-800 truncate">{item.name}</h4>
                      {item.selectedSize && (
                        <span className="inline-block mt-0.5 text-[11px] font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                          سایز: {item.selectedSize}
                        </span>
                      )}
                      
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-xs font-extrabold text-slate-900">
                          {digitsEnToFa(finalPrice.toLocaleString())} <span className="text-[10px] text-slate-500 font-normal">تومان</span>
                        </span>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.selectedSize, item.quantity - 1)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-600 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold text-slate-800 px-1.5">
                            {digitsEnToFa(item.quantity)}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.selectedSize, item.quantity + 1)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-600 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => onRemoveItem(item.id, item.selectedSize)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="حذف از سبد"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer & Summary */}
          {cartItems.length > 0 && !isCheckedOut && (
            <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 font-medium">مبلغ قابل پرداخت:</span>
                <span className="text-lg font-black text-teal-700">
                  {digitsEnToFa(totalPrice.toLocaleString())} <span className="text-xs font-normal text-slate-600">تومان</span>
                </span>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>تکمیل خرید و پرداخت</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
