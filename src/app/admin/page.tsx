    "use client"
    /* eslint-disable react-hooks/set-state-in-effect */

    import { useEffect, useState, useCallback } from "react"
    import { createClient } from "@/lib/supabase/client"
    import { BookOpen, Users, AlertCircle, TrendingUp, Loader2 } from "lucide-react"
    import { Card, CardContent } from "@/components/ui/card"

    interface LoanData {
    status: string
    due_date: string
    }

    interface AdminStats {
    totalMembers: number
    activeMembers: number
    totalBooks: number
    activeLoans: number
    overdueLoans: number
    }

    export default function AdminDashboardPage() {
    const supabase = createClient()
    const [stats, setStats] = useState<AdminStats>({
        totalMembers: 0,
        activeMembers: 0,
        totalBooks: 0,
        activeLoans: 0,
        overdueLoans: 0
    })
    const [loading, setLoading] = useState(true)

    const fetchStats = useCallback(async () => {
        setLoading(true)
        try {
        const [{ count: totalMembers }, { count: activeMembers }, { count: totalBooks }] = await Promise.all([
            supabase.from("members").select("*", { count: "exact", head: true }),
            supabase.from("members").select("*", { count: "exact", head: true }).eq("status", "active"),
            supabase.from("documents").select("*", { count: "exact", head: true })
        ])

        const { data: loans } = await supabase.from("prets").select("status, due_date")
        
        const today = new Date()
        const activeLoans = loans?.filter((l: LoanData) => l.status === "active" && new Date(l.due_date) >= today).length || 0
        const overdueLoans = loans?.filter((l: LoanData) => l.status === "overdue" || new Date(l.due_date) < today).length || 0

        setStats({
            totalMembers: totalMembers || 0,
            activeMembers: activeMembers || 0,
            totalBooks: totalBooks || 0,
            activeLoans,
            overdueLoans
        })
        } catch (error) {
        console.error("Erreur lors du chargement des statistiques:", error)
        } finally {
        setLoading(false)
        }
    }, [supabase])

    useEffect(() => {
        fetchStats()
    }, [fetchStats])

    if (loading) {
        return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
        )
    }

    return (
        <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Tableau de bord</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Vue d&apos;ensemble de l&apos;activité de la bibliothèque.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Membres actifs" value={stats.activeMembers.toString()} icon={Users} color="text-blue-600 dark:text-blue-500" bg="bg-blue-100 dark:bg-blue-500/10" />
            <StatCard title="Documents" value={stats.totalBooks.toString()} icon={BookOpen} color="text-amber-600 dark:text-amber-500" bg="bg-amber-100 dark:bg-amber-500/10" />
            <StatCard title="Emprunts en cours" value={stats.activeLoans.toString()} icon={TrendingUp} color="text-emerald-600 dark:text-emerald-500" bg="bg-emerald-100 dark:bg-emerald-500/10" />
            <StatCard title="Retards" value={stats.overdueLoans.toString()} icon={AlertCircle} color="text-red-600 dark:text-red-500" bg="bg-red-100 dark:bg-red-500/10" />
        </div>
        </div>
    )
    }

    function StatCard({ title, value, icon: Icon, color, bg }: { title: string; value: string; icon: React.ElementType; color: string; bg: string }) {
    return (
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <CardContent className="flex items-center gap-4 p-6">
            <div className={`p-3 rounded-lg ${bg}`}><Icon className={`w-6 h-6 ${color}`} /></div>
            <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
            </div>
        </CardContent>
        </Card>
    )
    }