import { Card, CardContent } from "@/components/ui/card"
import { ChevronRight, type LucideIcon } from "lucide-react"

type Tone = "blue" | "gold" | "green" | "red" | "purple"

const toneClasses: Record<Tone, { icon: string; glow: string }> = {
  blue: {
    icon: "bg-sky-500/10 text-sky-600 dark:text-sky-300",
    glow: "from-sky-500/10",
  },
  gold: {
    icon: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
    glow: "from-amber-500/10",
  },
  green: {
    icon: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    glow: "from-emerald-500/10",
  },
  red: {
    icon: "bg-red-500/10 text-red-600 dark:text-red-300",
    glow: "from-red-500/10",
  },
  purple: {
    icon: "bg-purple-500/10 text-purple-600 dark:text-purple-300",
    glow: "from-purple-500/10",
  },
}

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  tone?: Tone
  danger?: boolean
  href?: string
}

export function StatCard({ title, value, description, icon: Icon, tone = "blue", danger = false, href }: StatCardProps) {
  const classes = toneClasses[tone]

  const content = (
    <Card
      className={`group relative h-full overflow-hidden border-slate-200 bg-white text-slate-900 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 dark:text-white ${
        danger ? "border-red-500/40" : ""
      }`}
    >
      <div className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${classes.glow} to-transparent opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100`} />
      <CardContent className="relative p-5">
        <div className="flex items-start justify-between">
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${classes.icon}`}>
            <Icon className="h-5 w-5" />
          </div>
          <ChevronRight className="h-4 w-4 text-slate-300 transition-transform duration-300 group-hover:translate-x-0.5 dark:text-slate-600" />
        </div>
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{title}</p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</p>
        {description && (
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-500">{description}</p>
        )}
      </CardContent>
    </Card>
  )

  if (href) {
    return <a href={href} className="block h-full">{content}</a>
  }

  return content
}
