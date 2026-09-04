"use client"

import { useState } from "react"
import Link from "next/link"
import { Mail, Loader2, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (resetError) throw resetError

      setSuccess(true)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Une erreur est survenue."
      setError(errorMessage)
    } finally {
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
              Récupérez l&apos;accès à votre compte.
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Saisissez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
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
          {success ? (
            <Card className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-none">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Email envoyé !
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Si un compte existe pour <strong>{email}</strong>, un lien de réinitialisation vient d&apos;être envoyé. Vérifiez votre boîte de réception.
                </p>
                <Link href="/login">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour à la connexion
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-none">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                    Mot de passe oublié
                  </CardTitle>
                  <CardDescription className="text-slate-500 dark:text-slate-400">
                    Entrez votre email pour recevoir un lien de réinitialisation.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
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

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-lg shadow-amber-500/25 transition-all"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Envoyer le lien"}
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
