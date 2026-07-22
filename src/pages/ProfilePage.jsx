import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  User,
  ShoppingBag,
  MapPin,
  LogOut,
  CreditCard,
  Plus,
  CheckCircle2,
  Clock,
  PackageCheck,
  XCircle,
  ChevronLeft,
  Loader2,
  Phone,
  KeyRound,
  Edit3,
  Check,
} from "lucide-react";
import { digitsEnToFa } from "@persian-tools/persian-tools";
import {
  getProfile,
  updateProfile,
  getCustomerOrders,
  sendCodeApi,
  verifyCodeApi,
} from "../api";

export default function ProfilePage({ onAddToCart, onOpenCart }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const initialTab = searchParams.get("tab") || "orders";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [orderFilter, setOrderFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState(
    searchParams.get("status") === "success" ? "پرداخت با موفقیت انجام شد!" : ""
  );

  // Profile form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Auth modal state for unauthenticated users
  const [authStep, setAuthStep] = useState("MOBILE"); // MOBILE | OTP
  const [mobileInput, setMobileInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const isAuthenticated = Boolean(localStorage.getItem("accessToken"));

  const loadData = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [profData, orderData] = await Promise.all([
        getProfile().catch(() => null),
        getCustomerOrders().catch(() => []),
      ]);

      if (profData) {
        setUserProfile(profData);
        setFirstName(profData.first_name || "");
        setLastName(profData.last_name || "");
        setAddress(profData.address || "");
        setCity(profData.city || "");
        setPostalCode(profData.postal_code || "");
      }
      if (Array.isArray(orderData)) {
        setOrders(orderData);
      }
    } catch (err) {
      setError("خطا در دریافت اطلاعات کاربر");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAuthenticated]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleSaveProfileData = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setError("");
    setSuccessMsg("");
    try {
      const updated = await updateProfile({
        first_name: firstName,
        last_name: lastName,
        address,
        city,
        postal_code: postalCode,
      });
      setUserProfile(updated);
      localStorage.setItem("customerProfile", JSON.stringify(updated));
      setSuccessMsg("اطلاعات حساب با موفقیت بروزرسانی شد.");
    } catch (err) {
      setError(err.message || "خطا در بروزرسانی اطلاعات.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("customerProfile");
    window.dispatchEvent(new Event("auth:changed"));
    navigate("/");
  };

  // Auth flow for non-logged-in visitors
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setAuthError("");
    if (!mobileInput || mobileInput.length < 10) {
      setAuthError("لطفاً شماره موبایل معتبر وارد کنید.");
      return;
    }
    setAuthLoading(true);
    try {
      await sendCodeApi(mobileInput);
      setAuthStep("OTP");
    } catch (err) {
      setAuthError(err.message || "خطا در ارسال کد تایید.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      const res = await verifyCodeApi(mobileInput, otpInput);
      localStorage.setItem("accessToken", res.access);
      localStorage.setItem("refreshToken", res.refresh);
      localStorage.setItem("user", JSON.stringify(res.user));
      if (res.profile) localStorage.setItem("customerProfile", JSON.stringify(res.profile));
      window.dispatchEvent(new Event("auth:changed"));
      loadData();
    } catch (err) {
      setAuthError(err.message || "کد تایید اشتباه است.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAddMoreToCart = (item) => {
    if (onAddToCart) {
      onAddToCart({
        id: item.product || item.id,
        name: item.product_name,
        selectedSize: item.size || "",
        price: item.unit_price,
        image: item.product_image,
      });
      if (onOpenCart) onOpenCart();
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (orderFilter === "all") return true;
    return o.status === orderFilter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "paid":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            پرداخت شده
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            در انتظار پرداخت
          </span>
        );
      case "delivered":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
            <PackageCheck className="w-3.5 h-3.5 text-blue-600" />
            تحویل شده
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            لغو شده
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
            {status}
          </span>
        );
    }
  };

  // Render Login Prompt if Not Authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] bg-slate-50 flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-teal-100 text-teal-700 rounded-2xl mx-auto flex items-center justify-center shadow-md shadow-teal-500/10">
              <User className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-slate-800">ورود به حساب کاربری مدی‌کالا</h2>
            <p className="text-xs text-slate-500">برای مشاهده سفارش‌ها و اطلاعات حساب وارد شوید.</p>
          </div>

          {authError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium text-center">
              {authError}
            </div>
          )}

          {authStep === "MOBILE" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">شماره موبایل</label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="09xxxxxxxxx"
                    value={mobileInput}
                    onChange={(e) => setMobileInput(e.target.value)}
                    className="w-full pl-4 pr-11 py-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute right-4 top-4" />
                </div>
              </div>
              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-teal-600/20 disabled:opacity-50 cursor-pointer"
              >
                {authLoading ? "در حال ارسال..." : "ورود / ثبت نام"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">کد تایید ۶ رقمی</label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="______"
                    maxLength={6}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    className="w-full pl-4 pr-11 py-3.5 rounded-xl border border-slate-200 text-sm text-center tracking-[0.4em] font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute right-4 top-4" />
                </div>
              </div>
              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-teal-600/20 disabled:opacity-50 cursor-pointer"
              >
                {authLoading ? "در حال تایید..." : "تایید و ورود"}
              </button>
              <button
                type="button"
                onClick={() => { setAuthStep("MOBILE"); setOtpInput(""); }}
                className="w-full text-xs text-slate-500 hover:text-teal-600 py-1"
              >
                تغییر شماره موبایل
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        <span className="text-xs font-medium">در حال بارگذاری اطلاعات حساب...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Global Feedback Banner */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-2xl flex items-center justify-between font-medium shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg("")} className="text-emerald-600 hover:text-emerald-900">
              &times;
            </button>
          </div>
        )}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-2xl flex items-center justify-between font-medium shadow-xs">
            <span>{error}</span>
            <button onClick={() => setError("")} className="text-rose-600 hover:text-rose-900">
              &times;
            </button>
          </div>
        )}

        {/* Digikala Style Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6">
              
              {/* Profile Card */}
              <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
                <div className="w-14 h-14 bg-gradient-to-tr from-teal-600 to-emerald-400 text-white rounded-2xl flex items-center justify-center text-xl font-bold shadow-md shadow-teal-500/20">
                  {userProfile?.first_name ? userProfile.first_name[0] : <User className="w-7 h-7" />}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-slate-800 truncate">
                    {userProfile?.first_name ? `${userProfile.first_name} ${userProfile.last_name}` : "کاربر مدی‌کالا"}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    {userProfile?.mobile ? digitsEnToFa(userProfile.mobile) : ""}
                  </p>
                </div>
              </div>

              {/* Navigation Menu */}
              <nav className="space-y-1">
                <button
                  onClick={() => handleTabChange("orders")}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "orders"
                      ? "bg-teal-50 text-teal-700 shadow-xs border border-teal-200/60"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="w-4 h-4" />
                    <span>سفارش‌های من</span>
                  </div>
                  <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                    {digitsEnToFa(orders.length)}
                  </span>
                </button>

                <button
                  onClick={() => handleTabChange("details")}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "details"
                      ? "bg-teal-50 text-teal-700 shadow-xs border border-teal-200/60"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4" />
                    <span>اطلاعات حساب کاربری</span>
                  </div>
                </button>

                <button
                  onClick={() => handleTabChange("address")}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "address"
                      ? "bg-teal-50 text-teal-700 shadow-xs border border-teal-200/60"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4" />
                    <span>آدرس‌های من</span>
                  </div>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer pt-4 border-t border-slate-100 mt-4"
                >
                  <LogOut className="w-4 h-4" />
                  <span>خروج از حساب</span>
                </button>
              </nav>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="lg:col-span-3">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm min-h-[500px]">

              {/* TAB 1: MY ORDERS */}
              {activeTab === "orders" && (
                <div className="space-y-6">
                  
                  {/* Header & Status Filter Pills */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <h2 className="text-lg font-extrabold text-slate-800">تاریخچه سفارش‌ها</h2>
                      <p className="text-xs text-slate-400 mt-0.5">محصولات سفارش داده شده مرتبط با شما</p>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/80 p-1 rounded-2xl">
                      {[
                        { id: "all", label: "همه" },
                        { id: "pending", label: "در انتظار پرداخت" },
                        { id: "paid", label: "پرداخت شده" },
                        { id: "delivered", label: "تحویل شده" },
                      ].map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setOrderFilter(f.id)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                            orderFilter === f.id
                              ? "bg-white text-slate-900 shadow-xs"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Orders List */}
                  {filteredOrders.length === 0 ? (
                    <div className="py-16 text-center space-y-4">
                      <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-full mx-auto flex items-center justify-center">
                        <ShoppingBag className="w-10 h-10" />
                      </div>
                      <p className="text-slate-600 font-bold text-sm">هیچ سفارشی یافت نشد!</p>
                      <p className="text-xs text-slate-400">هنوز سفارشی با این مشخصات ثبت نکرده‌اید.</p>
                      <Link
                        to="/products"
                        className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-colors shadow-md shadow-teal-600/20 mt-2"
                      >
                        مشاهده محصولات و خرید
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {filteredOrders.map((order) => (
                        <div
                          key={order.id}
                          className="border border-slate-200/90 rounded-2xl overflow-hidden hover:border-slate-300 transition-all shadow-2xs"
                        >
                          {/* Order Card Header */}
                          <div className="bg-slate-50/70 p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-4">
                              <span className="font-mono font-bold text-slate-800">
                                کد سفارش: #{digitsEnToFa(order.id)}
                              </span>
                              <span className="text-slate-400">|</span>
                              <span className="text-slate-500">
                                {new Date(order.created_at).toLocaleDateString("fa-IR")}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              {getStatusBadge(order.status)}
                              {order.status === "pending" && (
                                <Link
                                  to={`/payment/${order.id}`}
                                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-xs transition-colors"
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                  <span>پرداخت نهایی</span>
                                </Link>
                              )}
                            </div>
                          </div>

                          {/* Order Products List */}
                          <div className="p-4 divide-y divide-slate-100">
                            {order.items?.map((item, idx) => (
                              <div
                                key={idx}
                                className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                              >
                                <div className="flex items-center gap-3">
                                  <img
                                    src={
                                      item.product_image ||
                                      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80"
                                    }
                                    alt={item.product_name}
                                    className="w-16 h-16 object-cover rounded-xl border border-slate-200/60 bg-white"
                                  />
                                  <div className="space-y-1">
                                    <h4 className="text-xs font-bold text-slate-800">
                                      {item.product_name}
                                    </h4>
                                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                      {item.size && (
                                        <span className="bg-slate-100 px-2 py-0.5 rounded-md font-medium text-slate-700">
                                          سایز: {item.size}
                                        </span>
                                      )}
                                      <span>تعداد: {digitsEnToFa(item.quantity)}</span>
                                    </div>
                                    <div className="text-xs font-extrabold text-teal-700">
                                      {digitsEnToFa(Number(item.unit_price).toLocaleString())}{" "}
                                      <span className="text-[10px] font-normal text-slate-500">تومان</span>
                                    </div>
                                  </div>
                                </div>

                                {/* "Add More" / Re-order Button */}
                                <div className="flex items-center gap-2 self-end sm:self-center">
                                  <button
                                    onClick={() => handleAddMoreToCart(item)}
                                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200/80 rounded-xl transition-colors cursor-pointer"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>خرید مجدد / افزودن به سبد</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Order Summary Footer */}
                          <div className="bg-slate-50/40 px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                            <span className="text-slate-500">مجموع سفارش:</span>
                            <span className="text-sm font-black text-slate-900">
                              {digitsEnToFa(Number(order.total_price).toLocaleString())}{" "}
                              <span className="text-xs font-normal text-slate-500">تومان</span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: ACCOUNT DETAILS */}
              {activeTab === "details" && (
                <div className="space-y-6">
                  <div className="pb-4 border-b border-slate-100">
                    <h2 className="text-lg font-extrabold text-slate-800">اطلاعات حساب کاربری</h2>
                    <p className="text-xs text-slate-400 mt-0.5">مشخصات فردی خود را مدیریت کنید</p>
                  </div>

                  <form onSubmit={handleSaveProfileData} className="max-w-xl space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">نام</label>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                          placeholder="مثلاً علی"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">نام خانوادگی</label>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                          placeholder="مثلاً محمدی"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">شماره همراه</label>
                      <input
                        type="text"
                        disabled
                        value={userProfile?.mobile ? digitsEnToFa(userProfile.mobile) : ""}
                        className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-100 text-slate-500 text-sm cursor-not-allowed font-mono"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">شماره همراه قابل تغییر نیست.</p>
                    </div>

                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 py-3 rounded-xl text-xs transition-colors shadow-md shadow-teal-600/20 disabled:opacity-50 cursor-pointer"
                    >
                      {savingProfile ? "در حال ذخیره..." : "ذخیره تغییرات"}
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 3: ADDRESSES */}
              {activeTab === "address" && (
                <div className="space-y-6">
                  <div className="pb-4 border-b border-slate-100">
                    <h2 className="text-lg font-extrabold text-slate-800">آدرس تحویل سفارش</h2>
                    <p className="text-xs text-slate-400 mt-0.5">آدرس ارسال کالاها را مدیریت کنید</p>
                  </div>

                  <form onSubmit={handleSaveProfileData} className="max-w-xl space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">آدرس کامل پستی</label>
                      <textarea
                        rows={3}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                        placeholder="استان، شهر، خیابان، پلاک، واحد..."
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">شهر</label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                          placeholder="مثلاً تهران"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">کد پستی (۱۰ رقمی)</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                          placeholder="xxxxxxxxxx"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 py-3 rounded-xl text-xs transition-colors shadow-md shadow-teal-600/20 disabled:opacity-50 cursor-pointer"
                    >
                      {savingProfile ? "در حال ذخیره..." : "ثبت آدرس"}
                    </button>
                  </form>
                </div>
              )}

            </div>
          </main>

        </div>
      </div>
    </div>
  );
}
