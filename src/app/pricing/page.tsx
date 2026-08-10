    import { Header } from "@/components/header"
    import { Footer } from "@/components/footer"
    import { CheckCircle, Star } from "lucide-react"
    import { Button } from "@/components/ui/button"
    import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

    const plans = [
    {
        name: "Essentiel",
        price: "Gratuit",
        desc: "Pour les petites bibliothèques associatives ou scolaires.",
        features: ["Jusqu'à 500 documents", "Gestion des membres basique", "1 administrateur", "Support par email"]
    },
    {
        name: "Professionnel",
        price: "50 000 FCFA/mois",
        desc: "Pour les bibliothèques d'établissement et lycées.",
        popular: true,
        features: ["Jusqu'à 10 000 documents", "Gestion avancée des prêts et pénalités", "Ressources numériques (PDF)", "3 administrateurs", "Support prioritaire"]
    },
    {
        name: "Université",
        price: "Sur devis",
        desc: "Pour les universités et grands centres de documentation.",
        features: ["Documents illimités", "API d'intégration", "Authentification SSO", "Administrateurs illimités", "Formation sur site dédiée", "Support 24/7"]
    }
    ]

    export default function PricingPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
        <Header />
        <main className="flex-1 max-w-6xl mx-auto px-6 py-12 w-full">
            <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Des tarifs adaptés à votre structure</h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">Choisissez la formule qui correspond à la taille de votre bibliothèque.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, index) => (
                <Card key={index} className={`relative bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 ${plan.popular ? "ring-2 ring-amber-500 shadow-lg" : ""}`}>
                {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3 fill-white" /> Populaire
                    </div>
                )}
                <CardHeader className="text-center pb-2">
                    <CardTitle className="text-xl text-slate-900 dark:text-white">{plan.name}</CardTitle>
                    <div className="text-3xl font-bold text-amber-600 dark:text-amber-500 mt-2">{plan.price}</div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{plan.desc}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> {feature}
                        </li>
                    ))}
                    </ul>
                    <Button className={`w-full mt-4 ${plan.popular ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700"}`}>
                    {plan.price === "Sur devis" ? "Nous contacter" : "Commencer"}
                    </Button>
                </CardContent>
                </Card>
            ))}
            </div>
        </main>
        <Footer />
        </div>
    )
    }