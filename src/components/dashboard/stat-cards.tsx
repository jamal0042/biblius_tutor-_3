import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  tone?: "blue" | "red" | "gold" | "green"
  danger?: boolean
}

const TONES: Record<string, string> = {
  blue: "bg-sky-500/10 text-sky-500 dark:bg-sky-500/15 dark:text-sky-400",
  red: "bg-red-500/10 text-red-500 dark:bg-red-500/15 dark:text-red-400",
  gold: "bg-amber-500/10 text-amber-500 dark:bg-amber-500/15 dark:text-amber-400",
  green: "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/15 dark:text-emerald-400",
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  tone = "blue",
  danger = false,
}: StatCardProps) {
  return (
    <Card
      className={`border-slate-200 bg-white transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 ${
        danger ? "border-red-300 dark:border-red-800" : ""
      }`}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Icône compacte */}
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${TONES[tone]}`}
          >
            <Icon className="h-4 w-4" />
          </div>

          {/* Texte + chiffre */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs dark:text-slate-400">
              {title}
            </p>

            <p
              className={`truncate text-lg font-bold leading-tight sm:text-xl ${
                danger
                  ? "text-red-600 dark:text-red-400"
                  : "text-slate-900 dark:text-white"
              }`}
            >
              {value}
            </p>

            {description && (
              <p className="truncate text-[10px] text-slate-400 sm:text-[11px] dark:text-slate-500">
                {description}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}