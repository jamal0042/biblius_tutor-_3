    "use client"

    import { useState, useEffect, useRef, useCallback } from "react"
    import Link from "next/link"
    import { Bell, Clock, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
    import { Button } from "@/components/ui/button"
    import { Badge } from "@/components/ui/badge"
    import { createClient } from "@/lib/supabase/client"
    import { useAuth } from "@/hooks/use-auth"
    import { toSingle } from "@/lib/supabase/relations"

    interface Notification {
    id: string
    type: "overdue" | "ready" | "penalty" | "reminder"
    title: string
    description: string
    date: string
    read: boolean
    }

    interface PretWithDoc {
    id: string
    due_date: string
    exemplaires: { documents: { title: string }[] | null }[] | null
    }

    interface ReservationWithDoc {
    id: string
    created_at: string
    documents: { title: string }[] | null
    }

    interface Penalite {
    id: string
    amount: number
    created_at: string
    type: string
    }

    export function NotificationBell() {
    const { member } = useAuth()
    const supabase = createClient()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Fermer le dropdown quand on clique ailleurs
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setOpen(false)
        }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    // Fonction de chargement (définie avec useCallback pour être stable)
    const loadNotifications = useCallback(async () => {
        if (!member) return

        setLoading(true)
        const notifs: Notification[] = []

        try {
        // 1. Emprunts en retard
        const { data: overdueLoans } = await supabase
            .from("prets")
            .select(`
            id,
            due_date,
            exemplaires (
                documents (title)
            )
            `)
            .eq("member_id", member.id)
            .eq("status", "active")
            .lt("due_date", new Date().toISOString())

        if (overdueLoans) {
            for (const loan of overdueLoans as unknown as PretWithDoc[]) {
            const exemplaire = toSingle(loan.exemplaires)
            const doc = exemplaire ? toSingle(exemplaire.documents) : null
            const title = doc?.title || "document"
            notifs.push({
                id: `overdue-${loan.id}`,
                type: "overdue",
                title: "Emprunt en retard",
                description: `Retour attendu pour "${title}"`,
                date: loan.due_date,
                read: false,
            })
            }
        }

        // 2. Emprunts bientôt à rendre (dans les 3 prochains jours)
        const threeDaysFromNow = new Date()
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

        const { data: upcomingLoans } = await supabase
            .from("prets")
            .select(`
            id,
            due_date,
            exemplaires (
                documents (title)
            )
            `)
            .eq("member_id", member.id)
            .eq("status", "active")
            .gte("due_date", new Date().toISOString())
            .lte("due_date", threeDaysFromNow.toISOString())

        if (upcomingLoans) {
            for (const loan of upcomingLoans as unknown as PretWithDoc[]) {
            const exemplaire = toSingle(loan.exemplaires)
            const doc = exemplaire ? toSingle(exemplaire.documents) : null
            const title = doc?.title || "document"
            notifs.push({
                id: `reminder-${loan.id}`,
                type: "reminder",
                title: "Retour bientôt attendu",
                description: `"${title}" à retourner avant le ${new Date(loan.due_date).toLocaleDateString("fr-FR")}`,
                date: loan.due_date,
                read: false,
            })
            }
        }

        // 3. Réservations prêtes
        const { data: readyReservations } = await supabase
            .from("reservations")
            .select(`
            id,
            created_at,
            documents (title)
            `)
            .eq("member_id", member.id)
            .eq("status", "ready")

        if (readyReservations) {
            for (const reservation of readyReservations as unknown as ReservationWithDoc[]) {
            const doc = toSingle(reservation.documents)
            const title = doc?.title || "document"
            notifs.push({
                id: `ready-${reservation.id}`,
                type: "ready",
                title: "Réservation disponible",
                description: `"${title}" est prêt à être récupéré`,
                date: reservation.created_at,
                read: false,
            })
            }
        }

        // 4. Pénalités impayées
        const { data: penalties } = await supabase
            .from("penalites")
            .select("id, amount, created_at, type")
            .eq("member_id", member.id)
            .eq("status", "unpaid")

        if (penalties) {
            for (const penalty of penalties as unknown as Penalite[]) {
            const typeLabel =
                penalty.type === "late"
                ? "retard"
                : penalty.type === "damage"
                    ? "dégradation"
                    : penalty.type === "lost"
                    ? "perte"
                    : penalty.type
            notifs.push({
                id: `penalty-${penalty.id}`,
                type: "penalty",
                title: "Pénalité impayée",
                description: `${penalty.amount.toLocaleString("fr-FR")} FCFA pour ${typeLabel}`,
                date: penalty.created_at,
                read: false,
            })
            }
        }

        setNotifications(notifs)
        } catch (error) {
        console.error("Erreur chargement notifications:", error)
        } finally {
        setLoading(false)
        }
    }, [member, supabase])

    // Charger les notifications quand le dropdown s'ouvre
    useEffect(() => {
        if (open && member) {
        void loadNotifications()
        }
    }, [open, member, loadNotifications])

    const unreadCount = notifications.filter((n) => !n.read).length

    const getIcon = (type: Notification["type"]) => {
        switch (type) {
        case "overdue":
            return <AlertCircle className="h-4 w-4 text-red-500" />
        case "ready":
            return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        case "penalty":
            return <AlertCircle className="h-4 w-4 text-amber-500" />
        case "reminder":
            return <Clock className="h-4 w-4 text-blue-500" />
        }
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

        if (diffDays === 0) return "Aujourd'hui"
        if (diffDays === 1) return "Hier"
        if (diffDays < 7) return `Il y a ${diffDays} jours`
        return date.toLocaleDateString("fr-FR")
    }

    return (
        <div className="relative" ref={dropdownRef}>
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(!open)}
            className="relative"
            aria-label="Notifications"
        >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
            <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
                {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
            )}
        </Button>

        {open && (
            <div className="absolute right-0 top-12 z-50 w-80 rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                <h3 className="font-semibold text-slate-900 dark:text-white">Notifications</h3>
                {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                    {unreadCount} nouvelle{unreadCount > 1 ? "s" : ""}
                </Badge>
                )}
            </div>

            <div className="max-h-96 overflow-y-auto">
                {loading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
                ) : notifications.length === 0 ? (
                <div className="py-8 text-center">
                    <Bell className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Aucune notification
                    </p>
                </div>
                ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                    {notifications.map((notif) => (
                    <div
                        key={notif.id}
                        className={`flex gap-3 px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                        !notif.read ? "bg-blue-50/50 dark:bg-blue-950/20" : ""
                        }`}
                    >
                        <div className="mt-0.5 shrink-0">{getIcon(notif.type)}</div>
                        <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {notif.title}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                            {notif.description}
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                            {formatDate(notif.date)}
                        </p>
                        </div>
                    </div>
                    ))}
                </div>
                )}
            </div>

            {notifications.length > 0 && (
                <div className="border-t border-slate-200 px-4 py-2 dark:border-slate-800">
                <Link
                    href="/dashboard/emprunts"
                    className="block text-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    onClick={() => setOpen(false)}
                >
                    Voir tous mes emprunts
                </Link>
                </div>
            )}
            </div>
        )}
        </div>
    )
    }