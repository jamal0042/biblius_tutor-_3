import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  BookOpen,
  Sparkles,
  ArrowRight,
  Library,
  FileText,
  Clock,
  Shield,
} from "lucide-react"
import { getCurrentMember, createServerSupabaseClient } from "@/lib/supabase/server"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { ResourceCardClient, type DigitalResource } from "@/components/resource-card"

export default async function HomePage() {
  const supabase = await createServerSupabaseClient()
  const member = await getCurrentMember()

  // Dernières ressources publiques pour la page d'accueil
  const { data: resources } = await supabase
    .from("digital_resources")
    .select(
      `*,
      documents (title, auteurs (id, name)),
      auteur_direct:auteurs!digital_resources_author_id_fkey (id, name)`
    )
    .eq("access_level", "all")
    .order("created_at", { ascending: false })
    .limit(3)

  const featuredResources = (resources as unknown as DigitalResource[]) || []

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300">
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {member ? (
              <Link href="/dashboard">
                <Button className="bg-amber-500 hover:bg-amber-600 text-white">
                  Mon espace
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Connexion</Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-amber-500 hover:bg-amber-600 text-white">
                    S&apos;inscrire
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-amber-50/40 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900" />
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-sm font-medium text-amber-600 dark:text-amber-300">
              <Sparkles className="h-4 w-4" />
              Bibliothèque numérique nouvelle génération
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl dark:text-white">
              Toute la connaissance,{" "}
              <span className="bg-gradient-to-r from-blue-600 to-amber-500 bg-clip-text text-transparent">
                à portée de clic
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-400">
              Biblius est votre bibliothèque universitaire en ligne : catalogue riche, ressources
              numériques en lecture intégrée, réservations simples et assistant IA pour vous guider.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link href="/catalogue">
                <Button className="h-12 px-6 bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/25">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Explorer le catalogue
                </Button>
              </Link>
              {member ? (
                <Link href="/dashboard">
                  <Button variant="outline" className="h-12 px-6">
                    Mon tableau de bord
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <Link href="/register">
                  <Button variant="outline" className="h-12 px-6">
                    Créer un compte
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Fonctionnalités */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: BookOpen,
              title: "Catalogue riche",
              desc: "Livres, mémoires, thèses, TFC et rapports classés selon la norme Dewey.",
              tone: "blue",
            },
            {
              icon: FileText,
              title: "Ressources numériques",
              desc: "Lisez vos documents directement dans la plateforme, sans rien installer.",
              tone: "amber",
            },
            {
              icon: Clock,
              title: "Gestion simplifiée",
              desc: "Emprunts, réservations et rappels automatiques depuis votre espace.",
              tone: "emerald",
            },
            {
              icon: Shield,
              title: "Assistant IA",
              desc: "Un chatbot intelligent pour vous aider à trouver les bons documents.",
              tone: "purple",
            },
          ].map((f) => {
            const Icon = f.icon
            return (
              <div
                key={f.title}
                className="rounded-xl border border-slate-200 bg-white p-6 transition-all hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
              >
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-${f.tone}-500/10 text-${f.tone}-500`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{f.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Dernières ressources */}
      {featuredResources.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Dernières ressources ajoutées
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Consultez les documents récents disponibles en lecture libre.
              </p>
            </div>
            <Link href="/dashboard/numerique">
              <Button variant="outline" className="hidden sm:inline-flex">
                Voir tout
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredResources.map((r) => (
              <ResourceCardClient key={r.id} resource={r} />
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Library className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                Biblius
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              © {new Date().getFullYear()} Biblius. Projet tutoré — Tous droits réservés.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              <Link href="/login" className="hover:text-slate-700 dark:hover:text-slate-300">
                Connexion
              </Link>
              <Link href="/register" className="hover:text-slate-700 dark:hover:text-slate-300">
                Inscription
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}