"use client"

import { useCallback, useEffect, useState } from "react"
import { 
  Package, 
  Search, 
  Plus, 
  Minus, 
  AlertCircle, 
  RefreshCw,
  TrendingUp,
  History,
  Box,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  FileDown,
  Truck,
  Printer,
  X,
  ChevronUp,
  ChevronDown
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase-client"
import { formatCurrency } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import type { Product, Category, Supplier } from "@/lib/types"

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [showPOModal, setShowPOModal] = useState(false)
  const [poItems, setPoItems] = useState<{id: string; name: string; category: string; currentStock: number; purchasePrice: number; qty: number}[]>([])
  const [poSupplier, setPoSupplier] = useState("")
  const [poNotes, setPoNotes] = useState("")
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  
  const supabase = createClient()
  const { toast } = useToast()

  const fetchData = useCallback(async () => {
    try {
      const [pRes, cRes, sRes] = await Promise.all([
        supabase.from("products").select("*").order("name"),
        supabase.from("categories").select("*").order("name"),
        supabase.from("suppliers").select("*").order("name")
      ])
      setProducts(pRes.data || [])
      setCategories(cRes.data || [])
      setSuppliers(sRes.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchData()
    
    // Real-time stock listener
    const channel = supabase
      .channel('inventory-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchData, supabase])

  const updateStock = async (productId: string, currentStock: number, delta: number) => {
    const newStock = Math.max(0, currentStock + delta)
    setUpdatingId(productId)
    
    try {
      const { error } = await supabase
        .from("products")
        .update({ stock: newStock })
        .eq("id", productId)

      if (error) throw error

      toast({
        title: "Stock Mis à Jour",
        description: `La quantité a été modifiée avec succès.`,
        variant: "default",
      })
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le stock.",
        variant: "destructive",
      })
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = selectedCategory === "all" || p.category_id === selectedCategory
    return matchesSearch && matchesCategory
  })

  const lowStockCount = products.filter(p => p.stock < 10).length
  const lowStockItems = products.filter(p => p.stock < 10)
  const totalItems = products.reduce((sum, p) => sum + p.stock, 0)

  const openPOModal = () => {
    setPoItems(lowStockItems.map(p => ({
      id: p.id,
      name: p.name,
      category: categories.find(c => c.id === p.category_id)?.name || "—",
      currentStock: p.stock,
      purchasePrice: p.purchase_price,
      qty: Math.max(10, 20 - p.stock)
    })))
    setPoSupplier("")
    setPoNotes("")
    setShowPOModal(true)
  }

  const updatePoQty = (id: string, delta: number) => {
    setPoItems(prev => prev.map(item =>
      item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item
    ))
  }

  const setPoQtyDirect = (id: string, val: number) => {
    setPoItems(prev => prev.map(item =>
      item.id === id ? { ...item, qty: Math.max(1, val || 1) } : item
    ))
  }

  const removePoItem = (id: string) => {
    setPoItems(prev => prev.filter(item => item.id !== id))
  }

  const totalPO = poItems.reduce((sum, item) => sum + item.purchasePrice * item.qty, 0)

  const handlePrintPO = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Gestion des Stocks</h1>
          <p className="text-slate-500 font-medium mt-1 uppercase tracking-widest text-[10px]">Inventaire & Réapprovisionnement en Temps Réel</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="px-5 py-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl flex items-center gap-3 shadow-xl shadow-amber-500/5">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <div className="flex flex-col">
                 <span className="text-lg font-black text-amber-700 dark:text-amber-400 leading-none">{lowStockCount}</span>
                 <span className="text-[9px] font-black text-amber-600/60 uppercase tracking-tighter">Alertes Stock Bas</span>
              </div>
           </div>
           {lowStockCount > 0 && (
             <button
               onClick={openPOModal}
               className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-500/30 transition-all active:scale-95"
             >
               <FileDown className="w-4 h-4" />
               Bon de Commande
             </button>
           )}
        </div>
      </div>

      {/* Purchase Order Modal */}
      <Dialog open={showPOModal} onOpenChange={setShowPOModal}>
        <DialogContent className="max-w-3xl border-none rounded-[2rem] bg-white dark:bg-slate-900 p-0 overflow-hidden shadow-2xl">
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-indigo-900 to-indigo-600 px-8 py-6 text-white">
            <DialogTitle className="text-xl font-black flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
                <Truck className="w-5 h-5" />
              </div>
              Bon de Commande
            </DialogTitle>
            <p className="text-indigo-200 text-xs font-semibold uppercase tracking-widest">Modifiez les quantités avant d&apos;imprimer</p>
          </div>

          <div className="p-7 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Supplier + Notes */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Fournisseur</label>
                <select
                  value={poSupplier}
                  onChange={e => setPoSupplier(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">— Sélectionner un fournisseur —</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.name}>{s.name}{s.contact_name ? ` (${s.contact_name})` : ""}</option>
                  ))}
                </select>
                {suppliers.length === 0 && (
                  <p className="text-[10px] text-amber-500 font-semibold mt-1">Aucun fournisseur — <a href="/dashboard/suppliers" className="underline">Ajouter d&apos;abord un fournisseur</a></p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Notes / Remarques</label>
                <Input placeholder="Délai, conditions..." className="rounded-xl h-11"
                  value={poNotes} onChange={e => setPoNotes(e.target.value)} />
              </div>
            </div>

            {/* Products Table */}
            <div className="rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Produit</th>
                    <th className="text-center px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Stock Actuel</th>
                    <th className="text-center px-4 py-3 text-[10px] font-black uppercase tracking-wider text-indigo-500">Qté à Commander</th>
                    <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Prix Achat</th>
                    <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Total</th>
                    <th className="px-2 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {poItems.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-800 dark:text-white">{item.name}</div>
                        <div className="text-[10px] text-slate-400 font-semibold">{item.category}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                          item.currentStock === 0 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                        }`}>{item.currentStock}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => updatePoQty(item.id, -1)}
                            className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-indigo-100 hover:text-indigo-600 flex items-center justify-center transition-colors">
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="number" min={1}
                            value={item.qty}
                            onChange={e => setPoQtyDirect(item.id, parseInt(e.target.value))}
                            className="w-16 text-center font-black text-indigo-600 border border-indigo-200 rounded-lg h-8 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-indigo-50"
                          />
                          <button onClick={() => updatePoQty(item.id, 1)}
                            className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-indigo-100 hover:text-indigo-600 flex items-center justify-center transition-colors">
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500 font-semibold text-xs">{formatCurrency(item.purchasePrice)}</td>
                      <td className="px-4 py-3 text-right font-black text-slate-800 dark:text-white">{formatCurrency(item.purchasePrice * item.qty)}</td>
                      <td className="px-2 py-3">
                        <button onClick={() => removePoItem(item.id)}
                          className="w-7 h-7 rounded-lg hover:bg-red-50 hover:text-red-500 flex items-center justify-center text-slate-300 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {poItems.length === 0 && (
              <div className="text-center py-8 text-slate-400 font-semibold">Tous les produits ont été retirés</div>
            )}

            {/* Total */}
            <div className="flex items-center justify-between bg-gradient-to-r from-indigo-50 to-emerald-50 dark:from-indigo-900/20 dark:to-emerald-900/10 rounded-2xl px-6 py-4 border border-indigo-100 dark:border-indigo-800">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-indigo-500">{poItems.length} produits — Total Estimé</p>
                <p className="text-3xl font-black text-indigo-700 dark:text-indigo-300 mt-0.5">{formatCurrency(totalPO)}</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowPOModal(false)} className="rounded-xl gap-2">
                  <X className="w-4 h-4" /> Annuler
                </Button>
                <Button onClick={handlePrintPO} disabled={poItems.length === 0}
                  className="rounded-xl gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-500/30">
                  <Printer className="w-4 h-4" /> Imprimer le Bon
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stats Quick Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-[2rem] border-none shadow-sm bg-indigo-600 text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-bl-[100px] -mr-8 -mt-8" />
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Total Unités en Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black tracking-tighter">{totalItems}</div>
          </CardContent>
        </Card>
        
        <Card className="rounded-[2rem] border-none shadow-sm bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
           <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Valeur de l&apos;Inventaire</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
               {formatCurrency(products.reduce((sum, p) => sum + (p.purchase_price * p.stock), 0))}
             </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-none shadow-sm bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
           <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Réapprovisionnement Nécessaire</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-3xl font-black text-rose-500 tracking-tight">
               {lowStockCount} <span className="text-sm text-slate-400 font-bold uppercase ml-1">Produits</span>
             </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <Input
            placeholder="Rechercher par nom ou IMEI..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-14 h-16 bg-white dark:bg-slate-900 rounded-[1.5rem] border-none shadow-sm text-lg font-semibold focus-visible:ring-indigo-500"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-6 h-12 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              selectedCategory === "all" ? "bg-indigo-600 text-white shadow-lg" : "bg-white dark:bg-slate-900 text-slate-500"
            }`}
          >
            Tous
          </button>
          {categories.map(cat => (
             <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-6 h-12 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                selectedCategory === cat.id ? "bg-indigo-600 text-white shadow-lg" : "bg-white dark:bg-slate-900 text-slate-500"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <Card className="rounded-[2.5rem] border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Produit</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Catégorie</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Prix Achat</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Quantité Actuelle</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions de Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                         {product.image_url ? (
                           <Image src={product.image_url} width={56} height={56} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center">
                             <Box className="w-6 h-6 text-slate-300" />
                           </div>
                         )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">{product.name}</span>
                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">ID: {product.id.slice(0,8)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                     <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black rounded-lg uppercase tracking-widest">
                       {categories.find(c => c.id === product.category_id)?.name || "Général"}
                     </span>
                  </td>
                  <td className="px-6 py-5 font-bold text-slate-600 dark:text-slate-400">
                    {formatCurrency(product.purchase_price)}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className={`inline-flex items-center px-4 py-2 rounded-2xl border-2 font-black text-lg ${
                      product.stock < 10 
                      ? "bg-rose-50 border-rose-100 text-rose-500 animate-pulse" 
                      : "bg-emerald-50 border-emerald-100 text-emerald-600"
                    }`}>
                      {product.stock}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <Button 
                         variant="outline" 
                         size="icon" 
                         onClick={() => updateStock(product.id, product.stock, -1)}
                         className="w-10 h-10 rounded-xl border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-rose-500"
                       >
                         <Minus className="w-4 h-4" />
                       </Button>
                       
                       <Button 
                         variant="outline"
                         onClick={() => updateStock(product.id, product.stock, 5)}
                         className="h-10 px-4 rounded-xl border-emerald-100 text-emerald-600 font-black text-xs hover:bg-emerald-50 active:scale-95"
                       >
                         +5
                       </Button>

                       <Button 
                         onClick={() => updateStock(product.id, product.stock, 10)}
                         className="h-10 px-4 rounded-xl bg-indigo-600 text-white font-black text-xs hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 active:scale-95"
                       >
                         +10
                       </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* PURCHASE ORDER - Hidden on screen, visible on print only */}
      {poItems.length > 0 && (
        <div id="printable-ticket" style={{ fontFamily: "'Segoe UI', Arial, sans-serif", background: "#fff", color: "#111", width: "210mm", margin: "0 auto", padding: 0, boxSizing: "border-box" }}>
          <div style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #4f46e5 100%)", color: "#fff", padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: "12px", width: "46px", height: "46px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Truck style={{ width: "24px", height: "24px", color: "#fff" }} />
              </div>
              <div>
                <div style={{ fontSize: "20px", fontWeight: 900, letterSpacing: "0.05em", textTransform: "uppercase" }}>Bon de Commande</div>
                {poSupplier
                  ? <div style={{ fontSize: "12px", opacity: 0.85, marginTop: "3px", fontWeight: 700 }}>Fournisseur : {poSupplier}</div>
                  : <div style={{ fontSize: "10px", opacity: 0.65, marginTop: "3px", letterSpacing: "0.15em", textTransform: "uppercase" }}>Purchase Order</div>}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: "10px", padding: "6px 14px", fontSize: "12px", fontWeight: 800, fontFamily: "monospace" }}>
                BC-{new Date().toISOString().slice(0, 10)}
              </div>
              <div style={{ fontSize: "10px", opacity: 0.6, marginTop: "6px" }}>
                Généré le {new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
              </div>
            </div>
          </div>
          <div style={{ padding: "24px 32px" }}>
            {poNotes && <div style={{ marginBottom: "12px", padding: "10px 16px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "10px", fontSize: "11px", fontWeight: 700, color: "#1e40af" }}>📝 {poNotes}</div>}
            <div style={{ marginBottom: "16px", padding: "12px 16px", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
              <AlertCircle style={{ width: "16px", height: "16px", color: "#f97316" }} />
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#9a3412" }}>{poItems.length} produit(s) — quantités validées manuellement.</span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Produit","Stock Actuel","Qté Commandée","Prix Achat","Total"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: h === "Produit" ? "left" : "right", fontWeight: 900, fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#6366f1", borderBottom: "2px solid #e2e8f0" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {poItems.map((item, idx) => (
                  <tr key={item.id} style={{ background: idx % 2 === 0 ? "#fff" : "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 700, color: "#1e293b" }}>
                      {item.name}
                      <div style={{ fontSize: "9px", color: "#94a3b8", fontWeight: 600, marginTop: "2px" }}>{item.category}</div>
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "right" }}>
                      <span style={{ background: item.currentStock === 0 ? "#fee2e2" : "#fef3c7", color: item.currentStock === 0 ? "#991b1b" : "#92400e", padding: "3px 10px", borderRadius: "20px", fontWeight: 800, fontSize: "11px" }}>
                        {item.currentStock}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 900, color: "#4f46e5", fontSize: "14px" }}>{item.qty}</td>
                    <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 600, color: "#475569" }}>{formatCurrency(item.purchasePrice)}</td>
                    <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 800, color: "#1e293b" }}>{formatCurrency(item.purchasePrice * item.qty)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: "linear-gradient(135deg, #eef2ff, #f0fdf4)", borderTop: "2px solid #e0e7ff" }}>
                  <td colSpan={4} style={{ padding: "12px 14px", fontWeight: 900, fontSize: "13px", color: "#1e1b4b" }}>TOTAL DE LA COMMANDE</td>
                  <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 900, fontSize: "15px", color: "#4f46e5" }}>{formatCurrency(totalPO)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div style={{ background: "#f8fafc", borderTop: "1px solid #e2e8f0", padding: "14px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>
            <div style={{ fontSize: "9px", color: "#94a3b8", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
              <Package style={{ width: "11px", height: "11px" }} />
              {poSupplier ? `À envoyer à : ${poSupplier}` : "Bon de commande — À envoyer au fournisseur"}
            </div>
            <div style={{ fontSize: "9px", color: "#a5b4fc", fontWeight: 700 }}>BC-{new Date().toISOString().slice(0, 10)}</div>
          </div>
        </div>
      )}
    </div>
  )
}
