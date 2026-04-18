"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase-client"
import { formatCurrency } from "@/lib/utils"
import { Activity, CalendarDays, DollarSign, Loader2, Package, TrendingUp, ChevronRight, Search, Download, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { exportCSV, exportPrintPDF } from "@/lib/export"

type Sale = {
  id: string;
  product_id: string;
  quantity: number;
  total_price: number;
  profit: number;
  created_at: string;
  products?: {
    name: string;
  };
}

type GroupedSale = {
  key: string;
  date: string;
  totalRevenue: number;
  totalProfit: number;
  totalItems: number;
  salesCount: number;
}

export default function HistoryPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"daily" | "monthly">("daily")
  const [searchTicket, setSearchTicket] = useState("")
  
  const router = useRouter()
  const supabase = createClient()

  const fetchSales = useCallback(async () => {
    try {
      let query = supabase
        .from("sales")
        .select("*, products(name)")
        .order("created_at", { ascending: false })

      if (searchTicket.trim().length > 0) {
        query = query.ilike('receipt_number', `%${searchTicket.trim()}%`)
      }

      const { data, error } = await query

      if (error) throw error
      setSales(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [supabase, searchTicket])

  useEffect(() => {
    fetchSales()
  }, [fetchSales])

  // Calculate Grouped Data based on viewMode
  const groupedData: GroupedSale[] = []
  
  if (sales.length > 0) {
    const groups: Record<string, GroupedSale> = {}
    
    sales.forEach(sale => {
      const dateObj = new Date(sale.created_at)
      let key = ""
      let displayDate = ""

      if (viewMode === "daily") {
        key = dateObj.toLocaleDateString("en-CA") // YYYY-MM-DD format
        displayDate = dateObj.toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      } else {
        const monthStr = String(dateObj.getMonth() + 1).padStart(2, '0')
        key = `${dateObj.getFullYear()}-${monthStr}` // YYYY-MM
        displayDate = dateObj.toLocaleDateString("en-US", { year: 'numeric', month: 'long' })
      }

      if (!groups[key]) {
        groups[key] = {
          key,
          date: displayDate,
          totalRevenue: 0,
          totalProfit: 0,
          totalItems: 0,
          salesCount: 0
        }
      }

      groups[key].totalRevenue += sale.total_price
      groups[key].totalProfit += sale.profit
      groups[key].totalItems += sale.quantity
      groups[key].salesCount += 1
    })

    // Convert object to array
    Object.values(groups).forEach(g => groupedData.push(g))
  }

  const totalAllTimeRevenue = sales.reduce((sum, item) => sum + item.total_price, 0)
  const totalAllTimeProfit = sales.reduce((sum, item) => sum + item.profit, 0)
  const totalAllTimeItems = sales.reduce((sum, item) => sum + item.quantity, 0)

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
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Sales History</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
            Track your revenue and profits over time
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Export Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-12 rounded-xl font-bold gap-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 dark:hover:bg-emerald-500/10 transition-colors"
              onClick={() =>
                exportCSV(
                  sales,
                  [
                    { label: "Ticket N°", value: (s) => (s as any).receipt_number || "" },
                    { label: "Produit", value: (s) => s.products?.name || "" },
                    { label: "Quantité", value: (s) => s.quantity },
                    { label: "Total (Dh)", value: (s) => s.total_price },
                    { label: "Profit (Dh)", value: (s) => s.profit },
                    { label: "Date", value: (s) => new Date(s.created_at).toLocaleString("fr-FR") },
                  ],
                  "historique_ventes"
                )
              }
            >
              <Download className="w-4 h-4" /> CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-12 rounded-xl font-bold gap-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 dark:hover:bg-indigo-500/10 transition-colors"
              onClick={() => exportPrintPDF("history-table-print", "Historique des Ventes")}
            >
              <Printer className="w-4 h-4" /> PDF
            </Button>
          </div>

          <div className="relative w-full sm:w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="TICKET N° (ex: REC-967673)..." 
              value={searchTicket}
              onChange={(e) => setSearchTicket(e.target.value)}
              className="pl-9 h-12 bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 shadow-sm rounded-xl font-bold focus:ring-indigo-500"
            />
          </div>
          <div className="w-full sm:w-[200px]">
            <Select value={viewMode} onValueChange={(val: any) => setViewMode(val)} disabled={searchTicket.length > 0}>
              <SelectTrigger className="h-12 bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 shadow-sm rounded-xl font-bold focus:ring-indigo-500 text-slate-700 dark:text-slate-200">
                <CalendarDays className="w-4 h-4 mr-2" />
                <SelectValue placeholder="View Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily" className="font-semibold">Daily Breakdown</SelectItem>
                <SelectItem value="monthly" className="font-semibold">Monthly Breakdown</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Global Stats Row */}
      {searchTicket.length === 0 && (
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="rounded-[1.5rem] border-none shadow-sm shadow-slate-200/50 dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] bg-white dark:bg-slate-900 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-bl-[100px] -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500 ease-out"></div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Revenue</CardTitle>
              <div className="p-3 bg-indigo-100 dark:bg-indigo-500/20 rounded-2xl text-indigo-600 dark:text-indigo-400 shadow-sm">
                 <DollarSign className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">{formatCurrency(totalAllTimeRevenue)}</div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">Gross income all time</p>
            </CardContent>
          </Card>

          <Card className="rounded-[1.5rem] border-none shadow-sm shadow-slate-200/50 dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] bg-white dark:bg-slate-900 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-bl-[100px] -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500 ease-out"></div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Profit</CardTitle>
              <div className="p-3 bg-emerald-100 dark:bg-emerald-500/20 rounded-2xl text-emerald-600 dark:text-emerald-400 shadow-sm">
                 <TrendingUp className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-black text-emerald-500 mb-1 tracking-tight">{formatCurrency(totalAllTimeProfit)}</div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">Net profit all time</p>
            </CardContent>
          </Card>

          <Card className="rounded-[1.5rem] border-none shadow-sm shadow-slate-200/50 dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] bg-white dark:bg-slate-900 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 dark:bg-blue-500/5 rounded-bl-[100px] -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500 ease-out"></div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Items Sold</CardTitle>
              <div className="p-3 bg-blue-100 dark:bg-blue-500/20 rounded-2xl text-blue-600 dark:text-blue-400 shadow-sm">
                 <Package className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">{totalAllTimeItems}</div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">Total volume moved</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* History Table */}
      <Card className="rounded-[1.5rem] border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden" id="history-table-print">
        <CardHeader className="border-b border-gray-100 dark:border-slate-800/60 pb-5">
          <CardTitle className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center justify-between">
             {searchTicket.length > 0 ? "Résultats de Recherche" : (viewMode === "daily" ? "Daily Performance" : "Monthly Performance")}
             {searchTicket.length === 0 && (
               <span className="text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 px-3 py-1 rounded-full uppercase tracking-wider">
                 Click any row for details
               </span>
             )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-slate-800/20">
              {searchTicket.length > 0 ? (
                <TableRow className="border-b-gray-100 dark:border-slate-800/60">
                  <TableHead className="pl-8 uppercase text-[10px] tracking-wider text-slate-500 font-bold">Ticket N°</TableHead>
                  <TableHead className="uppercase text-[10px] tracking-wider text-slate-500 font-bold">Produit</TableHead>
                  <TableHead className="uppercase text-[10px] tracking-wider text-slate-500 font-bold">Qty</TableHead>
                  <TableHead className="uppercase text-[10px] tracking-wider text-slate-500 font-bold">Total</TableHead>
                  <TableHead className="text-right pr-8 uppercase text-[10px] tracking-wider text-slate-500 font-bold">Date</TableHead>
                </TableRow>
              ) : (
                <TableRow className="border-b-gray-100 dark:border-slate-800/60">
                  <TableHead className="w-[300px] pl-8 uppercase text-[10px] tracking-wider text-slate-500 font-bold">Date</TableHead>
                  <TableHead className="uppercase text-[10px] tracking-wider text-slate-500 font-bold">Total Transactions</TableHead>
                  <TableHead className="uppercase text-[10px] tracking-wider text-slate-500 font-bold">Items Sold</TableHead>
                  <TableHead className="uppercase text-[10px] tracking-wider text-slate-500 font-bold">Revenue</TableHead>
                  <TableHead className="text-right pr-8 uppercase text-[10px] tracking-wider text-slate-500 font-bold">Profit</TableHead>
                </TableRow>
              )}
            </TableHeader>
            <TableBody>
              {searchTicket.length > 0 ? (
                sales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-16">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <Activity className="w-16 h-16 mb-4 opacity-20" />
                        <span className="font-bold text-slate-500">Aucun ticket trouvé</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  sales.map((sale) => (
                    <TableRow key={sale.id} className="border-b-gray-50 dark:border-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <TableCell className="pl-8 py-5 font-black text-slate-800 dark:text-slate-200">
                        {(sale as any).receipt_number || "N/A"}
                      </TableCell>
                      <TableCell className="font-extrabold text-slate-700 dark:text-slate-300">
                        {sale.products?.name || "Produit inconnu"}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-500 text-sm">
                        x{sale.quantity}
                      </TableCell>
                      <TableCell className="font-extrabold text-indigo-600 dark:text-indigo-400">
                         {formatCurrency(sale.total_price)}
                      </TableCell>
                      <TableCell className="text-right pr-8 font-semibold text-slate-500 text-sm">
                         {new Date(sale.created_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )
              ) : (
                groupedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-16">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <Activity className="w-16 h-16 mb-4 opacity-20" />
                        <span className="font-bold text-slate-500">No records found</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  groupedData.map((row) => (
                    <TableRow 
                      key={row.key} 
                      className="border-b-gray-50 dark:border-slate-800/40 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 transition-colors cursor-pointer group/row"
                      onClick={() => {
                          router.push(`/dashboard/history/${viewMode}/${row.key}`)
                      }}
                    >
                      <TableCell className="pl-8 py-5 font-extrabold text-slate-800 dark:text-slate-200">
                        {row.date}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-500 text-sm">
                         <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">{row.salesCount}</span>
                      </TableCell>
                      <TableCell className="font-semibold text-slate-500 text-sm">
                         <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">{row.totalItems}</span>
                      </TableCell>
                      <TableCell className="font-extrabold text-slate-700 dark:text-slate-300">
                         {formatCurrency(row.totalRevenue)}
                      </TableCell>
                      <TableCell className="text-right pr-8 font-black text-emerald-500">
                         <div className="flex items-center justify-end gap-3">
                           +{formatCurrency(row.totalProfit)}
                           <ChevronRight className="w-5 h-5 text-slate-300 group-hover/row:text-indigo-600 dark:group-hover/row:text-indigo-400 group-hover/row:translate-x-1 transition-all duration-300" />
                         </div>
                      </TableCell>
                    </TableRow>
                  ))
                )
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
