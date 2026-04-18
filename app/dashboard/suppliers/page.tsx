"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase-client"
import { useToast } from "@/hooks/use-toast"
import {
  Truck,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Pencil,
  Trash2,
  RefreshCw,
  User,
  FileText,
  X,
  Package
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { Supplier } from "@/lib/types"

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "", contact_name: "", phone: "", email: "", address: "", notes: ""
  })
  const supabase = createClient()
  const { toast } = useToast()

  const fetchSuppliers = useCallback(async () => {
    try {
      const { data } = await supabase.from("suppliers").select("*").order("name")
      setSuppliers(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => { fetchSuppliers() }, [fetchSuppliers])

  const resetForm = () => {
    setFormData({ name: "", contact_name: "", phone: "", email: "", address: "", notes: "" })
    setEditingSupplier(null)
  }

  const openEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setFormData({
      name: supplier.name,
      contact_name: supplier.contact_name || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
      notes: supplier.notes || ""
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editingSupplier) {
        const { error } = await supabase.from("suppliers").update(formData).eq("id", editingSupplier.id)
        if (error) throw error
        toast({ title: "Fournisseur mis à jour ✅" })
      } else {
        const { error } = await supabase.from("suppliers").insert(formData)
        if (error) throw error
        toast({ title: "Fournisseur ajouté ✅" })
      }
      setIsDialogOpen(false)
      resetForm()
      fetchSuppliers()
    } catch {
      toast({ title: "Erreur", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce fournisseur ?")) return
    const { error } = await supabase.from("suppliers").delete().eq("id", id)
    if (error) {
      toast({ title: "Erreur lors de la suppression", variant: "destructive" })
    } else {
      toast({ title: "Fournisseur supprimé" })
      fetchSuppliers()
    }
  }

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.contact_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.phone || "").includes(search)
  )

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
    </div>
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Truck className="w-9 h-9 text-indigo-500" /> Fournisseurs
          </h1>
          <p className="text-slate-500 font-medium mt-1 uppercase tracking-widest text-[10px]">
            Gestion des fournisseurs et partenaires
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm() }}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-500/30 gap-2">
              <Plus className="w-5 h-5" /> Ajouter Fournisseur
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[560px] border-none rounded-[2rem] bg-white dark:bg-slate-900 p-8 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black mb-1">
                {editingSupplier ? "Modifier le Fournisseur" : "Nouveau Fournisseur"}
              </DialogTitle>
              <p className="text-slate-500 text-sm">Renseignez les coordonnées du fournisseur.</p>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Nom de la société *</Label>
                <Input required placeholder="Ex: Samsung Maroc" className="rounded-xl h-11"
                  value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Contact</Label>
                  <Input placeholder="Nom du contact" className="rounded-xl h-11"
                    value={formData.contact_name} onChange={e => setFormData({ ...formData, contact_name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Téléphone</Label>
                  <Input placeholder="06..." className="rounded-xl h-11"
                    value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Email</Label>
                <Input type="email" placeholder="contact@fournisseur.ma" className="rounded-xl h-11"
                  value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Adresse</Label>
                <Input placeholder="Adresse complète" className="rounded-xl h-11"
                  value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Notes</Label>
                <textarea
                  placeholder="Délais de livraison, conditions, remarques..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-sm h-20 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => { setIsDialogOpen(false); resetForm() }}>
                  <X className="w-4 h-4 mr-2" /> Annuler
                </Button>
                <Button type="submit" disabled={submitting} className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                  {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : editingSupplier ? "Mettre à jour" : "Ajouter"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-[1.5rem] border-none shadow-sm bg-indigo-600 text-white">
          <CardContent className="p-6">
            <p className="text-xs font-black uppercase tracking-widest opacity-70 mb-1">Total Fournisseurs</p>
            <p className="text-4xl font-black">{suppliers.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-[1.5rem] border-none shadow-sm bg-white dark:bg-slate-900">
          <CardContent className="p-6">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Avec Email</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{suppliers.filter(s => s.email).length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-[1.5rem] border-none shadow-sm bg-white dark:bg-slate-900">
          <CardContent className="p-6">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Avec Téléphone</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{suppliers.filter(s => s.phone).length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <Input
          placeholder="Rechercher un fournisseur..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="pl-14 h-14 bg-white dark:bg-slate-900 rounded-[1.5rem] border-none shadow-sm text-base font-semibold"
        />
      </div>

      {/* Suppliers Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-20 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
            <Truck className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">Aucun fournisseur</h3>
          <p className="text-slate-500 mt-2 max-w-sm">Ajoutez votre premier fournisseur pour commencer.</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((supplier) => (
            <Card key={supplier.id} className="group overflow-hidden rounded-[2rem] border-none shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 bg-white dark:bg-slate-900">
              <CardContent className="p-7">
                {/* Header */}
                <div className="flex justify-between items-start mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center shrink-0">
                      <Truck className="w-6 h-6 text-indigo-500" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-lg leading-tight">{supplier.name}</h3>
                      {supplier.contact_name && (
                        <p className="text-xs text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
                          <User className="w-3 h-3" /> {supplier.contact_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(supplier)}
                      className="w-8 h-8 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(supplier.id)}
                      className="w-8 h-8 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-2.5">
                  {supplier.phone && (
                    <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400">
                      <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                      <a href={`tel:${supplier.phone}`} className="hover:text-emerald-600">{supplier.phone}</a>
                    </div>
                  )}
                  {supplier.email && (
                    <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400">
                      <Mail className="w-4 h-4 text-blue-500 shrink-0" />
                      <a href={`mailto:${supplier.email}`} className="hover:text-blue-600 truncate">{supplier.email}</a>
                    </div>
                  )}
                  {supplier.address && (
                    <div className="flex items-start gap-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400">
                      <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{supplier.address}</span>
                    </div>
                  )}
                  {supplier.notes && (
                    <div className="flex items-start gap-2.5 text-sm text-slate-500 dark:text-slate-500">
                      <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2 italic">{supplier.notes}</span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="mt-5 pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center gap-2">
                  <Package className="w-4 h-4 text-slate-400" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Depuis le {new Date(supplier.created_at).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
