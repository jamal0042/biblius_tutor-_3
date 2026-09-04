    "use client"

    import { useEffect, useMemo, useState } from "react"
    import { createClient } from "@/lib/supabase/client"
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogHeader,
        DialogTitle,
        DialogTrigger,
    } from "@/components/ui/dialog"
    import { Button } from "@/components/ui/button"
    import { Input } from "@/components/ui/input"
    import { Badge } from "@/components/ui/badge"
    import {
        BookMarked,
        ChevronRight,
        Check,
        Sparkles,
        Loader2,
        Search,
        X,
    } from "lucide-react"
    import { construireArbreDewey, cheminDewey } from "@/lib/dewey"
    import type { DeweyNode } from "@/lib/dewey"

    interface DeweyClassRow {
        code: string
        libelle: string
        parent_code: string | null
        level?: number | null
    }

    interface IaSuggestion {
        code: string
        libelle: string
        confidence: number
        justification: string
        path: string
    }

    interface DeweyPickerProps {
        value: string | null
        libelle?: string | null
        onChange: (code: string, libelle: string) => void
        documentContext?: {
            title?: string
            subtitle?: string
            type?: string
            description?: string
            keywords?: string
        }
    }

    // Aplatit un noeud (lui + descendants) pour la recherche
    function flatten(node: DeweyNode): DeweyNode[] {
        return [node, ...node.children.flatMap(flatten)]
    }

    function NodeItem({
        node,
        depth,
        onPick,
    }: {
        node: DeweyNode
        depth: number
        onPick: (n: DeweyNode) => void
    }) {
        const [open, setOpen] = useState(false)
        const hasChildren = node.children.length > 0

        return (
            <li>
                <div
                    className="flex items-center gap-1 rounded-md px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    style={{ marginLeft: depth * 12 }}
                >
                    {hasChildren ? (
                        <button
                            type="button"
                            onClick={() => setOpen((o) => !o)}
                            className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 shrink-0"
                            aria-label={open ? "Replier" : "Déplier"}
                        >
                            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-90" : ""}`} />
                        </button>
                    ) : (
                        <span className="w-4 shrink-0" />
                    )}
                    <button
                        type="button"
                        onClick={() => onPick(node)}
                        className="flex-1 text-left min-w-0"
                    >
                        <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{node.code}</span>
                        <span className="ml-2 text-sm text-slate-800 dark:text-slate-200 break-words">{node.libelle}</span>
                    </button>
                </div>
                {open && hasChildren && (
                    <ul>
                        {node.children.map((child) => (
                            <NodeItem key={child.code} node={child} depth={depth + 1} onPick={onPick} />
                        ))}
                    </ul>
                )}
            </li>
        )
    }

    export function DeweyPicker({
        value,
        libelle,
        onChange,
        documentContext,
    }: DeweyPickerProps) {
        const supabase = createClient()
        const [rows, setRows] = useState<DeweyClassRow[]>([])
        const [search, setSearch] = useState("")
        const [open, setOpen] = useState(false)
        const [suggesting, setSuggesting] = useState(false)
        const [suggestError, setSuggestError] = useState<string | null>(null)
        const [suggestions, setSuggestions] = useState<IaSuggestion[] | null>(null)

        const load = async () => {
            const { data } = await supabase
                .from("dewey_classes")
                .select("code, libelle, parent_code, level")
                .eq("status", "active")
                .order("code", { ascending: true })
            setRows((data as unknown as DeweyClassRow[]) || [])
        }
        useEffect(() => {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            void load()
        }, [supabase]) // eslint-disable-line react-hooks/exhaustive-deps

        const tree = useMemo(() => construireArbreDewey(rows), [rows])

        // Recherche dans tous les noeuds (plats)
        const flatAll = useMemo(() => tree.flatMap(flatten), [tree])
        const searchResults = useMemo(() => {
            const q = search.trim().toLowerCase()
            if (!q) return []
            return flatAll.filter(
                (n) =>
                    n.code.toLowerCase().includes(q) ||
                    n.libelle.toLowerCase().includes(q),
            )
        }, [search, flatAll])

        const selectedPath = useMemo(
            () => cheminDewey(value, rows),
            [value, rows],
        )

        const runIaSuggestion = async () => {
            setSuggesting(true)
            setSuggestError(null)
            setSuggestions(null)
            try {
                const res = await fetch("/api/dewey-suggest", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(documentContext || {}),
                })
                const data = await res.json()
                if (!res.ok || !data.suggestions) {
                    setSuggestError(data.error || "Suggestion indisponible.")
                } else {
                    setSuggestions(data.suggestions as IaSuggestion[])
                }
            } catch {
                setSuggestError("Erreur lors de la suggestion.")
            } finally {
                setSuggesting(false)
            }
        }

        const handlePick = (n: DeweyNode) => {
            onChange(n.code, n.libelle)
            setOpen(false)
        }

        return (
            <div className="space-y-2">
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-between h-10 px-3"
                        >
                            <span className="flex items-center gap-2 min-w-0">
                                <BookMarked className="w-4 h-4 text-amber-500 shrink-0" />
                                {value ? (
                                    <span className="truncate">
                                        <span className="font-mono text-slate-900 dark:text-white">{value}</span>
                                        <span className="text-slate-500 dark:text-slate-400"> — {libelle || value}</span>
                                    </span>
                                ) : (
                                    <span className="text-slate-500 dark:text-slate-400">Choisir une classe Dewey…</span>
                                )}
                            </span>
                            <ChevronRight className="w-4 h-4 text-slate-400 rotate-90 shrink-0" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Sélectionner une classification Dewey</DialogTitle>
                            <DialogDescription>
                                Naviguez dans la hiérarchie ou utilisez la suggestion IA.
                            </DialogDescription>
                        </DialogHeader>

                        {/* Bouton suggestion IA */}
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                onClick={runIaSuggestion}
                                disabled={suggesting}
                                className="bg-amber-500 hover:bg-amber-600 text-white flex-1"
                            >
                                {suggesting ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                    <Sparkles className="w-4 h-4 mr-2" />
                                )}
                                Suggestion IA
                            </Button>
                            {value && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        onChange("", "")
                                        setSuggestions(null)
                                    }}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            )}
                        </div>

                        {suggestError && (
                            <p className="text-xs text-red-600 dark:text-red-400">{suggestError}</p>
                        )}

                        {/* Suggestions IA */}
                        {suggestions && suggestions.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Propositions IA (à valider)
                                </p>
                                {suggestions.map((s) => (
                                    <button
                                        key={s.code}
                                        type="button"
                                        onClick={() => onChange(s.code, s.libelle)}
                                        className="w-full text-left rounded-lg border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-3 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-mono font-semibold text-blue-700 dark:text-blue-300">{s.code}</span>
                                            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                                                confiance {s.confidence}%
                                            </Badge>
                                        </div>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{s.libelle}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.path}</p>
                                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{s.justification}</p>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Recherche */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Rechercher un code ou un libellé…"
                                className="pl-9"
                            />
                        </div>

                        {/* Chemin sélectionné */}
                        {selectedPath.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {selectedPath.map((p, i) => (
                                    <span key={i} className="flex items-center gap-1 text-xs">
                                        <Badge variant="outline" className="font-mono">{p.code}</Badge>
                                        <span className="text-slate-500">{p.libelle}</span>
                                        {i < selectedPath.length - 1 && <ChevronRight className="w-3 h-3 text-slate-400" />}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Liste hiérarchique / résultats de recherche */}
                        <div className="rounded-lg border border-slate-200 dark:border-slate-800 max-h-60 overflow-y-auto p-1">
                            {search ? (
                                <ul>
                                    {searchResults.slice(0, 60).map((n) => (
                                        <li key={n.code}>
                                            <button
                                                type="button"
                                                onClick={() => handlePick(n)}
                                                className="w-full text-left px-2 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                                            >
                                                <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{n.code}</span>
                                                <span className="ml-2 text-sm text-slate-800 dark:text-slate-200">{n.libelle}</span>
                                            </button>
                                        </li>
                                    ))}
                                    {searchResults.length === 0 && (
                                        <li className="px-2 py-6 text-center text-sm text-slate-500">Aucun résultat</li>
                                    )}
                                </ul>
                            ) : (
                                <ul>
                                    {tree.map((node) => (
                                        <NodeItem key={node.code} node={node} depth={0}
                                            onPick={(n) => {
                                                onChange(n.code, n.libelle)
                                                setOpen(false)
                                            }}
                                        />
                                    ))}
                                </ul>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>

                {value && selectedPath.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        {selectedPath.map((p, i) => (
                            <span key={i} className="flex items-center gap-1">
                                <span className="text-slate-600 dark:text-slate-300">{p.libelle}</span>
                                {i < selectedPath.length - 1 && <ChevronRight className="w-3 h-3 text-slate-400" />}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        )
    }
