    "use client"

    import { useState } from "react"
    import { Button } from "@/components/ui/button"
    import { Input } from "@/components/ui/input"
    import { Badge } from "@/components/ui/badge"
    import {
        Plus,
        Trash2,
        ChevronUp,
        ChevronDown,
        Users,
    } from "lucide-react"
    import { CONTRIBUTION_ROLES, contributionRoleLabel } from "@/lib/contribution-roles"
    import type { ContributionRole } from "@/lib/contribution-roles"
    import type { Contributor } from "@/lib/contributors"

    interface ContributionListProps {
        contributors: Contributor[]
        onChange: (contributors: Contributor[]) => void
        minRows?: number
        hint?: string
    }

    export function ContributionList({
        contributors,
        onChange,
        minRows = 1,
        hint,
    }: ContributionListProps) {
        const [name, setName] = useState("")
        const [role, setRole] = useState<ContributionRole>("principal")
        const [localError, setLocalError] = useState<string | null>(null)

        const add = () => {
            const trimmed = name.trim()
            if (!trimmed) {
                setLocalError("Saisissez un nom de contributeur.")
                return
            }
            setLocalError(null)
            const next = [
                ...contributors,
                { name: trimmed, role, order: contributors.length + 1 },
            ]
            onChange(next)
            setName("")
            setRole("principal")
        }

        const remove = (index: number) => {
            const next = contributors
                .filter((_, i) => i !== index)
                .map((c, i) => ({ ...c, order: i + 1 }))
            onChange(next)
        }

        const update = (index: number, patch: Partial<Contributor>) => { // eslint-disable-line @typescript-eslint/no-unused-vars
            onChange(
                contributors.map((c, i) =>
                    i === index ? { ...c, ...patch } : c,
                ),
            )
        }

        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
                e.preventDefault()
                add()
            }
        }

        return (
            <div className="space-y-3">
                <div className="flex items-start gap-2">
                    <div className="flex-1 space-y-1">
                        <div className="flex gap-2">
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Nom du contributeur…"
                                className="flex-1"
                            />
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value as ContributionRole)}
                                className="h-10 w-44 rounded-md border border-slate-200 dark:border-slate-700 bg-transparent px-2 py-2 text-sm text-slate-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                            >
                                {CONTRIBUTION_ROLES.map((r) => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={add}
                                className="h-10"
                                aria-label="Ajouter le contributeur"
                            >
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                        {localError && <p className="text-xs text-red-600 dark:text-red-400">{localError}</p>}
                        {hint && <p className="text-xs text-slate-500">{hint}</p>}
                    </div>
                </div>

                {contributors.length === 0 && minRows > 0 && (
                    <p className="text-sm text-slate-400 dark:text-slate-500 flex items-center gap-2">
                        <Users className="w-4 h-4" /> Aucun contributeur ajouté.
                    </p>
                )}

                {contributors.length > 0 && (
                    <ul className="space-y-1.5">
                        {contributors.map((c, i) => (
                            <li
                                key={i}
                                className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2"
                            >
                                <span className="w-5 text-center text-xs font-mono text-slate-400">{c.order}.</span>
                                <span className="flex-1 min-w-0 truncate text-sm text-slate-900 dark:text-white">
                                    {c.name}
                                </span>
                                <Badge variant="outline" className="border-amber-300 dark:border-amber-500/40 text-amber-700 dark:text-amber-400">
                                    {contributionRoleLabel(c.role)}
                                </Badge>
                                <div className="flex items-center gap-0.5">
                                    <button
                                        type="button"
                                        disabled={i === 0}
                                        onClick={() => {
                                            const next = [...contributors]
                                            ;[next[i - 1], next[i]] = [next[i], next[i - 1]]
                                            onChange(next.map((c, j) => ({ ...c, order: j + 1 })))
                                        }}
                                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
                                        aria-label="Monter"
                                    >
                                        <ChevronUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        disabled={i === contributors.length - 1}
                                        onClick={() => {
                                            const next = [...contributors]
                                            ;[next[i], next[i + 1]] = [next[i + 1], next[i]]
                                            onChange(next.map((c, j) => ({ ...c, order: j + 1 })))
                                        }}
                                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
                                        aria-label="Descendre"
                                    >
                                        <ChevronDown className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => remove(i)}
                                        className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950 text-red-500 ml-1"
                                        aria-label="Supprimer"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        )
    }
