    import { Header } from "@/components/header"
    import { Footer } from "@/components/footer"
    import { FileText } from "lucide-react"

    // --- MODIFIEZ CES VARIABLES POUR CHAQUE PAGE ---
    const PAGE_TITLE = "Politique de Confidentialité" // Ex: Conditions d'utilisation, Sécurité, etc.
    const PAGE_DESC = "Dernière mise à jour : 10 Août 2026"

    const contentSections = [
    {
        title: "1. Collecte des données",
        text: "Nous collectons uniquement les informations nécessaires au fonctionnement de la bibliothèque : nom, email, matricule et historique des emprunts."
    },
    {
        title: "2. Utilisation des données",
        text: "Vos données sont utilisées exclusivement pour gérer vos prêts, vous envoyer des rappels de retour et améliorer nos services. Elles ne sont jamais vendues à des tiers."
    },
    {
        title: "3. Sécurité",
        text: "Nous utilisons des protocoles de chiffrement modernes et des politiques d'accès strictes (RLS Supabase) pour protéger vos informations personnelles."
    }
    ]
    // -----------------------------------------------

    export default function GenericInfoPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
        <Header />
        <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
            <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
                <FileText className="w-8 h-8 text-amber-500" />
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{PAGE_TITLE}</h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{PAGE_DESC}</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 space-y-8">
            {contentSections.map((section, index) => (
                <div key={index}>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">{section.title}</h2>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{section.text}</p>
                </div>
            ))}
            </div>
        </main>
        <Footer />
        </div>
    )
    }