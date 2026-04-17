"use client"

import { useEffect, useState } from "react"
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
  Filter
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency, cn } from "@/lib/utils"
import type { Repair } from "@/lib/types"

const statusConfig = {
  'Pending': { color: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400', icon: Clock },
  'In Progress': { color: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400', icon: Wrench },
  'Ready': { color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400', icon: CheckCircle2 },
  'Delivered': { color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400', icon: Smartphone },
  'Cancelled': { color: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400', icon: XCircle }
}

export default function RepairsPage() {
  const [repairs, setRepairs] = useState<Repair[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form states
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_phone: "",
    device_model: "",
    imei: "",
    issue_description: "",
    estimated_price: ""
  })

  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchRepairs()
  }, [])

  const fetchRepairs = async () => {
    try {
      const { data, error } = await supabase
        .from("repairs")
        .select("*")
        .order("created_at", { ascending: false })
      if (error) throw error
      setRepairs(data || [])
    } catch (err: any) {
      toast({ title: "Fetch Error", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleAddRepair = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const { error } = await supabase.from("repairs").insert([{
        ...formData,
        estimated_price: parseFloat(formData.estimated_price) || 0,
        status: 'Pending'
      }])
      if (error) throw error
      toast({ title: "Success!", description: "New repair ticket created." })
      setIsAddDialogOpen(false)
      setFormData({ customer_name: "", customer_phone: "", device_model: "", imei: "", issue_description: "", estimated_price: "" })
      fetchRepairs()
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const updateStatus = async (repairId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("repairs")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", repairId)
      if (error) throw error
      setRepairs(prev => prev.map(r => r.id === repairId ? { ...r, status: newStatus as any } : r))
      toast({ title: "Status Updated", description: `Ticket is now marked as ${newStatus}.` })
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" })
    }
  }

  const filteredRepairs = repairs.filter(r => {
    const matchesSearch = r.customer_name.toLowerCase().includes(search.toLowerCase()) || 
                          r.device_model.toLowerCase().includes(search.toLowerCase()) ||
                          r.imei?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || r.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Repair Tickets</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Manage device repairs and customer service</p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-500/30 gap-2">
              <Plus className="w-5 h-5" /> New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] border-none rounded-[2rem] bg-white dark:bg-slate-900 p-8 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black mb-1">Create Repair Ticket</DialogTitle>
              <p className="text-slate-500 text-sm">Enter the customer and device details below.</p>
            </DialogHeader>
            <form onSubmit={handleAddRepair} className="grid gap-6 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cname" className="text-xs font-bold uppercase tracking-wider text-slate-500">Customer Name</Label>
                  <Input id="cname" required placeholder="John Doe" className="rounded-xl border-slate-100 dark:border-slate-800 h-11" 
                    value={formData.customer_name} onChange={e => setFormData({...formData, customer_name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cphone" className="text-xs font-bold uppercase tracking-wider text-slate-500">Phone Number</Label>
                  <Input id="cphone" placeholder="06..." className="rounded-xl border-slate-100 dark:border-slate-800 h-11"
                    value={formData.customer_phone} onChange={e => setFormData({...formData, customer_phone: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="model" className="text-xs font-bold uppercase tracking-wider text-slate-500">Device Model</Label>
                  <Input id="model" required placeholder="iPhone 13 Pro" className="rounded-xl border-slate-100 dark:border-slate-800 h-11"
                    value={formData.device_model} onChange={e => setFormData({...formData, device_model: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="imei" className="text-xs font-bold uppercase tracking-wider text-slate-500">IMEI (Optional)</Label>
                  <Input id="imei" placeholder="35..." className="rounded-xl border-slate-100 dark:border-slate-800 h-11"
                    value={formData.imei} onChange={e => setFormData({...formData, imei: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="issue" className="text-xs font-bold uppercase tracking-wider text-slate-500">Problem Description</Label>
                <textarea id="issue" required className="w-full rounded-xl border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 h-24 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. Broken screen, water damage..." value={formData.issue_description} onChange={e => setFormData({...formData, issue_description: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price" className="text-xs font-bold uppercase tracking-wider text-slate-500">Estimated Price (Dh)</Label>
                <Input id="price" type="number" placeholder="400" className="rounded-xl border-slate-100 dark:border-slate-800 h-11"
                  value={formData.estimated_price} onChange={e => setFormData({...formData, estimated_price: e.target.value})} />
              </div>
              <Button type="submit" disabled={submitting} className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg mt-2">
                {submitting ? <Loader2 className="animate-spin" /> : "Save Repair Ticket"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <Input 
            placeholder="Search by customer, model or IMEI..." 
            className="pl-12 h-14 bg-white dark:bg-slate-900 border-none shadow-sm rounded-2xl font-medium focus-visible:ring-indigo-500"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-[200px] shrink-0">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-14 bg-white dark:bg-slate-900 border-none shadow-sm rounded-2xl font-bold">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <SelectValue placeholder="All Status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Store</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Ready">Ready</SelectItem>
              <SelectItem value="Delivered">Delivered</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
          <p className="text-slate-500 font-medium">Loading repair tickets...</p>
        </div>
      ) : filteredRepairs.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-20 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
            <Wrench className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">No repairs found</h3>
          <p className="text-slate-500 mt-2 max-w-sm">No tickets found for your current search or filter. Create a new one to get started.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredRepairs.map((repair) => {
            const Config = statusConfig[repair.status]
            const Icon = Config.icon
            return (
              <Card key={repair.id} className="group overflow-hidden rounded-[2rem] border-none shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 bg-white dark:bg-slate-900">
                <CardContent className="p-7">
                  <div className="flex justify-between items-start mb-6">
                    <div className={cn("px-4 py-1.5 rounded-full flex items-center gap-2 text-xs font-black uppercase tracking-wider", Config.color)}>
                      <Icon className="w-3.5 h-3.5" /> {repair.status}
                    </div>
                    <Select onValueChange={(val) => updateStatus(repair.id, val)} value={repair.status}>
                      <SelectTrigger className="w-8 h-8 p-0 border-none bg-transparent focus:ring-0">
                        <MoreVertical className="w-5 h-5 text-slate-400" />
                      </SelectTrigger>
                      <SelectContent align="end">
                        <SelectItem value="Pending">Set Pending</SelectItem>
                        <SelectItem value="In Progress">Set In Progress</SelectItem>
                        <SelectItem value="Ready">Set Ready</SelectItem>
                        <SelectItem value="Delivered">Set Delivered</SelectItem>
                        <SelectItem value="Cancelled">Set Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                        <User className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-slate-800 dark:text-white truncate">{repair.customer_name}</h4>
                        <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5" /> {repair.customer_phone || "No phone"}
                        </p>
                      </div>
                    </div>

                    <div className="w-full h-px bg-slate-50 dark:bg-slate-800/60 my-2" />

                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-500 shrink-0">
                        <Smartphone className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-700 dark:text-slate-300 truncate">{repair.device_model}</h4>
                        <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                          {repair.imei ? `IMEI: ${repair.imei}` : "No IMEI provided"}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl mt-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                        <Wrench className="w-3 h-3" /> Issue
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 font-medium line-clamp-2">
                        {repair.issue_description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Est. Price</span>
                        <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(repair.estimated_price)}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Received</span>
                        <span className="text-xs font-bold text-slate-500">
                          {new Date(repair.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
