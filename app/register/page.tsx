"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase-client"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, UserPlus, Loader2 } from "lucide-react"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        toast({
          title: "Registration Failed",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Welcome Aboard!",
          description: "Account created successfully! Please check your email to verify.",
        })
        router.push("/login")
      }
    } catch (error) {
      toast({
        title: "System Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950 p-4 selection:bg-indigo-500/30">
      {/* Background blobs matching homepage */}
      <div className="pointer-events-none absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
      <div className="pointer-events-none absolute top-1/4 -left-20 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-30 animate-blob"></div>
      <div className="pointer-events-none absolute top-1/3 -right-20 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-30 animate-blob" style={{ animationDelay: '2s' }}></div>
      <div className="pointer-events-none absolute -bottom-32 left-1/2 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-30 animate-blob" style={{ animationDelay: '4s' }}></div>

      <div className="relative z-10 w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <Link href="/login" className="inline-flex items-center text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors mb-6 group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Login
        </Link>
        <Card className="bg-slate-900/50 border-slate-800/60 backdrop-blur-2xl shadow-2xl shadow-indigo-500/5 rounded-3xl overflow-hidden relative group">
          {/* Subtle top glare */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-500/30 to-transparent"></div>
          
          <CardHeader className="space-y-4 pb-6 pt-10 px-8">
            <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-2 mx-auto border border-indigo-500/20 group-hover:scale-105 group-hover:bg-indigo-500/20 transition-all duration-500">
              <UserPlus className="w-7 h-7 text-indigo-400" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-extrabold text-center text-slate-100 tracking-tight">Create Account</CardTitle>
              <CardDescription className="text-center text-slate-400 text-base">
                Sign up to start managing your business
              </CardDescription>
            </div>
          </CardHeader>
          <form onSubmit={handleRegister}>
            <CardContent className="space-y-5 px-8">
              <div className="space-y-2.5">
                <Label htmlFor="email" className="text-slate-300 font-medium">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="bg-slate-950/50 border-slate-800/80 text-slate-200 placeholder:text-slate-500 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500 h-12 rounded-xl transition-all font-medium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="password" className="text-slate-300 font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="bg-slate-950/50 border-slate-800/80 text-slate-200 placeholder:text-slate-500 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500 h-12 rounded-xl transition-all font-medium"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="confirmPassword" className="text-slate-300 font-medium">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className="bg-slate-950/50 border-slate-800/80 text-slate-200 placeholder:text-slate-500 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500 h-12 rounded-xl transition-all font-medium"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-6 pt-6 pb-8 px-8">
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_-5px_rgba(79,70,229,0.4)] hover:shadow-[0_0_30px_-5px_rgba(79,70,229,0.6)] transition-all duration-300"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center">
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating account...
                  </span>
                ) : (
                  "Sign Up"
                )}
              </Button>
              <p className="text-sm text-center text-slate-400">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline transition-colors">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
