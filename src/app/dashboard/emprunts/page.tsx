        "use client"

        import {useEffect, useState } from "react"
        import { useRouter } from "next/navigation"
        import { createClient } from "@/lib/supabase/client"
        import { useAuth } from "@/hooks/use-auth"
        import { Card, CardContent } from "@/components/ui/card"
        import { Badge } from "@/components/ui/badge"
        import { 
        BookOpen, 
        Clock, 
        CheckCircle2, 
        AlertCircle, 
        History, 
        Calendar,
        Loader2,
        ArrowLeft,
        RotateCcw
        } from "lucide-react"
        import Link from "next/link"
        import { Button } from "@/components/ui/button"

        // Types flexibles (Supabase renvoie objet OU tableau)
        type MaybeArray<T> = T | T[] | null

        interface AuteurInfo { id: string; name: string }
        interface DocumentInfo {
        title: string
        auteurs: MaybeArray<AuteurInfo>
        }
        interface ExemplaireInfo {
        barcode: string
        }

        interface Loan {
        id: string
        loan_date: string
        due_date: string
        status: string
        documents: MaybeArray<DocumentInfo>
        exemplaires: MaybeArray<ExemplaireInfo>
        }

        interface Retour {
        id: string
        return_date: string
        days_late: number
        penalty_amount: number
        book_condition: string
        pret_id: string
        prets: {
            loan_date: string
            due_date: string
            documents: MaybeArray<DocumentInfo>
            exemplaires: MaybeArray<ExemplaireInfo>
        } | null
        }

        function toSingle<T>(rel: MaybeArray<T>): T | null {
        if (!rel) return null
        if (Array.isArray(rel)) return rel[0] ?? null
        return rel
        }

        function getAuthorName(doc: DocumentInfo | null): string {
        if (!doc) return "Auteur inconnu"
        return toSingle(doc.auteurs)?.name || "Auteur inconnu"
        }

        function formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
            year: "numeric",
        })
        }

        export default function MesEmpruntsPage() {
        const router = useRouter()
        const supabase = createClient()
        const { member, loading: authLoading } = useAuth()

        const [activeLoans, setActiveLoans] = useState<Loan[]>([])
        const [returnedLoans, setReturnedLoans] = useState<Retour[]>([])
        const [loading, setLoading] = useState(true)

        useEffect(() => {
            if (authLoading) return
            if (!member) {
            router.replace("/login")
            return
            }

            let isCancelled = false

            const loadData = async () => {
            setLoading(true)

            try {
                const { data: loansData, error: loansError } = await supabase
                .from("prets")
                .select(`
                    id,
                    loan_date,
                    due_date,
                    status,
                    documents (title, auteurs (id, name)),
                    exemplaires (barcode)
                `)
                .eq("member_id", member.id)
                .in("status", ["active", "overdue"])
                .order("due_date", { ascending: true })

                const { data: returnsData, error: returnsError } = await supabase
                .from("retours")
                .select(`
                    id,
                    return_date,
                    days_late,
                    penalty_amount,
                    book_condition,
                    pret_id,
                    prets (
                        loan_date,
                        due_date,
                        documents (title, auteurs (id, name)),
                        exemplaires (barcode)
                    )
                `)
                .eq("member_id", member.id)
                .order("return_date", { ascending: false })
                .limit(50)

                if (loansError || returnsError) {
                const message = loansError?.message || returnsError?.message || ""
                const isMissingTable = /does not exist|not found|404|PGRST205/i.test(message)

                if (isMissingTable) {
                    console.warn("Tables de données absentes pour les emprunts ; affichage vide.", { loansError, returnsError })
                    if (!isCancelled) {
                    setActiveLoans([])
                    setReturnedLoans([])
                    }
                    return
                }

                throw loansError || returnsError
                }

                if (!isCancelled) {
                setActiveLoans((loansData as unknown as Loan[]) || [])
                setReturnedLoans((returnsData as unknown as Retour[]) || [])
                }
            } catch (err) {
                console.error("Erreur chargement:", err)
                if (!isCancelled) {
                setActiveLoans([])
                setReturnedLoans([])
                }
            } finally {
                if (!isCancelled) {
                setLoading(false)
                }
            }
            }

            void loadData()

            return () => {
            isCancelled = true
            }
        }, [authLoading, member, router, supabase])

        if (authLoading || !member) return null

        const today = new Date()
        const overdueCount = activeLoans.filter((l) => new Date(l.due_date) < today).length
        const totalReturned = returnedLoans.length
        const totalLate = returnedLoans.filter((r) => r.days_late > 0).length
        const totalPenalties = returnedLoans.reduce((sum, r) => sum + (r.penalty_amount || 0), 0)

        return (
            <div className="max-w-6xl mx-auto space-y-6">
            {/* En-tête */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard">
                <Button variant="ghost" size="icon">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                </Link>
                <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    Mes Emprunts
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Consultez vos emprunts en cours et votre historique complet.
                </p>
                </div>
            </div>

            {/* Statistiques rapides */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                icon={BookOpen}
                label="En cours"
                value={activeLoans.length}
                color="blue"
                />
                <StatCard
                icon={AlertCircle}
                label="En retard"
                value={overdueCount}
                color="red"
                />
                <StatCard
                icon={CheckCircle2}
                label="Retournés"
                value={totalReturned}
                color="green"
                />
                <StatCard
                icon={Calendar}
                label="Retards passés"
                value={totalLate}
                color="amber"
                />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                </div>
            ) : (
                <>
                {/* ========== EMPRUNTS EN COURS ========== */}
                <section className="space-y-4">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-500" />
                    Emprunts en cours ({activeLoans.length})
                    </h2>

                    {activeLoans.length === 0 ? (
                    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500/50 mb-3" />
                        <p className="text-slate-500 dark:text-slate-400">
                            Vous n&apos;avez aucun emprunt en cours.
                        </p>
                        <Link href="/catalogue" className="mt-4">
                            <Button className="bg-amber-500 hover:bg-amber-600 text-white">
                            <BookOpen className="w-4 h-4 mr-2" />
                            Parcourir le catalogue
                            </Button>
                        </Link>
                        </CardContent>
                    </Card>
                    ) : (
                    <div className="space-y-3">
                        {activeLoans.map((loan) => {
                        const doc = toSingle(loan.documents)
                        const exemplaire = toSingle(loan.exemplaires)
                        const isOverdue = new Date(loan.due_date) < today
                        const daysRemaining = Math.ceil(
                            (new Date(loan.due_date).getTime() - today.getTime()) /
                            (1000 * 60 * 60 * 24)
                        )

                        return (
                            <Card
                            key={loan.id}
                            className={`bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 ${
                                isOverdue ? "border-red-300 dark:border-red-500/30" : ""
                            }`}
                            >
                            <CardContent className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div
                                    className={`w-12 h-16 rounded flex items-center justify-center shrink-0 ${
                                    isOverdue
                                        ? "bg-red-100 dark:bg-red-500/20"
                                        : "bg-slate-100 dark:bg-slate-800"
                                    }`}
                                >
                                    <BookOpen
                                    className={`w-6 h-6 ${
                                        isOverdue
                                        ? "text-red-500"
                                        : "text-slate-400"
                                    }`}
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                                    {doc?.title || "Titre inconnu"}
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                                    {getAuthorName(doc)}
                                    </p>
                                    {exemplaire && (
                                    <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-1">
                                        Code : {exemplaire.barcode}
                                    </p>
                                    )}
                                </div>
                                </div>
                                <div className="flex flex-col items-end gap-1 ml-4 shrink-0">
                                <Badge
                                    className={
                                    isOverdue
                                        ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                                    }
                                >
                                    {isOverdue ? "⚠️ En retard" : "✓ À temps"}
                                </Badge>
                                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {isOverdue
                                    ? `Retard de ${Math.abs(daysRemaining)}j`
                                    : daysRemaining === 0
                                    ? "À rendre aujourd'hui"
                                    : `Retour dans ${daysRemaining}j`}
                                </span>
                                <span className="text-xs text-slate-400 dark:text-slate-500">
                                    Échéance : {formatDate(loan.due_date)}
                                </span>
                                </div>
                            </CardContent>
                            </Card>
                        )
                        })}
                    </div>
                    )}
                </section>

                {/* ========== HISTORIQUE DES RETOURS ========== */}
                <section className="space-y-4 pt-6">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <History className="w-5 h-5 text-amber-500" />
                    Historique des retours ({totalReturned})
                    </h2>

                    {totalReturned === 0 ? (
                    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <History className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
                        <p className="text-slate-500 dark:text-slate-400">
                            Aucun retour enregistré pour le moment.
                        </p>
                        </CardContent>
                    </Card>
                    ) : (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                Document
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                Emprunté
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                Retourné
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                État
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                                Pénalité
                                </th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {returnedLoans.map((retour) => {
                                const pret = retour.prets as {
                                loan_date: string
                                due_date: string
                                documents: MaybeArray<DocumentInfo>
                                exemplaires: MaybeArray<ExemplaireInfo>
                                } | null
                                const doc = pret ? toSingle(pret.documents) : null

                                return (
                                <tr
                                    key={retour.id}
                                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                >
                                    <td className="px-6 py-4">
                                    <div className="font-medium text-slate-900 dark:text-white">
                                        {doc?.title || "Document"}
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                        {getAuthorName(doc)}
                                    </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                    {pret ? formatDate(pret.loan_date) : "-"}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                    {formatDate(retour.return_date)}
                                    </td>
                                    <td className="px-6 py-4">
                                    {retour.days_late > 0 ? (
                                        <Badge className="bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">
                                        Retard {retour.days_late}j
                                        </Badge>
                                    ) : (
                                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                                        À temps
                                        </Badge>
                                    )}
                                    {retour.book_condition === "damaged" && (
                                        <Badge className="ml-1 bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                                        Endommagé
                                        </Badge>
                                    )}
                                    {retour.book_condition === "lost" && (
                                        <Badge className="ml-1 bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">
                                        Perdu
                                        </Badge>
                                    )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                    {retour.penalty_amount > 0 ? (
                                        <span className="font-semibold text-red-600 dark:text-red-400">
                                        {retour.penalty_amount.toLocaleString()} FCFA
                                        </span>
                                    ) : (
                                        <span className="text-slate-400">—</span>
                                    )}
                                    </td>
                                </tr>
                                )
                            })}
                            </tbody>
                        </table>
                        </div>
                    </div>
                    )}
                </section>

                {/* Alerte pénalités impayées */}
                {totalPenalties > 0 && (
                    <Card className="bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30">
                    <CardContent className="flex items-center gap-4 p-4">
                        <RotateCcw className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0" />
                        <div className="flex-1">
                        <p className="font-semibold text-amber-900 dark:text-amber-300">
                            Total des pénalités historiques
                        </p>
                        <p className="text-sm text-amber-700 dark:text-amber-400">
                            {totalPenalties.toLocaleString()} FCFA • Pour toute question, contactez l&apos;accueil de la bibliothèque.
                        </p>
                        </div>
                    </CardContent>
                    </Card>
                )}
                </>
            )}
            </div>
        )
        }

        // Petit composant pour les stats
        function StatCard({
        icon: Icon,
        label,
        value,
        color,
        }: {
        icon: React.ElementType
        label: string
        value: number
        color: "blue" | "red" | "green" | "amber"
        }) {
        const colors = {
            blue: "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
            red: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400",
            green: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
            amber: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
        }

        return (
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardContent className="flex items-center gap-3 p-4">
                <div className={`p-2 rounded-lg ${colors[color]}`}>
                <Icon className="w-5 h-5" />
                </div>
                <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                    {value}
                </p>
                </div>
            </CardContent>
            </Card>
        )
        }