import { BookOpen, Calendar, AlertCircle, CheckCircle2, Clock, ArrowRight, Sparkles, Library } from "lucide-react"
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

type LoanDocs = LoanDoc[] | null | undefined

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

  const today = new Date()
  const typedLoans = (loans as LoanData[]) || []
  const typedReservations = (reservations as ReservationData[]) || []
  const typedPenalties = (penalties as PenaltyData[]) || []

  const activeLoans = typedLoans.filter((l) => l.status === "active" && new Date(l.due_date) >= today)
  const overdueLoans = typedLoans.filter((l) => l.status === "overdue" || new Date(l.due_date) < today)

  const totalUnpaidFines = typedPenalties.reduce((acc: number, curr: PenaltyData) => acc + (curr.amount || 0), 0)

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
                {firstName
                  ? `Bonjour, ${firstName}`
                  : "Votre espace membre"}
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
                    Cliquez sur l&apos;icône 💬 en bas à droite
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
