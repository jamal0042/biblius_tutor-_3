    import { Header } from "@/components/header"
    import { Footer } from "@/components/footer"
    import { BookOpen, Users, FileText, BarChart3, Shield, Smartphone } from "lucide-react"

    const features = [
    { icon: BookOpen, title: "Catalogue Intelligent", desc: "Recherche avancée, gestion des exemplaires physiques et numériques, et classification automatique." },
    { icon: Users, title: "Gestion des Membres", desc: "Inscriptions en ligne, validation par l'admin, et profils personnalisés (Étudiants, Enseignants, Externes)." },
    { icon: FileText, title: "Prêts & Pénalités", desc: "Suivi en temps réel des emprunts, calcul automatique des retards et génération d'amendes." },
    { icon: Smartphone, title: "Ressources Numériques", desc: "Upload et consultation de PDF, mémoires et projets tutorés directement depuis la plateforme." },
    { icon: BarChart3, title: "Tableau de Bord Admin", desc: "Statistiques en temps réel sur l'activité, les livres les plus empruntés et les membres actifs." },
    { icon: Shield, title: "Sécurité & Rôles", desc: "Contrôle d'accès granulaire. Les étudiants ne voient que leurs données, les admins contrôlent tout." },
    ]

    export default function FeaturesPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
        <Header />
        <main className="flex-1 max-w-6xl mx-auto px-6 py-12 w-full">
            <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Fonctionnalités Puissantes</h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">Tout ce dont vous avez besoin pour gérer une bibliothèque moderne.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
                <div key={index} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 transition-colors">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-500/20 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-amber-600 dark:text-amber-500" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
                </div>
            ))}
            </div>
        </main>
        <Footer />
        </div>
    )
    }