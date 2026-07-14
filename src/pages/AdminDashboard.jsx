import { NumericFormat } from "react-number-format"
import { digitsEnToFa } from "@persian-tools/persian-tools"
import * as shamsi from 'shamsi-date-converter'


import { useState, useEffect, useRef } from 'react'

import { useForm } from "react-hook-form";

import '../index.css'

import { Calendar, CalendarProvider } from "zaman"

import PersianNumberInput from '../components/persianNumberInput'
import { createAdminProduct, updateProduct, deleteProduct, getAdminProducts, createDiscount, updateDiscount, deleteDiscount, getProductCategories } from '../api'

import {
  Search,
  ShoppingBag,
  User,
  Settings,
  Plus,
  Trash2,
  Edit,
  CreditCard,
  MapPin,
  RefreshCw,
  Terminal,
  ArrowLeft,
  LogOut,
  Sparkles,
  Delete,
  ShoppingBasket,
} from "lucide-react";


const DEFAULT_CATEGORIES = ['clothing', 'accessories', 'electronics', 'home', 'beauty']


function AdminDashboard() {
  const [count, setCount] = useState(0)

  const [products, setProducts] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [isEditingProduct, setIsEditingProduct] = useState(null)
  const isFormOpen = isAddingProduct || isEditingProduct !== null;
  const [dateSelected, setDateSelected] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isPickingDate, setIsPickingDate] = useState('start');

  const [categories, setCategories] = useState([])

  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false)
  const categoryMenuRef = useRef(null)

  const category_options = [... new Set([
    ...products.map((p) => p.category).filter(Boolean),
    ...categories.filter(Boolean),
  ])]

  const VALID_SIZES = ["S", "M", "L", "2X", "Free Size"];
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
    // sizes: ["free size"],
    size: ["Free Size"],
    discount: 0,
    discountId: null,
    startDate: "",
    endDate: "",
  })

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  // Close calendar when clicking outside or pressing Escape
  const calendarRef = useRef(null)
  useEffect(() => {
    const handleOutside = (e) => {
      if (!dateSelected) return
      if (calendarRef.current && !calendarRef.current.contains(e.target)) {
        setDateSelected(false)
        setIsPickingDate('start')
      }
    }
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setDateSelected(false)
        setIsPickingDate('start')
      }
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
      document.removeEventListener('keydown', handleKey)
    }
  }, [dateSelected])

  // close category dropdown on outside click or Escape
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


  const handleGalleryImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        // base64
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

  const fetchProducts = async () => {
    try {
      const data = await getAdminProducts()
      setProducts(data)

    } catch (error) {
      console.error("Error fetching products:", error)
    }
  }

  const fetchCategories = async () => {
    try {
      const data = await getProductCategories()
      setCategories(data || [])
      console.log("Categories fetched:", data)
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }


  const handleAddOrEditProduct = async (e) => {
    e.preventDefault()

    console.log('productForm before submit', productForm)

    const payload = {
      name: productForm.name,
      description: productForm.description,
      price: productForm.price,
      image: productForm.image,
      images: productForm.images,
      category: productForm.category,
      stock: productForm.stock,
      rating: productForm.rating,
      brand: productForm.brand,
      size: (productForm.size && productForm.size.length > 0) ? productForm.size : ["Free Size"],
    }

    try {
      if (isEditingProduct) {
        const res = await updateProduct(isEditingProduct.id, payload)
        console.log("Product updated:", res)

        if (productForm.discount > 0) {
          const discountPayload = {
            product: res.id,
            discount_percentage: productForm.discount,
            start_date: productForm.startDate,
            end_date: productForm.endDate,
          }

          if (productForm.discountId) {
            await updateDiscount(productForm.discountId, discountPayload)
          } else {
            await createDiscount(discountPayload)
          }
        } else if (!productForm.discount && productForm.discountId) {
          await deleteDiscount(productForm.discountId)
        }

        setIsEditingProduct(null)
      } else {
        const res = await createAdminProduct(payload)
        if (productForm.discount > 0) {
          const discount = {
            product: res.id,
            discount_percentage: productForm.discount,
            start_date: productForm.startDate,
            end_date: productForm.endDate,
          }
          await createDiscount(discount)
        }
        console.log("Product created:", res)
        setIsAddingProduct(false)
      }

      await fetchProducts()
      await fetchCategories()
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
        discount: 0,
        discountId: null,
        startDate: "",
        endDate: "",
      })
    } catch (error) {
      console.error("Error creating/updating product:", error)
    }
  }

  const handleDeleteDiscount = async (discountId) => {
    if (!confirm("Are you sure you want to delete this discount?")) return

    try {
      await deleteDiscount(discountId)
      await fetchProducts()
      await fetchCategories()
      console.log("Discount deleted:", discountId)
    } catch (error) {
      console.error("Error deleting discount:", error)
    }
  }


  const handleDeleteProduct = async (productId) => {

    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteProduct(productId)
      setProducts((prevProducts) => prevProducts.filter((p) => p.id !== productId))
      console.log("Product deleted:", productId)
      await fetchProducts()
      await fetchCategories()

      // Refresh the product list after deletion
    } catch (error) {
      console.error("Error deleting product:", error)
    }

  }

  const handleSearch = (e) => {
    setSearchQuery(e.target.value)
  }

  const filteredProducts = products.filter((p) => {
    return p.name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const triggerFillEdit = (product) => {
    setIsEditingProduct(product)
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
      // normalize incoming sizes to match UI keys
      size: normalizeSizes(product.size || product.sizes || []),
      discount: product.current_discount?.discount_percentage || 0,
      discountId: product.current_discount?.id || null,
      startDate: product.current_discount?.start_date || "",
      endDate: product.current_discount?.end_date || "",
    })
    // populate calendar controls used in the UI
    setStartDate(product.current_discount && product.current_discount.start_date
      ? new Date(product.current_discount.start_date)
      : null)
    setEndDate(product.current_discount && product.current_discount.end_date
      ? new Date(product.current_discount.end_date)
      : null)
  }

  const formatDateValue = (date) => {
    if (!date) return ''

    const localDate = new Date(date)
    const year = localDate.getFullYear()
    const month = `${localDate.getMonth() + 1}`.padStart(2, '0')
    const day = `${localDate.getDate()}`.padStart(2, '0')

    return `${year}-${month}-${day}`
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

    if (isPickingDate === 'start') {
      setStartDate(selectedDate)
      setProductForm((prev) => ({ ...prev, startDate: formatDateValue(selectedDate) }))
      setIsPickingDate('end')
      return
    }

    const nextStart = startDate && selectedDate < startDate ? selectedDate : startDate
    const nextEnd = startDate && selectedDate < startDate ? startDate : selectedDate

    setStartDate(nextStart)
    setEndDate(nextEnd)
    setProductForm((prev) => ({
      ...prev,
      startDate: formatDateValue(nextStart),
      endDate: formatDateValue(nextEnd),
    }))
    setIsPickingDate('start')
    setDateSelected(false)
  }

  return (
    <div className="min-h-screen bg-emerald-200 py-6">
      <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6 sm:px-6 lg:px-8 ">
        {/* <button
          type="button"
          className="rounded-md bg-white px-6 py-3 text-lg font-semibold text-emerald-700 shadow-md transition hover:bg-emerald-50 hover:shadow-lg active:scale-95 "
          onClick={() => setCount((count) => count + 1)}
        >
          Count is {count}
        </button> */}


        {!isFormOpen && (
          <div className="flex items-center  gap-4 ">
            <button
              type="button"
              className="w-full sm:w-auto rounded-md bg-white px-6 py-3 text-lg font-semibold text-emerald-700 shadow-md transition hover:bg-emerald-50 hover:shadow-lg active:scale-95"
              onClick={() => {
                setIsAddingProduct(true)
                setProductForm({
                  name: '',
                  description: '',
                  price: 0,
                  image: '',
                  images: [],
                  category: '',
                  stock: 10,
                  rating: 4,
                  brand: '',
                  size: ['Free Size'],
                })
              }}
            >
              Add Product
            </button>

            <input
              type="text"
              onChange={(e) => handleSearch(e)}
              className="w-full  sm:w-auto rounded-md   focus:outline-none bg-white px-6 py-3 text-lg font-semibold text-emerald-700 shadow-md transition hover:bg-emerald-50 hover:shadow-lg active:scale-95"
              placeholder="Search...">
            </input>
          </div>

        )}

        {isFormOpen && <form onSubmit={handleAddOrEditProduct} className="space-y-5 rounded-3xl border border-black/5 bg-white/90 p-5 shadow-sm backdrop-blur-sm">

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input
              type="text"
              placeholder="name"
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              required
            />
            {/* <input
              type="number"
              placeholder="Price (Toman)"
              value={productForm.price || ""}
              onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              required
            /> */}

            <PersianNumberInput
              value={productForm.price}
              onChange={(value) => setProductForm({ ...productForm, price: value })}
              placeholder="Price (Toman)"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input
              type="number"
              placeholder="Stock qty"
              value={productForm.stock}
              onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              required
            />
            <input
              type="text"
              placeholder="Brand"
              value={productForm.brand}
              onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              required
            />
          </div>



          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="space-y-3 rounded-3xl border border-black/5 bg-gray-100/80 p-4">
              <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">Select Available Sizes</label>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  { key: "S", label: "Small (S)" },
                  { key: "M", label: "Medium (M)" },
                  { key: "L", label: "Large (L)" },
                  { key: "2X", label: "2X (Double XL)" },
                  { key: "Free Size", label: "Free Size" }
                ].map((sz) => {
                  const currentSizes = productForm.size || [];
                  const isChecked = currentSizes.includes(sz.key);
                  return (
                    <button
                      key={sz.key}
                      type="button"
                      // onClick={() => {
                      //   let newSizes;
                      //   if (isChecked) {
                      //     newSizes = currentSizes.filter((s) => s !== sz.key);
                      //   } else {
                      //     newSizes = [...currentSizes, sz.key];
                      //   }
                      //   setProductForm({ ...productForm, size: newSizes });
                      // }}
                      onClick={()=>{
                        const newSize = isChecked? [] : [sz.key]
                        setProductForm({...productForm, size: newSize})

                      }}


                      className={`px-2.5 py-1 rounded text-[10px] font-bold border transition-all ${isChecked
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                        }`}
                    >
                      {sz.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div >

              <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">Select Category</label>
              {/* <select
                value={productForm.category}
                onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                required
              >
                <option value="">Select Category</option>
                <option value="clothing">Clothing</option>
                <option value="accessories">Accessories</option>
                <option value="electronics">Electronics</option>
                <option value="home">Home</option>
                <option value="beauty">Beauty</option>
              </select> */}

              <div className="relative" ref={categoryMenuRef}>
                <input
                  type="text"
                  value={productForm.category}
                  onChange={(e) => {
                    setProductForm({ ...productForm, category: e.target.value })
                    setIsCategoryMenuOpen(true)
                  }}
                  onFocus={() => setIsCategoryMenuOpen(true)}
                  placeholder="select or type a new category"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  required
                />

                {isCategoryMenuOpen && category_options.length > 0 && (
                  <div className="absolute left-0 right-0 z-50 mt-1 max-h-52 overflow-auto rounded-2xl border border-gray-200 bg-white shadow-xl">
                    {category_options
                      .filter((category) =>
                        category.toLowerCase().includes(productForm.category.toLowerCase())
                      )
                      .map((category) => (
                        <button
                          key={category}
                          type="button"
                          onClick={() => {
                            setProductForm({ ...productForm, category })
                            setIsCategoryMenuOpen(false)
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50"
                        >
                          {category}
                        </button>
                      ))}
                  </div>
                )}
              </div>

            </div>


            <div>
              <input
                type="text"
                placeholder="description"
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>


            <div className="rounded-3xl border border-black/5 bg-gray-100/80 p-4">

              <label className="flex min-h-23.5 items-center justify-center gap-2 rounded-3xl bg-indigo-50 px-4 py-5 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100 cursor-pointer">
                <span>📤 Upload File to Gallery</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleGalleryImageUpload}
                  className="hidden"
                />

              </label>


            </div>


          </div>



          {productForm.images && productForm.images.length > 0 && <div className="space-y-3 bg-gray-50/50 p-4 rounded-3xl border border-black/5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-500 block font-bold">Product Gallery ({productForm.images.length})</span>
              <button
                type="button"
                onClick={() => setProductForm((prev) => ({ ...prev, images: [] }))}
                className="text-[9px] text-rose-500 hover:underline font-bold"
              >
                Clear Gallery
              </button>
            </div>
            <span className="text-[8px] text-gray-400 block leading-tight">⭐ Click an image to set as Primary (thumbnail) shown on catalog.</span>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 pt-1">
              {productForm.images.map((imgUrl, index) => {
                const isPrimary = productForm.image === imgUrl;
                return <div key={index} className="relative group rounded-lg overflow-hidden border bg-white border-black/10 aspect-square flex flex-col items-center justify-center">
                  <img
                    src={imgUrl}
                    alt={`gallery-${index}`}
                    className={`w-full h-full object-cover cursor-pointer transition-all ${isPrimary ? "ring-2 ring-indigo-600 scale-[0.93] z-10" : "opacity-80 hover:opacity-100"}`}
                    onClick={() => setPrimaryImage(imgUrl)}
                  />
                  {isPrimary && <span className="absolute top-0.5 right-0.5 bg-indigo-600 text-white text-[7px] px-1 rounded font-bold shadow-xs z-20">
                    Primary
                  </span>}
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(index)}
                    className="absolute bottom-0 inset-x-0 bg-rose-600/90 text-white text-[8px] py-0.5 font-bold opacity-0 group-hover:opacity-100 transition-all text-center z-20"
                  >
                    Delete
                  </button>
                </div>;
              })}
            </div>
          </div>}

<div className="flex flex-col gap-3 rounded-3xl border border-black/5 bg-gray-100/80 p-4 md:flex-row md:items-start">
            <div className="relative w-full md:max-w-55">
              <input
                type="number"
                value={productForm.discount}
                onChange={(e) => setProductForm({ ...productForm, discount: Number(e.target.value) })}
                placeholder="درصد تخفیف"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-gray-400">٪</span>
            </div>

            <div className="relative flex-1">
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => { setDateSelected(true); setIsPickingDate('start') }}
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-3 text-right text-sm shadow-sm transition hover:bg-gray-50"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">از</p>
                  <strong className="block text-gray-700">
                    {startDate ? new Date(startDate).toLocaleDateString('fa-IR') : 'انتخاب کنید'}
                  </strong>
                </button>

                <button
                  type="button"
                  onClick={() => { setDateSelected(true); setIsPickingDate('end') }}
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-3 text-right text-sm shadow-sm transition hover:bg-gray-50"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">به</p>
                  <strong className="block text-gray-700">
                    {endDate ? new Date(endDate).toLocaleDateString('fa-IR') : 'انتخاب کنید'}
                  </strong>
                </button>
              </div>

              {dateSelected && (
                <div ref={calendarRef} className="absolute left-12 top-full z-60 mt-2 rounded-xl border border-gray-200 bg-white p-3 shadow-xl">
                  <CalendarProvider locale="fa">
                    <Calendar
                      onChange={handleCalenderChange}
                      defaultValue={startDate ?? new Date()}
                    />
                  </CalendarProvider>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-start">
            <button
              type="submit"
              className="w-full rounded-xl bg-emerald-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-emerald-700 active:scale-95 sm:w-auto"
            >
              {isEditingProduct ? "Edit Product" : "Add Product"}
            </button>
            <button
              type="button"
              className="w-full rounded-xl border border-gray-200 bg-white px-6 py-3 text-base font-semibold text-gray-700 transition hover:bg-gray-50 sm:w-auto"
              onClick={() => {
                setIsAddingProduct(false)
                setIsEditingProduct(null)
                setProductForm({
                  name: '',
                  description: '',
                  price: 0,
                  image: '',
                  images: [],
                  category: '',
                  stock: 10,
                  rating: 4,
                  brand: '',
                  size: ['Free Size'],
                })
              }}
            >
              Cancel
            </button>

          </div>

        </form>}

        <div className="max-h-104 overflow-y-auto space-y-3 pr-1">


          {filteredProducts.map((p) => (
            <div key={p.id} className="flex flex-col gap-3 rounded-3xl bg-white/90 p-4 text-xs shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <span className="font-bold block text-gray-800 truncate">{p.name}</span>
                <span className="text-[12px] text-gray-400 block">
                  موجودی: {p.stock} | قیمت: {<PersianNumberInput className="font-bold text-gray-400" value={p.price} />}
                </span>
                {p.current_discount?.is_active && (
                  <span className="text-[12px] text-emerald-600 block">
                    تخفیف: {p.current_discount.discount_percentage}% 
                    ({shamsi.gregorianToJalali(p.current_discount.start_date).join('/')} - 
                    {shamsi.gregorianToJalali(p.current_discount.end_date).join('/')})
                  </span>
                )}
              </div>
              <div className="flex gap-1.5 shrink-0 ml-2">
                {/* دکمه ویرایش (Edit) */}

                {p.current_discount?.is_active &&  (
                  <button
                    onClick={() => handleDeleteDiscount(p.current_discount.id)}
                    className="p-1 hover:bg-rose-50 text-red-600 rounded transition-all"
                    title="حذف تخفیف"
                  >
                    <Delete className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => triggerFillEdit(p)}
                  className="p-1 hover:bg-black/5 text-indigo-600 rounded transition-all"
                  title="Edit" 
                >
                  <Edit className="w-3.5 h-3.5" />

                </button>
                
                <button
                  onClick={() => handleDeleteProduct(p.id)}
                  className="p-1 hover:bg-rose-50 text-rose-500 rounded transition-all"
                  title="حذف محصول"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          ))}
        </div>

      </div>





      <div>

      </div>


    </div>





  )
}

export default AdminDashboard
