import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroCarousel } from "@/components/hero-carousel"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300 flex flex-col">
      <Header/>

      <main className="flex-1">
        {/* Carrousel en haut de page */}
        <HeroCarousel />

        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
          <div className="text-center space-y-8 mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">
              Bienvenue sur{" "}
              <span className="text-amber-600 dark:text-amber-500">
                Biblius
              </span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              La solution complete pour moderniser la gestion de votre bibliotheque.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/catalogue">
                <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white px-8 h-12 text-lg">
                  Explorer le catalogue
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Vous pouvez remettre ici votre section "Fonctionnalites" et "Statistiques" si vous le souhaitez */}
        </div>
      </main>

      <Footer />
    </div>
  )
}