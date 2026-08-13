    import { createServerSupabaseClient } from "@/lib/supabase/server"
    import { Badge } from "@/components/ui/badge"
    import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
    import { AlertCircle, CheckCircle, XCircle, BookOpen, Clock } from "lucide-react"

    // --- Interfaces strictes ---
    interface RetourData {
    id: string
    return_date: string
    due_date: string
    days_late: number
    penalty_amount: number
    book_condition: string
    notes: string | null
    members: { first_name: string; last_name: string; email: string }[] | null
    documents: { title: string; author: string }[] | null
    }

    interface PretEnRetard {
    id: string
    due_date: string
    status: string
    members: { first_name: string; last_name: string; email: string }[] | null
    documents: { title: string; author: string }[] | null
    }

    export default async function AdminRetoursPage() {
    const supabase = await createServerSupabaseClient()
    const today = new Date()

    // 1. Récupérer l'historique des retours
    const { data: retours } = await supabase
        .from("retours")
        .select(`
        id,
        return_date,
        due_date,
        days_late,
        penalty_amount,
        book_condition,
        notes,
        members (first_name, last_name, email),
        documents (title, author)
        `)
        .order("return_date", { ascending: false })

    // 2. Récupérer les documents NON retournés (prêts actifs en retard)
    const { data: pretsEnRetard } = await supabase
        .from("prets")
        .select(`
        id,
        due_date,
        status,
        members (first_name, last_name, email),
        documents (title, author)
        `)
        .lt("due_date", today.toISOString())
        .in("status", ["active", "overdue"])
        .order("due_date", { ascending: true })

    const typedRetours = (retours as RetourData[]) || []
    const typedPretsEnRetard = (pretsEnRetard as PretEnRetard[]) || []

    // Statistiques
    const retoursATemps = typedRetours.filter((r) => r.days_late === 0).length
    const retoursEnRetard = typedRetours.filter((r) => r.days_late > 0).length
    const livresEndommages = typedRetours.filter((r) => r.book_condition === "damaged").length
    const totalPenalites = typedRetours.reduce((acc, curr) => acc + (curr.penalty_amount || 0), 0)

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
        })
    }

    const getDaysLate = (dueDate: string) => {
        const due = new Date(dueDate)
        const diff = Math.ceil((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
        return diff > 0 ? diff : 0
    }

    return (
        <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Gestion des retours
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
            Historique des retours et documents en retard
            </p>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardContent className="p-6">
                <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-500/20">
                    <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
                </div>
                <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Retours à temps</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{retoursATemps}</p>
                </div>
                </div>
            </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardContent className="p-6">
                <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-500/20">
                    <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-500" />
                </div>
                <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Retours en retard</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{retoursEnRetard}</p>
                </div>
                </div>
            </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardContent className="p-6">
                <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-red-100 dark:bg-red-500/20">
                    <XCircle className="w-6 h-6 text-red-600 dark:text-red-500" />
                </div>
                <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Livres endommagés</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{livresEndommages}</p>
                </div>
                </div>
            </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardContent className="p-6">
                <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-500/20">
                    <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-500" />
                </div>
                <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Total pénalités</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalPenalites.toLocaleString()} FCFA</p>
                </div>
                </div>
            </CardContent>
            </Card>
        </div>

        {/* SECTION : Documents non retournés (en retard) */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-red-600 dark:text-red-500">
                <Clock className="w-5 h-5" />
                Documents non retournés ({typedPretsEnRetard.length})
            </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
            {typedPretsEnRetard.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-500/50" />
                <p>Aucun document en retard. Tous les emprunts sont à jour !</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Livre</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Membre</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date de retour prévue</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Jours de retard</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Statut</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {typedPretsEnRetard.map((pret) => {
                        const doc = pret.documents?.[0]
                        const member = pret.members?.[0]
                        const daysLate = getDaysLate(pret.due_date)

                        return (
                        <tr key={pret.id} className="hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-colors">
                            <td className="px-6 py-4">
                            <div className="font-medium text-slate-900 dark:text-white">{doc?.title || "Inconnu"}</div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">{doc?.author}</div>
                            </td>
                            <td className="px-6 py-4">
                            <div className="font-medium text-slate-900 dark:text-white">
                                {member ? `${member.first_name} ${member.last_name}` : "Inconnu"}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">{member?.email}</div>
                            </td>
                            <td className="px-6 py-4 text-red-600 dark:text-red-400 font-medium">
                            {formatDate(pret.due_date)}
                            </td>
                            <td className="px-6 py-4">
                            <Badge className="bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">
                                {daysLate} jour(s)
                            </Badge>
                            </td>
                            <td className="px-6 py-4">
                            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                                En attente de retour
                            </Badge>
                            </td>
                        </tr>
                        )
                    })}
                    </tbody>
                </table>
                </div>
            )}
            </CardContent>
        </Card>

        {/* SECTION : Historique des retours */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                Historique des retours ({typedRetours.length})
            </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
            {typedRetours.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                <p>Aucun retour enregistré pour le moment.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Livre</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Membre</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date de retour</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Retard</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Pénalité</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">État</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Notes</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {typedRetours.map((retour) => {
                        const doc = retour.documents?.[0]
                        const member = retour.members?.[0]

                        return (
                        <tr key={retour.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-6 py-4">
                            <div className="font-medium text-slate-900 dark:text-white">{doc?.title || "Inconnu"}</div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">{doc?.author}</div>
                            </td>
                            <td className="px-6 py-4">
                            <div className="font-medium text-slate-900 dark:text-white">
                                {member ? `${member.first_name} ${member.last_name}` : "Inconnu"}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">{member?.email}</div>
                            </td>
                            <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                            {formatDate(retour.return_date)}
                            </td>
                            <td className="px-6 py-4">
                            {retour.days_late > 0 ? (
                                <Badge className="bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">
                                {retour.days_late} jour(s)
                                </Badge>
                            ) : (
                                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                                À temps
                                </Badge>
                            )}
                            </td>
                            <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                            {retour.penalty_amount > 0 ? (
                                <span className="text-red-600 dark:text-red-400">{retour.penalty_amount} FCFA</span>
                            ) : (
                                <span className="text-slate-400">Aucune</span>
                            )}
                            </td>
                            <td className="px-6 py-4">
                            <Badge
                                variant="outline"
                                className={
                                retour.book_condition === "good"
                                    ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                                    : retour.book_condition === "damaged"
                                    ? "border-red-500 text-red-600 dark:text-red-400"
                                    : "border-amber-500 text-amber-600 dark:text-amber-400"
                                }
                            >
                                {retour.book_condition === "good"
                                ? "Bon état"
                                : retour.book_condition === "damaged"
                                ? "Endommagé"
                                : "Perdu"}
                            </Badge>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 max-w-xs truncate">
                            {retour.notes || "-"}
                            </td>
                        </tr>
                        )
                    })}
                    </tbody>
                </table>
                </div>
            )}
            </CardContent>
        </Card>
        </div>
    )
    }