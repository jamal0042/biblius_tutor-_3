    import { Header } from "@/components/header"
    import { Footer } from "@/components/footer"
    import { BookOpen, Code, Database, ExternalLink } from "lucide-react"
    import { Card, CardContent } from "@/components/ui/card"
    import Link from "next/link"

    const docs = [
    { icon: BookOpen, title: "Guide de démarrage", desc: "Comment configurer votre bibliothèque en 5 minutes.", link: "#" },
    { icon: Database, title: "Schéma de la base de données", desc: "Comprendre la structure des tables members, documents et prets.", link: "#" },
    { icon: Code, title: "API Reference", desc: "Documentation technique pour les développeurs souhaitant intégrer Biblius.", link: "#" }
    ]

    export default function DocumentationPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
        <Header />
        <main className="flex-1 max-w-5xl mx-auto px-6 py-12 w-full">
            <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Documentation Technique</h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">Tout ce dont vous avez besoin pour installer, configurer et étendre Biblius.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {docs.map((doc, index) => (
                <Link key={index} href={doc.link}>
                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-500/50 transition-all h-full group">
                    <CardContent className="p-6 flex flex-col h-full">
                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <doc.icon className="w-6 h-6 text-amber-600 dark:text-amber-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{doc.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 flex-1">{doc.desc}</p>
                    <span className="text-sm font-medium text-amber-600 dark:text-amber-500 flex items-center gap-1">
                        Lire la documentation <ExternalLink className="w-3 h-3" />
                    </span>
                    </CardContent>
                </Card>
                </Link>
            ))}
            </div>
        </main>
        <Footer />
        </div>
    )
    }