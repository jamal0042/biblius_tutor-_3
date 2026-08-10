    import { Header } from "@/components/header"
    import { Footer } from "@/components/footer"
    import { HelpCircle } from "lucide-react"

    const faqs = [
    { q: "Comment emprunter un livre numérique ?", a: "Connectez-vous à votre espace membre, allez dans le catalogue, filtrez par 'Ressources Numériques' et cliquez sur 'Télécharger' ou 'Consulter'." },
    { q: "Que se passe-t-il si je rends un livre en retard ?", a: "Une pénalité automatique est calculée en fonction du nombre de jours de retard (configurable par l'administration). Vous devez régulariser votre situation pour pouvoir emprunter à nouveau." },
    { q: "Combien de livres puis-je emprunter simultanément ?", a: "Cela dépend de votre profil : 5 pour les étudiants, 10 pour les enseignants, et 3 pour les lecteurs externes." },
    { q: "Comment puis-je proposer l'achat d'un nouveau livre ?", a: "Vous pouvez utiliser le formulaire de contact ou en parler directement au bibliothécaire lors de votre prochaine visite." },
    ]

    export default function FaqPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
        <Header />
        <main className="flex-1 max-w-3xl mx-auto px-6 py-12 w-full">
            <div className="text-center mb-12">
            <HelpCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Foire Aux Questions</h1>
            <p className="text-slate-600 dark:text-slate-400">Trouvez rapidement des réponses à vos questions.</p>
            </div>

            <div className="space-y-4">
            {faqs.map((faq, index) => (
                <details key={index} className="group bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 open:border-amber-500/50 transition-colors">
                <summary className="flex items-center justify-between p-5 cursor-pointer font-semibold text-slate-900 dark:text-white">
                    {faq.q}
                    <span className="ml-4 text-amber-500 transition-transform group-open:rotate-180">▼</span>
                </summary>
                <div className="px-5 pb-5 text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-4">
                    {faq.a}
                </div>
                </details>
            ))}
            </div>
        </main>
        <Footer />
        </div>
    )
    }