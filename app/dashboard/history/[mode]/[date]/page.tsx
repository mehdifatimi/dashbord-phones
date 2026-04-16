"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase-client"
import { formatCurrency } from "@/lib/utils"
import { Activity, ArrowLeft, Loader2, Image as ImageIcon, Box, Tag } from "lucide-react"

type SaleDetail = {
  id: string;
  quantity: number;
  total_price: number;
  profit: number;
  created_at: string;
  products?: {
    name: string;
    brand: string;
    image_url: string;
    categories?: {
      name: string;
    }
  };
}

export default function HistoryDetailsPage() {
  const router = useRouter()
  const params = useParams()
  
  const mode = params.mode as string
  const dateStr = params.date as string
  
  const [sales, setSales] = useState<SaleDetail[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const fetchSales = useCallback(async () => {
    try {
      let query = supabase
        .from("sales")
        .select(`
          *,
          products (
            name,
            brand,
            image_url,
            categories (
              name
            )
          )
        `)
        .order("created_at", { ascending: false })

      if (mode === "daily") {
        const start = new Date(dateStr)
        const end = new Date(start)
        end.setDate(end.getDate() + 1)
        query = query.gte('created_at', start.toISOString()).lt('created_at', end.toISOString())
      } else if (mode === "monthly") {
        const [year, month] = dateStr.split('-')
        const start = new Date(parseInt(year), parseInt(month) - 1, 1)
        const end = new Date(parseInt(year), parseInt(month), 1)
        query = query.gte('created_at', start.toISOString()).lt('created_at', end.toISOString())
      }

      const { data, error } = await query
      if (error) throw error
      setSales(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [supabase, mode, dateStr])

  useEffect(() => {
    if (!mode || !dateStr) return
    fetchSales()
  }, [mode, dateStr, fetchSales])

  // Calculate formatted display title
  let displayDate = ""
  if (mode === "daily") {
    displayDate = new Date(dateStr).toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  } else {
    const [year, month] = dateStr.split('-')
    displayDate = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString("en-US", { year: 'numeric', month: 'long' })
  }

  const totalRevenue = sales.reduce((sum, s) => sum + s.total_price, 0)
  const totalProfit = sales.reduce((sum, s) => sum + s.profit, 0)
  const totalItems = sales.reduce((sum, s) => sum + s.quantity, 0)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
        <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl animate-pulse">
          <Loader2 className="w-10 h-10 text-indigo-600 dark:text-indigo-400 animate-spin" />
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-500 animate-pulse">Loading exact history...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Button 
            variant="ghost" 
            onClick={() => router.push('/dashboard/history')}
            className="mb-2 -ml-3 text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Overview
          </Button>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {displayDate}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
            Detailed breakdown of {sales.length} transactions
          </p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-white dark:bg-slate-900 py-2 px-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
             <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Items</p>
             <p className="text-lg font-black text-slate-800 dark:text-slate-200">{totalItems}</p>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-500/10 py-2 px-4 rounded-2xl shadow-sm">
             <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Total Revenue</p>
             <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-500/10 py-2 px-4 rounded-2xl shadow-sm">
             <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Net Profit</p>
             <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">+{formatCurrency(totalProfit)}</p>
          </div>
        </div>
      </div>

      <Card className="rounded-[1.5rem] border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-slate-800/20">
              <TableRow className="border-b-gray-100 dark:border-slate-800/60">
                <TableHead className="w-[120px] pl-6 uppercase text-[10px] tracking-wider text-slate-500 font-bold">{mode === "daily" ? "Time" : "Date"}</TableHead>
                <TableHead className="uppercase text-[10px] tracking-wider text-slate-500 font-bold">Product Details</TableHead>
                <TableHead className="uppercase text-[10px] tracking-wider text-slate-500 font-bold">Qty</TableHead>
                <TableHead className="uppercase text-[10px] tracking-wider text-slate-500 font-bold">T. Price</TableHead>
                <TableHead className="text-right pr-6 uppercase text-[10px] tracking-wider text-slate-500 font-bold">Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-16">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Activity className="w-16 h-16 mb-4 opacity-20" />
                      <span className="font-bold text-slate-500">No records found</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                sales.map((s) => (
                  <TableRow key={s.id} className="border-b-gray-50 dark:border-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <TableCell className="pl-6 py-4 font-bold text-slate-500 dark:text-slate-400 text-sm whitespace-nowrap">
                       {mode === "daily" 
                          ? new Date(s.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                          : new Date(s.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric'})}
                    </TableCell>
                    
                    <TableCell>
                       <div className="flex items-center gap-4">
                          {s.products?.image_url ? (
                             <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm shrink-0 border border-slate-100 dark:border-slate-800">
                               <Image
                                 src={s.products.image_url}
                                 alt={s.products.name}
                                 width={48}
                                 height={48}
                                 className="w-full h-full object-cover"
                               />
                             </div>
                          ) : (
                             <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-800">
                               <ImageIcon className="h-6 w-6 text-slate-400" />
                             </div>
                          )}
                          <div className="flex flex-col min-w-0">
                             <span className="font-extrabold text-slate-800 dark:text-slate-200 truncate pr-4">
                               {s.products?.name || "Unknown Product"}
                             </span>
                             <div className="flex items-center gap-3 mt-1">
                               {s.products?.brand && (
                                  <span className="flex items-center text-[11px] font-semibold text-slate-500">
                                     <Box className="w-3 h-3 mr-1 opacity-70" /> {s.products.brand}
                                  </span>
                               )}
                               {s.products?.categories?.name && (
                                  <span className="flex items-center text-[11px] font-semibold text-slate-500">
                                     <Tag className="w-3 h-3 mr-1 opacity-70" /> {s.products.categories.name}
                                  </span>
                               )}
                             </div>
                          </div>
                       </div>
                    </TableCell>

                    <TableCell className="font-bold text-slate-600 dark:text-slate-400 text-base">
                       x{s.quantity}
                    </TableCell>
                    
                    <TableCell className="font-bold text-indigo-600 dark:text-indigo-400 text-base">
                       {formatCurrency(s.total_price)}
                    </TableCell>
                    
                    <TableCell className="text-right pr-6 font-black text-emerald-500 text-base">
                       +{formatCurrency(s.profit)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
