    "use client"

    import { useState } from "react"
    import { FileText, Eye, Download, BookOpen, Film, Music, Image as ImageIcon } from "lucide-react"
    import { Card, CardContent, CardFooter } from "@/components/ui/card"
    import { Button } from "@/components/ui/button"
    import { Badge } from "@/components/ui/badge"
    import Link from "next/link"

    export interface DigitalResource {
    id: string
    title: string
    description?: string | null
    url: string
    type: string
    category?: string | null
    access_level: string
    uploaded_by?: string | null
    total_acces_numeriques?: number | null
    documents?: {
        title: string
        auteurs?: Array<{ id: string; name: string }> | null
    } | null
    auteur_direct?: { id: string; name: string } | null
    }

    interface ResourceCardClientProps {
    resource: DigitalResource
    isMine?: boolean
    autoOpen?: boolean
    }

    export function ResourceCardClient({ resource, isMine, autoOpen }: ResourceCardClientProps) {
    const [viewerOpen, setViewerOpen] = useState(!!autoOpen)

    const doc = resource.documents
    const auteurDirect = resource.auteur_direct
    const titre = doc?.title || resource.title
    const auteur = doc?.auteurs?.[0]?.name || auteurDirect?.name || "Auteur inconnu"

    // Déterminer l'icône selon le type
    const fileExtension = resource.url?.split(".").pop()?.toLowerCase() || resource.type || "pdf"
    let IconComponent = FileText
    let iconColor = "text-blue-600"

    if (["mp4", "webm", "video/mp4"].includes(fileExtension)) {
        IconComponent = Film
        iconColor = "text-purple-600"
    } else if (["mp3", "wav", "audio/mpeg"].includes(fileExtension)) {
        IconComponent = Music
        iconColor = "text-pink-600"
    } else if (["jpg", "jpeg", "png", "gif", "webp"].includes(fileExtension)) {
        IconComponent = ImageIcon
        iconColor = "text-emerald-600"
    } else if (["pdf"].includes(fileExtension)) {
        IconComponent = BookOpen
        iconColor = "text-red-600"
    }

    return (
        <>
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all hover:shadow-lg overflow-hidden">
            <CardContent className="p-5 space-y-3">
            <div className="flex items-start gap-3">
                <div className={`shrink-0 w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center ${iconColor}`}>
                <IconComponent className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-2 text-sm">
                    {titre}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                    {auteur}
                </p>
                </div>
            </div>

            {resource.description && (
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                {resource.description}
                </p>
            )}

            <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs capitalize">
                {resource.type}
                </Badge>
                <Badge
                variant="outline"
                className={`text-xs ${
                    resource.access_level === "all"
                    ? "border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400"
                    : "border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-400"
                }`}
                >
                {resource.access_level === "all" ? "Public" : "Membres"}
                </Badge>
                {isMine && (
                <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 text-xs">
                    Ma publication
                </Badge>
                )}
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400">
                {resource.total_acces_numeriques || 0} lecture(s)
            </div>
            </CardContent>

            <CardFooter className="p-4 pt-0 flex gap-2">
            <Link href={`/dashboard/numerique/${resource.id}`} className="flex-1">
                <Button
                variant="outline"
                className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-950"
                size="sm"
                >
                <Eye className="w-4 h-4 mr-2" />
                Lire
                </Button>
            </Link>
            <a href={resource.url} download className="flex-1">
                <Button
                variant="outline"
                className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950"
                size="sm"
                >
                <Download className="w-4 h-4 mr-2" />
                Télécharger
                </Button>
            </a>
            </CardFooter>
        </Card>
        </>
    )
    }