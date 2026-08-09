    import { FileText, ExternalLink, BookOpen } from "lucide-react"
    import { Button } from "@/components/ui/button"
    import { Badge } from "@/components/ui/badge"
    import { Card, CardContent } from "@/components/ui/card"
    import { createServerSupabaseClient, getCurrentMember } from "@/lib/supabase/server"
    import { isStaff } from "@/lib/roles"

    interface DocumentInfo {
    title: string
    author: string
    }

    interface DigitalResource {
    id: string
    title: string
    description: string | null
    url: string
    type: string
    category: string
    access_level: string
    documents: DocumentInfo | null
    }

    export default async function DigitalResourcesPage() {
    const member = await getCurrentMember()
    const supabase = await createServerSupabaseClient()

    let query = supabase
        .from("digital_resources")
        .select(`
        *,
        documents (title, author)
        `)
        .order("created_at", { ascending: false })

    if (member) {
        const userRole = member.role
        const isAdmin = isStaff(userRole)
        
        if (!isAdmin && userRole !== "teacher") {
        query = query.or("access_level.eq.all,access_level.eq.student")
        }
    }

    const { data: resources } = await query
    const typedResources = (resources as DigitalResource[]) || []

    return (
        <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Ressources Numériques</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
            Accédez aux documents numériques disponibles.
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {typedResources.length > 0 ? (
            typedResources.map((resource) => (
                <Card key={resource.id} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-500/30 transition-colors">
                <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-amber-600 dark:text-amber-500" />
                    </div>
                    <Badge className={
                        resource.type === "pdf" ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400" :
                        resource.type === "epub" ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400" :
                        "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400"
                    }>
                        {resource.type.toUpperCase()}
                    </Badge>
                    </div>

                    <h3 className="font-semibold text-slate-900 dark:text-white text-lg mb-2">{resource.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">{resource.description}</p>

                    {resource.documents && (
                    <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                        <BookOpen className="w-3 h-3" />
                        Document lié
                        </div>
                        <div className="font-medium text-sm text-slate-900 dark:text-white">{resource.documents.title}</div>
                        <div className="text-xs text-slate-500">{resource.documents.author}</div>
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
            ))
            ) : (
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
            )}
        </div>
        </div>
    )
    }