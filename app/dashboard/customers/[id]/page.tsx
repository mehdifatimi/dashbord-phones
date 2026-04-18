"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, User, Phone, Mail, MapPin, ShoppingBag, Wrench, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createClient } from "@/lib/supabase-client"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import type { Customer, Sale, Repair } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function CustomerProfilePage() {
  const { id } = useParams()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [sales, setSales] = useState<Sale[]>([])
  const [repairs, setRepairs] = useState<Repair[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        // 1. Fetch Customer Info
        const { data: customerData, error: customerErr } = await supabase
          .from("customers")
          .select("*")
          .eq("id", id as string)
          .single()
        if (customerErr) throw customerErr
        setCustomer(customerData)

        // 2. Fetch Sales
        const { data: salesData } = await supabase
          .from("sales")
          .select("*, products(name)")
          .eq("customer_id", id as string)
          .order("created_at", { ascending: false })
        setSales(salesData || [])

        // 3. Fetch Repairs
        const { data: repairsData } = await supabase
          .from("repairs")
          .select("*")
          .eq("customer_id", id as string)
          .order("created_at", { ascending: false })
        setRepairs(repairsData || [])

      } catch (error: any) {
        toast({
          title: "Erreur",
          description: "Impossible de charger les données du client.",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchCustomerData()
    }
  }, [id])

  if (loading) {
    return <div className="text-center py-10 animate-pulse text-indigo-500 font-bold">Chargement du profil client...</div>
  }

  if (!customer) {
    return <div className="text-center text-red-500 font-bold py-10">Client introuvable.</div>
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/customers">
          <Button variant="ghost" size="icon" className="rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700">
            <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Profil Client</h1>
          <p className="text-slate-500 font-medium mt-1">Historique complet de {customer.full_name}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Contact Info */}
        <Card className="rounded-[1.5rem] border-none shadow-sm bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-500" /> Informations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Nom Complet</p>
                <p className="font-bold text-slate-800 dark:text-slate-200">{customer.full_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Téléphone</p>
                <p className="font-bold text-slate-800 dark:text-slate-200">{customer.phone}</p>
              </div>
            </div>
            {customer.email && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Email</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{customer.email}</p>
                </div>
              </div>
            )}
            {customer.address && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Adresse</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{customer.address}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/60 mt-4">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Client depuis</p>
                <p className="font-bold text-slate-800 dark:text-slate-200">{new Date(customer.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* History Tables */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-[1.5rem] border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="border-b border-gray-100 dark:border-slate-800/60 pb-4">
              <CardTitle className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-indigo-500" /> Historique d'Achats ({sales.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50 dark:bg-slate-800/20">
                  <TableRow className="border-b-gray-100 dark:border-slate-800/60">
                    <TableHead className="font-bold text-slate-500 pl-6">Produit</TableHead>
                    <TableHead className="font-bold text-slate-500 text-right">Montant</TableHead>
                    <TableHead className="font-bold text-slate-500 text-right pr-6">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-6 text-slate-500">Aucun achat enregistré.</TableCell>
                    </TableRow>
                  ) : (
                    sales.map((sale) => (
                      <TableRow key={sale.id} className="border-b-gray-50/50 dark:border-slate-800/40">
                        <TableCell className="pl-6 font-bold text-slate-800 dark:text-slate-200">
                          {sale.products?.name} <span className="text-slate-400 text-xs">x{sale.quantity}</span>
                        </TableCell>
                        <TableCell className="text-right font-bold text-indigo-600 dark:text-indigo-400">
                          {formatCurrency(sale.total_price)}
                        </TableCell>
                        <TableCell className="text-right pr-6 text-xs font-semibold text-slate-500">
                          {formatDateTime(sale.created_at)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="rounded-[1.5rem] border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="border-b border-gray-100 dark:border-slate-800/60 pb-4">
              <CardTitle className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-500" /> Historique des Réparations ({repairs.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50 dark:bg-slate-800/20">
                  <TableRow className="border-b-gray-100 dark:border-slate-800/60">
                    <TableHead className="font-bold text-slate-500 pl-6">Appareil</TableHead>
                    <TableHead className="font-bold text-slate-500">Problème</TableHead>
                    <TableHead className="font-bold text-slate-500 text-center">Status</TableHead>
                    <TableHead className="font-bold text-slate-500 text-right pr-6">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {repairs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-slate-500">Aucune réparation enregistrée.</TableCell>
                    </TableRow>
                  ) : (
                    repairs.map((repair) => (
                      <TableRow key={repair.id} className="border-b-gray-50/50 dark:border-slate-800/40">
                        <TableCell className="pl-6 font-bold text-slate-800 dark:text-slate-200">
                          {repair.device_model}
                        </TableCell>
                        <TableCell className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          {repair.issue_description.substring(0, 30)}{repair.issue_description.length > 30 ? '...' : ''}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`px-2 py-1 text-xs font-bold rounded-lg ${
                            repair.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' :
                            repair.status === 'Ready' ? 'bg-blue-100 text-blue-700' :
                            repair.status === 'In Progress' ? 'bg-indigo-100 text-indigo-700' :
                            repair.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {repair.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right pr-6 text-xs font-semibold text-slate-500">
                          {new Date(repair.created_at).toLocaleDateString()}
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
    </div>
  )
}
