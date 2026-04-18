"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase-client"
import { use } from "react"
import { 
  Clock, 
  Wrench, 
  CheckCircle2, 
  Smartphone, 
  XCircle, 
  Phone,
  User,
  RefreshCw,
  AlertTriangle
} from "lucide-react"

type RepairPublic = {
  id: string
  customer_name: string
  customer_phone: string
  device_model: string
  imei?: string
  issue_description: string
  estimated_price: number
  status: string
  created_at: string
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType; desc: string }> = {
  'Pending': { 
    label: 'En attente', 
    color: 'text-amber-600', 
    bg: 'bg-amber-50 border-amber-200',
    icon: Clock,
    desc: 'Votre appareil a bien été reçu. Nous allons commencer le diagnostic très prochainement.'
  },
  'In Progress': { 
    label: 'En cours de réparation', 
    color: 'text-blue-600', 
    bg: 'bg-blue-50 border-blue-200',
    icon: Wrench,
    desc: 'Bonne nouvelle ! Nos techniciens travaillent actuellement sur votre appareil.'
  },
  'Ready': { 
    label: 'Prêt à récupérer', 
    color: 'text-emerald-600', 
    bg: 'bg-emerald-50 border-emerald-200',
    icon: CheckCircle2,
    desc: '✅ Votre appareil est réparé et prêt à être récupéré en boutique !'
  },
  'Delivered': { 
    label: 'Livré', 
    color: 'text-indigo-600', 
    bg: 'bg-indigo-50 border-indigo-200',
    icon: Smartphone,
    desc: 'Appareil récupéré. Merci pour votre confiance !'
  },
  'Cancelled': { 
    label: 'Annulé', 
    color: 'text-red-600', 
    bg: 'bg-red-50 border-red-200',
    icon: XCircle,
    desc: 'Cette réparation a été annulée. Contactez-nous pour plus d\'informations.'
  },
}

const steps = ['Pending', 'In Progress', 'Ready', 'Delivered']

export default function RepairTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [repair, setRepair] = useState<RepairPublic | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchRepair = async () => {
      try {
        const { data, error } = await supabase
          .from("repairs")
          .select("id, customer_name, customer_phone, device_model, imei, issue_description, estimated_price, status, created_at")
          .eq("id", id)
          .single()

        if (error || !data) {
          setError(true)
        } else {
          setRepair(data)
        }
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchRepair()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-10 h-10 animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-slate-400 font-semibold">Chargement du ticket...</p>
        </div>
      </div>
    )
  }

  if (error || !repair) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 mb-2">Ticket introuvable</h1>
          <p className="text-slate-500">Ce ticket de réparation n&apos;existe pas ou le lien est invalide.</p>
        </div>
      </div>
    )
  }

  const config = statusConfig[repair.status] || statusConfig['Pending']
  const Icon = config.icon
  const currentStepIndex = steps.indexOf(repair.status)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-4 pb-12">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="text-center pt-8 pb-6">
          <div className="inline-flex items-center gap-2 bg-white border border-indigo-100 rounded-full px-4 py-1.5 shadow-sm mb-4">
            <Smartphone className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">Suivi de Réparation</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-1">Mon Ticket</h1>
          <p className="text-slate-400 text-sm font-mono">REP-{repair.id.slice(0, 8).toUpperCase()}</p>
        </div>

        {/* Status Card */}
        <div className={`rounded-3xl border-2 p-6 mb-6 ${config.bg}`}>
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-sm shrink-0`}>
              <Icon className={`w-8 h-8 ${config.color}`} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Statut Actuel</p>
              <h2 className={`text-2xl font-black ${config.color}`}>{config.label}</h2>
            </div>
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-600 leading-relaxed">{config.desc}</p>
        </div>

        {/* Progress Steps */}
        {repair.status !== 'Cancelled' && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 mb-6">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-5">Progression</p>
            <div className="relative">
              {/* Line */}
              <div className="absolute top-5 left-5 right-5 h-0.5 bg-slate-100">
                <div 
                  className="h-full bg-indigo-500 transition-all duration-700 rounded-full"
                  style={{ width: `${currentStepIndex < 0 ? 0 : (currentStepIndex / (steps.length - 1)) * 100}%` }}
                />
              </div>
              <div className="relative flex justify-between">
                {steps.map((step, idx) => {
                  const StepIcon = statusConfig[step].icon
                  const done = currentStepIndex >= idx
                  const active = currentStepIndex === idx
                  return (
                    <div key={step} className="flex flex-col items-center gap-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                        done 
                          ? active 
                            ? 'bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-500/30'
                            : 'bg-indigo-400 border-indigo-400'
                          : 'bg-white border-slate-200'
                      }`}>
                        <StepIcon className={`w-4 h-4 ${done ? 'text-white' : 'text-slate-300'}`} />
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-wider text-center leading-tight max-w-[50px] ${
                        active ? 'text-indigo-600' : done ? 'text-slate-500' : 'text-slate-300'
                      }`}>
                        {statusConfig[step].label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Repair Details */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 mb-6 space-y-5">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Détails de la Réparation</p>

          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Client</p>
              <p className="font-bold text-slate-800">{repair.customer_name}</p>
            </div>
          </div>

          {repair.customer_phone && (
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Téléphone</p>
                <a href={`tel:${repair.customer_phone}`} className="font-bold text-emerald-600">{repair.customer_phone}</a>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-slate-500" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Appareil</p>
              <p className="font-bold text-slate-800">{repair.device_model}</p>
              {repair.imei && <p className="text-xs text-slate-400 font-mono">IMEI: {repair.imei}</p>}
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Wrench className="w-3 h-3" /> Problème signalé
            </p>
            <p className="text-sm font-semibold text-slate-700 leading-relaxed">{repair.issue_description}</p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-50">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Prix Estimé</p>
              <p className="text-2xl font-black text-indigo-600">{repair.estimated_price} Dh</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Déposé le</p>
              <p className="font-semibold text-slate-600 text-sm">{new Date(repair.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 font-semibold">Merci pour votre confiance 🙏</p>
      </div>
    </div>
  )
}
