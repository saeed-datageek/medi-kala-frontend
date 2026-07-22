import { X, Trash2, Plus, Minus, ShoppingBag, ArrowLeft, CheckCircle2, Phone, KeyRound, ChevronRight } from "lucide-react";
import { digitsEnToFa } from "@persian-tools/persian-tools";
import { useState } from "react";
import { sendCodeApi, verifyCodeApi, updateProfile, createOrder } from "../api";

// steps: CART → MOBILE → OTP → PROFILE → ADDRESS → SUCCESS
export default function CartDrawer({ isOpen, onClose, cartItems = [], onUpdateQuantity, onRemoveItem, onClearCart }) {
  const [step, setStep] = useState("CART");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // profile fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");

  if (!isOpen) return null;

  const calculateItemPrice = (item) => {
    const original = Number(item.price) || 0;
    const discount = item.current_discount?.is_active ? Number(item.current_discount.discount_percentage) : 0;
    return discount > 0 ? Math.round(original * (1 - discount / 100)) : original;
  };

  const totalPrice = cartItems.reduce((sum, item) => sum + calculateItemPrice(item) * item.quantity, 0);

  const handleClose = () => {
    setStep("CART");
    setError("");
    setOtp("");
    setMobile("");
    onClose();
  };

  // Step 1: check auth on checkout click
  const handleCheckout = () => {
    setError("");
    const token = localStorage.getItem("accessToken");
    const profileStr = localStorage.getItem("customerProfile");
    const profile = profileStr ? JSON.parse(profileStr) : null;

    if (!token) {
      setStep("MOBILE");
      return;
    }
    if (!profile?.is_complete) {
      if (!profile?.first_name || !profile?.last_name) {
        setStep("PROFILE");
      } else {
        setStep("ADDRESS");
      }
      return;
    }
    submitOrder(profile);
  };

  // Step 2: send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    if (!mobile || mobile.length < 10) {
      setError("لطفاً شماره موبایل معتبر وارد کنید.");
      return;
    }
    setLoading(true);
    try {
      await sendCodeApi(mobile);
      setStep("OTP");
    } catch (err) {
      setError(err.message || "خطا در ارسال کد تایید.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await verifyCodeApi(mobile, otp);
      localStorage.setItem("accessToken", res.access);
      localStorage.setItem("refreshToken", res.refresh);
      localStorage.setItem("user", JSON.stringify(res.user));
      if (res.profile) localStorage.setItem("customerProfile", JSON.stringify(res.profile));
      window.dispatchEvent(new Event("auth:changed"));

      if (res.is_new_user || !res.profile?.is_complete) {
        // pre-fill from existing profile if returning user with partial data
        if (res.profile) {
          setFirstName(res.profile.first_name || "");
          setLastName(res.profile.last_name || "");
          setAddress(res.profile.address || "");
          setCity(res.profile.city || "");
          setPostalCode(res.profile.postal_code || "");
        }
        setStep("PROFILE");
      } else {
        submitOrder(res.profile);
      }
    } catch (err) {
      setError(err.message || "کد تایید اشتباه است.");
    } finally {
      setLoading(false);
    }
  };

  // Step 4: save profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError("");
    if (!firstName || !lastName) {
      setError("نام و نام خانوادگی الزامی است.");
      return;
    }
    setLoading(true);
    try {
      const saved = await updateProfile({ first_name: firstName, last_name: lastName, address, city, postal_code: postalCode });
      localStorage.setItem("customerProfile", JSON.stringify(saved));
      if (!saved.is_complete) {
        setStep("ADDRESS");
      } else {
        submitOrder(saved);
      }
    } catch (err) {
      setError(err.message || "خطا در ذخیره اطلاعات.");
    } finally {
      setLoading(false);
    }
  };

  // Step 5: save address then order
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setError("");
    if (!address || !city || !postalCode) {
      setError("آدرس، شهر و کد پستی الزامی است.");
      return;
    }
    setLoading(true);
    try {
      const saved = await updateProfile({ address, city, postal_code: postalCode });
      localStorage.setItem("customerProfile", JSON.stringify(saved));
      await submitOrder(saved);
    } catch (err) {
      setError(err.message || "خطا در ثبت سفارش.");
    } finally {
      setLoading(false);
    }
  };

  const submitOrder = async (profile) => {
    setLoading(true);
    try {
      const items = cartItems.map((item) => ({
        product_id: item.id,
        product_name: item.name,
        size: item.selectedSize || "",
        quantity: item.quantity,
        unit_price: calculateItemPrice(item),
      }));
      await createOrder({ items });
      setStep("SUCCESS");
      setTimeout(() => {
        onClearCart && onClearCart();
        setStep("CART");
        handleClose();
      }, 3000);
    } catch (err) {
      setError(err.message || "خطا در ثبت سفارش.");
    } finally {
      setLoading(false);
    }
  };

  const stepTitles = {
    CART: "سبد خرید",
    MOBILE: "ورود / ثبت‌نام",
    OTP: "تایید کد",
    PROFILE: "اطلاعات شخصی",
    ADDRESS: "آدرس تحویل",
    SUCCESS: "ثبت سفارش",
  };

  const stepSubs = {
    CART: cartItems.length > 0 ? `${digitsEnToFa(cartItems.length)} کالا` : "سبد خالی",
    MOBILE: "شماره موبایل خود را وارد کنید",
    OTP: `کد پیامکی به ${digitsEnToFa(mobile)} ارسال شد`,
    PROFILE: "نام و نام خانوادگی را وارد کنید",
    ADDRESS: "آدرس، شهر و کد پستی را وارد کنید",
    SUCCESS: "با تشکر از خرید شما",
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" dir="rtl">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={handleClose} />

      <div className="fixed inset-y-0 left-0 max-w-full flex">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">

          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              {step !== "CART" && (
                <button
                  onClick={() => { setStep("CART"); setError(""); }}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
              <div className="p-2 bg-teal-100 text-teal-700 rounded-lg">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">{stepTitles[step]}</h2>
                <p className="text-xs text-slate-400">{stepSubs[step]}</p>
              </div>
            </div>
            <button onClick={handleClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Step progress dots */}
          {step !== "CART" && step !== "SUCCESS" && (
            <div className="flex items-center justify-center gap-2 py-3 border-b border-slate-100">
              {["MOBILE", "OTP", "PROFILE", "ADDRESS"].map((s, i) => (
                <div key={s} className={`h-1.5 rounded-full transition-all ${step === s ? "w-6 bg-teal-600" : ["MOBILE", "OTP", "PROFILE", "ADDRESS"].indexOf(step) > i ? "w-3 bg-teal-300" : "w-3 bg-slate-200"}`} />
              ))}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">{error}</div>
            )}

            {/* SUCCESS */}
            {step === "SUCCESS" && (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">سفارش با موفقیت ثبت شد!</h3>
                <p className="text-sm text-slate-500">با تشکر از خرید شما از مدی‌کالا.</p>
              </div>
            )}

            {/* MOBILE input */}
            {step === "MOBILE" && (
              <form onSubmit={handleSendOtp} className="space-y-5 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">شماره موبایل</label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="09xxxxxxxxx"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      className="w-full pl-4 pr-11 py-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                      autoFocus
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute right-4 top-4" />
                  </div>
                  <p className="text-xs text-slate-400 mt-2">اگر شماره ثبت نیست، حساب کاربری برایتان ساخته می‌شود.</p>
                </div>
                <button type="submit" disabled={loading} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 cursor-pointer">
                  {loading ? "در حال ارسال..." : "دریافت کد تایید"}
                </button>
              </form>
            )}

            {/* OTP verify */}
            {step === "OTP" && (
              <form onSubmit={handleVerifyOtp} className="space-y-5 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">کد تایید ۶ رقمی</label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="______"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full pl-4 pr-11 py-3.5 rounded-xl border border-slate-200 text-sm text-center tracking-[0.4em] font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                      autoFocus
                    />
                    <KeyRound className="w-4 h-4 text-slate-400 absolute right-4 top-4" />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 cursor-pointer">
                  {loading ? "در حال بررسی..." : "تایید کد"}
                </button>
                <button type="button" onClick={() => { setStep("MOBILE"); setOtp(""); setError(""); }} className="w-full text-sm text-slate-500 hover:text-teal-600 py-2 cursor-pointer">
                  تغییر شماره موبایل
                </button>
              </form>
            )}

            {/* PROFILE */}
            {step === "PROFILE" && (
              <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">نام</label>
                    <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required
                      className="w-full px-3 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">نام خانوادگی</label>
                    <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required
                      className="w-full px-3 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                  </div>
                </div>
                <p className="text-xs text-slate-400">این اطلاعات برای ثبت سفارش و ارسال استفاده می‌شود.</p>
                <button type="submit" disabled={loading} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 cursor-pointer">
                  {loading ? "در حال ذخیره..." : "ادامه"}
                </button>
              </form>
            )}

            {/* ADDRESS */}
            {step === "ADDRESS" && (
              <form onSubmit={handleSaveAddress} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">آدرس کامل</label>
                  <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} required
                    className="w-full px-3 py-3 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="خیابان، کوچه، پلاک، واحد..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">شهر</label>
                    <input type="text" value={city} onChange={(e) => setCity(e.target.value)} required
                      className="w-full px-3 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">کد پستی</label>
                    <input type="text" inputMode="numeric" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} required
                      className="w-full px-3 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 cursor-pointer">
                  {loading ? "در حال ثبت سفارش..." : "ثبت سفارش"}
                </button>
              </form>
            )}

            {/* CART items */}
            {step === "CART" && (cartItems.length === 0 ? (
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
                  <div key={`${item.id}-${item.selectedSize}`}
                    className="flex items-center gap-3 p-3 bg-slate-50/80 border border-slate-100 rounded-2xl hover:border-slate-200 transition-all">
                    <img
                      src={item.image || (item.images && item.images[0]) || "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80"}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-xl border border-slate-200/60 bg-white"
                    />
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
                        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                          <button onClick={() => onUpdateQuantity(item.id, item.selectedSize, item.quantity - 1)} className="p-1 hover:bg-slate-100 rounded text-slate-600 cursor-pointer">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold text-slate-800 px-1.5">{digitsEnToFa(item.quantity)}</span>
                          <button onClick={() => onUpdateQuantity(item.id, item.selectedSize, item.quantity + 1)} className="p-1 hover:bg-slate-100 rounded text-slate-600 cursor-pointer">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => onRemoveItem(item.id, item.selectedSize)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            ))}
          </div>

          {/* Footer */}
          {step === "CART" && cartItems.length > 0 && (
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
