"use client"
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import {
    BookOpen,
    Loader2,
    Plus,
    RotateCcw,
    AlertCircle,
    Clock3,
    CheckCircle2,
    ArrowRight,
    Library,
    TrendingUp,
    FileText,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface LoanData {
    id: string
    status: string
    due_date: string
    loan_date: string
    members: { first_name: string; last_name: string } | null
    documents: { title: string } | null
}

interface ReceptionStats {
    activeLoans: number
    overdueLoans: number
    availableCopies: number
    totalBooks: number
    todayReturns: number
}

const initialStats: ReceptionStats = {
    activeLoans: 0,
    overdueLoans: 0,
    availableCopies: 0,
    totalBooks: 0,
    todayReturns: 0,
}

export default function ReceptionPage() {
    const supabase = createClient()
    const { member } = useAuth()
    const [stats, setStats] = useState(initialStats)
    const [recentLoans, setRecentLoans] = useState<LoanData[]>([])
    const [loading, setLoading] = useState(true)

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const today = new Date().toISOString().split("T")[0]

            const [active, overdue, copies, books, returns, recent] = await Promise.all([
                supabase.from("prets").select("*", { count: "exact", head: true }).eq("status", "active"),
                supabase.from("prets").select("*", { count: "exact", head: true }).eq("status", "overdue"),
                supabase.from("exemplaires").select("status"),
                supabase.from("documents").select("*", { count: "exact", head: true }),
                supabase.from("prets").select("*", { count: "exact", head: true }).eq("status", "returned").gte("return_date", today),
                supabase
                    .from("prets")
                    .select("id, status, due_date, loan_date, members (first_name, last_name), documents (title)")
                    .in("status", ["active", "overdue"])
                    .order("loan_date", { ascending: false })
                    .limit(8),
            ])

            const copyRows = copies.data || []

            setStats({
                activeLoans: active.count || 0,
                overdueLoans: overdue.count || 0,
                availableCopies: copyRows.filter((c) => c.status === "available").length,
                totalBooks: books.count || 0,
                todayReturns: returns.count || 0,
            })

            setRecentLoans((recent.data as unknown as LoanData[]) || [])
        } catch (err) {
            console.error("Erreur chargement réception:", err)
        } finally {
            setLoading(false)
        }
    }, [supabase])

    useEffect(() => { void fetchData() }, [fetchData])

    if (!member) {
        return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-amber-500" /></div>
    }

    if (loading) {
        return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-amber-500" /></div>
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <section className="relative overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-white via-blue-50/60 to-amber-50/50 p-6 shadow-lg shadow-blue-500/5 sm:p-8 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900/60 dark:to-slate-900">
                <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl" />
                <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-xs font-medium text-amber-600 dark:text-amber-300">
                            <Library className="h-3.5 w-3.5" /> Compte-rendu
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl dark:text-white">
                            Bonjour, {member.first_name}
                        </h1>
                        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                            Gérez les emprunts, retours et catalogage depuis votre poste de travail.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Link href="/admin/emprunt">
                            <Button className="h-11 bg-amber-500 text-white hover:bg-amber-600">
                                <Plus className="mr-2 h-4 w-4" /> Nouvel emprunt
                            </Button>
                        </Link>
                        <Link href="/admin/books/new">
                            <Button variant="outline" className="h-11 border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800">
                                <BookOpen className="mr-2 h-4 w-4" /> Cataloguer
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-500/10">
                                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Emprunts actifs</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.activeLoans}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-red-100 p-2 dark:bg-red-500/10">
                                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">En retard</p>
                                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.overdueLoans}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-500/10">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Retours aujourd&apos;hui</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.todayReturns}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-500/10">
                                <BookOpen className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Exemplaires dispo.</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.availableCopies}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Quick actions */}
            <section>
                <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Actions rapides</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Link href="/admin/emprunt">
                        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-500/50 transition-all cursor-pointer group h-full">
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-500/10">
                                    <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-500">Nouvel emprunt</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Enregistrer un prêt</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/admin/circulation">
                        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-500/50 transition-all cursor-pointer group h-full">
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-500/10">
                                    <RotateCcw className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-500">Retours</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Gérer les retours</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/admin/books/new">
                        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-500/50 transition-all cursor-pointer group h-full">
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-500/10">
                                    <BookOpen className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-500">Cataloguer</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Ajouter un document</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/admin/books">
                        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-500/50 transition-all cursor-pointer group h-full">
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="rounded-lg bg-violet-100 p-2 dark:bg-violet-500/10">
                                    <FileText className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-500">Documents</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Voir le catalogue</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </section>

            {/* Recent loans */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Emprunts récents</h2>
                    <Link href="/admin/emprunt" className="text-sm text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 flex items-center gap-1">
                        Tout voir <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {recentLoans.length === 0 ? (
                    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <CardContent className="p-8 text-center">
                            <Clock3 className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
                            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Aucun emprunt en cours</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                        <div className="divide-y divide-slate-200 dark:divide-slate-800">
                            {recentLoans.map((loan) => {
                                const memberName = loan.members
                                    ? `${loan.members.first_name} ${loan.members.last_name}`
                                    : "Membre inconnu"
                                const bookTitle = loan.documents?.title || "Document inconnu"
                                const isOverdue = loan.status === "overdue"

                                return (
                                    <div key={loan.id} className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <div className={`rounded-lg p-2 ${isOverdue ? "bg-red-100 dark:bg-red-500/10" : "bg-blue-100 dark:bg-blue-500/10"}`}>
                                            {isOverdue
                                                ? <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                                : <Clock3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                            }
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{bookTitle}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{memberName}</p>
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className={`shrink-0 ${
                                                isOverdue
                                                    ? "border-red-300 text-red-700 dark:border-red-700 dark:text-red-400"
                                                    : "border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"
                                            }`}
                                        >
                                            {isOverdue ? "En retard" : `Échéance: ${new Date(loan.due_date).toLocaleDateString("fr-FR")}`}
                                        </Badge>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </section>
        </div>
    )
}
