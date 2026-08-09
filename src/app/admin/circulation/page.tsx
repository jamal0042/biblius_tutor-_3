    "use client"

    import { useEffect, useState, useCallback } from "react"
    import { createClient } from "@/lib/supabase/client"
    import { BookOpen, Search, Filter, CheckCircle, AlertCircle, Clock, Calendar } from "lucide-react"
    import { Button } from "@/components/ui/button"
    import { Input } from "@/components/ui/input"
    import { Badge } from "@/components/ui/badge"
    import { Card, CardContent } from "@/components/ui/card"
    import { ROLE_LABELS } from "@/lib/roles"

    interface Pret {
    id: string
    member_id: string
    document_id: string
    type: string
    loan_date: string
    due_date: string
    return_date: string | null
    status: string
    members: {
        first_name: string
        last_name: string
        email: string
        role: string
    }
    documents: {
        title: string
        author: string
    }
    }

    export default function CirculationPage() {
    const supabase = createClient()
    const [prets, setPrets] = useState<Pret[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [filterStatus, setFilterStatus] = useState("all")

    const fetchPrets = useCallback(async () => {
        setLoading(true)
        const { data, error } = await supabase
        .from("prets")
        .select(`
            *,
            members (first_name, last_name, email, role),
            documents (title, author)
        `)
        .order("loan_date", { ascending: false })

        if (!error && data) {
        setPrets(data as Pret[])
        }
        setLoading(false)
    }, [supabase])
        // eslint-disable-next-line react-hooks/set-state-in-effect
        useEffect(() => {
            fetchPrets()
        }, [fetchPrets])

    const handleReturn = async (pretId: string) => {
        const { error } = await supabase
        .from("prets")
        .update({ 
            status: "returned",
            return_date: new Date().toISOString().split("T")[0]
        })
        .eq("id", pretId)

        if (!error) {
        fetchPrets()
        } else {
        alert("Erreur lors de l'enregistrement du retour")
        }
    }

    const filteredPrets = prets.filter((pret) => {
        const matchesSearch = 
        pret.documents.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pret.members.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pret.members.last_name.toLowerCase().includes(searchTerm.toLowerCase())
        
        const matchesFilter = filterStatus === "all" || pret.status === filterStatus
        
        return matchesSearch && matchesFilter
    })

    const stats = {
        total: prets.length,
        active: prets.filter(p => p.status === "active").length,
        overdue: prets.filter(p => p.status === "overdue").length,
        returned: prets.filter(p => p.status === "returned").length
    }

    if (loading) {
        return (
        <div className="flex items-center justify-center h-64">
            <div className="text-center">
            <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4 animate-pulse" />
            <p className="text-slate-500 dark:text-slate-400">Chargement des emprunts...</p>
            </div>
        </div>
        )
    }

    return (
        <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Circulation</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Gestion des emprunts et retours de documents</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total des emprunts" value={stats.total.toString()} icon={BookOpen} color="text-blue-600 dark:text-blue-500" bg="bg-blue-100 dark:bg-blue-500/10" />
            <StatCard title="En cours" value={stats.active.toString()} icon={Clock} color="text-amber-600 dark:text-amber-500" bg="bg-amber-100 dark:bg-amber-500/10" />
            <StatCard title="En retard" value={stats.overdue.toString()} icon={AlertCircle} color="text-red-600 dark:text-red-500" bg="bg-red-100 dark:bg-red-500/10" />
            <StatCard title="Retournes" value={stats.returned.toString()} icon={CheckCircle} color="text-emerald-600 dark:text-emerald-500" bg="bg-emerald-100 dark:bg-emerald-500/10" />
        </div>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Rechercher par titre ou membre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                </div>
                <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="flex h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
                    <option value="all">Tous les statuts</option>
                    <option value="active">En cours</option>
                    <option value="overdue">En retard</option>
                    <option value="returned">Retournes</option>
                </select>
                </div>
            </div>
            </CardContent>
        </Card>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
            {filteredPrets.length === 0 ? (
            <div className="p-12 text-center">
                <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <p className="text-slate-500 dark:text-slate-400">Aucun emprunt trouve</p>
            </div>
            ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredPrets.map((pret) => {
                const isOverdue = pret.status === "overdue" || (pret.status === "active" && new Date(pret.due_date) < new Date())
                return (
                    <div key={pret.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-16 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center shrink-0">
                            <BookOpen className="w-6 h-6 text-slate-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-slate-900 dark:text-white truncate">{pret.documents.title}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{pret.documents.author}</p>
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Prete le : {new Date(pret.loan_date).toLocaleDateString("fr-FR")}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Retour prevu : {new Date(pret.due_date).toLocaleDateString("fr-FR")}</span>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                                <span className="text-xs font-medium text-amber-600 dark:text-amber-500">{pret.members.first_name[0]}</span>
                            </div>
                            <span className="text-sm text-slate-700 dark:text-slate-300">{pret.members.first_name} {pret.members.last_name}</span>
                            <Badge variant="outline" className="text-xs border-slate-300 dark:border-slate-700">{ROLE_LABELS[pret.members.role as keyof typeof ROLE_LABELS]}</Badge>
                            </div>
                        </div>
                        </div>
                        <div className="flex items-center gap-3 lg:self-center">
                        <Badge className={isOverdue ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400" : pret.status === "returned" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"}>
                            {isOverdue ? "En retard" : pret.status === "returned" ? "Retourne" : "En cours"}
                        </Badge>
                        {pret.status !== "returned" && (
                            <Button size="sm" onClick={() => handleReturn(pret.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Enregistrer le retour
                            </Button>
                        )}
                        </div>
                    </div>
                    </div>
                )
                })}
            </div>
            )}
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