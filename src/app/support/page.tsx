    import { Header } from "@/components/header"
    import { Footer } from "@/components/footer"
    import { LifeBuoy, Mail, MessageSquare, Phone } from "lucide-react"
    import { Card, CardContent } from "@/components/ui/card"
    import { Button } from "@/components/ui/button"

    export default function SupportPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
        <Header />
        <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
            <div className="text-center mb-12">
            <LifeBuoy className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Support Technique</h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">Notre équipe est là pour vous aider à résoudre tout problème technique.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-center">
                <CardContent className="p-6">
                <Mail className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Par Email</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Réponse sous 24h</p>
                <p className="text-amber-600 dark:text-amber-500 font-medium">support@biblius.cd</p>
                </CardContent>
            </Card>
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-center">
                <CardContent className="p-6">
                <Phone className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Par Téléphone</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Lun-Ven, 8h-17h</p>
                <p className="text-amber-600 dark:text-amber-500 font-medium">+243 992 720 042</p>
                </CardContent>
            </Card>
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-center">
                <CardContent className="p-6">
                <MessageSquare className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Chat en direct</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Disponible pour les admins</p>
                <Button size="sm" variant="outline" className="border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10">Ouvrir le chat</Button>
                </CardContent>
            </Card>
            </div>

            <Card className="bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20">
            <CardContent className="p-6 text-center">
                <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-300 mb-2">Avant de nous contacter</h3>
                <p className="text-sm text-amber-800 dark:text-amber-400 mb-4">
                Avez-vous consulté notre <a href="/faq" className="underline font-medium">FAQ</a> ou nos <a href="/guides" className="underline font-medium">Guides d&apos;utilisation</a> ? La réponse à votre question s&apos;y trouve peut-être déjà !
                </p>
            </CardContent>
            </Card>
        </main>
        <Footer />
        </div>
    )
    }