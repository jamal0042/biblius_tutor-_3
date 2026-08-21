    import { BookOpen } from "lucide-react"
    import { Badge } from "@/components/ui/badge"
    import { Card, CardContent } from "@/components/ui/card"

    interface CompactCardProps {
    title: string
    author?: string
    type: string
    availableCount: number
    }

    export function CompactDocumentCard({ title, author, type, availableCount }: CompactCardProps) {
    return (
        <Card className="overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-500/40 transition-colors">
        {/* 🌟 Couverture COMPACTE (h-32 au lieu de h-64) */}
        <div className="relative h-32 sm:h-36 bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            {availableCount > 0 ? (
            <Badge className="absolute top-1.5 right-1.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 text-[10px] px-1.5 py-0">
                Disponible
            </Badge>
            ) : (
            <Badge className="absolute top-1.5 right-1.5 bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 text-[10px] px-1.5 py-0">
                Indisponible
            </Badge>
            )}
        </div>

        {/* 🌟 Contenu réduit (p-3 au lieu de p-6) */}
        <CardContent className="p-2.5 sm:p-3">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white truncate" title={title}>
            {title}
            </h3>
            {author && (
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{author}</p>
            )}
            <div className="flex items-center justify-between mt-2 gap-1">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize border-slate-300 dark:border-slate-700">
                {type}
            </Badge>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {availableCount} dispo.
            </span>
            </div>
        </CardContent>
        </Card>
    )
    }