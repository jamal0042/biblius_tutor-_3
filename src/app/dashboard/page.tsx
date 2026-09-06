import { BookOpen, Calendar, AlertCircle, CheckCircle2, Clock, ArrowRight, Sparkles, Library, BarChart3, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { redirect } from "next/navigation"
import { getCurrentMember, createServerSupabaseClient } from "@/lib/supabase/server"
import { ChatbotWidget } from "@/components/chatbot"
import { StatCard } from "@/components/dashboard/stat-card"

interface LoanDoc {
  title: string
  auteurs: { name: string }[] | null
}

interface LoanData {
  id: string
  due_date: string
  status: string
  exemplaires: { documents: LoanDoc[] | null }[] | null
}

interface ReservationData {
  id: string
  status: string
  documents: {
    title: string
    auteurs: { name: string }[] | null
  }[] | null
}

interface PenaltyData {
  amount: number
}

interface FlowPoint {
  label: string
  loans: number
  returns: number
}

type LoanDocs = LoanDoc[] | null | undefined

const MONTH_LABELS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"]

function getAuthorName(doc: LoanDocs | ReservationData["documents"]): string {
  if (!doc) return "Auteur inconnu"
  const d = Array.isArray(doc) ? doc[0] : doc
  if (!d) return "Auteur inconnu"
  const auteur = d.auteurs?.[0]
  return auteur?.name || "Auteur inconnu"
}

function getDocTitle(doc: LoanDocs | ReservationData["documents"]): string {
  if (!doc) return "Titre inconnu"
  const d = Array.isArray(doc) ? doc[0] : doc
  return d?.title || "Titre inconnu"
}

/* =========================================================
GRAPHIQUE 1 : HISTOGRAMME (barres)
========================================================= */
function HistogramChart({ data }: { data: FlowPoint[] }) {
  const max = Math.max(...data.map((d) => d.loans), 1)

  return (
    <div>
      <div className="flex h-44 items-end gap-2 sm:gap-3">
        {data.map((d) => {
          const pct = Math.max((d.loans / max) * 100, 2)
          return (
            <div key={d.label} className="group relative h-full flex-1">
              {/* Barre */}
              <div
                className="absolute bottom-0 w-full rounded-t-lg bg-gradient-to-t from-amber-500 to-amber-400 transition-all duration-300 group-hover:from-amber-400 group-hover:to-amber-300 dark:from-amber-600 dark:to-amber-500"
                style={{ height: `${pct}%` }}
                title={`${d.label} : ${d.loans} emprunt(s)`}
              />
              {/* Valeur au-dessus de la barre */}
              <span
                className="absolute w-full text-center text-xs font-semibold text-slate-600 dark:text-slate-300"
                style={{ bottom: `calc(${pct}% + 4px)` }}
              >
                {d.loans}
              </span>
            </div>
          )
        })}
      </div>
      {/* Labels des mois */}
      <div className="mt-2 flex gap-2 sm:gap-3">
        {data.map((d) => (
          <span key={d.label} className="flex-1 text-center text-xs text-slate-500 dark:text-slate-400">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  )
}

/* =========================================================
GRAPHIQUE 2 : COURBE DE FLUX (lignes)
========================================================= */
function LineFlowChart({ data }: { data: FlowPoint[] }) {
  const max = Math.max(...data.flatMap((d) => [d.loans, d.returns]), 1)

  const x = (i: number) => 3 + (i / Math.max(data.length - 1, 1)) * 94
  const y = (v: number) => 94 - (v / max) * 88

  const loansPts = data.map((d, i) => `${x(i).toFixed(2)},${y(d.loans).toFixed(2)}`).join(" ")
  const returnsPts = data.map((d, i) => `${x(i).toFixed(2)},${y(d.returns).toFixed(2)}`).join(" ")

  return (
    <div>
      <div className="relative h-44">
        {/* Lignes de grille */}
        <div className="absolute inset-0 flex flex-col justify-between">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-px bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>

        {/* Courbes SVG */}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          <polyline
            points={loansPts}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <polyline
            points={returnsPts}
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>

        {/* Points emprunts */}
        {data.map((d, i) => (
          <div
            key={`loan-${i}`}
            className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-amber-500 dark:border-slate-900"
            style={{ left: `${x(i)}%`, top: `${y(d.loans)}%` }}
            title={`${d.label} : ${d.loans} emprunt(s)`}
          />
        ))}

        {/* Points retours */}
        {data.map((d, i) => (
          <div
            key={`ret-${i}`}
            className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900"
            style={{ left: `${x(i)}%`, top: `${y(d.returns)}%` }}
            title={`${d.label} : ${d.returns} retour(s)`}
          />
        ))}
      </div>

      {/* Labels des mois */}
      <div className="mt-2 flex justify-between">
        {data.map((d) => (
          <span key={d.label} className="text-xs text-slate-500 dark:text-slate-400">
            {d.label}
          </span>
        ))}
      </div>

      {/* Légende */}
      <div className="mt-4 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
          Emprunts
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          Retours
        </span>
      </div>
    </div>
  )
}

/* =========================================================
PAGE
========================================================= */
export default async function DashboardPage() {
  const member = await getCurrentMember()
  if (!member) redirect("/login")

  const supabase = await createServerSupabaseClient()

  const { data: loans } = await supabase
    .from("prets")
    .select(`id, due_date, status, exemplaires (documents (title, auteurs (name)))`)
    .eq("member_id", member.id)
    .in("status", ["active", "overdue"])
    .order("due_date", { ascending: true })

  const { data: reservations } = await supabase
    .from("reservations")
    .select(`id, status, documents (title, auteurs (name))`)
    .eq("member_id", member.id)
    .in("status", ["pending", "ready"])
    .order("created_at", { ascending: false })

  const { data: penalties } = await supabase
    .from("penalites")
    .select("amount")
    .eq("member_id", member.id)
    .eq("status", "unpaid")

  // 🌟 NOUVEAU : historique complet pour les graphiques de flux
  const { data: allLoans } = await supabase
    .from("prets")
    .select("loan_date")
    .eq("member_id", member.id)

  const { data: allReturns } = await supabase
    .from("retours")
    .select("return_date")
    .eq("member_id", member.id)

  const today = new Date()
  const typedLoans = (loans as LoanData[]) || []
  const typedReservations = (reservations as ReservationData[]) || []
  const typedPenalties = (penalties as PenaltyData[]) || []

  const activeLoans = typedLoans.filter((l) => l.status === "active" && new Date(l.due_date) >= today)
  const overdueLoans = typedLoans.filter((l) => l.status === "overdue" || new Date(l.due_date) < today)

  const totalUnpaidFines = typedPenalties.reduce((acc: number, curr: PenaltyData) => acc + (curr.amount || 0), 0)

  /* ---------- Construction des flux sur 6 mois ---------- */
  const flow: FlowPoint[] = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - (5 - i), 1)
    return { label: MONTH_LABELS[d.getMonth()], loans: 0, returns: 0 }
  })

  for (const l of (allLoans as { loan_date: string }[]) || []) {
    const d = new Date(l.loan_date)
    const entry = flow.find((f) => f.label === MONTH_LABELS[d.getMonth()] &&
      new Date(today.getFullYear(), today.getMonth() - (5 - flow.indexOf(f)), 1).getMonth() === d.getMonth() &&
      new Date(today.getFullYear(), today.getMonth() - (5 - flow.indexOf(f)), 1).getFullYear() === d.getFullYear())
    if (entry) entry.loans++
  }

  for (const r of (allReturns as { return_date: string }[]) || []) {
    const d = new Date(r.return_date)
    const entry = flow.find((f) => f.label === MONTH_LABELS[d.getMonth()] &&
      new Date(today.getFullYear(), today.getMonth() - (5 - flow.indexOf(f)), 1).getMonth() === d.getMonth() &&
      new Date(today.getFullYear(), today.getMonth() - (5 - flow.indexOf(f)), 1).getFullYear() === d.getFullYear())
    if (entry) entry.returns++
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric"
    })
  }

  const firstName = member.first_name || ""

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 sm:py-8">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-white via-blue-50/60 to-amber-50/50 p-6 shadow-lg shadow-blue-500/5 sm:p-8 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900/60 dark:to-slate-900">
          <div className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-sky-500/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-xs font-medium text-amber-600 dark:text-amber-300">
                <Sparkles className="h-3.5 w-3.5" />
                {firstName ? `Bonjour, ${firstName}` : "Votre espace membre"}
              </div>
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">
                Voici un aperçu de votre activité
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                Suivez vos emprunts, réservations et pénalités directement depuis votre espace personnel.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/catalogue">
                <Button className="h-11 bg-amber-500 text-white shadow-sm hover:bg-amber-600">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Explorer le catalogue
                </Button>
              </Link>
              <Link href="/dashboard/emprunts">
                <Button variant="outline" className="h-11 border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800">
                  Mes emprunts
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Statistiques */}
        <section>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Emprunts en cours" value={activeLoans.length} description={`${overdueLoans.length} en retard`} icon={BookOpen} tone="blue" />
            <StatCard title="En retard" value={overdueLoans.length} description={overdueLoans.length ? "Nécessitent votre attention" : "Aucun retard"} icon={AlertCircle} tone="red" danger={overdueLoans.length > 0} />
            <StatCard title="Réservations" value={typedReservations.length} description={typedReservations.length ? "En attente ou disponibles" : "Aucune réservation"} icon={Calendar} tone="gold" />
            <StatCard title="Amendes impayées" value={`${totalUnpaidFines.toLocaleString()} FC`} description={totalUnpaidFines ? "À régulariser" : "Tout est à jour"} icon={CheckCircle2} tone="green" />
          </div>
        </section>

        {/* 🌟 NOUVEAU : GRAPHIQUES DE FLUX */}
        <section className="grid gap-6 lg:grid-cols-2">
          {/* Histogramme */}
          <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <CardContent className="p-5 sm:p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                    <BarChart3 className="h-5 w-5 text-amber-500" />
                    Emprunts par mois
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">6 derniers mois</p>
                </div>
                <Badge variant="outline" className="border-amber-300 text-amber-600 dark:border-amber-700 dark:text-amber-400">
                  {flow.reduce((s, f) => s + f.loans, 0)} au total
                </Badge>
              </div>
              <HistogramChart data={flow} />
            </CardContent>
          </Card>

          {/* Courbe de flux */}
          <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <CardContent className="p-5 sm:p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                    Flux emprunts / retours
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Évolution sur 6 mois</p>
                </div>
              </div>
              <LineFlowChart data={flow} />
            </CardContent>
          </Card>
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Emprunts en cours */}
          <div className="space-y-4 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Mes emprunts en cours</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Les documents que vous avez actuellement.</p>
              </div>
              <Link href="/dashboard/emprunts">
                <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300">
                  Voir tout
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {typedLoans.length === 0 ? (
              <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                    <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                  </div>
                  <p className="font-medium text-slate-900 dark:text-white">Vous n&apos;avez aucun emprunt en cours.</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Parcourez le catalogue pour découvrir nos documents.</p>
                  <Link href="/catalogue" className="mt-4">
                    <Button size="sm" className="bg-amber-500 text-white hover:bg-amber-600">
                      <Library className="mr-2 h-4 w-4" />
                      Explorer le catalogue
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {[...overdueLoans, ...activeLoans].map((loan) => {
                  const isOverdue = new Date(loan.due_date) < today
                  return (
                    <Card key={loan.id} className="border-slate-200 bg-white transition-all duration-300 hover:border-amber-500/40 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                      <CardContent className="flex items-center justify-between gap-4 p-4">
                        <div className="flex min-w-0 items-center gap-4">
                          <div className="flex h-14 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                            <BookOpen className="h-6 w-6 text-slate-400" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="truncate font-semibold text-slate-900 dark:text-white">
                              {getDocTitle(loan.exemplaires?.[0]?.documents)}
                            </h3>
                            <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                              {getAuthorName(loan.exemplaires?.[0]?.documents)}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                          <Badge className={
                            isOverdue
                              ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                          }>
                            {isOverdue ? "En retard" : "À temps"}
                          </Badge>
                          <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                            <Clock className="h-3 w-3" />
                            Retour : {formatDate(loan.due_date)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

          {/* Réservations + assistant */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Mes réservations</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Vos documents réservés.</p>
              </div>
            </div>

            {typedReservations.length === 0 ? (
              <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                    <Calendar className="h-7 w-7 text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Aucune réservation en cours.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {typedReservations.map((res) => (
                  <Card key={res.id} className="border-slate-200 bg-white transition-all duration-300 hover:border-amber-500/40 dark:border-slate-800 dark:bg-slate-900">
                    <CardContent className="p-4">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <h3 className="line-clamp-1 text-sm font-semibold text-slate-900 dark:text-white">
                          {getDocTitle(res.documents)}
                        </h3>
                        <Badge variant="outline" className={
                          res.status === "ready"
                            ? "shrink-0 border-amber-500 bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-500"
                            : "shrink-0 border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"
                        }>
                          {res.status === "ready" ? "Disponible" : "En attente"}
                        </Badge>
                      </div>
                      <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                        {getAuthorName(res.documents)}
                      </p>
                      {res.status === "ready" && (
                        <Button size="sm" className="h-8 w-full bg-amber-500 text-xs text-white hover:bg-amber-600">
                          Retirer à l&apos;accueil
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <Card className="overflow-hidden border-0 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 text-white shadow-lg shadow-blue-900/20">
              <CardContent className="relative overflow-hidden p-6">
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-amber-400/20 blur-2xl" />
                <div className="relative">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                      <Sparkles className="h-4 w-4 text-amber-300" />
                    </div>
                    <h3 className="font-semibold text-lg">Assistant Biblius</h3>
                  </div>
                  <p className="text-sm text-blue-100/90">
                    Besoin d&apos;aide ? Posez-moi vos questions sur vos emprunts, pénalités ou le catalogue !
                  </p>
                  <p className="mt-3 text-xs text-white/70">
                    Cliquez sur l&apos;icône de chat en bas à droite
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <ChatbotWidget memberName={member.first_name} memberId={member.id} />
    </div>
  )
}