    "use client"
    /* eslint-disable react-hooks/set-state-in-effect */

    import { useEffect, useState, useCallback } from "react"
    import { createClient } from "@/lib/supabase/client"
    import { BarChart3, BookOpen, Users, AlertCircle, TrendingUp, Download } from "lucide-react"
    import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
    import { Button } from "@/components/ui/button"

    interface LoanData {
    status: string
    due_date: string
    }

    interface PenaltyData {
    amount: number
    }

    export default function RapportsPage() {
    const supabase = createClient()
    const [stats, setStats] = useState({
        totalDocuments: 0,
        totalMembers: 0,
        activeLoans: 0,
        overdueLoans: 0,
        totalPenaltiesAmount: 0
    })
    const [loading, setLoading] = useState(true)

    const fetchReports = useCallback(async () => {
        setLoading(true)
        const [docs, members, loans, penalties] = await Promise.all([
        supabase.from("documents").select("*", { count: "exact", head: true }),
        supabase.from("members").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("prets").select("status, due_date"),
        supabase.from("penalites").select("amount").eq("status", "unpaid")
        ])

        const today = new Date()
        const loanData = (loans.data as LoanData[]) || []
        const active = loanData.filter((l: LoanData) => l.status === "active" && new Date(l.due_date) >= today).length
        const overdue = loanData.filter((l: LoanData) => l.status === "overdue" || new Date(l.due_date) < today).length
        
        const penaltyData = (penalties.data as PenaltyData[]) || []
        const penaltyTotal = penaltyData.reduce((acc: number, curr: PenaltyData) => acc + (curr.amount || 0), 0)

        setStats({
        totalDocuments: docs.count || 0,
        totalMembers: members.count || 0,
        activeLoans: active,
        overdueLoans: overdue,
        totalPenaltiesAmount: penaltyTotal
        })
        setLoading(false)
    }, [supabase])

    useEffect(() => {
        fetchReports()
    }, [fetchReports])

    if (loading) return <div className="p-8 text-center text-slate-500">Chargement des rapports...</div>

    const circulationRate = stats.totalDocuments > 0 ? Math.round((stats.activeLoans / stats.totalDocuments) * 100) : 0
    const overdueRate = (stats.activeLoans + stats.overdueLoans) > 0 
        ? Math.round((stats.overdueLoans / (stats.activeLoans + stats.overdueLoans)) * 100) 
        : 0

    return (
        <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Rapports Statistiques</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Vue d&apos;ensemble automatisée de l&apos;activité de la bibliothèque.</p>
            </div>
            <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" /> Exporter en PDF
            </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Documents" value={stats.totalDocuments} icon={BookOpen} color="text-blue-600" bg="bg-blue-100 dark:bg-blue-500/10" />
            <StatCard title="Membres Actifs" value={stats.totalMembers} icon={Users} color="text-emerald-600" bg="bg-emerald-100 dark:bg-emerald-500/10" />
            <StatCard title="Emprunts en Retard" value={stats.overdueLoans} icon={AlertCircle} color="text-red-600" bg="bg-red-100 dark:bg-red-500/10" />
            <StatCard title="Amendes Impayées" value={`${stats.totalPenaltiesAmount.toLocaleString()} FCFA`} icon={TrendingUp} color="text-amber-600" bg="bg-amber-100 dark:bg-amber-500/10" />
        </div>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-500" />
                Indicateurs de Performance
            </CardTitle>
            </CardHeader>
            <CardContent>
            <div className="space-y-4">
                <div>
                <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600 dark:text-slate-400">Taux de documents en circulation</span>
                    <span className="font-semibold">{circulationRate}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full transition-all" style={{ width: `${Math.min(circulationRate, 100)}%` }}></div>
                </div>
                </div>
                <div>
                <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600 dark:text-slate-400">Taux de retard sur les emprunts</span>
                    <span className="font-semibold text-red-600">{overdueRate}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                    <div className="bg-red-600 h-2.5 rounded-full transition-all" style={{ width: `${Math.min(overdueRate, 100)}%` }}></div>
                </div>
                </div>
            </div>
            </CardContent>
        </Card>
        </div>
    )
    }

    interface StatCardProps {
    title: string
    value: number | string
    icon: React.ElementType
    color: string
    bg: string
    }

    function StatCard({ title, value, icon: Icon, color, bg }: StatCardProps) {
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