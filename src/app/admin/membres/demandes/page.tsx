    "use client"

    import { useEffect, useState, useCallback } from "react"
    import { createClient } from "@/lib/supabase/client"
    import { Check, X, User, Mail, Calendar, Loader2 } from "lucide-react"
    import { Button } from "@/components/ui/button"
    import { Card, CardContent } from "@/components/ui/card"
    import { Badge } from "@/components/ui/badge"
    import { ROLE_LABELS, type Member } from "@/lib/roles"

    export default function AdminRequestsPage() {
    const supabase = createClient()
    const [pendingMembers, setPendingMembers] = useState<Member[]>([])
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState<string | null>(null)

    const fetchPendingMembers = useCallback(async () => {
        setLoading(true)
        const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false })

        if (!error && data) {
        setPendingMembers(data as Member[])
        }
        setLoading(false)
    }, [supabase])

        // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => {
        fetchPendingMembers()
    }, [fetchPendingMembers])

    const handleApprove = async (memberId: string) => {
        setProcessing(memberId)
        const { error } = await supabase.from("members").update({ status: "active", updated_at: new Date().toISOString() }).eq("id", memberId)
        if (!error) setPendingMembers((prev) => prev.filter((m) => m.id !== memberId))
        else alert("Erreur lors de la validation.")
        setProcessing(null)
    }

    const handleReject = async (memberId: string) => {
        if (!confirm("Voulez-vous vraiment refuser cette demande ? Le compte sera supprime.")) return
        setProcessing(memberId)
        const { error } = await supabase.from("members").delete().eq("id", memberId)
        if (!error) setPendingMembers((prev) => prev.filter((m) => m.id !== memberId))
        else alert("Erreur lors du refus.")
        setProcessing(null)
    }

    if (loading) {
        return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
    }

    return (
        <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Demandes d&apos;inscription</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Validez les demandes d&apos;inscription recues via le formulaire en ligne.</p>
        </div>

        {pendingMembers.length === 0 ? (
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <User className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Aucune demande en attente</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Toutes les demandes ont ete traitees.</p>
            </CardContent>
            </Card>
        ) : (
            <div className="space-y-4">
            {pendingMembers.map((member) => (
                <Card key={member.id} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-500/30 transition-colors">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <User className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                        </div>
                        <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white text-lg">{member.first_name} {member.last_name}</h3>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{member.email}</span>
                            {member.phone && <span>{member.phone}</span>}
                            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(member.created_at).toLocaleDateString("fr-FR")}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                            <Badge variant="outline" className="border-amber-500/50 text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10">{ROLE_LABELS[member.role]}</Badge>
                            {member.department && <Badge variant="outline" className="border-slate-300 dark:border-slate-700">{member.department}</Badge>}
                        </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 md:self-center">
                        <Button variant="outline" onClick={() => handleReject(member.id)} disabled={processing === member.id} className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950">
                        {processing === member.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><X className="w-4 h-4 mr-2" /> Refuser</>}
                        </Button>
                        <Button onClick={() => handleApprove(member.id)} disabled={processing === member.id} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        {processing === member.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-2" /> Valider</>}
                        </Button>
                    </div>
                    </div>
                </CardContent>
                </Card>
            ))}
            </div>
        )}
        </div>
    )
    }