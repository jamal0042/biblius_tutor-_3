import { ArrowRight, BookOpen, Search, Users, Clock, Shield, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroCarousel } from "@/components/hero-carousel"
import Link from "next/link"

const features = [
  {
    icon: BookOpen,
    title: "Catalogue Intelligent",
    description: "Recherchez parmi des milliers d'ouvrages physiques et numériques avec des filtres avancés.",
    color: "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-500"
  },
  {
    icon: Search,
    title: "Ressources Numériques",
    description: "Accédez aux thèses, mémoires et projets tutorés directement en ligne.",
    color: "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-500"
  },
  {
    icon: Clock,
    title: "Gestion des Emprunts",
    description: "Suivez vos prêts, dates de retour et historique en temps réel.",
    color: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-500"
  },
  {
    icon: Shield,
    title: "Sécurité des Données",
    description: "Vos informations et vos emprunts sont protégés avec les meilleures pratiques.",
    color: "bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-500"
  },
  {
    icon: FileText,
    title: "Rapports Statistiques",
    description: "Tableaux de bord détaillés pour les administrateurs et bibliothécaires.",
    color: "bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-500"
  },
  {
    icon: Users,
    title: "Multi-Profils",
    description: "Espaces dédiés pour étudiants, enseignants et administrateurs.",
    color: "bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-500"
  }
]

const stats = [
  { value: "5000+", label: "Documents disponibles" },
  { value: "1200+", label: "Membres actifs" },
  { value: "350+", label: "Ressources numériques" },
  { value: "24/7", label: "Accès en ligne" }
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300 flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Carrousel en haut de page */}
        <HeroCarousel />

        {/* Section Héros */}
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
          <div className="text-center space-y-8 mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">
              Bienvenue sur{" "}
              <span className="text-amber-600 dark:text-amber-500">
                Biblius
              </span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              La solution complète pour moderniser la gestion de votre bibliothèque.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/catalogue">
                <Button size="lg" className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white px-8 h-12 text-lg">
                  Explorer le catalogue
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/blog">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 px-8 h-12 text-lg">
                  Lire le blog
                </Button>
              </Link>
            </div>
          </div>

          {/* Section Statistiques */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-24">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="text-center p-6 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800"
              >
                <div className="text-3xl md:text-4xl font-bold text-amber-600 dark:text-amber-500 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Section Fonctionnalités */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                Fonctionnalités Principales
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Tout ce dont vous avez besoin pour gérer efficacement votre bibliothèque
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="group p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 hover:shadow-lg transition-all duration-300"
                >
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${feature.color}`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Section Call-to-Action */}
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-8 md:p-12 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Prêt à moderniser votre bibliothèque ?
            </h2>
            <p className="text-lg text-amber-50 mb-8 max-w-2xl mx-auto">
              Rejoignez les établissements qui font confiance à Biblius pour leur gestion documentaire.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto bg-white text-amber-600 hover:bg-slate-100 px-8 h-12 text-lg">
                  Créer un compte
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white/10 px-8 h-12 text-lg">
                  Nous contacter
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}