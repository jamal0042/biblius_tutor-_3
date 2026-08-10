    import { Header } from "@/components/header"
    import { Footer } from "@/components/footer"
    import { Lock, Database, ShieldCheck, RefreshCw } from "lucide-react"

    const securityFeatures = [
    { icon: Lock, title: "Chiffrement des données", desc: "Toutes les communications entre votre navigateur et nos serveurs sont chiffrées via le protocole HTTPS/TLS." },
    { icon: Database, title: "Row Level Security (RLS)", desc: "La base de données utilise des politiques de sécurité strictes pour garantir que chaque utilisateur ne voit que ses propres données." },
    { icon: ShieldCheck, title: "Authentification sécurisée", desc: "Gestion des sessions via Supabase Auth avec des jetons JWT à durée de vie limitée et des mots de passe hachés." },
    { icon: RefreshCw, title: "Sauvegardes automatiques", desc: "Des sauvegardes quotidiennes de la base de données sont effectuées pour prévenir toute perte de données en cas d'incident." }
    ]

    export default function SecurityPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
        <Header />
        <main className="flex-1 max-w-5xl mx-auto px-6 py-12 w-full">
            <div className="text-center mb-12">
            <ShieldCheck className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Notre engagement en matière de sécurité</h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">La protection de vos données est notre priorité absolue. Voici les mesures techniques que nous mettons en œuvre.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {securityFeatures.map((feature, index) => (
                <div key={index} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex gap-4">
                <div className="p-3 bg-amber-100 dark:bg-amber-500/20 rounded-lg h-fit">
                    <feature.icon className="w-6 h-6 text-amber-600 dark:text-amber-500" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
                </div>
                </div>
            ))}
            </div>
        </main>
        <Footer />
        </div>
    )
    }