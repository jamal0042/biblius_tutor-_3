"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import { toSingle } from "@/lib/supabase/relations"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatCard } from "@/components/dashboard/stat-card"
import {
  BookOpen,
  Clock,
  AlertCircle,
  DollarSign,
  History,
  Loader2,
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

type MaybeArray<T> = T | T[] | null

interface DocumentInfo {
  title: string
}

interface ExemplaireInfo {
  documents?: MaybeArray<DocumentInfo>
}

interface RetourInfo {
  return_date: string
}

interface Pret {
  id: string
  loan_date: string
  due_date: string
  status: string
  exemplaires: MaybeArray<ExemplaireInfo>
  retours: MaybeArray<RetourInfo>
}

interface Penalite {
  id: string
  type: string
  amount: number
  days: number
  reason: string
  status: string
  created_at: string
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function formatType(type: string): string {
  switch (type) {
    case "late":
      return "Retard"
    case "lost":
      return "Perte"
    case "damage":
      return "Dégradation"
    default:
      return type
  }
}

function statusBadge(status: string) {
  switch (status) {
    case "active":
      return (
        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
          En cours
        </Badge>
      )
    case "returned":
      return (
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
          Retourné
        </Badge>
      )
    case "overdue":
      return (
        <Badge className="bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">
          En retard
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className="text-slate-600 dark:text-slate-400">
          {status}
        </Badge>
      )
  }
}

function penaltyBadge(status: string) {
  switch (status) {
    case "unpaid":
      return (
        <Badge className="bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">
          Impayée
        </Badge>
      )
    case "paid":
      return (
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
          Payée
        </Badge>
      )
    case "waived":
      return (
        <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400">
          Annulée
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export default function RapportsPage() {
  const router = useRouter()
  const supabase = createClient()
  const { member, loading: authLoading } = useAuth()

  const [prets, setPrets] = useState<Pret[]>([])
  const [penalites, setPenalites] = useState<Penalite[]>([])
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
        const [pretsResult, penalitesResult] = await Promise.all([
          supabase
            .from("prets")
            .select(
              "id, loan_date, due_date, status, exemplaires(documents(title)), retours(return_date)"
            )
            .eq("member_id", member.id)
            .order("loan_date", { ascending: false })
            .limit(10),
          supabase
            .from("penalites")
            .select("id, type, amount, days, reason, status, created_at")
            .eq("member_id", member.id)
            .order("created_at", { ascending: false }),
        ])

        if (!isCancelled) {
          setPrets((pretsResult.data as unknown as Pret[]) || [])
          setPenalites((penalitesResult.data as unknown as Penalite[]) || [])
        }
      } catch (err) {
        console.error("Erreur chargement rapports:", err)
        if (!isCancelled) {
          setPrets([])
          setPenalites([])
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
  const totalPrets = prets.length
  const enCours = prets.filter((p) => p.status === "active").length
  const enRetard = prets.filter(
    (p) => p.status === "overdue" || (p.status === "active" && new Date(p.due_date) < today)
  ).length
  const penalitesImpayees = penalites
    .filter((p) => p.status === "unpaid")
    .reduce((sum, p) => sum + (p.amount || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Mes Rapports
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Historique de vos emprunts et statistiques personnelles.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      ) : (
        <>
          {/* 🌟 CARTES COMPACTES SUR UNE SEULE LIGNE (comme le dashboard) */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard
              title="Total emprunts"
              value={totalPrets}
              description="10 derniers affichés"
              icon={BookOpen}
              tone="blue"
            />
            <StatCard
              title="Emprunts en cours"
              value={enCours}
              description={enCours ? "À retourner bientôt" : "Aucun en cours"}
              icon={Clock}
              tone="green"
            />
            <StatCard
              title="Retards"
              value={enRetard}
              description={enRetard ? "Action requise" : "Aucun retard"}
              icon={AlertCircle}
              tone="red"
              danger={enRetard > 0}
            />
            <StatCard
              title="Pénalités impayées"
              value={`${penalitesImpayees.toLocaleString()} FC`}
              description={penalitesImpayees ? "À régulariser" : "Tout est à jour"}
              icon={DollarSign}
              tone="gold"
            />
          </div>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-5 w-5 text-blue-500" />
              Historique des emprunts
            </h2>

            {prets.length === 0 ? (
              <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
                  <p className="text-slate-500 dark:text-slate-400">
                    Aucun emprunt enregistré pour le moment.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">
                          Document
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">
                          Date d&apos;emprunt
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">
                          Retour prévu
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">
                          Retour effectif
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">
                          Statut
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {prets.map((pret) => {
                        const exemplaire = toSingle(pret.exemplaires)
                        const doc = exemplaire ? toSingle(exemplaire.documents) : null
                        const retour = toSingle(pret.retours)
                        const isOverdue =
                          pret.status === "overdue" ||
                          (pret.status === "active" && new Date(pret.due_date) < today)

                        const effectiveStatus =
                          isOverdue && pret.status === "active" ? "overdue" : pret.status

                        return (
                          <tr
                            key={pret.id}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          >
                            <td className="px-6 py-4">
                              <span className="font-medium text-slate-900 dark:text-white">
                                {doc?.title || "Document inconnu"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                              {formatDate(pret.loan_date)}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                              {formatDate(pret.due_date)}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                              {pret.status === "returned" && retour
                                ? formatDate(retour.return_date)
                                : "—"}
                            </td>
                            <td className="px-6 py-4">{statusBadge(effectiveStatus)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          {penalites.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="w-5 w-5 text-amber-500" />
                Pénalités
              </h2>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">
                          Montant
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">
                          Statut
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {penalites.map((p) => (
                        <tr
                          key={p.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        >
                          <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">
                            {formatType(p.type)}
                            {p.reason && (
                              <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {p.reason}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white">
                            {p.amount.toLocaleString()} FCFA
                          </td>
                          <td className="px-6 py-4">{penaltyBadge(p.status)}</td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                            {formatDate(p.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}