"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  Tags,
  ShoppingCart,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  History,
  Bell,
  AlertTriangle,
  Wrench,
  Box,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase-client"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Gestion Stocks", href: "/dashboard/inventory", icon: Box },
  { name: "Produits", href: "/dashboard/products", icon: Package },
  { name: "Catégories", href: "/dashboard/categories", icon: Tags },
  { name: "Vente POS", href: "/dashboard/sales", icon: ShoppingCart },
  { name: "Réparations", href: "/dashboard/repairs", icon: Wrench },
  { name: "Historique", href: "/dashboard/history", icon: History },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showAlerts, setShowAlerts] = useState(false)
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([])
  const pathname = usePathname()
  const { signOut, user } = useAuth()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchLowStock()

    // Configuration du Realtime pour les produits
    const channel = supabase
      .channel('products-stock-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Écouter les updates, inserts et deletes
          schema: 'public',
          table: 'products'
        },
        () => {
          // Rafraîchir la liste dès qu'un changement est détecté
          fetchLowStock()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const fetchLowStock = async () => {
    const { data } = await supabase
      .from("products")
      .select("id, name, stock")
      .lt("stock", 10)
      .gt("stock", 0)
      .order("stock", { ascending: true })
    setLowStockProducts(data || [])
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/login")
  }

  const SidebarContent = () => (
    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
      {navigation.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm",
              isActive
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
            onClick={() => setSidebarOpen(false)}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {item.name}
          </Link>
        )
      })}
      <button
        onClick={handleSignOut}
        className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm w-full text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 mt-2"
      >
        <LogOut className="h-5 w-5" />
        Sign Out
      </button>
    </nav>
  )

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-slate-900 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between h-16 px-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm shadow-indigo-500/30">
                  <ShoppingCart className="w-4 h-4 text-white" />
                </div>
                <span className="text-base font-extrabold text-slate-800 dark:text-white">Phone Shop</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col shadow-sm print:hidden">
        <div className="flex flex-col flex-1 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 h-16 px-6 border-b border-slate-100 dark:border-slate-800">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/30">
              <ShoppingCart className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-slate-800 dark:text-white">Phone Shop</span>
          </div>
          <SidebarContent />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 print:pl-0">
        {/* Top navbar */}
        <div className="sticky top-0 z-40 flex items-center justify-between h-16 px-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-100 dark:border-slate-800 shadow-sm print:hidden">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-base font-extrabold text-slate-800 dark:text-white">
                {navigation.find((n) => pathname.startsWith(n.href) && (n.href !== '/dashboard' || pathname === '/dashboard'))?.name || "Dashboard"}
              </h2>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">
                {user?.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Low Stock Bell */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => setShowAlerts(!showAlerts)}
              >
                <Bell className="h-5 w-5" />
                {lowStockProducts.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem] bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center leading-none px-1 animate-pulse">
                    {lowStockProducts.length}
                  </span>
                )}
              </Button>

              {/* Alert Dropdown */}
              {showAlerts && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowAlerts(false)} />
                  <div className="absolute right-0 top-12 w-80 z-50 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                    <div className="bg-red-50 dark:bg-red-500/10 px-5 py-4 flex items-center gap-3">
                      <div className="p-2 bg-red-100 dark:bg-red-500/20 rounded-xl">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-slate-800 dark:text-white">Low Stock Alert</p>
                        <p className="text-xs text-slate-500 font-medium">{lowStockProducts.length} product(s) need restocking</p>
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                      {lowStockProducts.length === 0 ? (
                        <div className="px-5 py-6 text-center text-slate-400 text-sm font-medium">
                          All products well stocked ✅
                        </div>
                      ) : (
                        lowStockProducts.map((p) => (
                          <div key={p.id} className="flex items-center justify-between px-5 py-3">
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate mr-3">{p.name}</span>
                            <span className={cn(
                              "text-xs font-black px-2.5 py-1 rounded-full shrink-0",
                              p.stock === 0
                                ? "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400"
                                : "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400"
                            )}>
                              {p.stock === 0 ? "OUT" : `${p.stock} left`}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800">
                      <Link
                        href="/dashboard/products"
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                        onClick={() => setShowAlerts(false)}
                      >
                        View all products →
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
