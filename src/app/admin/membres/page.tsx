    "use client"
    /* eslint-disable react-hooks/set-state-in-effect */

    import { useEffect, useState, useCallback } from "react"
    import { createClient } from "@/lib/supabase/client"
    import Link from "next/link"
    import { UserPlus, Loader2, Search, ShieldCheck, ShieldOff } from "lucide-react"
    import { Button } from "@/components/ui/button"
    import { Card, CardContent } from "@/components/ui/card"
    import { Badge } from "@/components/ui/badge"
    import { Input } from "@/components/ui/input"
    import { ROLE_LABELS, STATUS_LABELS, STATUS_COLORS, type Member, type MemberStatus, type Role } from "@/lib/roles"
    import { toast } from "sonner"

    export default function AdminMembersPage() {
    const supabase = createClient()
    const [members, setMembers] = useState<Member[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [roleFilter, setRoleFilter] = useState<Role | "all">("all")
    const [statusFilter, setStatusFilter] = useState<MemberStatus | "all">("all")
    const [processing, setProcessing] = useState<string | null>(null)

    const loadMembers = useCallback(async () => {
        setLoading(true)
        const { data, error } = await supabase
        .from("members")
        .select("*")
        .order("created_at", { ascending: false })

        if (!error && data) setMembers(data as Member[])
        setLoading(false)
    }, [supabase])

    useEffect(() => {
        void loadMembers()
    }, [loadMembers])

    const handleToggleStatus = async (member: Member) => {
        if (processing) return
        setProcessing(member.id)

        const nextStatus: MemberStatus = member.status === "active" ? "suspended" : "active"
        const { error } = await supabase
        .from("members")
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq("id", member.id)

        if (!error) {
        setMembers((prev) => prev.map((m) => (m.id === member.id ? { ...m, status: nextStatus } : m)))
        toast.success(member.status === "active" ? "Membre suspendu." : "Membre réactivé.")
        } else {
        toast.error("Erreur lors de la mise à jour du statut.")
        }
        setProcessing(null)
    }

    const filtered = members.filter((m) => {
        const matchesSearch =
        !search ||
        `${m.first_name} ${m.last_name} ${m.email} ${m.matricule ?? ""}`.toLowerCase().includes(search.toLowerCase())
        const matchesRole = roleFilter === "all" || m.role === roleFilter
        const matchesStatus = statusFilter === "all" || m.status === statusFilter
        return matchesSearch && matchesRole && matchesStatus
    })

    if (loading) {
        return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
    }

    const pendingCount = members.filter((m) => m.status === "pending").length

    return (
        <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Gestion des Membres</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
                Consultez et gérez les comptes de tous les membres de la bibliothèque.
            </p>
            </div>
            <div className="flex items-center gap-2">
            <Link href="/admin/membres/online">
                <Button variant="outline" className="border-slate-300 dark:border-slate-700">
                <UserPlus className="w-4 h-4 mr-2 text-amber-500" />
                Nouveau membre
                </Button>
            </Link>
            <Link href="/admin/membres/demandes">
                <Button className="bg-amber-500 hover:bg-amber-600 text-white relative">
                Demandes
                {pendingCount > 0 && (
                    <span className="absolute -top-2 -right-2 h-5 min-w-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                    {pendingCount}
                    </span>
                )}
                </Button>
            </Link>
            </div>
        </div>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardContent className="p-4 space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                    placeholder="Rechercher par nom, email, matricule..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                />
                </div>
                <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as Role | "all")}
                className="h-10 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                >
                <option value="all">Tous les rôles</option>
                {Object.entries(ROLE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                ))}
                </select>
                <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as MemberStatus | "all")}
                className="h-10 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                >
                <option value="all">Tous les statuts</option>
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                ))}
                </select>
            </div>

            {filtered.length === 0 ? (
                <div className="py-12 text-center text-slate-500">Aucun membre trouvé.</div>
            ) : (
                <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                        <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-300 uppercase text-xs">Membre</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-300 uppercase text-xs">Matricule</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-300 uppercase text-xs">Rôle</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-300 uppercase text-xs">Statut</th>
                        <th className="px-4 py-3 text-right font-medium text-slate-500 dark:text-slate-300 uppercase text-xs">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {filtered.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3">
                            <p className="font-medium text-slate-900 dark:text-white">{m.first_name} {m.last_name}</p>
                            <p className="text-xs text-slate-500">{m.email}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-mono text-xs">{m.matricule || "—"}</td>
                        <td className="px-4 py-3">
                            <Badge variant="outline" className="border-slate-300 dark:border-slate-700">{ROLE_LABELS[m.role]}</Badge>
                        </td>
                        <td className="px-4 py-3">
                            <Badge className={STATUS_COLORS[m.status]}>{STATUS_LABELS[m.status]}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                            {m.status === "pending" ? (
                            <span className="text-xs text-slate-400">À valider dans les demandes</span>
                            ) : (
                            <Button
                                size="sm"
                                variant={m.status === "active" ? "outline" : "default"}
                                disabled={processing === m.id}
                                onClick={() => handleToggleStatus(m)}
                                className={m.status === "active"
                                ? "border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-400"
                                : "bg-emerald-600 hover:bg-emerald-700 text-white"}
                            >
                                {processing === m.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                                ) : m.status === "active" ? (
                                <>
                                    <ShieldOff className="w-4 h-4 mr-1.5" /> Suspendre
                                </>
                                ) : (
                                <>
                                    <ShieldCheck className="w-4 h-4 mr-1.5" /> Réactiver
                                </>
                                )}
                            </Button>
                            )}
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>
            )}
            </CardContent>
        </Card>
        </div>
    )
    }
