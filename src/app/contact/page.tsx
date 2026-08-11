    "use client"

    import { Header } from "@/components/header"
    import { Footer } from "@/components/footer"
    import { Mail, Phone, MapPin, Send } from "lucide-react"
    import { Button } from "@/components/ui/button"
    import { Input } from "@/components/ui/input"
    import { Textarea } from "@/components/ui/textarea"
    import { Card, CardContent } from "@/components/ui/card"

    export default function ContactPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
        <Header />
        <main className="flex-1 max-w-5xl mx-auto px-6 py-12 w-full">
            <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Nous Contacter</h1>
            <p className="text-slate-600 dark:text-slate-400">Une question ? Notre équipe est là pour vous aider.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Informations */}
            <div className="space-y-6">
                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <CardContent className="p-6 space-y-6">
                    <div className="flex items-start gap-4">
                    <div className="p-3 bg-amber-100 dark:bg-amber-500/20 rounded-lg">
                        <MapPin className="w-6 h-6 text-amber-600 dark:text-amber-500" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">Adresse</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Université Adventiste de Lukanga, Nord-Kivu, RDC</p>
                    </div>
                    </div>
                    <div className="flex items-start gap-4">
                    <div className="p-3 bg-amber-100 dark:bg-amber-500/20 rounded-lg">
                        <Mail className="w-6 h-6 text-amber-600 dark:text-amber-500" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">Email</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">contact@biblius.cd</p>
                    </div>
                    </div>
                    <div className="flex items-start gap-4">
                    <div className="p-3 bg-amber-100 dark:bg-amber-500/20 rounded-lg">
                        <Phone className="w-6 h-6 text-amber-600 dark:text-amber-500" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">Téléphone</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">+243 992 720 042</p>
                    </div>
                    </div>
                </CardContent>
                </Card>
            </div>

            {/* Formulaire */}
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <CardContent className="p-6">
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-900 dark:text-white">Nom</label>
                        <Input placeholder="Votre nom" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-900 dark:text-white">Email</label>
                        <Input type="email" placeholder="votre@email.com" />
                    </div>
                    </div>
                    <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-900 dark:text-white">Sujet</label>
                    <Input placeholder="Objet de votre message" />
                    </div>
                    <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-900 dark:text-white">Message</label>
                    <Textarea rows={5} placeholder="Décrivez votre demande..." />
                    </div>
                    <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-white">
                    <Send className="w-4 h-4 mr-2" /> Envoyer le message
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