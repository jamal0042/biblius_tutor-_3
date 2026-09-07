    import { BookMarked, Calendar} from "lucide-react"
    import { Card, CardContent } from "@/components/ui/card"
    import { Badge } from "@/components/ui/badge"
    import { redirect } from "next/navigation"
    import { getCurrentMember, createServerSupabaseClient } from "@/lib/supabase/server"

    interface Reservation {
    id: string
    status: string
    created_at: string
    documents: {
        title: string
        auteurs: { name: string }[] | null
    }[] | null
    }

    export default async function ReservationsPage() {
    const member = await getCurrentMember()
    if (!member) redirect("/login")

    const supabase = await createServerSupabaseClient()

    const { data: reservations } = await supabase
        .from("reservations")
        .select(`
        id,
        status,
        created_at,
        documents (
            title,
            auteurs (name)
        )
        `)
        .eq("member_id", member.id)
        .order("created_at", { ascending: false })

    const typedReservations = (reservations as unknown as Reservation[]) || []

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
        })
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
        case "ready":
            return (
            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                Disponible
            </Badge>
            )
        case "pending":
            return (
            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                En attente
            </Badge>
            )
        case "fulfilled":
            return (
            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
                Emprunté
            </Badge>
            )
        default:
            return <Badge variant="outline">{status}</Badge>
        }
    }

    return (
        <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Mes Réservations</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
            Suivez vos réservations en cours et leur disponibilité.
            </p>
        </div>

        {typedReservations.length === 0 ? (
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <BookMarked className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Aucune réservation
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
                Vous n&aposavez aucune réservation en cours. Parcourez le catalogue pour réserver des documents.
                </p>
            </CardContent>
            </Card>
        ) : (
            <div className="space-y-4">
            {typedReservations.map((reservation) => {
                const doc = Array.isArray(reservation.documents)
                ? reservation.documents[0]
                : reservation.documents
                const auteur = doc?.auteurs?.[0]?.name || "Auteur inconnu"

                return (
                <Card
                    key={reservation.id}
                    className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-500/40 transition-all"
                >
                    <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                            {doc?.title || "Document inconnu"}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                            {auteur}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Réservé le {formatDate(reservation.created_at)}
                            </span>
                        </div>
                        </div>
                        <div className="shrink-0">{getStatusBadge(reservation.status)}</div>
                    </div>
                    </CardContent>
                </Card>
                )
            })}
            </div>
        )}
        </div>
    )
    }