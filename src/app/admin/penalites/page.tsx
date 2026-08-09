    "use client"

    import { useEffect, useState, useCallback } from "react"
    import { createClient } from "@/lib/supabase/client"
    import { AlertCircle, CheckCircle, XCircle, DollarSign, Loader2 } from "lucide-react"
    import { Button } from "@/components/ui/button"
    import { Card, CardContent } from "@/components/ui/card"
    import { Badge } from "@/components/ui/badge"

    interface Penalite {
    id: string
    member_id: string
    type: string
    amount: number
    days: number
    reason: string
    status: string
    created_at: string
    resolved_at: string | null
    members: {
        first_name: string
        last_name: string
        email: string
    }
    }

    export default function AdminPenalitesPage() {
    const supabase = createClient()
    const [penalites, setPenalites] = useState<Penalite[]>([])
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState<string | null>(null)

    const fetchPenalites = useCallback(async () => {
        setLoading(true)
        const { data, error } = await supabase
        .from("penalites")
        .select(`
            *,
            members (first_name, last_name, email)
        `)
        .order("created_at", { ascending: false })

        if (!error && data) {
        setPenalites(data as Penalite[])
        }
        setLoading(false)
    }, [supabase])

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => {
        fetchPenalites()
    }, [fetchPenalites])

    const handleStatusUpdate = async (id: string, newStatus: "paid" | "waived") => {
        setProcessing(id)
        const { error } = await supabase
        .from("penalites")
        .update({ 
            status: newStatus,
            resolved_at: new Date().toISOString()
        })
        .eq("id", id)

        if (!error) {
        fetchPenalites()
        } else {
        alert("Erreur lors de la mise à jour du statut.")
        }
        setProcessing(null)
    }

    const stats = {
        unpaid: penalites.filter(p => p.status === "unpaid").reduce((acc, curr) => acc + curr.amount, 0),
        paid: penalites.filter(p => p.status === "paid").reduce((acc, curr) => acc + curr.amount, 0),
        waived: penalites.filter(p => p.status === "waived").length,
        total: penalites.length
    }

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
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Gestion des Pénalités</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
            Suivi des amendes pour retards, pertes ou dégradations de documents.
            </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
            title="Impayées" 
            value={`${stats.unpaid.toLocaleString()} FCFA`} 
            icon={AlertCircle} 
            color="text-red-600 dark:text-red-500"
            bg="bg-red-100 dark:bg-red-500/10"
            />
            <StatCard 
            title="Payées" 
            value={`${stats.paid.toLocaleString()} FCFA`} 
            icon={CheckCircle} 
            color="text-emerald-600 dark:text-emerald-500"
            bg="bg-emerald-100 dark:bg-emerald-500/10"
            />
            <StatCard 
            title="Annulées" 
            value={stats.waived.toString()} 
            icon={XCircle} 
            color="text-slate-600 dark:text-slate-500"
            bg="bg-slate-100 dark:bg-slate-500/10"
            />
            <StatCard 
            title="Total des cas" 
            value={stats.total.toString()} 
            icon={DollarSign} 
            color="text-blue-600 dark:text-blue-500"
            bg="bg-blue-100 dark:bg-blue-500/10"
            />
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto">
            <table className="w-full min-w-[800px]">
            <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Membre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Motif</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Montant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {penalites.length === 0 ? (
                <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    Aucune pénalité enregistrée pour le moment.
                    </td>
                </tr>
                ) : (
                penalites.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                        {p.members?.first_name} {p.members?.last_name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{p.members?.email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 capitalize">
                        {p.type === "late" ? "Retard" : p.type === "lost" ? "Perte" : p.type === "damage" ? "Dégradation" : "Autre"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                        {p.reason || "-"}
                        {p.days > 0 && <span className="block text-xs text-slate-400 mt-1">{p.days} jour(s)</span>}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white">
                        {p.amount.toLocaleString()} FCFA
                    </td>
                    <td className="px-6 py-4">
                        <Badge className={
                        p.status === "unpaid" ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400" :
                        p.status === "paid" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" :
                        "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400"
                        }>
                        {p.status === "unpaid" ? "Impayée" : p.status === "paid" ? "Payée" : "Annulée"}
                        </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                        {p.status === "unpaid" && (
                        <div className="flex justify-end gap-2">
                            <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleStatusUpdate(p.id, "paid")}
                            disabled={processing === p.id}
                            className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-400"
                            >
                            {processing === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Marquer payée"}
                            </Button>
                            <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleStatusUpdate(p.id, "waived")}
                            disabled={processing === p.id}
                            className="border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400"
                            >
                            Annuler
                            </Button>
                        </div>
                        )}
                    </td>
                    </tr>
                ))
                )}
            </tbody>
            </table>
        </div>
        </div>
    )
    }

    function StatCard({ title, value, icon: Icon, color, bg }: { 
    title: string; 
    value: string; 
    icon: React.ElementType; 
    color: string;
    bg: string;
    }) {
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