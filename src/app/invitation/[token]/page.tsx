"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Loader2, ArrowRight, BookOpen, AlertCircle } from "lucide-react"

function isValidUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

export default function InvitationPage() {
  const params = useParams()
  const token = params.token as string

  if (!token) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 transition-colors duration-300">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Vérification de votre invitation…
            </p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!isValidUUID(token)) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 transition-colors duration-300">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <Card className="w-full max-w-md bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-none">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Lien invalide
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Le lien d&apos;invitation que vous avez reçu n&apos;est pas valide. Veuillez contacter l&apos;administration pour obtenir un nouveau lien.
              </p>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  Retour à l&apos;accueil
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 transition-colors duration-300">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 text-sm font-medium">
              <BookOpen className="w-4 h-4" />
              Invitation
            </div>
          </div>

          <Card className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-none">
            <CardContent className="p-8">
              <div className="flex justify-center mb-6">
                <Logo showSubtitle={true} />
              </div>

              <div className="text-center space-y-4 mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                  Rejoignez Biblius
                </h1>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Vous avez été invité à rejoindre notre plateforme de gestion bibliothèque.
                  Créez votre compte pour accéder au catalogue, effectuer des emprunts et bien plus encore.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-500">📚</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Catalogue</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-500">📖</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Emprunts</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-500">⭐</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Réservations</p>
                  </div>
                </div>

                <Link href={`/register?token=${token}`} className="block">
                  <Button className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-lg shadow-amber-500/25 transition-all text-base">
                    Commencer
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>

              <div className="mt-6 text-center">
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Vous avez déjà un compte ?{" "}
                  <Link
                    href="/login"
                    className="text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 font-medium transition-colors"
                  >
                    Se connecter
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
