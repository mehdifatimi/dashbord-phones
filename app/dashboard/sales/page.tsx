"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ShoppingCart, Search, Plus, Minus, Trash2, Loader2, CreditCard, Printer, CheckCircle2, X, Image as ImageIcon, AlertTriangle, UserPlus } from "lucide-react"
import { createClient } from "@/lib/supabase-client"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils"
import Image from "next/image"
import type { Product, Category } from "@/lib/types"

type CartItem = {
  product: Product;
  quantity: number;
  unit_price: number;
  imei?: string;
}

type ReceiptData = {
  items: CartItem[];
  total: number;
  date: Date;
  receiptNumber: string;
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [receipt, setReceipt] = useState<ReceiptData | null>(null)
  
  // CRM Linkage
  const [customers, setCustomers] = useState<{ id: string; full_name: string; phone: string }[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<string>("")
  
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ full_name: "", phone: "", email: "", address: "" })

  const supabase = createClient()
  const { toast } = useToast()
  const printRef = useRef<HTMLDivElement>(null)

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data, error } = await supabase
        .from("customers")
        .insert([{
          full_name: newCustomer.full_name,
          phone: newCustomer.phone,
          email: newCustomer.email || null,
          address: newCustomer.address || null
        }])
        .select()
        .single()

      if (error) throw error

      setCustomers([...customers, data].sort((a,b) => a.full_name.localeCompare(b.full_name)))
      setSelectedCustomer(data.id)
      setIsAddCustomerOpen(false)
      setNewCustomer({ full_name: "", phone: "", email: "", address: "" })
      
      toast({
        title: "Success",
        description: "Customer added successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add customer.",
        variant: "destructive",
      })
    }
  }

  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await supabase.from("categories").select("*").order("name")
      setCategories(data || [])
    } catch (err) {
      console.error(err)
    }
  }, [supabase])

  const fetchProducts = useCallback(async () => {
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
  }, [supabase])

  const fetchCustomers = useCallback(async () => {
    try {
      const { data } = await supabase.from("customers").select("id, full_name, phone").order("full_name")
      setCustomers(data || [])
    } catch (err) {
      console.error(err)
    }
  }, [supabase])

  useEffect(() => {
    Promise.all([fetchProducts(), fetchCategories(), fetchCustomers()])

    // Abonnement Temps-Réel pour les produits
    const channel = supabase
      .channel('pos-stock-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          fetchProducts()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, fetchProducts, fetchCategories, fetchCustomers])

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = selectedCategory === "all" || p.category_id === selectedCategory
    return matchesSearch && matchesCategory
  })

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

  const updateImei = (productId: string, imei: string) => {
    setCart(prev => prev.map(item =>
      item.product.id === productId ? { ...item, imei } : item
    ))
  }

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const grandTotal = cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0)

  const handleCompleteSale = async () => {
    if (cart.length === 0) return
    setSubmitting(true)

    try {
      const receiptNumber = `REC-${Date.now().toString().slice(-6)}`

      const salesData = cart.map(item => ({
        product_id: item.product.id,
        customer_id: selectedCustomer || null,
        quantity: item.quantity,
        total_price: item.unit_price * item.quantity,
        profit: (item.unit_price - item.product.purchase_price) * item.quantity,
        imei: item.imei || null,
        receipt_number: receiptNumber
      }))

      const { error: saleError } = await supabase.from("sales").insert(salesData)
      if (saleError) throw saleError

      for (const item of cart) {
        await supabase
          .from("products")
          .update({ stock: item.product.stock - item.quantity })
          .eq("id", item.product.id)

        // Notification si le stock devient bas
        const newStock = item.product.stock - item.quantity
        if (newStock < 10) {
          toast({
            title: "⚠️ Stock Bas !",
            description: `Le produit ${item.product.name} n'a plus que ${newStock} unités.`,
            variant: "destructive",
          })
        }
      }

      // Generate receipt
      setReceipt({
        items: [...cart],
        total: grandTotal,
        date: new Date(),
        receiptNumber,
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
    if (!receipt || !printRef.current) return
    
    const win = window.open("", "_blank", "width=500,height=700")
    if (!win) return

    const itemsHtml = receipt.items.map(item => `
      <div class="item-row">
        <div class="item-img-container">
          ${item.product.image_url 
            ? `<img src="${item.product.image_url}" class="item-img" />` 
            : `<div class="item-img-placeholder"></div>`
          }
        </div>
        <div class="item-name">
          <div class="name-text">${item.product.name}</div>
          <div class="item-details">x${item.quantity} unités ${item.imei ? `• IMEI: ${item.imei}` : ''}</div>
        </div>
        <div class="price">${formatCurrency(item.unit_price * item.quantity)}</div>
      </div>
    `).join('')

    win.document.write(`
      <html>
        <head>
          <title>Ticket - ${receipt.receiptNumber}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            @page { margin: 0; }
            body { 
              font-family: 'Inter', sans-serif;
              font-size: 11px; 
              color: #1e293b; 
              padding: 30px;
              width: 85mm;
              margin: 0 auto;
              background: #fff;
            }
            .header {
              text-align: center;
              margin-bottom: 25px;
            }
            .header h1 {
              font-size: 22px;
              font-weight: 900;
              margin: 0;
              color: #4f46e5;
              text-transform: uppercase;
              letter-spacing: -0.5px;
            }
            .header p {
              font-size: 10px;
              margin: 4px 0;
              color: #64748b;
              font-weight: 600;
            }
            .ticket-info {
              background: #f8fafc;
              padding: 10px;
              border-radius: 12px;
              margin-bottom: 20px;
              text-align: center;
              border: 1px solid #e2e8f0;
            }
            .divider {
              border-top: 1px dashed #e2e8f0;
              margin: 15px 0;
            }
            .item-row {
              display: flex;
              align-items: center;
              gap: 12px;
              margin-bottom: 12px;
            }
            .item-img-container {
              width: 40px;
              height: 40px;
              border-radius: 8px;
              overflow: hidden;
              background: #f1f5f9;
              flex-shrink: 0;
              border: 1px solid #f1f5f9;
            }
            .item-img {
              width: 100%;
              height: 100%;
              object-cover: cover;
            }
            .item-img-placeholder {
              width: 100%;
              height: 100%;
              background: #cbd5e1;
            }
            .item-name {
              flex: 1;
            }
            .name-text {
              font-weight: 700;
              font-size: 11px;
              color: #0f172a;
            }
            .item-details {
              font-size: 9px;
              color: #64748b;
              margin-top: 2px;
            }
            .price {
              font-weight: 900;
              color: #0f172a;
              font-size: 12px;
            }
            .total-section {
              margin-top: 20px;
              background: #4f46e5;
              padding: 15px;
              border-radius: 14px;
              color: #fff;
            }
            .total-label {
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 1px;
              opacity: 0.8;
            }
            .total-amount {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              margin-top: 4px;
            }
            .total-val {
              font-size: 20px;
              font-weight: 900;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #94a3b8;
              font-size: 9px;
            }
            .footer p { margin: 4px 0; }
            .emoji { font-size: 14px; }
            @media print {
              body { padding: 10px; }
              .total-section { -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>PHONE SHOP</h1>
            <p>Le meilleur de la tech entre vos mains</p>
          </div>

          <div class="ticket-info">
            <div style="font-weight: 900; color: #0f172a; font-size: 11px;">TICKET N° ${receipt.receiptNumber}</div>
            <div style="margin-top: 2px;">${receipt.date.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })} • ${receipt.date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
          </div>
          
          <div class="divider"></div>
          
          ${itemsHtml}
          
          <div class="total-section">
            <div class="total-label">Montant Total</div>
            <div class="total-amount">
              <span style="font-size: 12px; font-weight: 700;">Dh</span>
              <span class="total-val">${receipt.total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          
          <div class="footer">
            <p>Merci pour votre confiance ! <span class="emoji">🙏</span></p>
            <p>Retrouvez-nous sur Instagram & TikTok</p>
            <p><strong>www.phoneshop.ma</strong></p>
            <p style="margin-top:10px; font-size: 8px;">Logiciel de gestion v2.0</p>
          </div>

          <script>
            window.onload = function() {
              // Petit délai pour s'assurer que les images sont bien rendues
              setTimeout(() => {
                window.print();
                window.onafterprint = () => window.close();
              }, 500);
            }
          </script>
        </body>
      </html>
    `)
    win.document.close()
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
      <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-8rem)] min-h-[600px] overflow-hidden">
        {/* Left Area: Products */}
        <div className="flex-1 flex flex-col h-full gap-6 overflow-hidden">
          
          {/* Low Stock Toast Overlay (New) */}
          {filteredProducts.some(p => p.stock < 10 && p.stock > 0) && (
            <div className="bg-rose-500 text-white px-6 py-3 rounded-2xl shadow-lg shadow-rose-500/30 flex items-center justify-between animate-pulse shrink-0">
               <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-black text-sm uppercase tracking-widest">
                    Alerte Réapprovisionnement : {filteredProducts.filter(p => p.stock < 10 && p.stock > 0).map(p => p.name).join(', ')}
                  </span>
               </div>
               <span className="text-[10px] font-bold opacity-80 uppercase tracking-tighter">Stock bas (Inférieur à 10)</span>
            </div>
          )}

          {/* Header & Search */}
          <div className="flex flex-col md:flex-row gap-4 items-center shrink-0">
            <div className="relative flex-1 w-full group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <Input
                type="text"
                placeholder="Rechercher un produit..."
                className="pl-14 h-16 bg-white dark:bg-slate-900/50 backdrop-blur-xl rounded-[2rem] border-slate-200 dark:border-slate-800 text-lg shadow-xl shadow-slate-200/50 dark:shadow-none focus-visible:ring-indigo-500 transition-all font-semibold"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Categories Bar */}
          <div className="flex gap-3 overflow-x-auto py-2 shrink-0 no-scrollbar">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-8 h-12 rounded-2xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap ${
                selectedCategory === "all" 
                ? "bg-indigo-600 text-white shadow-xl shadow-indigo-500/40 scale-105" 
                : "bg-white dark:bg-slate-900 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
              }`}
            >
              Tous les Produits
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-8 h-12 rounded-2xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap ${
                  selectedCategory === cat.id 
                  ? "bg-indigo-600 text-white shadow-xl shadow-indigo-500/40 scale-105" 
                  : "bg-white dark:bg-slate-900 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto pb-10 custom-scrollbar pr-2">
            {filteredProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 opacity-50">
                <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                   <ShoppingCart className="w-10 h-10" />
                </div>
                <p className="font-bold uppercase tracking-widest text-xs">Aucun produit en stock</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map(product => (
                  <div
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="group bg-white dark:bg-slate-900 rounded-[2.5rem] p-4 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-2 transition-all duration-500 cursor-pointer flex flex-col items-center group active:scale-95"
                  >
                    {/* Image Box */}
                    <div className="w-full aspect-square rounded-[2rem] bg-slate-50 dark:bg-slate-800/50 overflow-hidden relative mb-4 ring-1 ring-slate-100 dark:ring-slate-800">
                      {product.image_url ? (
                        <Image 
                           src={product.image_url} 
                           alt={product.name} 
                           width={300} 
                           height={300} 
                           className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-12 h-12 text-slate-200 dark:text-slate-700" />
                        </div>
                      )}
                      
                      {/* Price Badge Overlay */}
                      <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg">
                         <span className="font-black text-indigo-600 dark:text-indigo-400 text-sm tracking-tight">{formatCurrency(product.sale_price)}</span>
                      </div>
                    </div>

                    <div className="w-full px-3">
                      <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm mb-3 truncate leading-tight">{product.name}</h3>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-slate-800">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">En Stock</span>
                          <span className={`text-xs font-black ${
                            product.stock < 10 ? 'text-rose-500 animate-pulse' : 'text-emerald-500'
                          }`}>
                            {product.stock} unités
                          </span>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                           <Plus className="w-5 h-5 text-indigo-600 group-hover:text-white transition-colors" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Area: Order Summary / Cart */}
        <div className="w-full lg:w-[440px] shrink-0 h-full flex flex-col bg-slate-900 rounded-[3rem] shadow-2xl relative overflow-hidden text-left">
          {/* Decorative Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-[80px]" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/20 blur-[80px]" />

          <div className="p-8 pb-4 flex items-center justify-between shrink-0 relative z-10">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/20">
                 <ShoppingCart className="w-6 h-6 text-indigo-400" />
               </div>
               <div>
                  <h2 className="font-black text-white text-lg tracking-tight">Panier</h2>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">{cart.length} Articles</p>
               </div>
            </div>
            <button onClick={() => setCart([])} className="text-slate-500 hover:text-rose-400 transition-colors">
               <Trash2 className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-6 relative z-10 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-700">
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-800 flex items-center justify-center mb-4">
                   <ShoppingCart className="w-8 h-8 opacity-20" />
                </div>
                <p className="font-bold text-sm tracking-widest uppercase opacity-20 text-center">Votre panier est vide</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.product.id} className="group relative flex gap-5 items-center p-4 rounded-[2rem] hover:bg-white/5 transition-all">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800 overflow-hidden shrink-0 border border-slate-700">
                    {item.product.image_url ? (
                      <Image src={item.product.image_url} width={80} height={80} alt={item.product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingCart className="w-6 h-6 text-slate-700" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                       <h4 className="font-bold text-white text-sm truncate pr-2">{item.product.name}</h4>
                       <span className="font-black text-slate-300 text-sm whitespace-nowrap">{formatCurrency(item.unit_price * item.quantity)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-1">
                          <button onClick={() => updateQuantity(item.product.id, -1)} className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-all">-</button>
                          <span className="text-white font-black w-8 text-center text-xs">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.product.id, 1)} className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-all">+</button>
                       </div>
                       
                       <input
                        type="number"
                        className="w-20 h-7 bg-slate-800 rounded-lg text-indigo-400 text-[11px] font-black text-center focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        value={item.unit_price}
                        onChange={(e) => updatePrice(item.product.id, parseFloat(e.target.value) || 0)}
                       />
                    </div>
                    
                    <div className="mt-3">
                      <Input
                        placeholder="IMEI du téléphone..."
                        className="h-8 text-[10px] bg-slate-800 border-none rounded-lg text-slate-400 placeholder:text-slate-600"
                        value={item.imei || ""}
                        onChange={(e) => updateImei(item.product.id, e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-8 pt-6 space-y-6 relative z-10 border-t border-white/5 bg-slate-900/50 backdrop-blur-xl">
             <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
                      👑 Client (Optionnel)
                      <Dialog open={isAddCustomerOpen} onOpenChange={setIsAddCustomerOpen}>
                        <DialogTrigger asChild>
                          <button className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                            <UserPlus className="w-3 h-3" /> Nouveau
                          </button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl z-[100]">
                          <form onSubmit={handleAddCustomer}>
                            <DialogHeader>
                              <DialogTitle className="font-extrabold text-xl text-slate-800 dark:text-white">Créer un Client</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nom Complet *</Label>
                                <Input required placeholder="Ex: Mohamed Alami" className="rounded-xl border-slate-200"
                                  value={newCustomer.full_name} onChange={(e) => setNewCustomer({...newCustomer, full_name: e.target.value})} />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Téléphone *</Label>
                                <Input required placeholder="Ex: 06..." className="rounded-xl border-slate-200"
                                  value={newCustomer.phone} onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})} />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button type="submit" className="w-full rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 h-12">Sauvegarder</Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </label>
                    <select
                      className="w-full text-sm bg-slate-800 text-white rounded-xl h-10 px-3 border border-slate-700 outline-none focus:border-indigo-500"
                      value={selectedCustomer}
                      onChange={(e) => setSelectedCustomer(e.target.value)}
                    >
                      <option value="">-- Client de passage --</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.full_name} ({c.phone})</option>
                      ))}
                    </select>
                 </div>

                 <div className="space-y-3 pt-3 border-t border-slate-700">
                    <div className="flex justify-between items-center opacity-40">
                       <span className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Sous-total</span>
                       <span className="text-sm font-bold text-white">{formatCurrency(grandTotal)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Total à payer</span>
                       <span className="text-3xl font-black text-white tracking-tighter tabular-nums">{formatCurrency(grandTotal)}</span>
                    </div>
                 </div>
             </div>

             <Button
                onClick={handleCompleteSale}
                disabled={cart.length === 0 || submitting}
                className="w-full h-16 rounded-[1.5rem] bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/30 transition-all active:scale-95 flex gap-3 mt-4"
             >
                {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <><CreditCard className="w-6 h-6" /> Valider la Vente</>}
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
            <h2 className="text-xl font-black tracking-tight uppercase">Vente Terminée ✅</h2>
            <p className="text-indigo-200 text-sm font-medium mt-1 tracking-widest">{receipt?.receiptNumber}</p>
          </div>

          {/* Printable Receipt Content (Hidden from view, used for ref) */}
          <div ref={printRef} className="hidden" />

          <div className="p-6">
            <div className="bg-slate-50 dark:bg-slate-900 rounded-[2rem] p-5 border border-slate-100 dark:border-slate-800 shadow-inner">
              <table className="w-full border-separate border-spacing-y-3">
                <tbody>
                  {receipt?.items.map(item => (
                    <tr key={item.product.id} className="group">
                      <td className="w-14">
                        <div className="w-12 h-12 bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                          {item.product.image_url ? (
                            <Image src={item.product.image_url} width={48} height={48} className="w-full h-full object-cover" alt={item.product.name} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-100">
                              <ImageIcon className="w-5 h-5 text-slate-300" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="pl-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">{item.product.name}</span>
                          <span className="text-[10px] font-black text-indigo-500 uppercase">Qty: {item.quantity}</span>
                        </div>
                      </td>
                      <td className="text-right align-top pt-0.5">
                        <span className="font-black text-slate-900 dark:text-white text-sm whitespace-nowrap">
                          {formatCurrency(item.unit_price * item.quantity)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div className="mt-4 pt-4 border-t-2 border-dashed border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Amount</span>
                  <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
                    {formatCurrency(receipt?.total || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-8 pb-8 flex gap-3">
            <Button
              variant="outline"
              className="flex-1 h-14 rounded-2xl font-bold border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              onClick={() => setReceipt(null)}
            >
              <X className="w-4 h-4 mr-2" />
              Done
            </Button>
            <Button
              className="flex-1 h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
              onClick={handlePrint}
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
