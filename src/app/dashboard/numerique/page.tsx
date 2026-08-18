    import { FileText, ExternalLink, BookOpen, User } from "lucide-react"
    import { Button } from "@/components/ui/button"
    import { Badge } from "@/components/ui/badge"
    import { Card, CardContent } from "@/components/ui/card"
    import { createServerSupabaseClient, getCurrentMember } from "@/lib/supabase/server"
    import { isStaff } from "@/lib/roles"

    // Types flexibles (objet OU tableau)
    type MaybeArray<T> = T | T[] | null

    interface AuteurInfo { id: string; name: string }
    interface DocumentInfo {
    title: string
    author_id: string | null
    auteurs: MaybeArray<AuteurInfo>
    }
    interface DigitalResource {
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

    // Carte réutilisable
    function ResourceCard({ resource, isMine }: { resource: DigitalResource; isMine?: boolean }) {
    const doc = toSingle(resource.documents)
    const docTitle = getDocTitle(doc)

    return (
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

            <a href={resource.url} target="_blank" rel="noopener noreferrer">
            <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white">
                <ExternalLink className="w-4 h-4 mr-2" />
                Accéder au document
            </Button>
            </a>
        </CardContent>
        </Card>
    )
    }

    export default async function DigitalResourcesPage() {
    const member = await getCurrentMember()
    const supabase = await createServerSupabaseClient()

    // 🌟 Requête corrigée : auteurs(name) au lieu de author
    const selectClause = `*, documents (title, author_id, auteurs (id, name))`

    // 1. Mes publications (si connecté)
    let myResources: DigitalResource[] = []
    if (member) {
        const { data } = await supabase
        .from("digital_resources")
        .select(selectClause)
        .eq("uploaded_by", member.id)
        .order("created_at", { ascending: false })
        myResources = (data as unknown as DigitalResource[]) || []
    }

    // 2. Ressources visibles selon le rôle
    let query = supabase
        .from("digital_resources")
        .select(selectClause)
        .order("created_at", { ascending: false })

    if (member) {
        const userRole = member.role
        if (!isStaff(userRole) && userRole !== "teacher") {
        query = query.or("access_level.eq.all,access_level.eq.student")
        }
    } else {
        query = query.eq("access_level", "all")
    }

    const { data: resources } = await query
    const allResources = (resources as unknown as DigitalResource[]) || []

    // Éviter les doublons (mes ressources déjà affichées en haut)
    const myIds = new Set(myResources.map((r) => r.id))
    const otherResources = allResources.filter((r) => !myIds.has(r.id))

    return (
        <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Ressources Numériques</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
            Accédez aux documents numériques disponibles.
            </p>
        </div>

        {/* 🌟 SECTION : MES PUBLICATIONS */}
        {member && myResources.length > 0 && (
            <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-purple-500" />
                Mes publications ({myResources.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myResources.map((r) => (
                <ResourceCard key={r.id} resource={r} isMine />
                ))}
            </div>
            </div>
        )}

        {/* SECTION : TOUTES LES RESSOURCES */}
        <div className="space-y-4">
            {member && myResources.length > 0 && (
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Toutes les ressources ({otherResources.length})
            </h2>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherResources.length > 0 ? (
                otherResources.map((r) => (
                <ResourceCard key={r.id} resource={r} />
                ))
            ) : myResources.length === 0 ? (
                <div className="col-span-full">
                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Aucune ressource disponible</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Les ressources numériques apparaîtront ici quand elles seront ajoutées.
                    </p>
                    </CardContent>
                </Card>
                </div>
            ) : null}
            </div>
        </div>
        </div>
    )
    }