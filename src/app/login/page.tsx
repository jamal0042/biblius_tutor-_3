"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, LogIn, Mail, Lock, Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { ROLE_DASHBOARD } from "@/lib/roles"

const ERROR_MESSAGES: Record<string, string> = {
  account_disabled: "Votre compte a été suspendu ou désactivé. Contactez l'administration.",
  confirmation_failed: "La confirmation de votre compte a échoué. Veuillez réessayer ou contacter l'administration.",
  invalid_credentials: "Email ou mot de passe incorrect.",
  email_not_confirmed: "Veuillez confirmer votre adresse email avant de vous connecter.",
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white dark:bg-slate-950" />}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const supabase = createClient()

  const confirmedParam = searchParams.get("confirmed")
  const errorParam = searchParams.get("error")
  const [error, setError] = useState<string | null>(
    errorParam ? ERROR_MESSAGES[errorParam] || "Une erreur est survenue. Veuillez réessayer." : null
  )
  const [info, setInfo] = useState<string | null>(
    confirmedParam === "1" ? "Votre compte a bien été confirmé. Vous pouvez maintenant vous connecter." : null
  )

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        const message = authError.message.toLowerCase()
        if (message.includes("not confirmed")) {
          throw new Error(ERROR_MESSAGES.email_not_confirmed)
        }
        if (message.includes("invalid") || message.includes("credentials")) {
          throw new Error(ERROR_MESSAGES.invalid_credentials)
        }
        throw authError
      }
      if (!authData.user) throw new Error("Utilisateur non trouvé")

      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle()

      if (memberError || !member) {
        throw new Error("Profil membre introuvable. Contactez l'administrateur.")
      }

      if (member.status === 'pending') {
        router.push('/pending')
        return
      }

      if (member.status === 'suspended' || member.status === 'inactive') {
        setError("Votre compte a été suspendu ou désactivé. Contactez l'administration.")
        setLoading(false)
        return
      }

      const dashboard = ROLE_DASHBOARD[member.role as keyof typeof ROLE_DASHBOARD] || '/dashboard'
      router.push(dashboard)

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Erreur de connexion"
      setError(errorMessage)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white dark:bg-slate-950 transition-colors duration-300">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-slate-50 dark:bg-slate-900/50 border-r border-slate-200 dark:border-slate-800">
        <Logo showSubtitle={true} />
        <div className="space-y-6">
          <div>
            <h2 className="text-5xl font-bold text-slate-900 dark:text-white leading-tight">
              Gerez votre bibliotheque en toute simplicite.
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Catalogue, emprunts, reservations, penalites, tableau de bord - une plateforme moderne pour les bibliotheques universitaires et municipales.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-1 w-12 bg-amber-500 rounded-full" />
            <span className="text-amber-600 dark:text-amber-500 font-medium">Version 2.0.0</span>
          </div>
        </div>
        <div className="text-slate-500 dark:text-slate-500 text-sm">© 2024 Biblius. Tous droits reserves.</div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12 bg-white dark:bg-slate-950 relative">
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-md space-y-6">
          <Card className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-none">
            <CardHeader className="space-y-1">
              <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">Connexion</CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400">
                Accedez a votre espace bibliotheque.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="nom@exemple.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus-visible:ring-amber-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Mot de passe</Label>
                    <Link href="/forgot-password" className="text-sm text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 transition-colors">
                      Mot de passe oublié ?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-12 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus-visible:ring-amber-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-lg shadow-amber-500/25 transition-all"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span className="flex items-center gap-2">
                      Se connecter
                      <LogIn className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-slate-600 dark:text-slate-400">
                  Pas de compte ?{" "}
                  <Link href="/register" className="text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 font-medium transition-colors">
                    Creer un compte
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Messages d'information (succès/confirmation) en bas */}
          {info && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 shadow-sm">
              <div className="shrink-0 mt-0.5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Confirmation</p>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-0.5">{info}</p>
              </div>
            </div>
          )}

          {/* Message d'erreur en bas */}
          {error && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 shadow-sm">
              <div className="shrink-0 mt-0.5">
                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-red-800 dark:text-red-300">Erreur de connexion</p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-0.5">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
