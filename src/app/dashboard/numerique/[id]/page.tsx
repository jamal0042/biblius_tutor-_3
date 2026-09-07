    import { createServerSupabaseClient } from "@/lib/supabase/server"
    import { notFound } from "next/navigation"
    import { ArrowLeft, Download, BookOpen, FileText, Film, Music, Image as ImageIcon } from "lucide-react"
    import Link from "next/link"
    import Image from "next/image"
    import { Button } from "@/components/ui/button"
    import { Badge } from "@/components/ui/badge"

    export default async function DigitalResourceReaderPage({
    params,
    }: {
    params: Promise<{ id: string }>
    }) {
    const { id } = await params
    const supabase = await createServerSupabaseClient()

    const { data: resource } = await supabase
        .from("digital_resources")
        .select(`
        id, title, description, url, type, category, access_level,
        uploaded_by, total_acces_numeriques, downloadable,
        documents (title, auteurs (id, name)),
        auteur_direct:auteurs!digital_resources_author_id_fkey (id, name)
        `)
        .eq("id", id)
        .single()

    if (!resource) {
        notFound()
    }

    // Incrémenter le compteur de vues
    await supabase
        .from("digital_resources")
        .update({
        total_acces_numeriques: (resource.total_acces_numeriques || 0) + 1,
        })
        .eq("id", id)

    const doc = Array.isArray(resource.documents) ? resource.documents[0] : resource.documents
    const auteurDirect = Array.isArray(resource.auteur_direct)
        ? resource.auteur_direct[0]
        : resource.auteur_direct
    const titre = doc?.title || resource.title
    const auteur = doc?.auteurs?.[0]?.name || auteurDirect?.name || "Auteur inconnu"

    const fileExtension = resource.url?.split(".").pop()?.toLowerCase() || resource.type || "pdf"

    let viewerContent = null
    let iconComponent = <FileText className="w-6 h-6" />

    if (["pdf", "application/pdf"].includes(fileExtension)) {
        iconComponent = <BookOpen className="w-6 h-6" />
        viewerContent = (
        <iframe
            src={resource.url}
            className="w-full h-full border-0"
            title={titre}
        />
        )
    } else if (["mp4", "webm", "video/mp4"].includes(fileExtension)) {
        iconComponent = <Film className="w-6 h-6" />
        viewerContent = (
        <video
            src={resource.url}
            controls
            autoPlay
            className="w-full h-full object-contain bg-black"
        >
            Votre navigateur ne supporte pas la lecture vidéo.
        </video>
        )
    } else if (["mp3", "wav", "audio/mpeg"].includes(fileExtension)) {
        iconComponent = <Music className="w-6 h-6" />
        viewerContent = (
        <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-purple-900 to-slate-900 p-8">
            <div className="w-32 h-32 rounded-full bg-purple-500/20 flex items-center justify-center mb-8">
            <Music className="w-16 h-16 text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{titre}</h2>
            <p className="text-purple-200 mb-8">{auteur}</p>
            <audio
            src={resource.url}
            controls
            autoPlay
            className="w-full max-w-2xl"
            >
            Votre navigateur ne supporte pas la lecture audio.
            </audio>
        </div>
        )
    } else if (["jpg", "jpeg", "png", "gif", "webp", "image/jpeg", "image/png"].includes(fileExtension)) {
        iconComponent = <ImageIcon className="w-6 h-6" />
        viewerContent = (
        <div className="flex items-center justify-center h-full bg-slate-900 p-4">
            <Image
            src={resource.url}
            alt={titre}
            width={1200}
            height={800}
            unoptimized
            className="max-w-full max-h-full object-contain"
            />
        </div>
        )
    } else if (["doc", "docx", "ppt", "pptx", "xls", "xlsx"].includes(fileExtension)) {
        iconComponent = <FileText className="w-6 h-6" />
        const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(resource.url)}&embedded=true`
        viewerContent = (
        <iframe
            src={googleViewerUrl}
            className="w-full h-full border-0"
            title={titre}
        />
        )
    } else {
        viewerContent = (
        <div className="flex flex-col items-center justify-center h-full bg-slate-100 dark:bg-slate-900 p-8">
            <FileText className="w-16 h-16 text-slate-400 mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            {titre}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
            Ce format de fichier ne peut pas être prévisualisé dans le navigateur.
            </p>
            {resource.downloadable && (
            <a
                href={`/api/download/${resource.id}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
                <Download className="w-5 h-5" />
                Télécharger le fichier
            </a>
            )}
        </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        {/* Header fixe */}
        <div className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                <Link href="/dashboard/numerique">
                    <Button variant="ghost" size="icon" className="shrink-0">
                    <ArrowLeft className="w-5 w-5" />
                    </Button>
                </Link>
                <div className="min-w-0 flex-1">
                    <h1 className="text-lg font-semibold text-slate-900 dark:text-white truncate">
                    {titre}
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                    {auteur}
                    </p>
                </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className="hidden sm:flex">
                    {iconComponent}
                    <span className="ml-2 uppercase">{fileExtension}</span>
                </Badge>
                {!resource.downloadable && (
                    <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    Lecture seule
                    </Badge>
                )}
                {resource.downloadable && (
                    <a
                    href={`/api/download/${resource.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Télécharger</span>
                    </a>
                )}
                </div>
            </div>
            </div>
        </div>

        {/* Zone de lecture plein écran */}
        <div className="h-[calc(100vh-4rem)]">
            {viewerContent}
        </div>
        </div>
    )
    }