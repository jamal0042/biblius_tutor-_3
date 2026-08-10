    import { Header } from "@/components/header"
    import { Footer } from "@/components/footer"
    import { FileText } from "lucide-react"

    export default function TermsPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
        <Header />
        <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
            <div className="mb-8 flex items-center gap-3">
            <FileText className="w-8 h-8 text-amber-500" />
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Conditions d'utilisation</h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">Dernière mise à jour : 10 Août 2026</p>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 space-y-8">
            <section>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">1. Acceptation des conditions</h2>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">En utilisant la plateforme Biblius, vous acceptez pleinement et sans réserve les présentes conditions générales d'utilisation. L'utilisation du site vaut reconnaissance et acceptation de ces conditions.</p>
            </section>
            <section>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">2. Responsabilités de l'utilisateur</h2>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">L'utilisateur s'engage à fournir des informations exactes lors de son inscription. Il est responsable de la confidentialité de son mot de passe et de toutes les activités effectuées sous son compte. Tout comportement abusif ou tentative de piratage entraînera la suspension immédiate du compte.</p>
            </section>
            <section>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">3. Propriété intellectuelle</h2>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">L'ensemble du contenu de la plateforme (textes, images, logos, code source) est la propriété exclusive de Biblius ou de ses partenaires. Toute reproduction ou représentation totale ou partielle est interdite sans autorisation préalable.</p>
            </section>
            </div>
        </main>
        <Footer />
        </div>
    )
    }