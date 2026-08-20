    import { FileText, User } from "lucide-react"
    import { Card, CardContent } from "@/components/ui/card"
    import { createServerSupabaseClient, getCurrentMember } from "@/lib/supabase/server"
    import { isStaff } from "@/lib/roles"
    import { ResourceCardClient, type DigitalResource } from "@/components/resource-card"

    export default async function DigitalResourcesPage() {
    const member = await getCurrentMember()
    const supabase = await createServerSupabaseClient()

    // Requête corrigée : auteurs(name) au lieu de author
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

    // Éviter les doublons
    const myIds = new Set(myResources.map((r) => r.id))
    const otherResources = allResources.filter((r) => !myIds.has(r.id))

    return (
        <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Ressources Numériques</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
            Lisez vos documents directement dans la plateforme, sans quitter la bibliothèque.
            </p>
        </div>

        {/* SECTION : MES PUBLICATIONS */}
        {member && myResources.length > 0 && (
            <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-purple-500" />
                Mes publications ({myResources.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myResources.map((r) => (
                <ResourceCardClient key={r.id} resource={r} isMine />
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
                <ResourceCardClient key={r.id} resource={r} />
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