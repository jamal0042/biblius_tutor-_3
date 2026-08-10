    import { Header } from "@/components/header"
    import { Footer } from "@/components/footer"
    import { User, BookOpen, Upload } from "lucide-react"
    import { Card, CardContent } from "@/components/ui/card"

    const guides = [
    { 
        icon: User, 
        title: "Pour les Étudiants", 
        steps: [
        "Créez votre compte via la page d&apos;inscription.", 
        "Attendez la validation par l&apos;administrateur.", 
        "Parcourez le catalogue et cliquez sur &apos;Emprunter&apos;."
        ] 
    },
    { 
        icon: BookOpen, 
        title: "Pour les Bibliothécaires", 
        steps: [
        "Accédez au panneau d&apos;administration.", 
        "Ajoutez de nouveaux documents via &apos;Gestion des livres&apos;.", 
        "Validez les demandes d&apos;inscription en attente."
        ] 
    },
    { 
        icon: Upload, 
        title: "Gestion des Ressources Numériques", 
        steps: [
        "Allez dans &apos;Ressources Numériques&apos; &gt; Ajouter.", 
        "Uploadez votre fichier PDF ou EPUB.", 
        "Définissez le niveau d&apos;accès (Étudiants ou Tous)."
        ] 
    }
    ]

    export default function GuidesPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
        <Header />
        <main className="flex-1 max-w-5xl mx-auto px-6 py-12 w-full">
            <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Guides d&apos;utilisation</h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">Apprenez à maîtriser Biblius en quelques étapes simples.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {guides.map((guide, index) => (
                <Card key={index} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <CardContent className="p-6">
                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-500/20 rounded-lg flex items-center justify-center mb-4">
                    <guide.icon className="w-6 h-6 text-amber-600 dark:text-amber-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{guide.title}</h3>
                    <ol className="space-y-3">
                    {guide.steps.map((step, i) => (
                        <li key={i} className="flex gap-3 text-sm text-slate-600 dark:text-slate-400">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                        {step}
                        </li>
                    ))}
                    </ol>
                </CardContent>
                </Card>
            ))}
            </div>
        </main>
        <Footer />
        </div>
    )
    }