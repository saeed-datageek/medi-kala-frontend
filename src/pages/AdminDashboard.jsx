import { digitsEnToFa } from "@persian-tools/persian-tools"
import * as shamsi from 'shamsi-date-converter'
import { useState, useEffect, useRef } from 'react'
import { Calendar, CalendarProvider } from "zaman"

import PersianNumberInput from '../components/persianNumberInput'
import {
  createAdminProduct,
  updateProduct,
  deleteProduct,
  getAdminProducts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  getProductCategories
} from '../api'

import {
  Search,
  ShoppingBag,
  Plus,
  Trash2,
  Edit,
  Delete,
  Package,
  Tag,
  Percent,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  CheckCircle2,
  Calendar as CalendarIcon,
  Layers,
  Filter,
  Upload,
  Star
} from "lucide-react";

const VALID_SIZES = ["S", "M", "L", "2X", "Free Size"];

// Helper to convert YYYY-MM-DD to Jalali Display format YYYY/MM/DD
const toJalaliDisplay = (dateStr) => {
  if (!dateStr) return '';
  try {
    const parts = String(dateStr).split('T')[0].split('-');
    if (parts.length === 3) {
      const gY = parseInt(parts[0], 10);
      const gM = parseInt(parts[1], 10);
      const gD = parseInt(parts[2], 10);
      if (!isNaN(gY) && !isNaN(gM) && !isNaN(gD)) {
        const j = shamsi.gregorianToJalali(gY, gM, gD);
        return digitsEnToFa(`${j[0]}/${String(j[1]).padStart(2, '0')}/${String(j[2]).padStart(2, '0')}`);
      }
    }
  } catch (e) {
    console.error("Jalali conversion error", e);
  }
  return String(dateStr);
};

