"use client"
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Activity, AlertCircle, ArrowRight, BarChart3, BookOpen, CheckCircle2, ChevronRight, Clock3, FileText, Library, Loader2, Plus, RotateCcw, TrendingUp, UserPlus, Users } from "lucide-react"
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

interface AdminStats {
  totalMembers: number
  activeMembers: number
  totalBooks: number
  activeLoans: number
  overdueLoans: number
  availableCopies: number
  loanedCopies: number
}

const initialStats: AdminStats = { totalMembers: 0, activeMembers: 0, totalBooks: 0, activeLoans: 0, overdueLoans: 0, availableCopies: 0, loanedCopies: 0 }

// Palette thème-aware (bleu principal + or accent)
const surface = "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"

export default function AdminDashboardPage() {
  const supabase = createClient()
  const [stats, setStats] = useState(initialStats)
  const [recentLoans, setRecentLoans] = useState<LoanData[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    try {
      const [members, activeMembers, documents, copies, active, overdue, recent] = await Promise.all([
        supabase.from("members").select("*", { count: "exact", head: true }),
        supabase.from("members").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("documents").select("*", { count: "exact", head: true }),
        supabase.from("exemplaires").select("status"),
        supabase.from("prets").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("prets").select("*", { count: "exact", head: true }).eq("status", "overdue"),
        supabase.from("prets").select("id, status, due_date, loan_date, members (first_name, last_name), documents (title)").in("status", ["active", "overdue"]).order("loan_date", { ascending: false }).limit(8),
      ])
      const copyRows = copies.data || []
      setStats({
        totalMembers: members.count || 0,
        activeMembers: activeMembers.count || 0,
        totalBooks: documents.count || 0,
        activeLoans: active.count || 0,
        overdueLoans: overdue.count || 0,
        availableCopies: copyRows.filter((copy) => copy.status === "available").length,
        loanedCopies: copyRows.filter((copy) => copy.status === "loaned").length,
      })
      setRecentLoans((recent.data as unknown as LoanData[]) || [])
    } catch (error) {
      console.error("Erreur lors du chargement du tableau de bord :", error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => { void fetchDashboard() }, [fetchDashboard])

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-amber-500" /></div>

  const totalCopies = stats.availableCopies + stats.loanedCopies

  return (
    <div className="space-y-8 bg-slate-50 p-1 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Bandeau d'intro */}
      <section className="relative overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-white via-blue-50/60 to-amber-50/50 p-6 shadow-lg shadow-blue-500/5 sm:p-8 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900/60 dark:to-slate-900">
        <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-xs font-medium text-amber-600 dark:text-amber-300">
              <Activity className="h-3.5 w-3.5" />• Administration
            </div>
            <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl dark:text-white">Tableau de bord</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">Gérez votre bibliothèque, suivez les emprunts et surveillez l&apos;activité de vos membres.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/emprunt"><Button className="h-11 bg-amber-500 text-white hover:bg-amber-600"><Plus className="mr-2 h-4 w-4" />Nouvel emprunt</Button></Link>
            <Link href="/admin/membres/invitations"><Button variant="outline" className="h-11 border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"><UserPlus className="mr-2 h-4 w-4" />Inviter un membre</Button></Link>
          </div>
        </div>
      </section>

      {/* Vue d'ensemble */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Vue d&apos;ensemble</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Les indicateurs principaux de votre bibliothèque.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Membres actifs" value={stats.activeMembers} description={`${stats.totalMembers} membres au total`} icon={Users} tone="blue" />
          <StatCard title="Documents" value={stats.totalBooks} description={`${stats.availableCopies} exemplaires disponibles`} icon={BookOpen} tone="gold" />
          <StatCard title="Emprunts en cours" value={stats.activeLoans} description={`${stats.loanedCopies} exemplaires prêtés`} icon={TrendingUp} tone="green" />
          <StatCard title="Retards" value={stats.overdueLoans} description={stats.overdueLoans ? "Nécessitent votre attention" : "Aucun retard actuellement"} icon={AlertCircle} tone="red" danger={stats.overdueLoans > 0} />
        </div>
      </section>

      {/* Actions rapides */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Actions rapides</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Accédez rapidement aux fonctions les plus utilisées.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction href="/admin/emprunt" icon={Plus} title="Nouvel emprunt" description="Enregistrer un prêt" />
          <QuickAction href="/admin/membres/invitations" icon={UserPlus} title="Nouveau membre" description="Inviter un adhérent" />
          <QuickAction href="/admin/books" icon={Library} title="Documents" description="Gérer le catalogue" />
          <QuickAction href="/admin/retours" icon={RotateCcw} title="Retours" description="Gérer les retours" />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">
        {/* Emprunts récents */}
        <Card className={`overflow-hidden ${surface} text-slate-900 dark:text-white`}>
          <div className={`flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800`}>
            <div>
              <h2 className="font-semibold">Emprunts récents</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Les dernières opérations enregistrées.</p>
            </div>
            <Link href="/admin/emprunt"><Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300">Voir tout<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          </div>
          <CardContent className="p-0">
            {recentLoans.length === 0 ? (
              <div className="p-12 text-center text-slate-500 dark:text-slate-400"><BookOpen className="mx-auto mb-3 h-8 w-8" />Aucun emprunt récent.</div>
            ) : (
              <div className={`divide-y divide-slate-200 dark:divide-slate-800`}>
                {recentLoans.map((loan) => {
                  const overdue = loan.status === "overdue" || new Date(loan.due_date) < new Date()
                  return (
                    <div key={loan.id} className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="hidden h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 sm:flex"><BookOpen className="h-5 w-5 text-amber-600 dark:text-amber-400" /></div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900 dark:text-white">{loan.documents?.title || "Document inconnu"}</p>
                          <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{loan.members ? `${loan.members.first_name} ${loan.members.last_name}` : "Membre inconnu"}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">{new Date(loan.due_date).toLocaleDateString("fr-FR")}</span>
                        <Badge className={overdue ? "bg-red-500/15 text-red-600 dark:text-red-300" : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"}>{overdue ? "En retard" : "En cours"}</Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* État de la bibliothèque */}
        <Card className={`${surface} text-slate-900 dark:text-white`}>
          <div className={`border-b border-slate-200 px-6 py-5 dark:border-slate-800`}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10"><BarChart3 className="h-5 w-5 text-amber-600 dark:text-amber-400" /></div>
              <div>
                <h2 className="font-semibold">État de la bibliothèque</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Disponibilité des exemplaires</p>
              </div>
            </div>
          </div>
          <CardContent className="space-y-6 p-6">
            <LibraryStatus label="Exemplaires disponibles" value={stats.availableCopies} total={totalCopies} icon={CheckCircle2} color="text-emerald-600 dark:text-emerald-400" />
            <LibraryStatus label="Exemplaires empruntés" value={stats.loanedCopies} total={totalCopies} icon={BookOpen} color="text-amber-600 dark:text-amber-400" />
            <LibraryStatus label="Emprunts en retard" value={stats.overdueLoans} total={Math.max(stats.activeLoans + stats.overdueLoans, 1)} icon={Clock3} color="text-red-600 dark:text-red-400" />
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-400" />
                <p className="text-xs leading-5 text-slate-600 dark:text-slate-300">{stats.overdueLoans ? `${stats.overdueLoans} emprunt(s) nécessitent une attention particulière.` : "La bibliothèque fonctionne normalement. Aucun emprunt en retard."}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bandeau bas */}
      <div className={`flex flex-col items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row dark:border-slate-800 dark:bg-slate-900`}>
        <div>
          <p className="font-medium text-slate-900 dark:text-white">Besoin de gérer les emprunts ?</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Consultez tous les prêts, retours et retards.</p>
        </div>
        <Link href="/admin/emprunt"><Button className="bg-amber-500 text-white hover:bg-amber-600">Gérer les emprunts<ChevronRight className="ml-2 h-4 w-4" /></Button></Link>
      </div>
    </div>
  )
}

function StatCard({ title, value, description, icon: Icon, tone, danger = false }: { title: string; value: number; description: string; icon: React.ElementType; tone: "blue" | "gold" | "green" | "red"; danger?: boolean }) {
  const tones: Record<typeof tone, string> = {
    blue: "bg-sky-500/10 text-sky-600 dark:text-sky-300",
    gold: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
    green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    red: "bg-red-500/10 text-red-600 dark:text-red-300",
  }
  return (
    <Card className={`border-slate-200 bg-white text-slate-900 transition hover:-translate-y-0.5 hover:border-amber-500/40 dark:border-slate-800 dark:bg-slate-900 dark:text-white ${danger ? "border-red-500/40" : ""}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${tones[tone]}`}><Icon className="h-5 w-5" /></div>
          <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600" />
        </div>
        <p className="mt-5 text-sm text-slate-500 dark:text-slate-400">{title}</p>
        <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">{description}</p>
      </CardContent>
    </Card>
  )
}

function QuickAction({ href, icon: Icon, title, description }: { href: string; icon: React.ElementType; title: string; description: string }) {
  return (
    <Link href={href} className="group">
      <Card className="h-full border-slate-200 bg-white text-slate-900 transition hover:-translate-y-0.5 hover:border-amber-500/40 dark:border-slate-800 dark:bg-slate-900 dark:text-white">
        <CardContent className="flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-500/10"><Icon className="h-5 w-5 text-amber-600 dark:text-amber-400" /></div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{title}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-amber-500 dark:text-slate-600" />
        </CardContent>
      </Card>
    </Link>
  )
}

function LibraryStatus({ label, value, total, icon: Icon, color }: { label: string; value: number; total: number; icon: React.ElementType; color: string }) {
  const percentage = total > 0 ? Math.min(Math.round((value / total) * 100), 100) : 0
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2"><Icon className={`h-4 w-4 ${color}`} /><span className="text-sm text-slate-600 dark:text-slate-300">{label}</span></div>
        <span className="text-sm font-semibold text-slate-900 dark:text-white">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className={`h-full rounded-full bg-current ${color}`} style={{ width: `${percentage}%` }} /></div>
      <p className="mt-1 text-right text-[11px] text-slate-400 dark:text-slate-500">{percentage}%</p>
    </div>
  )
}
