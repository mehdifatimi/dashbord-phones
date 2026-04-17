"use client"

import { useEffect, useState } from "react"
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
  ArrowDownRight
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase-client"
import { formatCurrency } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import type { Product, Category } from "@/lib/types"

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  
  const supabase = createClient()
  const { toast } = useToast()

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

  const fetchData = useCallback(async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        supabase.from("products").select("*").order("name"),
        supabase.from("categories").select("*").order("name")
      ])
      setProducts(pRes.data || [])
      setCategories(cRes.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

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
  const totalItems = products.reduce((sum, p) => sum + p.stock, 0)

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
        </div>
      </div>

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
    </div>
  )
}
