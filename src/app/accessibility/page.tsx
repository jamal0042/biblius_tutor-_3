    import { Header } from "@/components/header"
    import { Footer } from "@/components/footer"
    import { Eye, Keyboard, Monitor } from "lucide-react"

    export default function AccessibilityPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
        <Header />
        <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
            <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Déclaration d&apos;accessibilité</h1>
            <p className="text-slate-600 dark:text-slate-400">Biblius s&apos;engage à rendre son service accessible à tous, conformément aux principes du design universel.</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 space-y-8">
            <div className="flex gap-4">
                <Eye className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
                <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Contraste et lisibilité</h3>
                <p className="text-slate-600 dark:text-slate-400">L&apos;interface respecte les ratios de contraste recommandés par les normes WCAG 2.1 niveau AA pour assurer une lecture confortable.</p>
                </div>
            </div>
            <div className="flex gap-4">
                <Keyboard className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
                <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Navigation au clavier</h3>
                <p className="text-slate-600 dark:text-slate-400">Toutes les fonctionnalités de la plateforme sont accessibles et utilisables uniquement avec un clavier, sans souris.</p>
                </div>
            </div>
            <div className="flex gap-4">
                <Monitor className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
                <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Mode sombre</h3>
                <p className="text-slate-600 dark:text-slate-400">Un mode sombre complet est disponible pour réduire la fatigue oculaire et s&apos;adapter aux préférences de chacun.</p>
                </div>
            </div>
            </div>
        </main>
        <Footer />
        </div>
    )
    }