// Helper to format Date object to YYYY-MM-DD
const formatDateValue = (date) => {
  if (!date) return ''
  const localDate = new Date(date)
  if (isNaN(localDate.getTime())) return ''
  const year = localDate.getFullYear()
  const month = `${localDate.getMonth() + 1}`.padStart(2, '0')
  const day = `${localDate.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function AdminDashboard() {
  const [products, setProducts] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const PRODUCTS_PER_PAGE = 5

  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [isEditingProduct, setIsEditingProduct] = useState(null)
  const isFormOpen = isAddingProduct || isEditingProduct !== null;

  // Jalali Calendar popover states
  const [showJalaliCalendar, setShowJalaliCalendar] = useState(false);
  const [activeDateTab, setActiveDateTab] = useState('start'); // 'start' | 'end'

  const [categories, setCategories] = useState([])
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false)
  const categoryMenuRef = useRef(null)
  const calendarRef = useRef(null)

  const normalizeSizes = (input) => {
    const arr = Array.isArray(input) ? input : (input ? [input] : []);
    return arr.map((s) => {
      if (s == null) return s
      const found = VALID_SIZES.find((v) => v.toLowerCase() === String(s).toLowerCase());
      return found || s;
    });
  }

  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: 0,
    image: "",
    images: [],
    category: "",
    stock: 10,
    rating: 4,
    brand: "",
    size: ["Free Size"],
    size_stock: { "Free Size": 10 },
    discount: 0,
    discountId: null,
    startDate: "",
    endDate: "",
  })

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  // Close calendar popover on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (!showJalaliCalendar) return
      if (calendarRef.current && !calendarRef.current.contains(e.target)) {
        setShowJalaliCalendar(false)
      }
    }
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setShowJalaliCalendar(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleKey)
    }
  }, [showJalaliCalendar])

  // Close category dropdown on outside click
  useEffect(() => {
    const onOutside = (e) => {
      if (!isCategoryMenuOpen) return
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(e.target)) {
        setIsCategoryMenuOpen(false)
      }
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setIsCategoryMenuOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onOutside)
      document.removeEventListener('keydown', onKey)
    }
  }, [isCategoryMenuOpen])

  const fetchProducts = async () => {
    try {
      const data = await getAdminProducts()
      const productList = Array.isArray(data) ? data : (data?.results ?? [])
      setProducts(productList)
    } catch (error) {
      console.error("Error fetching products:", error)
    }
  }

  const fetchCategories = async () => {
    try {
      const data = await getProductCategories()
      setCategories(data || [])
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const normalizedProducts = Array.isArray(products) ? products : []

  const category_options = [... new Set([
    ...normalizedProducts.map((p) => p.category).filter(Boolean),
    ...categories.filter(Boolean),
  ])]

  const handleGalleryImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = reader.result
        setProductForm((prev) => {
          const currentImages = prev.images || []
          const updatedImages = [...currentImages, base64]
          return {
            ...prev,
            image: prev.image || base64,
            images: updatedImages
          }
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const setPrimaryImage = (imgUrl) => {
    setProductForm((prev) => ({
      ...prev,
      image: imgUrl,
    }))
  }

  const removeGalleryImage = (index) => {
    setProductForm((prev) => {
      const nextImages = (prev.images || []).filter((_, i) => i !== index)
      const nextPrimary = prev.image === prev.images?.[index] ? nextImages[0] || "" : prev.image
      return {
        ...prev,
        images: nextImages,
        image: nextPrimary,
      }
    })
  }

  const resetFormState = () => {
    setIsAddingProduct(false)
    setIsEditingProduct(null)
    setShowJalaliCalendar(false)
    setProductForm({
      name: "",
      description: "",
      price: 0,
      image: "",
      images: [],
      category: "",
      stock: 10,
      rating: 4,
      brand: "",
      size: ["Free Size"],
      size_stock: { "Free Size": 10 },
      discount: 0,
      discountId: null,
      startDate: "",
      endDate: "",
    })
  }

  const handleAddOrEditProduct = async (e) => {
    e.preventDefault()

    const computedStock = productForm.size_stock && Object.keys(productForm.size_stock).length > 0
      ? Object.values(productForm.size_stock).reduce((a, b) => a + Number(b), 0)
      : productForm.stock

    const payload = {
      name: productForm.name,
      description: productForm.description,
      price: productForm.price,
      image: productForm.image,
      images: productForm.images,
      category: productForm.category,
      stock: computedStock,
      rating: productForm.rating,
      brand: productForm.brand,
      size: (productForm.size && productForm.size.length > 0) ? productForm.size : ["Free Size"],
      size_stock: productForm.size_stock || {},
    }

    try {
      let savedProduct;
      if (isEditingProduct) {
        savedProduct = await updateProduct(isEditingProduct.id, payload)
      } else {
        savedProduct = await createAdminProduct(payload)
      }

      const discountVal = parseFloat(productForm.discount) || 0;
      const targetProductId = savedProduct?.id || isEditingProduct?.id;

      if (targetProductId) {
        if (discountVal > 0) {
          // Send null instead of empty string if date is not selected
          const discountPayload = {
            product: targetProductId,
            discount_percentage: discountVal,
            start_date: productForm.startDate ? productForm.startDate : null,
            end_date: productForm.endDate ? productForm.endDate : null,
          }

          if (productForm.discountId) {
            await updateDiscount(productForm.discountId, discountPayload)
          } else {
            await createDiscount(discountPayload)
          }
        } else if (discountVal === 0 && productForm.discountId) {
          // If discount was set to 0, delete existing discount
          await deleteDiscount(productForm.discountId)
        }
      }

      await fetchProducts()
      await fetchCategories()
      resetFormState()
    } catch (error) {
      console.error("Error creating/updating product:", error)
      alert("خطا در ثبت اطلاعات محصول یا تخفیف: " + (error?.message || "لطفاً مقادیر وارد شده را بررسی کنید."))
    }
  }

  const handleDeleteDiscount = async (discountId) => {
    if (!confirm("آیا از حذف این تخفیف اطمینان دارید؟")) return
    try {
      await deleteDiscount(discountId)
      await fetchProducts()
      await fetchCategories()
    } catch (error) {
      console.error("Error deleting discount:", error)
      alert("خطا در حذف تخفیف")
    }
  }

  const handleDeleteProduct = async (productId) => {
    if (!confirm("آیا از حذف این محصول اطمینان دارید؟")) return;
    try {
      await deleteProduct(productId)
      setProducts((prev) => prev.filter((p) => p.id !== productId))
      await fetchProducts()
      await fetchCategories()
    } catch (error) {
      console.error("Error deleting product:", error)
      alert("خطا در حذف محصول")
    }
  }

  const triggerFillEdit = (product) => {
    const currentDisc = product.current_discount;
    setIsEditingProduct(product)
    setIsAddingProduct(false)
    setShowJalaliCalendar(false)
    setProductForm({
      name: product.name,
      price: product.price,
      images: product.images || [],
      image: product.image,
      category: product.category,
      rating: product.rating,
      description: product.description,
      stock: product.stock,
      brand: product.brand,
      size: normalizeSizes(product.size || product.sizes || []),
      size_stock: product.size_stock || {},
      discount: currentDisc ? Number(currentDisc.discount_percentage) : 0,
      discountId: currentDisc ? currentDisc.id : null,
      startDate: currentDisc?.start_date || "",
      endDate: currentDisc?.end_date || "",
    })
  }

  const handleCalenderChange = (payload) => {
    const selectedDate = payload?.value
      ? new Date(payload.value)
      : payload?.from
        ? new Date(payload.from)
        : payload instanceof Date
          ? payload
          : null

    if (!selectedDate || Number.isNaN(selectedDate.getTime())) return
    const formattedDate = formatDateValue(selectedDate);

    if (activeDateTab === 'start') {
      setProductForm((prev) => ({ ...prev, startDate: formattedDate }))
      setActiveDateTab('end') // Move to end date selection automatically
    } else {
      setProductForm((prev) => ({ ...prev, endDate: formattedDate }))
      setShowJalaliCalendar(false) // Close popover when end date selected
    }
  }

  // Filtered list logic
  const filteredProducts = normalizedProducts.filter((p) => {
    const matchesSearch = String(p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.brand && String(p.brand).toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = selectedCategoryFilter === "all" || p.category === selectedCategoryFilter
    return matchesSearch && matchesCategory
  })

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE))
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  )

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedCategoryFilter, products.length])

  // Stats calculation
  const totalStockCount = normalizedProducts.reduce((acc, curr) => acc + (Number(curr.stock) || 0), 0)
  const activeDiscountsCount = normalizedProducts.filter((p) => p.current_discount).length
  const lowStockCount = normalizedProducts.filter((p) => p.stock > 0 && p.stock <= 5).length

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-16" dir="rtl">
      {/* Top Header Navigation Banner */}
      <header className="sticky top-0 z-40 bg-white/80 border-b border-slate-200/80 backdrop-blur-xl shadow-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-md shadow-emerald-600/20 text-white font-bold">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-wide flex items-center gap-2">
                مدیریت پارسین طب
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  پنل مدیریت
                </span>
              </h1>
              <p className="text-xs text-slate-500">مدیریت محصولات، تخفیف‌ها و انبارداری</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isFormOpen && (
              <button
                type="button"
                onClick={() => {
                  resetFormState()
                  setIsAddingProduct(true)
                }}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 shadow-md shadow-emerald-600/20 transition-all duration-200 active:scale-95 text-sm cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>افزودن محصول جدید</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* KPI Dashboard Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-white border border-slate-200/80 p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">کل محصولات</span>
              <Package className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {digitsEnToFa(products.length)} <span className="text-xs font-normal text-slate-500">قلم</span>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200/80 p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">موجودی کل انبار</span>
              <Layers className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {digitsEnToFa(totalStockCount)} <span className="text-xs font-normal text-slate-500">عدد</span>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200/80 p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">محصولات دارای تخفیف</span>
              <Percent className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-amber-600">
              {digitsEnToFa(activeDiscountsCount)} <span className="text-xs font-normal text-slate-500">محصول</span>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200/80 p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">هشدار کمبود موجودی</span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-bold text-rose-600">
              {digitsEnToFa(lowStockCount)} <span className="text-xs font-normal text-slate-500">کالا</span>
            </div>
          </div>
        </div>

        {/* Product Add / Edit Light Form Card */}
        {isFormOpen && (
          <section className="rounded-3xl border border-slate-200 bg-white shadow-xl p-6 relative overflow-visible transition-all duration-300 animate-in fade-in slide-in-from-top-4">
            <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-emerald-500 to-teal-600" />
            
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                  {isEditingProduct ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  {isEditingProduct ? `ویرایش محصول: ${isEditingProduct.name}` : "افزودن محصول جدید به فروشگاه"}
                </h2>
              </div>
              <button
                type="button"
                onClick={resetFormState}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddOrEditProduct} className="space-y-6">
              {/* Basic Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">نام محصول *</label>
                  <input
                    type="text"
                    placeholder="مثال: روپوش پزشکی مردانه"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">قیمت (تومان) *</label>
                  <PersianNumberInput
                    value={productForm.price}
                    onChange={(value) => setProductForm({ ...productForm, price: value })}
                    placeholder="مثال: ۴۵۰,۰۰۰"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">برند / برند تولیدکننده</label>
                  <input
                    type="text"
                    placeholder="مثال: مدی‌کالا"
                    value={productForm.brand}
                    onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                  />
                </div>
              </div>

              {/* Category & Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 relative" ref={categoryMenuRef}>
                  <label className="text-xs font-semibold text-slate-700">دسته‌بندی محصول *</label>
                  <input
                    type="text"
                    value={productForm.category}
                    onChange={(e) => {
                      setProductForm({ ...productForm, category: e.target.value })
                      setIsCategoryMenuOpen(true)
                    }}
                    onFocus={() => setIsCategoryMenuOpen(true)}
                    placeholder="انتخاب یا تایپ دسته‌بندی جدید..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                    required
                  />

                  {isCategoryMenuOpen && category_options.length > 0 && (
                    <div className="absolute right-0 left-0 z-50 mt-1 max-h-48 overflow-auto rounded-xl border border-slate-200 bg-white shadow-xl">
                      {category_options
                        .filter((cat) => cat.toLowerCase().includes(productForm.category.toLowerCase()))
                        .map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              setProductForm({ ...productForm, category: cat })
                              setIsCategoryMenuOpen(false)
                            }}
                            className="w-full text-right px-4 py-2.5 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition flex items-center justify-between cursor-pointer"
                          >
                            <span>{cat}</span>
                            <Tag className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">توضیحات محصول</label>
                  <input
                    type="text"
                    placeholder="خلاصه ویژگی‌های محصول..."
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                  />
                </div>
              </div>

              {/* Sizes and Stock management */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    انتخاب سایزبندی و موجودی انبار
                  </label>
                  <span className="text-xs text-slate-600">
                    موجودی کل محاسبه شده: <strong className="text-emerald-700">{digitsEnToFa(productForm.stock)}</strong>
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "S", label: "سایز S" },
                    { key: "M", label: "سایز M" },
                    { key: "L", label: "سایز L" },
                    { key: "2X", label: "سایز 2XL" },
                    { key: "Free Size", label: "فری سایز (Free Size)" }
                  ].map((sz) => {
                    const currentSizes = productForm.size || [];
                    const isChecked = currentSizes.includes(sz.key);
                    return (
                      <button
                        key={sz.key}
                        type="button"
                        onClick={() => {
                          let newSizes;
                          let newSizeStock = { ...(productForm.size_stock || {}) };
                          if (isChecked) {
                            newSizes = currentSizes.filter((s) => s !== sz.key);
                            delete newSizeStock[sz.key];
                          } else {
                            newSizes = [...currentSizes, sz.key];
                            newSizeStock[sz.key] = newSizeStock[sz.key] ?? 10;
                          }
                          const totalStock = Object.values(newSizeStock).reduce((a, b) => a + Number(b), 0);
                          setProductForm({
                            ...productForm,
                            size: newSizes,
                            size_stock: newSizeStock,
                            stock: totalStock,
                          });
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          isChecked
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                            : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {sz.label}
                      </button>
                    );
                  })}
                </div>

                {productForm.size && productForm.size.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
                    {productForm.size.map((sKey) => (
                      <div key={sKey} className="bg-white p-2.5 rounded-xl border border-slate-200 flex flex-col gap-1 shadow-2xs">
                        <span className="text-xs text-slate-600 font-medium">{sKey}:</span>
                        <input
                          type="number"
                          min="0"
                          value={productForm.size_stock?.[sKey] ?? 0}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const updatedMap = { ...(productForm.size_stock || {}), [sKey]: val };
                            const total = Object.values(updatedMap).reduce((a, b) => a + Number(b), 0);
                            setProductForm({
                              ...productForm,
                              size_stock: updatedMap,
                              stock: total,
                            });
                          }}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Gallery Image Upload & Thumbnail Gallery */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    گالری تصاویر محصول ({digitsEnToFa(productForm.images?.length || 0)})
                  </label>
                  {productForm.images?.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setProductForm((prev) => ({ ...prev, images: [], image: "" }))}
                      className="text-xs text-rose-600 hover:underline font-medium cursor-pointer"
                    >
                      حذف همه تصاویر
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <label className="flex flex-col items-center justify-center h-28 rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-white hover:bg-emerald-50/30 transition cursor-pointer text-slate-500 hover:text-emerald-700 group">
                    <Upload className="w-6 h-6 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-medium">بارگذاری تصویر</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleGalleryImageUpload}
                      className="hidden"
                    />
                  </label>

                  {productForm.images && productForm.images.map((imgUrl, index) => {
                    const isPrimary = productForm.image === imgUrl;
                    return (
                      <div
                        key={index}
                        className={`relative h-28 rounded-xl overflow-hidden border bg-white group transition-all ${
                          isPrimary ? "ring-2 ring-emerald-600 border-transparent shadow-md" : "border-slate-200"
                        }`}
                      >
                        <img
                          src={imgUrl}
                          alt={`gallery-${index}`}
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => setPrimaryImage(imgUrl)}
                        />
                        {isPrimary ? (
                          <span className="absolute top-1.5 right-1.5 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                            <Star className="w-3 h-3 fill-white" /> اصلی
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setPrimaryImage(imgUrl)}
                            className="absolute inset-0 bg-slate-900/40 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer"
                          >
                            انتخاب به عنوان اصلی
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(index)}
                          className="absolute bottom-1.5 right-1.5 bg-rose-600 text-white p-1 rounded-lg text-xs opacity-0 group-hover:opacity-100 transition cursor-pointer"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Discount & Dates Section (Refactored & Fixed) */}
              {/* Discount & Dates Section (Refactored for Pure Jalali & Validation) */}
              <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-900">
                    <Percent className="w-4 h-4 text-amber-600" />
                    تنظیمات تخفیف ویژه‌کالا
                  </div>
                  {productForm.discount > 0 && (
                    <span className="text-xs text-amber-700 font-semibold bg-amber-100 px-2 py-0.5 rounded-md">
                      تخفیف فعال: {digitsEnToFa(productForm.discount)}٪
                    </span>
                  )}
                </div>

                {/* Validation Warning: Triggered if dates are selected but discount percentage is 0 */}
                {(productForm.startDate || productForm.endDate) && Number(productForm.discount) <= 0 && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium animate-in fade-in">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>لطفاً درصد تخفیف را وارد کنید. بازه زمانی بدون مشخص کردن درصد تخفیف ذخیره نخواهد شد.</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Discount percentage input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700">درصد تخفیف (٪)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={productForm.discount || 0}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(100, Number(e.target.value)));
                          setProductForm((prev) => {
                            const updated = { ...prev, discount: val };
                            if (val > 0 && !prev.startDate) {
                              updated.startDate = formatDateValue(new Date());
                            }
                            if (val > 0 && !prev.endDate) {
                              const future = new Date();
                              future.setDate(future.getDate() + 30);
                              updated.endDate = formatDateValue(future);
                            }
                            return updated;
                          });
                        }}
                        placeholder="مثال: ۱۵"
                        className="w-full rounded-xl border border-amber-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition font-bold"
                      />
                      <span className="absolute left-3 top-3 text-amber-600 text-xs font-bold">٪</span>
                    </div>
                  </div>

                  {/* Jalali Date Selection Controls */}
                  <div className="md:col-span-2 space-y-1.5 relative">
                    <label className="text-xs font-medium text-slate-700 block">بازه زمانی تخفیف (شمسی)</label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Jalali Start Date Selector */}
                      <div className="space-y-1">
                        <span className="text-[11px] text-slate-500 block">تاریخ شروع:</span>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveDateTab('start');
                            setShowJalaliCalendar(true);
                          }}
                          className="w-full flex items-center justify-between gap-2 rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs text-slate-800 hover:border-amber-400 transition cursor-pointer"
                        >
                          <span className="font-semibold text-amber-900">
                            {productForm.startDate ? toJalaliDisplay(productForm.startDate) : "انتخاب تاریخ شروع..."}
                          </span>
                          <CalendarIcon className="w-4 h-4 text-amber-600 shrink-0" />
                        </button>
                      </div>

                      {/* Jalali End Date Selector */}
                      <div className="space-y-1">
                        <span className="text-[11px] text-slate-500 block">تاریخ پایان:</span>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveDateTab('end');
                            setShowJalaliCalendar(true);
                          }}
                          className="w-full flex items-center justify-between gap-2 rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs text-slate-800 hover:border-amber-400 transition cursor-pointer"
                        >
                          <span className="font-semibold text-amber-900">
                            {productForm.endDate ? toJalaliDisplay(productForm.endDate) : "انتخاب تاریخ پایان..."}
                          </span>
                          <CalendarIcon className="w-4 h-4 text-amber-600 shrink-0" />
                        </button>
                      </div>
                    </div>

                    {/* Jalali Calendar Popover Dropdown */}
                    {showJalaliCalendar && (
                      <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
                        onClick={() => setShowJalaliCalendar(false)}
                      >
                        <div
                          ref={calendarRef}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                          }}
                          className="w-full max-w-sm bg-white rounded-3xl border border-amber-200 p-5 shadow-2xl text-slate-900 space-y-4"
                        >
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-1">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                              <span>انتخاب تاریخ برای:</span>
                              <div className="flex bg-slate-100 p-0.5 rounded-lg">
                                <button
                                  type="button"
                                  onClick={() => setActiveDateTab('start')}
                                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                                    activeDateTab === 'start' ? "bg-amber-500 text-white" : "text-slate-600"
                                  }`}
                                >
                                  تاریخ شروع
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setActiveDateTab('end')}
                                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                                    activeDateTab === 'end' ? "bg-amber-500 text-white" : "text-slate-600"
                                  }`}
                                >
                                  تاریخ پایان
                                </button>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowJalaliCalendar(false)}
                              className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex justify-center">
                            <CalendarProvider key={activeDateTab} locale="fa">
                              <Calendar
                                onChange={handleCalenderChange}
                                defaultValue={
                                  activeDateTab === 'start'
                                    ? (productForm.startDate ? new Date(productForm.startDate) : new Date())
                                    : (productForm.endDate ? new Date(productForm.endDate) : new Date())
                                }
                              />
                            </CalendarProvider>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 text-sm shadow-md shadow-emerald-600/20 transition active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isEditingProduct ? "ذخیره تغییرات" : "ثبت محصول جدید"}</span>
                </button>
                <button
                  type="button"
                  onClick={resetFormState}
                  className="rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Filter and Search Bar Header */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو بر اساس نام محصول یا برند..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pr-10 pl-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute left-3 top-3 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <button
              type="button"
              onClick={() => setSelectedCategoryFilter("all")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 cursor-pointer ${
                selectedCategoryFilter === "all"
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
              }`}
            >
              همه ({digitsEnToFa(products.length)})
            </button>
            {category_options.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategoryFilter(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 cursor-pointer ${
                  selectedCategoryFilter === cat
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards List Grid */}
        {paginatedProducts.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500 space-y-3 shadow-xs">
            <Package className="w-12 h-12 text-slate-400 mx-auto" />
            <p className="text-base font-semibold text-slate-700">هیچ محصولی با این مشخصات یافت نشد!</p>
            <p className="text-xs text-slate-400">لطفا عبارت جستجو یا فیلتر دسته‌بندی را تغییر دهید.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedProducts.map((p) => {
              const isLowStock = p.stock <= 5 && p.stock > 0;
              const isOutOfStock = p.stock === 0;
              const originalPrice = Number(p.price);
              const discountObj = p.current_discount;
              const discountPercent =  Number(discountObj?.discount_percentage || 0)
              const hasDiscount = Boolean(discountObj?.is_active) ;
              const finalPrice = hasDiscount ? Math.round(originalPrice * (1 - discountPercent / 100)) : originalPrice


              return (
                <div
                  key={p.id}
                  className="rounded-2xl border border-slate-200/90 bg-white hover:border-slate-300 p-4 transition duration-200 shadow-sm hover:shadow-md flex flex-col justify-between space-y-4 group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 relative">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <ImageIcon className="w-8 h-8" />
                        </div>
                      )}
                      {discountObj && (
                        <span className="absolute top-1 right-1 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-xs">
                          %{digitsEnToFa(discountObj.discount_percentage)}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 truncate">
                          {p.category || "بدون دسته‌بندی"}
                        </span>
                        {p.brand && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {p.brand}
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 truncate leading-snug" title={p.name}>
                        {p.name}
                      </h3>

                      {/* <div className="text-xs text-slate-600 font-semibold pt-0.5">
                        <PersianNumberInput className="bg-transparent text-emerald-700 font-bold pointer-events-none" value={p.price} /> تومان
                      </div> */}
                      {/* Price - Digikal style */}
                          <div className="flex flex-col gap-0.5">
            {hasDiscount ? (
              <>
                {/* Discount percent pill + original crossed */}
                <div className="flex items-center gap-1.5">
                  <span className="bg-rose-100 text-rose-600 text-[10px] font-black px-1.5 py-0.5 rounded-md">
                    ٪{digitsEnToFa(discountPercent)}
                  </span>
                  <span className="text-[11px] text-slate-400 line-through font-medium">
                    {digitsEnToFa(originalPrice.toLocaleString())}
                  </span>
                </div>
                {/* Final price */}
                <div className="flex items-baseline gap-1">
                  <span className="text-base font-black text-rose-600">
                    {digitsEnToFa(finalPrice.toLocaleString())}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">تومان</span>
                </div>
              </>
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-base font-black text-slate-900">
                  {digitsEnToFa(finalPrice.toLocaleString())}
                </span>
                <span className="text-[10px] font-bold text-slate-500">تومان</span>
              </div>
            )}
          </div>

                    </div>
                  </div>

                  {/* Stock & Discount Status Badges */}
                  <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-500">
                      <span>موجودی انبار:</span>
                      <span className={`font-semibold px-2 py-0.5 rounded-md text-[11px] ${
                        isOutOfStock
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : isLowStock
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-slate-100 text-slate-700"
                      }`}>
                        {isOutOfStock ? "اتمام موجودی" : `${digitsEnToFa(p.stock)} عدد`}
                      </span>
                    </div>

                    {/* Show discount info whenever discountObj exists */}
                    {discountObj && discountObj.end_date && 
                    new Date(discountObj.end_date).setHours(0,0,0,0) > new Date().setHours(0,0,0,0) && (
                      <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-2.5 text-[11px] text-amber-900 space-y-1">
                        <div className="flex items-center justify-between font-semibold">
                          <span className="flex items-center gap-1">
                            <Percent className="w-3.5 h-3.5 text-amber-600" />
                            تخفیف ویژه‌کالا:
                          </span>
                          <span className="font-bold text-amber-800">
                            ٪{digitsEnToFa(discountObj.discount_percentage)}
                          </span>
                        </div>
                        <div className="text-[10px] text-amber-700 flex items-center justify-between pt-0.5 border-t border-amber-200/50">
                          <span>بازه زمانی:</span>
                          <span className="font-mono">
                            {toJalaliDisplay(discountObj.start_date)} تا {toJalaliDisplay(discountObj.end_date)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                    {discountObj && (
                      <button
                        onClick={() => handleDeleteDiscount(discountObj.id)}
                        className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                        title="حذف تخفیف"
                      >
                        <Delete className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => triggerFillEdit(p)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition cursor-pointer"
                      title="ویرایش محصول"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>ویرایش</span>
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(p.id)}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                      title="حذف محصول"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between rounded-2xl bg-white p-4 border border-slate-200/80 shadow-xs text-sm text-slate-600">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
              <span>صفحه قبلی</span>
            </button>

            <span className="text-xs font-medium">
              صفحه {digitsEnToFa(currentPage)} از {digitsEnToFa(totalPages)}
            </span>

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>صفحه بعدی</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

export default AdminDashboard