"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase-client"
import { useToast } from "@/hooks/use-toast"
import { 
  Wrench, 
  Search, 
  Plus, 
  Loader2, 
  User, 
  Phone, 
  Smartphone, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  CreditCard,
  MoreVertical,
  Filter,
  Box,
  Printer,
  MessageCircle,
  Download
} from "lucide-react"
import { exportCSV, exportPrintPDF } from "@/lib/export"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { QRCodeSVG } from "qrcode.react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency, cn } from "@/lib/utils"
import type { Repair } from "@/lib/types"

const statusConfig = {
  'Pending': { color: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400', icon: Clock },
  'In Progress': { color: 'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400', icon: Wrench },
  'Ready': { color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400', icon: CheckCircle2 },
  'Delivered': { color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400', icon: Smartphone },
  'Cancelled': { color: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400', icon: XCircle }
}

// WhatsApp helper
const buildWhatsAppMessage = (repair: Repair): string => {
  const shopName = "Phone Shop"
  const name = repair.customer_name
  const device = repair.device_model
  const ref = `REP-${repair.id.slice(0, 8).toUpperCase()}`
  const price = `${repair.estimated_price} Dh`

  const messages: Record<string, string> = {
    Ready:
      `✅ Bonjour ${name},\n\nVotre appareil *${device}* est prêt à être récupéré !\n\n` +
      `🔖 Référence : *${ref}*\n💰 Montant à régler : *${price}*\n\n` +
      `Vous pouvez passer à notre boutique dès maintenant.\n\nMerci de votre confiance — *${shopName}* 📱`,
    "In Progress":
      `🔧 Bonjour ${name},\n\nVotre appareil *${device}* est actuellement en cours de réparation.\n\n` +
      `🔖 Référence : *${ref}*\n\nNous vous contacterons dès qu'il sera prêt.\n\nMerci — *${shopName}* 📱`,
    Pending:
      `⏳ Bonjour ${name},\n\nVotre appareil *${device}* a bien été réceptionné et est en attente de diagnostic.\n\n` +
      `🔖 Référence : *${ref}*\n\nNous vous tiendrons informé de l'avancement.\n\nMerci — *${shopName}* 📱`,
    Delivered:
      `🎉 Bonjour ${name},\n\nMerci d'avoir récupéré votre appareil *${device}*.\n\n` +
      `Nous espérons que vous êtes satisfait(e). N'hésitez pas à nous contacter pour tout problème.\n\n*${shopName}* 📱`,
    Cancelled:
      `ℹ️ Bonjour ${name},\n\nConcernant votre appareil *${device}* (réf. *${ref}*),\n\n` +
      `La réparation a été annulée. Veuillez nous contacter pour plus d'informations.\n\n*${shopName}* 📱`,
  }
  return messages[repair.status] ?? messages["Pending"]
}

const openWhatsApp = (repair: Repair) => {
  const rawPhone = repair.customer_phone.replace(/\D/g, "")
  const phone = rawPhone.startsWith("0") ? `212${rawPhone.slice(1)}` : rawPhone
  const message = encodeURIComponent(buildWhatsAppMessage(repair))
  window.open(`https://wa.me/${phone}?text=${message}`, "_blank", "noopener,noreferrer")
}

export default function RepairsPage() {
  const [repairs, setRepairs] = useState<Repair[]>([])
  const [customers, setCustomers] = useState<{ id: string; full_name: string; phone: string }[]>([])
  const [products, setProducts] = useState<{ id: string; name: string; stock: number; sale_price: number; image_url?: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [stockSearch, setStockSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [ticketToPrint, setTicketToPrint] = useState<Repair | null>(null)

  const { toast } = useToast()
  const supabase = createClient()

  const fetchRepairs = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("repairs").select("*").order("created_at", { ascending: false })
      if (error) throw error
      setRepairs(data || [])
    } catch (err: any) {
      toast({ title: "Fetch Error", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [supabase, toast])

  const fetchCustomers = useCallback(async () => {
    try {
      const { data } = await supabase.from("customers").select("id, full_name, phone").order("full_name")
      setCustomers(data || [])
    } catch (err) { console.error(err) }
  }, [supabase])

  const fetchProducts = useCallback(async () => {
    try {
      const { data } = await supabase.from("products").select("id, name, stock, sale_price, image_url").gt("stock", 0).order("name")
      setProducts(data || [])
    } catch (err) { console.error(err) }
  }, [supabase])

  useEffect(() => {
    fetchRepairs(); fetchCustomers(); fetchProducts()
  }, [fetchRepairs, fetchCustomers, fetchProducts])

  useEffect(() => {
    if (ticketToPrint) {
      const timer = setTimeout(() => { window.print(); setTicketToPrint(null) }, 500)
      return () => clearTimeout(timer)
    }
  }, [ticketToPrint])

  const [formData, setFormData] = useState({
    customer_id: "", customer_name: "", customer_phone: "", device_model: "", imei: "", issue_description: "", estimated_price: "", used_product_id: ""
  })

  const handleAddRepair = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const { error } = await supabase.from("repairs").insert([{
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        device_model: formData.device_model,
        imei: formData.imei,
        issue_description: formData.issue_description,
        customer_id: formData.customer_id || null,
        used_product_id: formData.used_product_id || null,
        estimated_price: parseFloat(formData.estimated_price) || 0,
        status: 'Pending'
      }])
      if (error) throw error
      toast({ title: "Success!", description: "New repair ticket created." })
      setIsAddDialogOpen(false)
      setFormData({ customer_id: "", customer_name: "", customer_phone: "", device_model: "", imei: "", issue_description: "", estimated_price: "", used_product_id: "" })
      fetchRepairs()
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const updateStatus = async (repair: Repair, newStatus: string) => {
    try {
      if (newStatus === 'Delivered' && repair.used_product_id && !repair.is_billed) {
        const { data: prodData } = await supabase.from("products").select("stock").eq("id", repair.used_product_id).single()
        if (prodData && prodData.stock > 0) {
          await supabase.from("products").update({ stock: prodData.stock - 1 }).eq("id", repair.used_product_id)
          await supabase.from("repairs").update({ status: newStatus, is_billed: true, updated_at: new Date().toISOString() }).eq("id", repair.id)
          toast({ title: "Stock Déduit", description: "L'article a été déduit du stock." })
        } else {
          toast({ title: "Erreur Stock", description: "Plus en stock.", variant: "destructive" })
          return
        }
      } else {
        await supabase.from("repairs").update({ status: newStatus, updated_at: new Date().toISOString() }).eq("id", repair.id)
      }
      setRepairs(prev => prev.map(r => r.id === repair.id ? { ...r, status: newStatus as any, is_billed: newStatus === 'Delivered' ? true : r.is_billed } : r))
      toast({ title: "Status Updated", description: `Marked as ${newStatus}.` })
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" })
    }
  }

  const filteredRepairs = repairs.filter(r => {
    const s = search.toLowerCase()
    return (r.customer_name.toLowerCase().includes(s) || r.device_model.toLowerCase().includes(s) || r.imei?.toLowerCase().includes(s)) && (statusFilter === "all" || r.status === statusFilter)
  })

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Repair Tickets</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Manage device repairs and customer service</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline" size="sm"
            className="h-12 rounded-xl font-bold gap-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 dark:hover:bg-emerald-500/10 transition-colors"
            onClick={() => exportCSV(filteredRepairs, [
              { label: "Référence", value: (r) => `REP-${r.id.slice(0, 8).toUpperCase()}` },
              { label: "Client", value: (r) => r.customer_name },
              { label: "Téléphone", value: (r) => r.customer_phone },
              { label: "Appareil", value: (r) => r.device_model },
              { label: "Statut", value: (r) => r.status },
              { label: "Date", value: (r) => new Date(r.created_at).toLocaleDateString("fr-FR") },
            ], "tickets_reparation")}
          >
            <Download className="w-4 h-4" /> CSV
          </Button>
          <Button
            variant="outline" size="sm"
            className="h-12 rounded-xl font-bold gap-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 dark:hover:bg-indigo-500/10 transition-colors"
            onClick={() => exportPrintPDF("repairs-list-print", "Liste des Réparations")}
          >
            <Printer className="w-4 h-4" /> PDF
          </Button>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-2xl h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-500/30 gap-2">
                <Plus className="w-5 h-5" /> New Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] border-none rounded-[2rem] bg-white dark:bg-slate-900 p-8 shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black mb-1">Create Repair Ticket</DialogTitle>
                <p className="text-slate-500 text-sm">Enter the customer and device details below.</p>
              </DialogHeader>
              <form onSubmit={handleAddRepair} className="grid gap-6 mt-4">
                <div className="space-y-4">
                  <div className="space-y-2 mb-2 p-3 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                    <Label className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">📝 Associer à un Client existant</Label>
                    <Select value={formData.customer_id} onValueChange={(val) => {
                      const c = customers.find(x => x.id === val)
                      if (c) setFormData({...formData, customer_id: val, customer_name: c.full_name, customer_phone: c.phone})
                      else setFormData({...formData, customer_id: ""})
                    }}>
                      <SelectTrigger className="w-full rounded-xl bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-800">
                        <SelectValue placeholder="Sélectionner un client..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Nouveau Client --</SelectItem>
                        {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name} ({c.phone})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input placeholder="Nom du Client" required value={formData.customer_name} onChange={e => setFormData({...formData, customer_name: e.target.value})} className="rounded-xl" />
                    <Input placeholder="Téléphone" required value={formData.customer_phone} onChange={e => setFormData({...formData, customer_phone: e.target.value})} className="rounded-xl" />
                  </div>
                  <div className="space-y-2 mb-2 p-4 bg-emerald-50/50 dark:bg-emerald-500/5 rounded-2xl border border-emerald-100 dark:border-emerald-800/50">
                    <Label className="text-[11px] font-black uppercase text-emerald-600">📦 Pièce utilisée du stock</Label>
                    <Select value={formData.used_product_id} onValueChange={(val) => setFormData({...formData, used_product_id: val === "none" ? "" : val})}>
                      <SelectTrigger className="w-full h-12 rounded-[14px]">
                        <SelectValue placeholder="Sélectionner une pièce..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        <SelectItem value="none">-- Aucune pièce --</SelectItem>
                        {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.stock} dispos)</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input placeholder="Modèle Appareil" required value={formData.device_model} onChange={e => setFormData({...formData, device_model: e.target.value})} className="rounded-xl" />
                    <Input placeholder="IMEI (Optionnel)" value={formData.imei} onChange={e => setFormData({...formData, imei: e.target.value})} className="rounded-xl" />
                  </div>
                  <textarea required placeholder="Description du problème" value={formData.issue_description} onChange={e => setFormData({...formData, issue_description: e.target.value})} className="w-full rounded-xl border-slate-100 dark:border-slate-800 p-3 h-24 text-sm" />
                  <Input type="number" placeholder="Prix Estimé (Dh)" value={formData.estimated_price} onChange={e => setFormData({...formData, estimated_price: e.target.value})} className="rounded-xl" />
                </div>
                <Button type="submit" disabled={submitting} className="w-full h-14 rounded-2xl bg-indigo-600">
                  {submitting ? <Loader2 className="animate-spin" /> : "Créer le Ticket"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input placeholder="Rechercher..." className="pl-12 h-14 bg-white dark:bg-slate-900 rounded-2xl" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-14 w-[200px] bg-white dark:bg-slate-900 rounded-2xl font-bold">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Ready">Ready</SelectItem>
            <SelectItem value="Delivered">Delivered</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center p-20"><Loader2 className="animate-spin h-10 w-10 mx-auto" /><p>Chargement...</p></div>
      ) : filteredRepairs.length === 0 ? (
        <div className="text-center p-20 bg-white dark:bg-slate-900 rounded-[2rem]">Aucun ticket trouvé.</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3" id="repairs-list-print">
          {filteredRepairs.map((repair) => {
            const Config = statusConfig[repair.status] || statusConfig['Pending']
            const Icon = Config.icon
            return (
              <Card key={repair.id} className="rounded-[2rem] overflow-hidden border-none shadow-sm bg-white dark:bg-slate-900 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className={cn("px-4 py-1 rounded-full flex items-center gap-2 text-[10px] font-black uppercase", Config.color)}>
                    <Icon className="w-3 h-3" /> {repair.status}
                  </div>
                  <div className="flex gap-2">
                    {repair.customer_phone && <Button variant="ghost" size="icon" onClick={() => openWhatsApp(repair)}><MessageCircle className="w-4 h-4 text-emerald-500" /></Button>}
                    <Button variant="ghost" size="icon" onClick={() => setTicketToPrint(repair)}><Printer className="w-4 h-4 text-slate-400" /></Button>
                    <Select onValueChange={(val) => updateStatus(repair, val)} value={repair.status}>
                      <SelectTrigger className="w-8 h-8 p-0 border-none bg-transparent"><MoreVertical className="w-5 h-5 text-slate-400" /></SelectTrigger>
                      <SelectContent align="end">
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Ready">Ready</SelectItem>
                        <SelectItem value="Delivered">Delivered</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-extrabold text-slate-800 dark:text-white">{repair.customer_name}</h4>
                  <p className="text-sm text-slate-500">{repair.customer_phone}</p>
                  <div className="h-px bg-slate-50 dark:bg-slate-800 my-2" />
                  <p className="font-bold text-slate-700 dark:text-slate-300">{repair.device_model}</p>
                  <p className="text-xs text-slate-400">{repair.issue_description}</p>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-xl font-black text-indigo-600">{formatCurrency(repair.estimated_price)}</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest">{new Date(repair.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {ticketToPrint && (
        <div id="printable-ticket" className="hidden print:block p-8">
           <h2 className="text-2xl font-bold mb-4">Phone Shop - Ticket de Réparation</h2>
           <p><strong>Client:</strong> {ticketToPrint.customer_name}</p>
           <p><strong>Appareil:</strong> {ticketToPrint.device_model}</p>
           <p><strong>Problème:</strong> {ticketToPrint.issue_description}</p>
           <p><strong>Prix Estimé:</strong> {formatCurrency(ticketToPrint.estimated_price)}</p>
           <div className="mt-8 border-t pt-4 text-xs text-slate-400">Merci de votre confiance.</div>
        </div>
      )}
    </div>
  )
}
