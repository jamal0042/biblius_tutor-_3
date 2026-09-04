    "use client"

    import { useEffect, useMemo, useState } from "react"
    import { createClient } from "@/lib/supabase/client"
    import { Button } from "@/components/ui/button"
    import {
        MapPin,
        ChevronRight,
        Building2,
    } from "lucide-react"

    interface LocationRow {
        id: string
        code: string | null
        name: string
        level: string
        parent_id: string | null
    }

    interface LocationPickerProps {
        value: string | null
        onChange: (id: string | null) => void
        placeholder?: string
    }

    const LEVEL_LABELS: Record<string, string> = {
        bibliotheque: "Bibliothèque",
        salle: "Salle",
        section: "Section",
        rayon: "Rayon",
        etagere: "Étagère",
        position: "Position",
    }

    export function LocationPicker({ value, onChange, placeholder }: LocationPickerProps) {
        const supabase = createClient()
        const [rows, setRows] = useState<LocationRow[]>([])
        const [open, setOpen] = useState(false)
        const [crumbs, setCrumbs] = useState<LocationRow[]>([])

        const load = async () => {
            const { data } = await supabase.from("locations").select("id, code, name, level, parent_id")
            setRows((data as unknown as LocationRow[]) || [])
        }
        useEffect(() => {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            void load()
        }, [supabase]) // eslint-disable-line react-hooks/exhaustive-deps

        const byId = useMemo(() => {
            const m = new Map<string, LocationRow>()
            rows.forEach((r) => m.set(r.id, r))
            return m
        }, [rows])

        const currentId = crumbs.length > 0 ? crumbs[crumbs.length - 1].id : null
        const children = useMemo(
            () => rows.filter((r) => (currentId ? r.parent_id === currentId : r.parent_id === null)),
            [rows, currentId],
        )

        const selected = value ? byId.get(value) : null

        const navigate = (loc: LocationRow) => {
            setCrumbs((c) => [...c, loc])
            // Si c'est une feuille (aucun enfant ou niveau position), sélectionner
            const hasChildren = rows.some((r) => r.parent_id === loc.id)
            if (!hasChildren || loc.level === "position") {
                onChange(loc.id)
                setOpen(false)
            }
        }

        return (
            <div className="space-y-2">
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpen((o) => !o)}
                        className="w-full justify-between h-10 px-3"
                    >
                        <span className="flex items-center gap-2 min-w-0 truncate">
                            <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                            {selected ? (
                                <span className="truncate text-slate-900 dark:text-white">{selected.name}</span>
                            ) : (
                                <span className="text-slate-500 dark:text-slate-400">{placeholder || "Aucune localisation"}</span>
                            )}
                        </span>
                        <ChevronRight className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? "rotate-90" : ""}`} />
                    </Button>
                    {value && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => onChange(null)} aria-label="Retirer la localisation">
                            <Building2 className="w-4 h-4" />
                        </Button>
                    )}
                </div>

                {open && (
                    <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-2 space-y-1.5">
                        {/* Fil d'ariane */}
                        {crumbs.length > 0 && (
                            <div className="flex items-center gap-1 text-xs text-slate-500 flex-wrap px-1">
                                <button type="button" onClick={() => setCrumbs([])} className="hover:text-amber-600">
                                    Racine
                                </button>
                                {crumbs.map((c, i) => (
                                    <span key={c.id} className="flex items-center gap-1">
                                        <ChevronRight className="w-3 h-3" />
                                        <button type="button" onClick={() => setCrumbs(crumbs.slice(0, i + 1))} className="hover:text-amber-600">
                                            {c.name}
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        {children.length === 0 ? (
                            <p className="px-2 py-4 text-center text-sm text-slate-500">Aucune localisation disponible.</p>
                        ) : (
                            <ul className="max-h-52 overflow-y-auto">
                                {children.map((loc) => {
                                    const hasChildren = rows.some((r) => r.parent_id === loc.id)
                                    const levelLabel = LEVEL_LABELS[loc.level] || loc.level
                                    const isLeaf = !hasChildren || loc.level === "position"
                                    return (
                                        <li key={loc.id}>
                                            <button
                                                type="button"
                                                onClick={() => navigate(loc)}
                                                className="w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-left"
                                            >
                                                <span className="flex items-center gap-2 min-w-0">
                                                    <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                                    <span className="truncate text-sm text-slate-800 dark:text-slate-200">{loc.name}</span>
                                                </span>
                                                <span className="flex items-center gap-1 shrink-0">
                                                    <span className="text-[10px] uppercase tracking-wide text-slate-400">{levelLabel}</span>
                                                    {!isLeaf && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                                                </span>
                                            </button>
                                        </li>
                                    )
                                })}
                            </ul>
                        )}
                    </div>
                )}
            </div>
        )
    }
