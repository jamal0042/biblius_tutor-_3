    "use client"

    import Link from "next/link"
    import { 
    BookOpen, Clock, AlertCircle, CheckCircle, Calendar 
    } from "lucide-react"
    import { Button } from "@/components/ui/button"
    import { Card, CardContent} from "@/components/ui/card"
    import { Badge } from "@/components/ui/badge"
    //import { Logo } from "@/components/logo"

    // Données factices pour la démonstration
    const currentLoans = [
    { id: 1, title: "Le Petit Prince", author: "Antoine de Saint-Exupery", dueDate: "15 Sept 2024", status: "on-time" },
    { id: 2, title: "1984", author: "George Orwell", dueDate: "02 Sept 2024", status: "overdue" },
    { id: 3, title: "Dune", author: "Frank Herbert", dueDate: "20 Sept 2024", status: "on-time" },
    ]

    const reservations = [
    { id: 1, title: "Sapiens", author: "Yuval Noah Harari", status: "ready" },
    { id: 2, title: "Les Miserables", author: "Victor Hugo", status: "waiting" },
    ]

    export default function DashboardPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        {/* Barre de navigation du tableau de bord */}


        {/* Contenu principal */}
        <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
            
            {/* Section de bienvenue */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Bonjour, Jamal 
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                Voici un apercu de votre activite a la bibliotheque.
                </p>
            </div>
            <Link href="/catalogue">
                <Button className="bg-amber-500 hover:bg-amber-600 text-white shadow-sm">
                <BookOpen className="w-4 h-4 mr-2" />
                Parcourir le catalogue
                </Button>
            </Link>
            </div>

            {/* Grille de statistiques */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
                title="Emprunts en cours" 
                value="3" 
                icon={BookOpen} 
                color="blue" 
            />
            <StatCard 
                title="En retard" 
                value="1" 
                icon={AlertCircle} 
                color="red" 
            />
            <StatCard 
                title="Reservations" 
                value="2" 
                icon={Calendar} 
                color="amber" 
            />
            <StatCard 
                title="Amendes impayees" 
                value="0 FC" 
                icon={CheckCircle} 
                color="green" 
            />
            </div>

            {/* Section Emprunts et Reservations */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Emprunts en cours (Prend 2/3 de la largeur) */}
            <div className="lg:col-span-2 space-y-4">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Mes emprunts en cours
                </h2>
                <div className="space-y-3">
                {currentLoans.map((loan) => (
                    <Card key={loan.id} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-500/30 transition-colors">
                    <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                        <div className="w-12 h-16 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-slate-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white">{loan.title}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{loan.author}</p>
                        </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                        <Badge variant={loan.status === "overdue" ? "destructive" : "default"} className={
                            loan.status === "overdue" 
                            ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20" 
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20"
                        }>
                            {loan.status === "overdue" ? "En retard" : "A temps"}
                        </Badge>
                        <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Retour : {loan.dueDate}
                        </span>
                        </div>
                    </CardContent>
                    </Card>
                ))}
                </div>
            </div>

            {/* Reservations (Prend 1/3 de la largeur) */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Mes reservations
                </h2>
                <div className="space-y-3">
                {reservations.map((res) => (
                    <Card key={res.id} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{res.title}</h3>
                        <Badge variant="outline" className={
                            res.status === "ready" 
                            ? "border-amber-500 text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10" 
                            : "border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                        }>
                            {res.status === "ready" ? "Disponible" : "En attente"}
                        </Badge>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{res.author}</p>
                        {res.status === "ready" && (
                        <Button size="sm" className="w-full bg-amber-500 hover:bg-amber-600 text-white h-8 text-xs">
                            Retirer a l accueil
                        </Button>
                        )}
                    </CardContent>
                    </Card>
                ))}
                </div>
            </div>

            </div>
        </main>
        </div>
    )
    }

    // Composant interne pour les cartes de statistiques
    function StatCard({ title, value, icon: Icon, color }: { 
    title: string; 
    value: string; 
    icon: React.ElementType; 
    color: "blue" | "red" | "amber" | "green";
    }) {
    const colorClasses = {
        blue: "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
        red: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400",
        amber: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
        green: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
    }

    return (
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <CardContent className="flex items-center gap-4 p-6">
            <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
            </div>
            <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
            </div>
        </CardContent>
        </Card>
    )
    }