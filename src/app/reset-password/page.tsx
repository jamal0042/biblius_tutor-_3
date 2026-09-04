"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Lock, Loader2, Eye, EyeOff, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white dark:bg-slate-950" />}>
      <ResetForm />
    </Suspense>
  )
}

function ResetForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [invalidSession, setInvalidSession] = useState(false)

  useEffect(() => {
    const code = searchParams.get("code") || ""

    async function exchangeCode(confirmationCode: string) {
      try {
        if (!confirmationCode) {
          setInvalidSession(true)
          setChecking(false)
          return
        }
        const { error } = await supabase.auth.exchangeCodeForSession(confirmationCode)
        if (error) {
          setInvalidSession(true)
        }
      } catch {
        setInvalidSession(true)
      } finally {
        setChecking(false)
      }
    }

    void exchangeCode(code)

    router.replace("/reset-password")
  }, [searchParams, supabase.auth, router])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.")
      return
    }

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.")
      return
    }

    setLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })

      if (updateError) throw updateError

      setSuccess(true)
      setTimeout(() => router.push("/login"), 2000)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Une erreur est survenue."
      setError(errorMessage)
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white dark:bg-slate-950 transition-colors duration-300">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-slate-50 dark:bg-slate-900/50 border-r border-slate-200 dark:border-slate-800">
        <Logo showSubtitle={true} />
        <div className="space-y-6">
          <div>
            <h2 className="text-5xl font-bold text-slate-900 dark:text-white leading-tight">
              Définissez votre nouveau mot de passe.
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Choisissez un mot de passe sécurisé pour protéger votre compte.
            </p>
          </div>
        </div>
        <div className="text-slate-500 dark:text-slate-500 text-sm">© 2024 Biblius. Tous droits réservés.</div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12 bg-white dark:bg-slate-950 relative">
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-md space-y-6">
          {invalidSession ? (
            <Card className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-none">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Lien invalide ou expiré
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Ce lien de réinitialisation est invalide ou a expiré. Veuillez en demander un nouveau.
                </p>
                <Link href="/forgot-password">
                  <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white">
                    Demander un nouveau lien
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : success ? (
            <Card className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-none">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Mot de passe mis à jour !
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Vous allez être redirigé vers la page de connexion...
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-none">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                    Nouveau mot de passe
                  </CardTitle>
                  <CardDescription className="text-slate-500 dark:text-slate-400">
                    Choisissez un nouveau mot de passe pour votre compte.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Nouveau mot de passe</Label>
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

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pl-10 pr-10 h-12 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus-visible:ring-amber-500"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-lg shadow-amber-500/25 transition-all"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Mettre à jour le mot de passe"}
                    </Button>
                  </form>

                  <div className="mt-6 text-center">
                    <Link href="/login" className="inline-flex items-center text-sm text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 font-medium transition-colors">
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      Retour à la connexion
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {error && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 shadow-sm">
                  <div className="shrink-0 mt-0.5">
                    <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-red-800 dark:text-red-300">Erreur</p>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-0.5">{error}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
