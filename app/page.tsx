import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Smartphone, LineChart, BellRing } from "lucide-react"

export default function HomePage() {
  return (
    <div className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-slate-950 text-slate-50 selection:bg-indigo-500/30">
      {/* Dynamic Background Elements */}
      <div className="pointer-events-none absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
      <div className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob"></div>
      <div className="pointer-events-none absolute top-40 -right-40 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob" style={{ animationDelay: '2s' }}></div>
      <div className="pointer-events-none absolute -bottom-40 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob" style={{ animationDelay: '4s' }}></div>

      <div className="relative z-10 container mx-auto px-6 py-24 flex flex-col items-center justify-center text-center">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/50 border border-slate-800 backdrop-blur-md mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          <span className="text-sm font-medium text-slate-300">Next-Gen Shop Management</span>
        </div>

        {/* Hero Title */}
        <h1 className="max-w-4xl text-5xl md:text-7xl font-extrabold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-br from-slate-100 via-indigo-100 to-indigo-400 animate-in fade-in slide-in-from-bottom-6 duration-1000 fill-mode-both" style={{ animationDelay: '150ms' }}>
          Elevate Your Phone Business
        </h1>
        
        <p className="max-w-2xl text-lg md:text-xl text-slate-400 mb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both leading-relaxed" style={{ animationDelay: '300ms' }}>
          Manage your inventory, track sales metrics, and grow your operations with our meticulously crafted dashboard solution designed for modern retailers.
        </p>
        
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-24 animate-in fade-in slide-in-from-bottom-10 duration-1000 fill-mode-both" style={{ animationDelay: '500ms' }}>
          <Link href="/login">
            <Button size="lg" className="h-14 px-8 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-lg transition-all duration-300 shadow-[0_0_40px_-10px_rgba(79,70,229,0.5)] hover:shadow-[0_0_60px_-15px_rgba(79,70,229,0.7)] group">
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="h-14 px-8 rounded-full border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-200 font-semibold text-lg backdrop-blur-md transition-all duration-300">
              Sign In
            </Button>
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid md:grid-cols-3 gap-8 w-full max-w-6xl animate-in fade-in slide-in-from-bottom-12 duration-1000 fill-mode-both text-left" style={{ animationDelay: '700ms' }}>
          
          <Card className="group relative overflow-hidden bg-slate-900/40 border-slate-800/60 backdrop-blur-xl hover:bg-slate-800/60 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_0_30px_-10px_rgba(79,70,229,0.3)]">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader>
              <div className="h-12 w-12 rounded-xl bg-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400 group-hover:scale-110 group-hover:text-indigo-300 transition-all duration-500">
                <Smartphone className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl font-bold text-slate-200">Inventory Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 leading-relaxed pointer-events-none">
                Effortlessly track products, manage stock levels, and organize by categories with real-time sync across all your devices.
              </p>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden bg-slate-900/40 border-slate-800/60 backdrop-blur-xl hover:bg-slate-800/60 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_0_30px_-10px_rgba(168,85,247,0.3)]">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader>
              <div className="h-12 w-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4 text-purple-400 group-hover:scale-110 group-hover:text-purple-300 transition-all duration-500">
                <LineChart className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl font-bold text-slate-200">Sales Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 leading-relaxed pointer-events-none">
                Monitor performance, track profits, and view real-time data through intuitive, beautifully designed graphs and charts.
              </p>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden bg-slate-900/40 border-slate-800/60 backdrop-blur-xl hover:bg-slate-800/60 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_0_30px_-10px_rgba(236,72,153,0.3)]">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader>
              <div className="h-12 w-12 rounded-xl bg-pink-500/20 flex items-center justify-center mb-4 text-pink-400 group-hover:scale-110 group-hover:text-pink-300 transition-all duration-500">
                <BellRing className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl font-bold text-slate-200">Smart Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 leading-relaxed pointer-events-none">
                Stay updated instantly with intelligent alerts when inventory runs low or major sales occur in your store.
              </p>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
