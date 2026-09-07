    /* =========================================================
    GRAPHIQUE À BARRES HORIZONTALES JUMELÉES (style budget)
    - 2 séries par catégorie : Emprunts / Retours
    - Labels à gauche, grille verticale, axe des valeurs en bas
    ========================================================= */

    export interface FlowPoint {
    key: string
    label: string
    loans: number
    returns: number
    }

    const MONTH_LABELS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"]

    /* Construit les flux sur N mois (par défaut 6) */
    export function buildMonthlyFlow(
    loans: { loan_date: string }[],
    returns: { return_date: string }[],
    months = 6
    ): FlowPoint[] {
    const now = new Date()

    const flow: FlowPoint[] = Array.from({ length: months }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1)
        return {
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: MONTH_LABELS[d.getMonth()],
        loans: 0,
        returns: 0,
        }
    })

    for (const l of loans || []) {
        const d = new Date(l.loan_date)
        const e = flow.find((f) => f.key === `${d.getFullYear()}-${d.getMonth()}`)
        if (e) e.loans++
    }

    for (const r of returns || []) {
        const d = new Date(r.return_date)
        const e = flow.find((f) => f.key === `${d.getFullYear()}-${d.getMonth()}`)
        if (e) e.returns++
    }

    return flow
    }

    /* Le graphique horizontal jumelé */
    export function HorizontalFlowChart({ data }: { data: FlowPoint[] }) {
    const max = Math.max(...data.flatMap((d) => [d.loans, d.returns]), 1)
    const pct = (v: number) => (v > 0 ? Math.max((v / max) * 100, 2) : 0)
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(max * t))

    return (
        <div>
        {/* Légende */}
        <div className="mb-5 flex items-center gap-5 text-xs text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-[3px] bg-sky-600 dark:bg-sky-500" />
            Emprunts
            </span>
            <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-[3px] bg-slate-700 dark:bg-slate-400" />
            Retours
            </span>
        </div>

        <div className="grid grid-cols-[52px_1fr] gap-x-3 sm:grid-cols-[72px_1fr]">
            {/* Labels des mois */}
            <div className="flex flex-col">
            {data.map((d) => (
                <div key={d.key} className="flex h-14 items-center justify-end">
                <span className="text-xs text-slate-500 dark:text-slate-400">{d.label}</span>
                </div>
            ))}
            </div>

            {/* Barres + grille verticale */}
            <div className="relative flex flex-col">
            {/* Grille */}
            <div className="pointer-events-none absolute inset-0 flex justify-between">
                {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="h-full w-px bg-slate-200 dark:bg-slate-800" />
                ))}
            </div>

            {data.map((d) => (
                <div key={d.key} className="flex h-14 flex-col justify-center gap-1.5">
                {/* Barre Emprunts */}
                <div
                    className="relative h-4 rounded-r-[4px] bg-sky-600 dark:bg-sky-500"
                    style={{ width: `${pct(d.loans)}%` }}
                    title={`${d.label} : ${d.loans} emprunt(s)`}
                >
                    {d.loans > 0 &&
                    (pct(d.loans) > 12 ? (
                        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-white">
                        {d.loans}
                        </span>
                    ) : (
                        <span className="absolute left-full ml-1 top-1/2 -translate-y-1/2 whitespace-nowrap text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        {d.loans}
                        </span>
                    ))}
                </div>

                {/* Barre Retours */}
                <div
                    className="relative h-4 rounded-r-[4px] bg-slate-700 dark:bg-slate-400"
                    style={{ width: `${pct(d.returns)}%` }}
                    title={`${d.label} : ${d.returns} retour(s)`}
                >
                    {d.returns > 0 &&
                    (pct(d.returns) > 12 ? (
                        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-white dark:text-slate-900">
                        {d.returns}
                        </span>
                    ) : (
                        <span className="absolute left-full ml-1 top-1/2 -translate-y-1/2 whitespace-nowrap text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        {d.returns}
                        </span>
                    ))}
                </div>
                </div>
            ))}
            </div>
        </div>

        {/* Axe des valeurs */}
        <div className="mt-2 grid grid-cols-[52px_1fr] gap-x-3 sm:grid-cols-[72px_1fr]">
            <div />
            <div className="flex justify-between">
            {ticks.map((t, i) => (
                <span key={i} className="text-[10px] text-slate-400 dark:text-slate-500">
                {t}
                </span>
            ))}
            </div>
        </div>
        </div>
    )
    }