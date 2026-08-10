    import { Header } from "@/components/header"
    import { Footer } from "@/components/footer"
    import { Calendar, CheckCircle, Mail, Phone } from "lucide-react"
    import { Button } from "@/components/ui/button"
    import { Input } from "@/components/ui/input"
    import { Textarea } from "@/components/ui/textarea"
    import { Card, CardContent } from "@/components/ui/card"

    export default function DemoPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
        <Header />
        <main className="flex-1 max-w-5xl mx-auto px-6 py-12 w-full">
            <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Demandez une démonstration</h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">Découvrez comment Biblius peut transformer la gestion de votre bibliothèque en 30 minutes.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Pourquoi choisir Biblius ?</h3>
                <ul className="space-y-4">
                {["Mise en place en moins de 24h", "Formation de votre équipe incluse", "Support technique réactif", "Pas de frais cachés"].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" /> {item}
                    </li>
                ))}
                </ul>
                <Card className="bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 mt-8">
                <CardContent className="p-6">
                    <p className="text-sm text-amber-800 dark:text-amber-300 font-medium mb-2">Besoin d&apos;une réponse rapide ?</p>
                    <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400 mb-1">
                    <Mail className="w-4 h-4" /> contact@biblius.cd
                    </div>
                    <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
                    <Phone className="w-4 h-4" /> +243 992 720 042
                    </div>
                </CardContent>
                </Card>
            </div>

            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <CardContent className="p-6">
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                    <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-900 dark:text-white">Prénom</label>
                        <Input placeholder="Jean" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-900 dark:text-white">Nom</label>
                        <Input placeholder="Dupont" />
                    </div>
                    </div>
                    <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-900 dark:text-white">Établissement</label>
                    <Input placeholder="Nom de l'université ou bibliothèque" />
                    </div>
                    <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-900 dark:text-white">Email professionnel</label>
                    <Input type="email" placeholder="jean@etablissement.cd" />
                    </div>
                    <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-900 dark:text-white">Message (optionnel)</label>
                    <Textarea rows={3} placeholder="Dites-nous en plus sur vos besoins..." />
                    </div>
                    <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white">
                    <Calendar className="w-4 h-4 mr-2" /> Planifier la démo
                    </Button>
                </form>
                </CardContent>
            </Card>
            </div>
        </main>
        <Footer />
        </div>
    )
    }