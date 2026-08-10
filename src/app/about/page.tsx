    import { Header } from "@/components/header"
    import { Footer } from "@/components/footer"
    import { BookOpen, Target, Lightbulb } from "lucide-react"

    export default function AboutPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
        <Header />
        <main className="flex-1 max-w-5xl mx-auto px-6 py-12 w-full">
            <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">À propos de Biblius</h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Nous révolutionnons la gestion des bibliothèques en combinant la richesse du patrimoine physique avec la puissance du numérique.
            </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800">
                <Target className="w-10 h-10 text-amber-500 mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Notre Mission</h3>
                <p className="text-slate-600 dark:text-slate-400">
                Démocratiser l&apos;accès au savoir en fournissant aux établissements d&apos;enseignement et aux bibliothèques publiques un outil intuitif, puissant et sécurisé pour gérer leurs collections.
                </p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800">
                <Lightbulb className="w-10 h-10 text-amber-500 mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Notre Vision</h3>
                <p className="text-slate-600 dark:text-slate-400">
                Devenir la référence incontournable en Afrique et ailleurs pour la transformation numérique des centres de documentation, sans jamais perdre l&apos;âme de la bibliothèque traditionnelle.
                </p>
            </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-500/10 rounded-2xl p-8 border border-amber-200 dark:border-amber-500/20 text-center">
            <BookOpen className="w-12 h-12 text-amber-600 dark:text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Pourquoi nous choisir ?</h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Biblius est conçu par des bibliothécaires et des ingénieurs logiciels. Nous comprenons les défis du terrain : gestion des retards, suivi des projets tutorés, accès aux ressources numériques et simplicité d&apos;utilisation pour les étudiants.
            </p>
            </div>
        </main>
        <Footer />
        </div>
    )
    }