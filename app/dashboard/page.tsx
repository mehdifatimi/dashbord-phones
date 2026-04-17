"use client"

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from "react"
import {
  Package,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Wrench,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { createClient } from "@/lib/supabase-client"
import type { DashboardStats } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState<any[]>([])
  const [topProducts, setTopProducts] = useState<any[]>([])
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([])
  const supabase = createClient()
  const { toast } = useToast()

  const fetchLowStock = useCallback(async () => {
    const { data } = await supabase
      .from('products')
      .select('name, stock')
      .lt('stock', 10)
      .gt('stock', 0)
    setLowStockProducts(data || [])
  }, [supabase])

  const getChartDataFn = useCallback(async () => {
    const today = new Date()
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      return date.toISOString().split("T")[0]
    }).reverse()

    const { data: salesData } = await supabase
      .from("sales")
      .select("created_at, total_price, profit, quantity, products(name)")
      .gte("created_at", last7Days[0])

    const daily = last7Days.map((date) => {
      const daySales = salesData?.filter((sale) =>
        sale.created_at.split("T")[0] === date
      ) || []
      return {
        date: new Date(date).toLocaleDateString("en-US", { weekday: "short" }),
        sales: daySales.length,
        revenue: daySales.reduce((sum, s) => sum + s.total_price, 0),
        profit: daySales.reduce((sum, s) => sum + s.profit, 0),
      }
    })
    setChartData(daily)

    // Top products by revenue
    const productMap: Record<string, { name: string; revenue: number; qty: number }> = {}
    salesData?.forEach(s => {
      const name = (s.products as any)?.name || "Unknown"
      if (!productMap[name]) productMap[name] = { name, revenue: 0, qty: 0 }
      productMap[name].revenue += s.total_price
      productMap[name].qty += s.quantity
    })
    const top = Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5)
    setTopProducts(top)

    // Last 6 months data
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(today)
      d.setMonth(d.getMonth() - i)
      return { year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleDateString("en-US", { month: "short" }) }
    }).reverse()

    const { data: allSales } = await supabase
      .from("sales")
      .select("created_at, total_price, profit")
      .gte("created_at", new Date(today.getFullYear(), today.getMonth() - 5, 1).toISOString())

    const monthly = months.map(m => {
      const mSales = allSales?.filter(s => {
        const d = new Date(s.created_at)
        return d.getFullYear() === m.year && d.getMonth() === m.month
      }) || []
      return {
        month: m.label,
        revenue: mSales.reduce((sum, s) => sum + s.total_price, 0),
        profit: mSales.reduce((sum, s) => sum + s.profit, 0),
      }
    })
    setMonthlyData(monthly)
  }, [supabase])

  const fetchDashboardData = useCallback(async () => {
    try {
      const [productsRes, salesRes, lowStockRes, recentSalesRes, repairsRes] = await Promise.all([
        supabase.from("products").select("*", { count: "exact" }),
        supabase.from("sales").select("*", { count: "exact" }),
        supabase.from("products").select("*").lt("stock", 10).gt("stock", 0),
        supabase
          .from("sales")
          .select("*, products(*)")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase.from("repairs").select("*").in("status", ["Pending", "In Progress"])
      ])

      const totalRevenue = salesRes.data?.reduce((sum, s) => sum + s.total_price, 0) || 0
      const totalProfit = salesRes.data?.reduce((sum, sale) => sum + sale.profit, 0) || 0

      const lowStockData = lowStockRes.data || []
      setLowStockProducts(lowStockData)

      setStats({
        totalProducts: productsRes.count || 0,
        totalSales: salesRes.count || 0,
        totalProfit,
        totalRevenue,
        lowStockProducts: lowStockData,
        recentSales: recentSalesRes.data || [],
        activeRepairs: repairsRes.data?.length || 0,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [supabase, toast])

  useEffect(() => {
    fetchDashboardData()
    getChartDataFn()
    fetchLowStock()
  }, [fetchDashboardData, getChartDataFn, fetchLowStock])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
        <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl animate-pulse">
          <Package className="w-10 h-10 text-indigo-600 dark:text-indigo-400 animate-bounce" />
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-500 animate-pulse">Loading dashboard data...</p>
      </div>
    )
  }

  const displayRevenue = (stats as any)?.totalRevenue || 0

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Tableau de bord</h1>
          <p className="text-slate-500 font-medium mt-1">Bienvenue dans votre gestionnaire de boutique.</p>
        </div>
      </div>

      {/* Low Stock Alert Banner */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-6 rounded-[2.5rem] flex items-start gap-5 shadow-xl shadow-amber-500/5 animate-in slide-in-from-top-4 duration-500">
          <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/30">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-amber-900 dark:text-amber-400 font-black text-lg">Attention : Stock Faible !</h3>
            <p className="text-amber-700 dark:text-amber-500/80 text-sm font-medium mt-1">
              Les produits suivants sont presque épuisés (moins de 10 unités) : 
              <span className="font-bold ml-1 text-amber-900 dark:text-amber-300">
                {lowStockProducts.map(p => `${p.name} (${p.stock})`).join(', ')}
              </span>
            </p>
          </div>
          <Link href="/dashboard/inventory">
            <Button className="rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 h-12 shadow-lg shadow-amber-500/20 text-xs">
              Gérer le stock
            </Button>
          </Link>
        </div>
      )}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Products */}
        <Card className="rounded-[1.5rem] border-none shadow-md shadow-slate-200/50 dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] bg-white dark:bg-slate-900 overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 dark:bg-blue-500/5 rounded-bl-[100px] -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500 ease-out"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Products</CardTitle>
            <div className="p-3 bg-blue-100 dark:bg-blue-500/20 rounded-2xl text-blue-600 dark:text-blue-400 shadow-sm">
              <Package className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">{stats?.totalProducts || 0}</div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">Live inventory variants</p>
          </CardContent>
        </Card>

        {/* Total Sales */}
        <Card className="rounded-[1.5rem] border-none shadow-md shadow-slate-200/50 dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] bg-white dark:bg-slate-900 overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-bl-[100px] -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500 ease-out"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Sales</CardTitle>
            <div className="p-3 bg-indigo-100 dark:bg-indigo-500/20 rounded-2xl text-indigo-600 dark:text-indigo-400 shadow-sm">
              <ShoppingCart className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">{stats?.totalSales}</div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">All time sales count</p>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card className="rounded-[1.5rem] border-none shadow-md shadow-slate-200/50 dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] bg-white dark:bg-slate-900 overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 dark:bg-violet-500/5 rounded-bl-[100px] -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500 ease-out"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Revenue</CardTitle>
            <div className="p-3 bg-violet-100 dark:bg-violet-500/20 rounded-2xl text-violet-600 dark:text-violet-400 shadow-sm">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl lg:text-4xl font-black text-violet-600 dark:text-violet-400 mb-1 tracking-tight">
              {formatCurrency(displayRevenue)}
            </div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">Gross income all time</p>
          </CardContent>
        </Card>

        {/* Total Profit */}
        <Card className="rounded-[1.5rem] border-none shadow-md shadow-slate-200/50 dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] bg-white dark:bg-slate-900 overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-bl-[100px] -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500 ease-out"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Net Profit</CardTitle>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-500/20 rounded-2xl text-emerald-600 dark:text-emerald-400 shadow-sm">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl lg:text-4xl font-black text-emerald-500 mb-1 tracking-tight">
              {formatCurrency(stats?.totalProfit || 0)}
            </div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">Net profit all time</p>
          </CardContent>
        </Card>

        {/* Active Repairs */}
        <Card className="rounded-[1.5rem] border-none shadow-md shadow-slate-200/50 dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] bg-white dark:bg-slate-900 overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 dark:bg-amber-500/5 rounded-bl-[100px] -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500 ease-out"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Active Repairs</CardTitle>
            <div className="p-3 bg-amber-100 dark:bg-amber-500/20 rounded-2xl text-amber-600 dark:text-amber-400 shadow-sm">
              <Wrench className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">{stats?.activeRepairs || 0}</div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">Tickets in progress</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Charts Row 1: Daily Revenue + Daily Sales ── */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Area Chart - Revenue last 7 days */}
        <Card className="rounded-[1.5rem] border-none shadow-sm bg-white dark:bg-slate-900 pb-2">
          <CardHeader>
            <CardTitle className="font-extrabold text-slate-800 dark:text-slate-100">Revenue — Last 7 Days</CardTitle>
            <p className="text-sm font-semibold text-slate-400">Daily gross income</p>
          </CardHeader>
          <CardContent>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                  <Tooltip
                    cursor={{ stroke: '#6366f1', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                    formatter={(value) => [formatCurrency(Number(value)), "Revenue"]}
                    contentStyle={{ borderRadius: '14px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', fontSize: '12px', fontWeight: 700 }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fill="url(#colorRevenue)" dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Area Chart - Profit last 7 days */}
        <Card className="rounded-[1.5rem] border-none shadow-sm bg-white dark:bg-slate-900 pb-2">
          <CardHeader>
            <CardTitle className="font-extrabold text-slate-800 dark:text-slate-100">Profit — Last 7 Days</CardTitle>
            <p className="text-sm font-semibold text-slate-400">Daily net profit</p>
          </CardHeader>
          <CardContent>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                  <Tooltip
                    cursor={{ stroke: '#10b981', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                    formatter={(value) => [formatCurrency(Number(value)), "Profit"]}
                    contentStyle={{ borderRadius: '14px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', fontSize: '12px', fontWeight: 700 }}
                  />
                  <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} fill="url(#colorProfit)" dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Charts Row 2: Monthly + Top Products ── */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Line Chart Monthly */}
        <Card className="md:col-span-2 rounded-[1.5rem] border-none shadow-sm bg-white dark:bg-slate-900 pb-2">
          <CardHeader>
            <CardTitle className="font-extrabold text-slate-800 dark:text-slate-100">Monthly Performance</CardTitle>
            <p className="text-sm font-semibold text-slate-400">Revenue vs Profit — last 6 months</p>
          </CardHeader>
          <CardContent>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                  <Tooltip
                    formatter={(value, name) => [formatCurrency(Number(value)), name === "revenue" ? "Revenue" : "Profit"]}
                    contentStyle={{ borderRadius: '14px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', fontSize: '12px', fontWeight: 700 }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Products Bar Chart */}
        <Card className="rounded-[1.5rem] border-none shadow-sm bg-white dark:bg-slate-900 pb-2">
          <CardHeader>
            <CardTitle className="font-extrabold text-slate-800 dark:text-slate-100">Top Products</CardTitle>
            <p className="text-sm font-semibold text-slate-400">By revenue (last 7 days)</p>
          </CardHeader>
          <CardContent>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.15} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} tickFormatter={(v) => `${v}Dh`} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} width={70} />
                  <Tooltip
                    formatter={(value) => [formatCurrency(Number(value)), "Revenue"]}
                    contentStyle={{ borderRadius: '14px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', fontSize: '12px', fontWeight: 700 }}
                  />
                  <Bar dataKey="revenue" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables Area */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Sales (2 cols) */}
        <Card className="lg:col-span-2 rounded-[1.5rem] border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 dark:border-slate-800/60 pb-5">
            <div>
              <CardTitle className="font-extrabold text-slate-800 dark:text-slate-100">Recent Sales</CardTitle>
              <p className="text-sm font-semibold text-slate-400 mt-1">Your latest store transactions</p>
            </div>
            <Link href="/dashboard/sales">
              <Button variant="outline" size="sm" className="rounded-xl font-bold bg-white dark:bg-slate-800 hidden sm:flex">View POS</Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-slate-800/20">
                <TableRow className="border-b-gray-100 dark:border-slate-800/60">
                  <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-[10px] pl-6">Product</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Qty</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Price</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Profit</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-[10px] pr-6">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats?.recentSales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <ShoppingCart className="w-10 h-10 mb-3 opacity-20" />
                        <span className="font-semibold">No sales recorded yet</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  stats?.recentSales.map((sale) => (
                    <TableRow key={sale.id} className="border-b-gray-50 dark:border-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <TableCell className="font-bold text-slate-800 dark:text-slate-200 pl-6">
                        {sale.products?.name || "Unknown"}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-600 dark:text-slate-300">
                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">{sale.quantity}</span>
                      </TableCell>
                      <TableCell className="font-bold text-slate-700 dark:text-slate-300">
                        {formatCurrency(sale.total_price)}
                      </TableCell>
                      <TableCell className="font-bold text-emerald-500">
                        +{formatCurrency(sale.profit)}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-500 dark:text-slate-400 text-sm pr-6">
                        {formatDateTime(sale.created_at)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Low Stock Alerts (1 col) */}
        <Card className={`rounded-[1.5rem] border-none shadow-sm overflow-hidden ${stats?.lowStockProducts.length ? "bg-red-50/50 dark:bg-red-900/10" : "bg-white dark:bg-slate-900"}`}>
          <CardHeader className="border-b border-gray-100 dark:border-slate-800/60 pb-5">
            <CardTitle className={`font-extrabold ${stats?.lowStockProducts.length ? "text-red-600 dark:text-red-400" : "text-slate-800 dark:text-slate-100"}`}>
              Low Stock Alerts
            </CardTitle>
            <p className="text-sm font-semibold text-slate-400 mt-1">Requires immediate attention</p>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-transparent">
                <TableRow className="border-b-gray-100 dark:border-slate-800/60">
                  <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-[10px] pl-6">Item</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Stock</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-[10px] text-right pr-6">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!stats?.lowStockProducts.length ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-10">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <Package className="w-10 h-10 mb-3 opacity-20" />
                        <span className="font-semibold">Inventory is healthy</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  stats?.lowStockProducts.map((p) => (
                    <TableRow key={p.id} className="border-b-gray-50/50 dark:border-slate-800/20">
                      <TableCell className="font-bold text-slate-800 dark:text-slate-200 pl-6">{p.name}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg font-black text-xs animate-pulse">
                          {p.stock} units
                        </span>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Link href="/dashboard/inventory">
                          <Button size="sm" variant="ghost" className="h-8 text-[11px] font-black uppercase text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl">Order</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
