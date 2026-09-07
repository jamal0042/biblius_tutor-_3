    "use client"

    import { useEffect, useState } from "react"
    import {
    FileText,
    Eye,
    Download,
    BookOpen,
    Film,
    Music,
    Image as ImageIcon,
    X,
    Loader2,
    } from "lucide-react"
    import Image from "next/image"
    import { Card, CardContent, CardFooter } from "@/components/ui/card"
    import { Button } from "@/components/ui/button"
    import { Badge } from "@/components/ui/badge"
    import { PdfViewer } from "@/components/pdf-viewer"

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
    downloadable?: boolean | null
    documents?: {
        title: string
        auteurs?: Array<{ id: string; name: string }> | null
    } | null
    auteur_direct?: { id: string; name: string } | null
    }

    interface ResourceCardClientProps {
    resource: DigitalResource
    isMine?: boolean
    }

    export function ResourceCardClient({ resource, isMine }: ResourceCardClientProps) {
    const [viewerOpen, setViewerOpen] = useState(false)
    const [downloading, setDownloading] = useState(false)
    const [downloadError, setDownloadError] = useState<string | null>(null)

    const doc = resource.documents
    const auteurDirect = resource.auteur_direct
    const titre = doc?.title || resource.title
    const auteur = doc?.auteurs?.[0]?.name || auteurDirect?.name || "Auteur inconnu"

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

    useEffect(() => {
        if (viewerOpen) {
        document.body.style.overflow = "hidden"
        return () => {
            document.body.style.overflow = ""
        }
        }
    }, [viewerOpen])

    /* ---------- Téléchargement vers le dossier Téléchargements (sans quitter la page) ---------- */
    const handleDownload = async () => {
        setDownloading(true)
        setDownloadError(null)

        try {
        const res = await fetch(`/api/download/${resource.id}`)

        if (!res.ok) {
            const json = await res.json().catch(() => null)
            throw new Error(json?.error || "Téléchargement refusé.")
        }

        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${(titre || "document").replace(/[^\wÀ-ÿ-]+/g, "_")}.${fileExtension}`
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
        } catch (err) {
        setDownloadError(err instanceof Error ? err.message : "Erreur de téléchargement.")
        } finally {
        setDownloading(false)
        }
    }

    /* ---------- Contenu de la visionneuse ---------- */
    const renderViewer = () => {
        // 🌟 PDF : lecteur maison sur canvas (AUCUNE barre d'outils navigateur)
        if (["pdf"].includes(fileExtension)) {
        return <PdfViewer url={resource.url} />
        }

        if (["mp4", "webm", "video/mp4"].includes(fileExtension)) {
        return (
            <video src={resource.url} controls className="h-full w-full bg-black object-contain">
            Votre navigateur ne supporte pas la lecture vidéo.
            </video>
        )
        }

        if (["mp3", "wav", "audio/mpeg"].includes(fileExtension)) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-6 bg-gradient-to-br from-purple-900 to-slate-900 p-8">
            <div className="flex h-32 w-32 items-center justify-center rounded-full bg-purple-500/20">
                <Music className="h-16 w-16 text-purple-400" />
            </div>
            <div className="text-center">
                <p className="text-xl font-bold text-white">{titre}</p>
                <p className="mt-1 text-purple-200">{auteur}</p>
            </div>
            <audio src={resource.url} controls className="w-full max-w-2xl">
                Votre navigateur ne supporte pas la lecture audio.
            </audio>
            </div>
        )
        }

        if (["jpg", "jpeg", "png", "gif", "webp"].includes(fileExtension)) {
        return (
            <div className="flex h-full items-center justify-center p-4">
            <Image
                src={resource.url}
                alt={titre}
                width={1200}
                height={800}
                unoptimized
                className="max-h-full w-auto max-w-full object-contain"
            />
            </div>
        )
        }

        if (["doc", "docx", "ppt", "pptx", "xls", "xlsx"].includes(fileExtension)) {
        const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(resource.url)}&embedded=true`
        return <iframe src={googleViewerUrl} title={titre} className="h-full w-full border-0 bg-white" />
        }

        return (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
            <FileText className="h-16 w-16 text-slate-500" />
            <p className="text-lg font-semibold text-white">{titre}</p>
            <p className="text-sm text-slate-400">
            Ce format ne peut pas être prévisualisé dans le navigateur.
            </p>
            {resource.downloadable && (
            <Button onClick={handleDownload} disabled={downloading} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Download className="mr-2 h-4 h-4" />
                Télécharger le fichier
            </Button>
            )}
        </div>
        )
    }

    return (
        <>
        {/* ---------- CARTE ---------- */}
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

            <CardFooter className="p-4 pt-0 flex-col gap-2">
            <div className="flex w-full gap-2">
                <Button
                variant="outline"
                onClick={() => setViewerOpen(true)}
                className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-950"
                size="sm"
                >
                <Eye className="w-4 h-4 mr-2" />
                Lire
                </Button>

                {resource.downloadable ? (
                <Button
                    variant="outline"
                    onClick={handleDownload}
                    disabled={downloading}
                    className="flex-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950"
                    size="sm"
                >
                    {downloading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                    <Download className="w-4 h-4 mr-2" />
                    )}
                    Télécharger
                </Button>
                ) : (
                <Button
                    variant="outline"
                    disabled
                    className="flex-1 border-slate-200 text-slate-400 dark:border-slate-700 dark:text-slate-600"
                    size="sm"
                    title="Téléchargement non autorisé pour cette ressource"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Non téléchargeable
                </Button>
                )}
            </div>

            {downloadError && (
                <p className="w-full text-xs text-red-600 dark:text-red-400">{downloadError}</p>
            )}
            </CardFooter>
        </Card>

        {/* ---------- VISIONNEUSE PLEIN ÉCRAN (même page) ---------- */}
        {viewerOpen && (
            <div
            className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-sm"
            onContextMenu={(e) => e.preventDefault()}
            >
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-900 px-4 py-3">
                <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-white">{titre}</p>
                <p className="truncate text-xs text-slate-400">{auteur}</p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                <Badge variant="outline" className="hidden sm:flex border-slate-700 text-slate-300">
                    <span className="uppercase">{fileExtension}</span>
                </Badge>

                {resource.downloadable && (
                    <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDownload}
                    disabled={downloading}
                    className="border-emerald-700 text-emerald-400 hover:bg-emerald-950"
                    >
                    {downloading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Download className="h-4 w-4" />
                    )}
                    <span className="ml-1 hidden sm:inline">Télécharger</span>
                    </Button>
                )}

                <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setViewerOpen(false)}
                    aria-label="Fermer la visionneuse"
                    className="text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                    <X className="h-5 w-5" />
                </Button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden">{renderViewer()}</div>
            </div>
        )}
        </>
    )
    }