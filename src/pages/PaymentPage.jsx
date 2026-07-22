import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ShieldCheck, CreditCard, CheckCircle2, ArrowRight, Loader2, AlertCircle, Building2, Lock } from "lucide-react";
import { digitsEnToFa } from "@persian-tools/persian-tools";
import { getOrderDetails, payOrderApi } from "../api";

export default function PaymentPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [selectedGateway, setSelectedGateway] = useState("saman");

  useEffect(() => {
    async function fetchOrder() {
      setLoading(true);
      setError("");
      try {
        const data = await getOrderDetails(orderId);
        setOrder(data);
      } catch (err) {
        setError("خطا در دریافت اطلاعات سفارش.");
      } finally {
        setLoading(false);
      }
    }
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    setPaying(true);
    setError("");
    try {
      await payOrderApi(orderId);
      // Success -> navigate to profile orders page
      navigate("/profile?tab=orders&status=success");
    } catch (err) {
      setError(err.message || "خطا در انجام پرداخت.");
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        <span className="text-xs font-medium">در حال انتقال به درگاه پرداخت...</span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center space-y-4" dir="rtl">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">سفارش یافت نشد یا دسترسی مجاز نیست</h2>
        <p className="text-xs text-slate-500 max-w-sm">{error || "سفارش مورد نظر وجود ندارد."}</p>
        <Link
          to="/profile"
          className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-colors"
        >
          بازگشت به حساب کاربری
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 font-sans" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Back Link */}
        <Link
          to="/profile?tab=orders"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-teal-600 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به سفارش‌ها</span>
        </Link>

        {/* Payment Container */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-teal-700 to-emerald-600 text-white p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-teal-100">درگاه پرداخت امن الکترونیک</span>
              <h1 className="text-xl font-extrabold flex items-center gap-2">
                <CreditCard className="w-6 h-6" />
                پرداخت نهایی سفارش #{digitsEnToFa(order.id)}
              </h1>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 hidden sm:block">
              <Lock className="w-6 h-6 text-emerald-200" />
            </div>
          </div>

          <div className="p-6 space-y-8">

            {/* Order Items & Shipping Summary */}
            <div className="space-y-4">
              <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">خلاصه سفارش</h3>
              
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 divide-y divide-slate-200/60 space-y-3">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="pt-3 first:pt-0 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{item.product_name}</span>
                      {item.size && (
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                          {item.size}
                        </span>
                      )}
                      <span className="text-slate-400">({digitsEnToFa(item.quantity)} عدد)</span>
                    </div>
                    <span className="font-extrabold text-slate-900">
                      {digitsEnToFa(Number(item.unit_price * item.quantity).toLocaleString())} تومان
                    </span>
                  </div>
                ))}
              </div>

              {/* Shipping info */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-xs space-y-1 text-slate-600">
                <div className="font-bold text-slate-800">آدرس تحویل:</div>
                <p>{order.city} - {order.shipping_address} (کد پستی: {digitsEnToFa(order.postal_code)})</p>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">انتخاب درگاه پرداخت</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: "saman", name: "درگاه پرداخت سامان", desc: "کلیه کارت‌های عضو شتاب" },
                  { id: "mellat", name: "درگاه پرداخت ملت", desc: "پرداخت مستقیم آنلاین" },
                ].map((gw) => (
                  <label
                    key={gw.id}
                    className={`flex items-start gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${
                      selectedGateway === gw.id
                        ? "border-teal-500 bg-teal-50/40 ring-2 ring-teal-500/20"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="gateway"
                      value={gw.id}
                      checked={selectedGateway === gw.id}
                      onChange={() => setSelectedGateway(gw.id)}
                      className="mt-1 text-teal-600 focus:ring-teal-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-teal-600" />
                        {gw.name}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{gw.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Total Amount & Submit Button */}
            <div className="border-t border-slate-100 pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-600">مبلغ قابل پرداخت:</span>
                <span className="text-xl font-black text-teal-700">
                  {digitsEnToFa(Number(order.total_price).toLocaleString())}{" "}
                  <span className="text-xs font-normal text-slate-500">تومان</span>
                </span>
              </div>

              <button
                onClick={handleProcessPayment}
                disabled={paying || order.status === "paid"}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold py-4 px-6 rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                {paying ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>در حال انتقال به درگاه بانک...</span>
                  </>
                ) : order.status === "paid" ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>این سفارش قبلاً پرداخت شده است</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    <span>پرداخت نهایی و تکمیل سفارش</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 pt-2">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>اتصال امن به درگاه شاپرک با گواهی SSL ۲۵۶ بیتی</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
