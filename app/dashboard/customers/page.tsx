"use client"

import { useEffect, useState } from "react"
import { Users, Plus, Search, Mail, Phone, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase-client"
import type { Customer } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [isAddOpen, setIsAddOpen] = useState(false)
  
  // New Customer Form State
  const [newCustomer, setNewCustomer] = useState({
    full_name: "",
    phone: "",
    email: "",
    address: ""
  })

  const supabase = createClient()
  const { toast } = useToast()

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setCustomers(data || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load customers.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

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

      setCustomers([data, ...customers])
      setIsAddOpen(false)
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

  const filteredCustomers = customers.filter(c => 
    c.full_name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Clients (CRM)</h1>
          <p className="text-slate-500 font-medium mt-1">Gérez votre base de données clients et leur historique.</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20">
              <Plus className="w-5 h-5 mr-2" />
              Nouveau Client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-2xl">
            <form onSubmit={handleAddCustomer}>
              <DialogHeader>
                <DialogTitle className="font-extrabold text-xl">Ajouter un Client</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-bold text-slate-700 dark:text-slate-300">Nom Complet *</Label>
                  <Input 
                    id="name" 
                    required 
                    placeholder="Ex: Mohamed Alami"
                    value={newCustomer.full_name}
                    onChange={(e) => setNewCustomer({...newCustomer, full_name: e.target.value})}
                    className="rounded-xl border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="font-bold text-slate-700 dark:text-slate-300">Téléphone *</Label>
                  <Input 
                    id="phone" 
                    required 
                    placeholder="Ex: 06 12 34 56 78"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                    className="rounded-xl border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-bold text-slate-700 dark:text-slate-300">Email (Optionnel)</Label>
                  <Input 
                    id="email" 
                    type="email"
                    placeholder="email@exemple.com"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                    className="rounded-xl border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="font-bold text-slate-700 dark:text-slate-300">Adresse (Optionnelle)</Label>
                  <Input 
                    id="address" 
                    placeholder="Quartier, Ville"
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                    className="rounded-xl border-slate-200"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700">Enregistrer</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="rounded-[1.5rem] border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
        <CardHeader className="border-b border-gray-100 dark:border-slate-800/60 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" /> Liste des Clients
            </CardTitle>
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher par nom ou téléphone..."
                className="pl-10 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-none focus-visible:ring-1"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-slate-800/20">
              <TableRow className="border-b-gray-100 dark:border-slate-800/60">
                <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-[10px] pl-6">Client</TableHead>
                <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Contact</TableHead>
                <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-[10px] text-right pr-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-slate-500">Chargement...</TableCell>
                </TableRow>
              ) : filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center font-medium text-slate-500">Aucun client trouvé.</TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow key={customer.id} className="border-b-gray-50/50 dark:border-slate-800/20 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <TableCell className="pl-6">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{customer.full_name}</div>
                      {customer.address && (
                        <div className="flex items-center text-xs text-slate-400 mt-1">
                          <MapPin className="w-3 h-3 mr-1" /> {customer.address}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center text-sm font-semibold text-slate-600 dark:text-slate-300">
                          <Phone className="w-3.5 h-3.5 mr-2 text-indigo-400" /> {customer.phone}
                        </div>
                        {customer.email && (
                          <div className="flex items-center text-xs text-slate-400">
                            <Mail className="w-3.5 h-3.5 mr-2" /> {customer.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Link href={`/dashboard/customers/${customer.id}`}>
                        <Button variant="ghost" size="sm" className="font-bold text-indigo-600 dark:text-indigo-400">
                          Profil
                        </Button>
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
  )
}
