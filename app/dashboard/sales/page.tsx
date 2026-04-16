"use client"

import { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { ShoppingCart, Search, Plus, Minus, Trash2, Loader2, CreditCard, Printer, CheckCircle2, X } from "lucide-react"
import { createClient } from "@/lib/supabase-client"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils"
import Image from "next/image"
import type { Product } from "@/lib/types"

type CartItem = {
  product: Product;
  quantity: number;
  unit_price: number;
}

type ReceiptData = {
  items: CartItem[];
  total: number;
  date: Date;
  receiptNumber: string;
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [receipt, setReceipt] = useState<ReceiptData | null>(null)

  const supabase = createClient()
  const { toast } = useToast()
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const { data } = await supabase
        .from("products")
        .select("*")
        .gt("stock", 0)
        .order("name")
      setProducts(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id)
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast({ title: "Limit reached", description: "Not enough stock available.", variant: "destructive" })
          return prev
        }
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      }
      return [...prev, { product, quantity: 1, unit_price: product.sale_price }]
    })
  }

  const updatePrice = (productId: string, newPrice: number) => {
    setCart(prev => prev.map(item =>
      item.product.id === productId ? { ...item, unit_price: newPrice } : item
    ))
  }

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQ = item.quantity + delta
          if (newQ > item.product.stock) {
            toast({ title: "Limit reached", description: "Not enough stock available.", variant: "destructive" })
            return item
          }
          if (newQ < 1) return item
          return { ...item, quantity: newQ }
        }
        return item
      })
    })
  }

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId))
  }

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const grandTotal = cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0)

  const handleCompleteSale = async () => {
    if (cart.length === 0) return
    setSubmitting(true)

    try {
      const salesData = cart.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        total_price: item.unit_price * item.quantity,
        profit: (item.unit_price - item.product.purchase_price) * item.quantity,
      }))

      const { error: saleError } = await supabase.from("sales").insert(salesData)
      if (saleError) throw saleError

      for (const item of cart) {
        await supabase
          .from("products")
          .update({ stock: item.product.stock - item.quantity })
          .eq("id", item.product.id)
      }

      // Generate receipt
      setReceipt({
        items: [...cart],
        total: grandTotal,
        date: new Date(),
        receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
      })

      setCart([])
      fetchProducts()
    } catch (error: any) {
      toast({
        title: "Transaction Error",
        description: error.message || "Failed to complete the sale.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handlePrint = () => {
    if (!printRef.current) return
    const printContents = printRef.current.innerHTML
    const win = window.open("", "_blank", "width=400,height=600")
    if (!win) return
    win.document.write(`
      <html>
        <head>
          <title>Receipt</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Courier New', monospace; font-size: 13px; color: #111; padding: 16px; max-width: 300px; }
            .header { text-align: center; border-bottom: 2px dashed #ccc; padding-bottom: 12px; margin-bottom: 12px; }
            .header h1 { font-size: 20px; font-weight: 900; letter-spacing: 2px; }
            .header p { font-size: 11px; color: #555; margin-top: 2px; }
            .item-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; }
            .item-row .name { flex: 1; }
            .item-row .qty { width: 30px; text-align: center; }
            .item-row .price { width: 80px; text-align: right; font-weight: bold; }
            .divider { border-top: 1px dashed #ccc; margin: 8px 0; }
            .total-row { display: flex; justify-content: space-between; font-size: 14px; font-weight: 900; padding: 4px 0; }
            .footer { text-align: center; margin-top: 14px; font-size: 11px; color: #777; }
          </style>
        </head>
        <body>${printContents}</body>
      </html>
    `)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 300)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-500" />
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-8rem)] min-h-[600px] overflow-hidden -mx-4 sm:mx-0">
        {/* Left Area: Products */}
        <div className="flex-1 flex flex-col h-full gap-6 overflow-hidden">
          <div className="relative shrink-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search products by name..."
              className="pl-12 h-14 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border-gray-100 dark:border-slate-800 text-lg focus-visible:ring-indigo-500 transition-all font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto pb-6 pr-2 custom-scrollbar">
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <ShoppingCart className="w-16 h-16 mb-4 opacity-20" />
                <p className="font-medium">No products found in inventory.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredProducts.map(product => (
                  <div
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-sm border border-gray-50 dark:border-slate-800 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col items-center text-center gap-4 active:scale-95 group"
                  >
                    <div className="w-full aspect-square rounded-[1.25rem] bg-gray-50 dark:bg-slate-800/50 overflow-hidden relative">
                      {product.image_url ? (
                        <Image src={product.image_url} alt={product.name} width={200} height={200} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingCart className="w-12 h-12 text-gray-200 dark:text-slate-700" />
                        </div>
                      )}
                    </div>
                    <div className="w-full px-2 pb-1">
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 truncate mb-3">{product.name}</h3>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col items-start gap-1">
                          <span className="text-indigo-600 dark:text-indigo-500 font-extrabold text-lg leading-none">{formatCurrency(product.sale_price)}</span>
                          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Selling Price</span>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 text-xs font-bold px-2 py-0.5 rounded-full">{product.stock}</span>
                          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">In Stock</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Area: Cart */}
        <div className="w-full lg:w-[420px] shrink-0 h-full flex flex-col bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-gray-50 dark:border-slate-800 overflow-hidden relative">
          <div className="p-7 bg-indigo-50/50 dark:bg-indigo-900/10 flex items-center gap-4 shrink-0">
            <div className="bg-indigo-600 rounded-xl p-2.5 shadow-md shadow-indigo-500/20">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <h2 className="font-extrabold text-lg text-slate-800 dark:text-slate-100 uppercase tracking-widest">Customer Order</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-7 space-y-7">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-300 dark:text-slate-600">
                <ShoppingCart className="w-20 h-20 mb-6 opacity-50" />
                <p className="font-medium text-lg">Cart is empty</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.product.id} className="flex gap-4 items-center group">
                  <div className="w-[4.5rem] h-[4.5rem] rounded-2xl bg-gray-50 dark:bg-slate-800 overflow-hidden shrink-0 border border-gray-100 dark:border-slate-700">
                    {item.product.image_url ? (
                      <Image src={item.product.image_url} width={72} height={72} alt={item.product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-50">
                        <ShoppingCart className="w-6 h-6 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1.5">
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm line-clamp-1 pr-2">{item.product.name}</h4>
                      <div className="font-bold text-slate-800 dark:text-slate-100 text-sm whitespace-nowrap shrink-0">
                        {formatCurrency(item.unit_price * item.quantity)}
                      </div>
                    </div>

                    <div className="flex items-center text-[11px] mb-2 font-bold text-gray-400">
                      <span className="mr-1">Dh</span>
                      <input
                        type="number"
                        step="0.01"
                        className="w-[4.5rem] bg-slate-100/80 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-300 focus:border-indigo-500 text-indigo-600 dark:text-indigo-400 font-black focus:outline-none focus:ring-4 focus:ring-indigo-500/20 rounded-lg px-2 py-0.5 transition-all text-sm -mt-0.5"
                        value={item.unit_price === 0 ? "" : item.unit_price}
                        onChange={(e) => updatePrice(item.product.id, parseFloat(e.target.value) || 0)}
                      />
                      <span className="ml-1.5 uppercase tracking-widest text-[9px]">/ unit</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center">
                        <button onClick={() => updateQuantity(item.product.id, -1)} className="w-[1.875rem] h-[1.875rem] flex items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 transition-colors">
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-bold text-slate-800 dark:text-slate-100 w-8 text-center text-sm">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product.id, 1)} className="w-[1.875rem] h-[1.875rem] flex items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 transition-colors">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button onClick={() => removeFromCart(item.product.id)} className="ml-auto p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-7 border-t flex flex-col justify-end border-dashed border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 shrink-0">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Subtotal Items</span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{totalItems} Products</span>
            </div>
            <div className="flex justify-between items-center mb-8">
              <span className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Grand Total</span>
              <span className="text-[1.75rem] font-extrabold text-indigo-600 dark:text-indigo-500 tracking-tight">{formatCurrency(grandTotal)}</span>
            </div>
            <Button
              onClick={handleCompleteSale}
              disabled={cart.length === 0 || submitting}
              className="w-full h-16 rounded-[1.25rem] bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 border-0 shadow-[0_8px_30px_rgb(79,70,229,0.3)] hover:shadow-[0_8px_40px_rgb(79,70,229,0.4)] text-white font-extrabold text-base uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-1" />
                  Complete Sale
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* ── RECEIPT MODAL ── */}
      <Dialog open={!!receipt} onOpenChange={() => setReceipt(null)}>
        <DialogContent className="max-w-sm p-0 border-none rounded-[2rem] overflow-hidden bg-white dark:bg-slate-900 shadow-2xl">
          {/* Success Header */}
          <div className="bg-gradient-to-br from-indigo-600 to-blue-500 p-8 text-center text-white">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h2 className="text-xl font-black tracking-tight">Sale Completed!</h2>
            <p className="text-indigo-200 text-sm font-medium mt-1">{receipt?.receiptNumber}</p>
          </div>

          {/* Printable Receipt Content */}
          <div ref={printRef}>
            <div className="header">
              <h1>PHONE SHOP</h1>
              <p>{receipt?.date.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</p>
              <p>{receipt?.date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
              <p>Receipt: {receipt?.receiptNumber}</p>
            </div>
            <div className="divider" />
            {receipt?.items.map((item) => (
              <div className="item-row" key={item.product.id}>
                <span className="name">{item.product.name}</span>
                <span className="qty">x{item.quantity}</span>
                <span className="price">{formatCurrency(item.unit_price * item.quantity)}</span>
              </div>
            ))}
            <div className="divider" />
            <div className="total-row">
              <span>TOTAL</span>
              <span>{formatCurrency(receipt?.total || 0)}</span>
            </div>
            <div className="footer">
              <p>Thank you for your purchase!</p>
              <p>See you next time 🙏</p>
            </div>
          </div>

          {/* Screen Preview of receipt */}
          <div className="px-7 py-5 space-y-2">
            {receipt?.items.map(item => (
              <div key={item.product.id} className="flex justify-between items-center text-sm">
                <span className="font-semibold text-slate-700 dark:text-slate-300 truncate mr-3">{item.product.name} <span className="text-slate-400">x{item.quantity}</span></span>
                <span className="font-bold text-slate-800 dark:text-slate-100 shrink-0">{formatCurrency(item.unit_price * item.quantity)}</span>
              </div>
            ))}
            <div className="border-t border-dashed border-slate-200 dark:border-slate-700 pt-3 flex justify-between items-center">
              <span className="font-extrabold text-slate-700 dark:text-slate-200">TOTAL</span>
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(receipt?.total || 0)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="px-7 pb-7 flex gap-3">
            <Button
              variant="outline"
              className="flex-1 h-12 rounded-xl font-bold border-slate-200 dark:border-slate-700"
              onClick={() => setReceipt(null)}
            >
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
            <Button
              className="flex-1 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              onClick={handlePrint}
            >
              <Printer className="w-4 h-4 mr-2" />
              Print Receipt
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
