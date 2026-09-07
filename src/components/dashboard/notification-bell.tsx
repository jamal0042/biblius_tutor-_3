    "use client"

    import { useEffect, useRef, useState } from "react"
    import {
    Bell,
    AlertCircle,
    Clock,
    CalendarCheck,
    DollarSign,
    CheckCircle2,
    } from "lucide-react"
    import { createClient } from "@/lib/supabase/client"
    import { useAuth } from "@/hooks/use-auth"
    import { toSingle } from "@/lib/supabase/relations"

    interface AlertItem {
    id: string
    tone: "red" | "amber" | "blue"
    icon: "alert" | "clock" | "calendar" | "money"
    title: string
    description: string
    }

    const TONE_CLASSES: Record<AlertItem["tone"], string> = {
    red: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    blue: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
    }

    function AlertIcon({ icon }: { icon: AlertItem["icon"] }) {
    switch (icon) {
        case "alert":
        return <AlertCircle className="h-4 w-4" />
        case "clock":
        return <Clock className="h-4 w-4" />
        case "calendar":
        return <CalendarCheck className="h-4 w-4" />
        case "money":
        return <DollarSign className="h-4 w-4" />
    }
    }

    export function NotificationBell() {
    const supabase = createClient()
    const { member, loading } = useAuth()
    const [open, setOpen] = useState(false)
    const [alerts, setAlerts] = useState<AlertItem[]>([])
    const panelRef = useRef<HTMLDivElement | null>(null)

    /* Fermer le panneau au clic extérieur */
    useEffect(() => {
        const handler = (e: MouseEvent) => {
        if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
            setOpen(false)
        }
        }
        document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [])

    /* Construire les alertes en temps réel */
    useEffect(() => {
        if (loading || !member) return
        let cancelled = false

        const load = async () => {
        const [pretsRes, penalitesRes, reservationsRes] = await Promise.all([
            supabase
            .from("prets")
            .select("id, due_date, status, exemplaires(documents(title))")
            .eq("member_id", member.id)
            .in("status", ["active", "overdue"]),
            supabase
            .from("penalites")
            .select("id, amount")
            .eq("member_id", member.id)
            .eq("status", "unpaid"),
            supabase
            .from("reservations")
            .select("id, documents(title)")
            .eq("member_id", member.id)
            .eq("status", "ready"),
        ])

        if (cancelled) return

        const items: AlertItem[] = []
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        /* Retards + rappels J-2 */
        for (const p of (pretsRes.data as unknown as Array<{
            id: string
            due_date: string
            status: string
            exemplaires: { documents: { title: string }[] | null } | null
        }>) || []) {
            const due = new Date(p.due_date)
            due.setHours(0, 0, 0, 0)
            const exemplaire = toSingle(p.exemplaires)
            const doc = exemplaire ? toSingle(exemplaire.documents) : null
            const title = doc?.title || "Document"
            const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000)

            if (diffDays < 0 || p.status === "overdue") {
            items.push({
                id: `retard-${p.id}`,
                tone: "red",
                icon: "alert",
                title: "Retard de retour",
                description: `${title} — ${Math.abs(diffDays)} jour(s) de retard`,
            })
            } else if (diffDays <= 2) {
            items.push({
                id: `rappel-${p.id}`,
                tone: "amber",
                icon: "clock",
                title: "Rappel de retour",
                description: `${title} — retour ${
                diffDays === 0 ? "aujourd'hui" : diffDays === 1 ? "demain" : `dans ${diffDays} jours`
                }`,
            })
            }
        }

        /* Pénalités impayées */
        for (const pen of (penalitesRes.data as unknown as Array<{ id: string; amount: number }>) || []) {
            items.push({
            id: `pen-${pen.id}`,
            tone: "red",
            icon: "money",
            title: "Pénalité impayée",
            description: `${(pen.amount || 0).toLocaleString()} FCFA à régulariser`,
            })
        }

        /* Réservations disponibles */
        for (const r of (reservationsRes.data as unknown as Array<{
            id: string
            documents: { title: string } | { title: string }[] | null
        }>) || []) {
            const doc = toSingle(r.documents)
            items.push({
            id: `res-${r.id}`,
            tone: "blue",
            icon: "calendar",
            title: "Réservation disponible",
            description: `${doc?.title || "Document"} — à retirer à l'accueil`,
            })
        }

        setAlerts(items)
        }

        void load()
        return () => {
        cancelled = true
        }
    }, [loading, member, supabase])

    return (
        <div className="relative" ref={panelRef}>
        {/* Bouton cloche */}
        <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label="Notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
        >
            <Bell className="h-5 w-5" />
            {alerts.length > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm">
                {alerts.length}
            </span>
            )}
        </button>

        {/* Panneau déroulant */}
        {open && (
            <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900 sm:w-96">
            {/* En-tête du panneau */}
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</p>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {alerts.length} alerte{alerts.length > 1 ? "s" : ""}
                </span>
            </div>

            {/* Liste des alertes */}
            {alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                </div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">Tout est à jour</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Aucun retard, rappel ou pénalité en cours.
                </p>
                </div>
            ) : (
                <div className="max-h-96 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
                {alerts.map((a) => (
                    <div key={a.id} className="flex items-start gap-3 px-4 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${TONE_CLASSES[a.tone]}`}>
                        <AlertIcon icon={a.icon} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{a.title}</p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{a.description}</p>
                    </div>
                    </div>
                ))}
                </div>
            )}
            </div>
        )}
        </div>
    )
    }