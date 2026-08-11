    "use client"
    /* eslint-disable react-hooks/set-state-in-effect */

    import { useEffect, useState, useCallback } from "react"
    import { createClient } from "@/lib/supabase/client"
    import { BookOpen, Clock, AlertCircle, CheckCircle, TrendingUp, Calendar } from "lucide-react"
    import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
    import { Badge } from "@/components/ui/badge"

    interface StudentLoan {
    id: string
    due_date: string
    return_date: string | null
    status: string
    documents: { title: string; author: string }[] | null
    }

    interface StudentPenalty {
    amount: number
    status: string
    }

    export default function StudentStatsPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalLoans: 0,
        activeLoans: 0,
        overdueLoans: 0,
        returnedLoans: 0,
        totalPenalties: 0,
        unpaidPenalties: 0,
        onTimeRate: 0,
        recentLoans: [] as StudentLoan[]
    })

    const fetchStats = useCallback(async () => {
        setLoading(true)
        // Note: Remplacez 'member.id' par l'ID réel de l'utilisateur connecté si ce composant est dans le dashboard
        // Pour l'exemple, nous utilisons un ID fictif ou nous supposons que vous avez accès à l'ID via un hook ou props
        // Si ce fichier est dans /admin, adaptez la logique pour filtrer par un membre spécifique ou montrer les stats globales.
        
        const { data: loans } = await supabase
        .from("prets")
        .select(`id, due_date, return_date, status, documents (title, author)`)
        .order("loan_date", { ascending: false })

        const { data: penalties } = await supabase
        .from("penalites")
        .select("amount, status")

        const today = new Date()
        const typedLoans = (loans as StudentLoan[]) || []
        const typedPenalties = (penalties as StudentPenalty[]) || []

        const totalLoans = typedLoans.length
        const activeLoans = typedLoans.filter((l) => l.status === "active" && new Date(l.due_date) >= today).length
        const overdueLoans = typedLoans.filter((l) => l.status === "overdue" || new Date(l.due_date) < today).length
        const returnedLoans = typedLoans.filter((l) => l.status === "returned").length
        
        const totalPenalties = typedPenalties.reduce((acc: number, curr: StudentPenalty) => acc + (curr.amount || 0), 0)
        const unpaidPenalties = typedPenalties.filter((p) => p.status === "unpaid").reduce((acc: number, curr: StudentPenalty) => acc + (curr.amount || 0), 0)

        const onTimeRate = totalLoans > 0 ? Math.round((returnedLoans / totalLoans) * 100) : 0

        setStats({
        totalLoans,
        activeLoans,
        overdueLoans,
        returnedLoans,
        totalPenalties,
        unpaidPenalties,
        onTimeRate,
        recentLoans: typedLoans.slice(0, 5)
        })
        setLoading(false)
    }, [supabase])

    useEffect(() => {
        fetchStats()
    }, [fetchStats])

    if (loading) return <div className="p-8 text-center text-slate-500">Chargement des statistiques...</div>

    return (
        <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Statistiques</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Vue d&apos;ensemble de l&apos;activité.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Emprunts" value={stats.totalLoans} icon={BookOpen} color="text-blue-600 dark:text-blue-500" bg="bg-blue-100 dark:bg-blue-500/10" />
            <StatCard title="En Cours" value={stats.activeLoans} icon={Clock} color="text-amber-600 dark:text-amber-500" bg="bg-amber-100 dark:bg-amber-500/10" />
            <StatCard title="En Retard" value={stats.overdueLoans} icon={AlertCircle} color="text-red-600 dark:text-red-500" bg="bg-red-100 dark:bg-red-500/10" />
            <StatCard title="Retournés" value={stats.returnedLoans} icon={CheckCircle} color="text-emerald-600 dark:text-emerald-500" bg="bg-emerald-100 dark:bg-emerald-500/10" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                Taux de retour à temps
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                <div className="flex items-end gap-2">
                    <span className="text-4xl font-bold text-slate-900 dark:text-white">{stats.onTimeRate}%</span>
                    <span className="text-sm text-slate-500 dark:text-slate-400 mb-1">des emprunts retournés à temps</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                    <div 
                    className={`h-3 rounded-full transition-all ${stats.onTimeRate >= 80 ? 'bg-emerald-500' : stats.onTimeRate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${stats.onTimeRate}%` }}
                    ></div>
                </div>
                </div>
            </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                <AlertCircle className="w-5 h-5 text-red-500" />
                Pénalités
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Total des amendes</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalPenalties.toLocaleString()} FCFA</p>
                    </div>
                    <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Impayées</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-500">{stats.unpaidPenalties.toLocaleString()} FCFA</p>
                    </div>
                </div>
                </div>
            </CardContent>
            </Card>
        </div>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5 text-amber-500" />
                Historique récent
            </CardTitle>
            </CardHeader>
            <CardContent>
            {stats.recentLoans.length === 0 ? (
                <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400">Aucun emprunt trouvé.</p>
                </div>
            ) : (
                <div className="space-y-3">
                {stats.recentLoans.map((loan) => {
                    const isOverdue = new Date(loan.due_date) < new Date() && loan.status !== "returned"
                    const doc = loan.documents?.[0] // <-- CORRECTION ICI : on prend le premier élément du tableau
                    return (
                    <div key={loan.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 dark:text-white truncate">
                            {doc?.title || "Document inconnu"}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {doc?.author || "Auteur inconnu"}
                        </p>
                        </div>
                        <Badge className={
                        loan.status === "returned" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" : 
                        isOverdue ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400" : 
                        "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                        }>
                        {loan.status === "returned" ? "Retourné" : isOverdue ? "En retard" : "En cours"}
                        </Badge>
                    </div>
                    )
                })}
                </div>
            )}
            </CardContent>
        </Card>
        </div>
    )
    }

    interface StatCardProps {
    title: string
    value: number
    icon: React.ElementType
    color: string
    bg: string
    }

    function StatCard({ title, value, icon: Icon, color, bg }: StatCardProps) {
    return (
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <CardContent className="flex items-center gap-4 p-6">
            <div className={`p-3 rounded-lg ${bg}`}>
            <Icon className={`w-6 h-6 ${color}`} />
            </div>
            <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
            </div>
        </CardContent>
        </Card>
    )
    }