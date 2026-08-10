    import { BookOpen, Clock, AlertCircle, CheckCircle, Calendar } from "lucide-react"
    import { Button } from "@/components/ui/button"
    import { Badge } from "@/components/ui/badge"
    import { Card, CardContent } from "@/components/ui/card"
    import Link from "next/link"
    import { redirect } from "next/navigation"
    import { getCurrentMember, createServerSupabaseClient } from "@/lib/supabase/server"

    // Les relations Supabase sont retournées sous forme de tableaux
    interface Loan {
    id: string
    due_date: string
    status: string
    documents: { title: string; author: string; }[] | null
    }

    interface Penalty {
    amount: number
    }

    interface Reservation {
    id: string
    status: string
    documents: { title: string; author: string; }[] | null
    }

    export default async function DashboardPage() {
    const member = await getCurrentMember()
    if (!member) redirect("/login")

    const supabase = await createServerSupabaseClient()

    // 1. Récupérer les emprunts en cours et en retard
    const { data: loans } = await supabase
        .from("prets")
        .select(`
        id,
        due_date,
        status,
        documents (title, author)
        `)
        .eq("member_id", member.id)
        .in("status", ["active", "overdue"])
        .order("due_date", { ascending: true })

    // 2. Récupérer les pénalités impayées
    const { data: penalties } = await supabase
        .from("penalites")
        .select("amount")
        .eq("member_id", member.id)
        .eq("status", "unpaid")

    // 3. Récupérer les réservations
    const { data: reservations } = await supabase
        .from("reservations")
        .select(`
        id,
        status,
        documents (title, author)
        `)
        .eq("member_id", member.id)
        .in("status", ["pending", "ready"])
        .order("created_at", { ascending: false })

    // Typage et calculs des statistiques
    const today = new Date()
    const typedLoans = (loans as Loan[]) || []
    const activeLoans = typedLoans.filter((l) => l.status === "active" && new Date(l.due_date) >= today)
    const overdueLoans = typedLoans.filter((l) => l.status === "overdue" || new Date(l.due_date) < today)
    
    const typedPenalties = (penalties as Penalty[]) || []
    const totalUnpaidFines = typedPenalties.reduce((acc: number, curr) => acc + (curr.amount || 0), 0)
    
    const activeReservations = (reservations as Reservation[]) || []

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric"
        })
    }

    return (
        <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Bonjour, {member.first_name} 
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
                Voici un aperçu de votre activité à la bibliothèque.
            </p>
            </div>
            <Link href="/catalogue">
            <Button className="bg-amber-500 hover:bg-amber-600 text-white shadow-sm">
                <BookOpen className="w-4 h-4 mr-2" />
                Parcourir le catalogue
            </Button>
            </Link>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Emprunts en cours" value={activeLoans.length.toString()} icon={BookOpen} color="blue" />
            <StatCard title="En retard" value={overdueLoans.length.toString()} icon={AlertCircle} color="red" />
            <StatCard title="Réservations" value={activeReservations.length.toString()} icon={Calendar} color="amber" />
            <StatCard title="Amendes impayées" value={`${totalUnpaidFines.toLocaleString()} FC`} icon={CheckCircle} color="green" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Section Emprunts */}
            <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Mes emprunts en cours</h2>
                <Link href="/dashboard/emprunts" className="text-sm text-amber-600 dark:text-amber-500 hover:underline">
                Voir tout
                </Link>
            </div>
            
            <div className="space-y-3">
                {activeLoans.length === 0 && overdueLoans.length === 0 ? (
                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                    <CheckCircle className="w-12 h-12 text-emerald-500/50 mb-3" />
                    <p className="text-slate-500 dark:text-slate-400">Vous n&apos;avez aucun emprunt en cours.</p>
                    </CardContent>
                </Card>
                ) : (
                [...overdueLoans, ...activeLoans].map((loan) => {
                    const isOverdue = new Date(loan.due_date) < today
                    const doc = loan.documents?.[0] // On prend le premier élément du tableau
                    return (
                    <Card key={loan.id} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-500/30 transition-colors">
                        <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-16 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center shrink-0">
                            <BookOpen className="w-6 h-6 text-slate-400" />
                            </div>
                            <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white">
                                {doc?.title || "Titre inconnu"}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {doc?.author || "Auteur inconnu"}
                            </p>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <Badge className={
                            isOverdue 
                                ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400" 
                                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                            }>
                            {isOverdue ? "En retard" : "À temps"}
                            </Badge>
                            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Retour : {formatDate(loan.due_date)}
                            </span>
                        </div>
                        </CardContent>
                    </Card>
                    )
                })
                )}
            </div>
            </div>

            {/* Section Réservations */}
            <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Mes réservations</h2>
            <div className="space-y-3">
                {activeReservations.length === 0 ? (
                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                    <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Aucune réservation en cours.</p>
                    </CardContent>
                </Card>
                ) : (
                activeReservations.map((res) => {
                    const doc = res.documents?.[0] // On prend le premier élément du tableau
                    return (
                    <Card key={res.id} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-slate-900 dark:text-white text-sm line-clamp-1">
                            {doc?.title || "Titre inconnu"}
                            </h3>
                            <Badge variant="outline" className={
                            res.status === "ready" 
                                ? "border-amber-500 text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10" 
                                : "border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                            }>
                            {res.status === "ready" ? "Disponible" : "En attente"}
                            </Badge>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                            {doc?.author || "Auteur inconnu"}
                        </p>
                        {res.status === "ready" && (
                            <Button size="sm" className="w-full bg-amber-500 hover:bg-amber-600 text-white h-8 text-xs">
                            Retirer à l&apos;accueil
                            </Button>
                        )}
                        </CardContent>
                    </Card>
                    )
                })
                )}
            </div>
            </div>
        </div>
        </div>
    )
    }

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