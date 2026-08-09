    import Link from "next/link"
    import { Clock, Mail, ArrowLeft, CheckCircle } from "lucide-react"
    import { Button } from "@/components/ui/button"
    import { Card, CardContent } from "@/components/ui/card"
    import { ThemeToggle } from "@/components/theme-toggle"
    import { Logo } from "@/components/logo"

    export default function PendingPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300 flex flex-col items-center justify-center p-6 relative">
        <div className="absolute top-6 right-6">
            <ThemeToggle />
        </div>

        <Card className="w-full max-w-md bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 shadow-xl">
            <CardContent className="p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                <Clock className="w-10 h-10 text-amber-600 dark:text-amber-500" />
            </div>

            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Demande en cours de traitement
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
                Votre inscription a bien ete enregistree. Un administrateur ou bibliothecaire va examiner votre demande et activer votre compte sous 24 a 48 heures.
            </p>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-3 flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-500" />
                Prochaines etapes
                </h3>
                <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    Demande recue et enregistree
                </li>
                <li className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    Verification par l&apos;administration
                </li>
                <li className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-500" />
                    Email de confirmation
                </li>
                <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-slate-400" />
                    Acces a votre espace membre
                </li>
                </ul>
            </div>

            <Link href="/login">
                <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour a la connexion
                </Button>
            </Link>
            </CardContent>
        </Card>

        <div className="mt-8">
            <Logo showSubtitle={false} />
        </div>
        </div>
    )
    }