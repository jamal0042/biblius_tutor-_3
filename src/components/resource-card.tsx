    "use client"

    import { useEffect, useState } from "react"
    import Image from "next/image"
    import { FileText, BookOpen, User, X, Download, Eye, Loader2 } from "lucide-react"
    import { Button } from "@/components/ui/button"
    import { Badge } from "@/components/ui/badge"
    import { Card, CardContent } from "@/components/ui/card"

    // ---------- Types ----------
    type MaybeArray<T> = T | T[] | null

    interface AuteurInfo { id: string; name: string }

    interface DocumentInfo {
    title: string
    author_id: string | null
    auteurs: MaybeArray<AuteurInfo>
    }

    export interface DigitalResource {
    id: string
    title: string
    description: string | null
    url: string
    type: string
    category: string
    access_level: string
    uploaded_by: string | null
    documents: MaybeArray<DocumentInfo>
    }

    // ---------- Helpers ----------
    function toSingle<T>(rel: MaybeArray<T>): T | null {
    if (!rel) return null
    if (Array.isArray(rel)) return rel[0] ?? null
    return rel
    }

    function getAuthorName(doc: DocumentInfo | null): string {
    if (!doc) return "Auteur inconnu"
    return toSingle(doc.auteurs)?.name || "Auteur inconnu"
    }

    function getDocTitle(doc: DocumentInfo | null): string | null {
    return doc?.title || null
    }

    type ViewerKind = "pdf" | "video" | "audio" | "image" | "office" | "other"

    function getViewerKind(resource: DigitalResource): ViewerKind {
    const url = resource.url.toLowerCase().split("?")[0]
    if (url.endsWith(".pdf") || resource.type === "pdf") return "pdf"
    if (url.endsWith(".mp4") || url.endsWith(".webm") || resource.type === "video") return "video"
    if (url.endsWith(".mp3") || url.endsWith(".wav") || resource.type === "audio") return "audio"
    if ([".png", ".jpg", ".jpeg", ".webp", ".gif"].some((e) => url.endsWith(e))) return "image"
    if ([".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx"].some((e) => url.endsWith(e))) return "office"
    return "other"
    }

    // ============================================================
    // VISIONNEUSE INTÉGRÉE (modal plein écran)
    // ============================================================
    function DocumentViewerModal({ resource, onClose }: { resource: DigitalResource; onClose: () => void }) {
    const kind = getViewerKind(resource)
    const [blobUrl, setBlobUrl] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState(false)

    useEffect(() => {
        let objectUrl: string | null = null
        let cancelled = false

        const load = async () => {
        if (kind === "office" || kind === "other") {
            setLoading(false)
            return
        }
        try {
            const res = await fetch(resource.url)
            if (!res.ok) throw new Error("fetch failed")
            const blob = await res.blob()
            if (cancelled) return
            objectUrl = URL.createObjectURL(blob)
            setBlobUrl(objectUrl)
        } catch {
            if (!cancelled) setLoadError(true)
        } finally {
            if (!cancelled) setLoading(false)
        }
        }

        load()

        return () => {
        cancelled = true
        if (objectUrl) URL.revokeObjectURL(objectUrl)
        }
    }, [resource.url, kind])

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose()
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [onClose])

    const src = blobUrl || resource.url

    return (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-700">
            <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-amber-500" />
            </div>
            <div className="min-w-0">
                <h2 className="font-semibold text-white truncate">{resource.title}</h2>
                <p className="text-xs text-slate-400 truncate">
                Lecture intégrée • {resource.type.toUpperCase()}
                </p>
            </div>
            </div>
            <div className="flex items-center gap-2">
            <a href={resource.url} download title="Télécharger">
                <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white">
                <Download className="w-5 h-5" />
                </Button>
            </a>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-300 hover:text-white" title="Fermer (Échap)">
                <X className="w-5 h-5" />
            </Button>
            </div>
        </div>

        <div className="flex-1 relative overflow-hidden">
            {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
                <p className="text-slate-300 text-sm">Chargement du document...</p>
            </div>
            ) : (
            <>
                {kind === "pdf" && (
                <iframe
                    src={loadError ? resource.url : src}
                    title={resource.title}
                    className="w-full h-full bg-white"
                />
                )}

                {kind === "video" && (
                <video
                    src={src}
                    controls
                    className="w-full h-full bg-black"
                />
                )}

                {kind === "audio" && (
                <div className="w-full h-full flex flex-col items-center justify-center gap-6 px-8">
                    <div className="w-24 h-24 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <FileText className="w-12 h-12 text-amber-500" />
                    </div>
                    <p className="text-white text-lg font-medium text-center">{resource.title}</p>
                    <audio src={src} controls className="w-full max-w-md" />
                </div>
                )}

                {kind === "image" && (
                <div className="w-full h-full flex items-center justify-center p-6 overflow-auto relative">
                    <Image
                    src={src}
                    alt={resource.title}
                    fill
                    unoptimized
                    className="object-contain rounded-lg"
                    />
                </div>
                )}

                {kind === "office" && (
                <iframe
                    src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(resource.url)}`}
                    title={resource.title}
                    className="w-full h-full bg-white"
                />
                )}

                {kind === "other" && (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 px-8 text-center">
                    <FileText className="w-16 h-16 text-slate-500" />
                    <p className="text-white text-lg font-medium">
                    Ce format ne peut pas être lu directement dans la plateforme.
                    </p>
                    <p className="text-slate-400 text-sm max-w-md">
                    Utilisez le bouton de téléchargement en haut à droite pour consulter ce fichier.
                    </p>
                </div>
                )}
            </>
            )}
        </div>
        </div>
    )
    }

    // ============================================================
    // CARTE RESSOURCE
    // ============================================================
    export function ResourceCardClient({ resource, isMine }: { resource: DigitalResource; isMine?: boolean }) {
    const [viewerOpen, setViewerOpen] = useState(false)
    const doc = toSingle(resource.documents)
    const docTitle = getDocTitle(doc)

    return (
        <>
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-500/30 transition-colors">
            <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                <FileText className="w-6 h-6 text-amber-600 dark:text-amber-500" />
                </div>
                <div className="flex gap-1">
                {isMine && (
                    <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400">
                    <User className="w-3 h-3 mr-1" /> Moi
                    </Badge>
                )}
                <Badge className={
                    resource.type === "pdf" ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400" :
                    resource.type === "epub" ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400" :
                    "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400"
                }>
                    {resource.type.toUpperCase()}
                </Badge>
                </div>
            </div>

            <h3 className="font-semibold text-slate-900 dark:text-white text-lg mb-2">{resource.title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">{resource.description}</p>

            {docTitle && (
                <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <BookOpen className="w-3 h-3" />
                    Document lié
                </div>
                <div className="font-medium text-sm text-slate-900 dark:text-white">{docTitle}</div>
                <div className="text-xs text-slate-500">{getAuthorName(doc)}</div>
                </div>
            )}

            <div className="flex items-center justify-between mb-4">
                <Badge variant="outline" className="border-slate-300 dark:border-slate-700 capitalize">
                {resource.category}
                </Badge>
                <Badge className={
                resource.access_level === "all" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" :
                resource.access_level === "student" ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400" :
                "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                }>
                {resource.access_level === "all" ? "Accès libre" :
                resource.access_level === "student" ? "Étudiants" : "Staff"}
                </Badge>
            </div>

            <Button
                onClick={() => setViewerOpen(true)}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white"
            >
                <Eye className="w-4 h-4 mr-2" />
                Lire dans la plateforme
            </Button>
            </CardContent>
        </Card>

        {viewerOpen && (
            <DocumentViewerModal resource={resource} onClose={() => setViewerOpen(false)} />
        )}
        </>
    )
    }