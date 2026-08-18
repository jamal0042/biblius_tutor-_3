    "use client"
    /* eslint-disable react-hooks/set-state-in-effect */

    import { useEffect, useState, useCallback } from "react"
    import { createClient } from "@/lib/supabase/client"
    import Link from "next/link"
    import { Plus, Pencil, Trash2, Loader2, Search, ExternalLink } from "lucide-react"
    import { Button } from "@/components/ui/button"
    import { Badge } from "@/components/ui/badge"
    import { Card, CardContent } from "@/components/ui/card"
    import { Input } from "@/components/ui/input"

    interface DigitalResource {
    id: string
    title: string
    description: string | null
    url: string
    type: string
    category: string
    access_level: string
    created_at: string
    documents: { title: string; author: string } | null
    }

    export default function AdminDigitalResourcesPage() {
    const supabase = createClient()
    const [resources, setResources] = useState<DigitalResource[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    const fetchResources = useCallback(async () => {
        setLoading(true)
        const { data, error } = await supabase
        .from("digital_resources")
        .select(`*, documents (title, author)`)
        .order("created_at", { ascending: false })

        if (!error && data) setResources(data as DigitalResource[])
        setLoading(false)
    }, [supabase])

    useEffect(() => { fetchResources() }, [fetchResources])

    // 🌟 FONCTION DE SUPPRESSION
    const handleDelete = async (id: string, url: string) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer cette ressource ? Cette action est irréversible.")) return
        
        try {
        // 1. Supprimer le fichier du stockage (si l'URL existe)
        if (url) {
            const fileName = url.split('/').pop()
            if (fileName) {
            await supabase.storage.from('digital-resources').remove([fileName])
            }
        }
        // 2. Supprimer l'entrée de la base de données
        const { error } = await supabase.from("digital_resources").delete().eq("id", id)
        if (error) throw error
        
        fetchResources() // Rafraîchir la liste
        } catch (err) {
        console.error(err)
        alert("Erreur lors de la suppression de la ressource.")
        }
    }

    const filteredResources = resources.filter((r) => {
        const normalized = searchTerm.trim().toLowerCase()
        if (!normalized) return true

        const title = r.title?.toLowerCase() ?? ""
        const documentTitle = r.documents?.title?.toLowerCase() ?? ""
        const author = r.documents?.author?.toLowerCase() ?? ""

        return title.includes(normalized) || documentTitle.includes(normalized) || author.includes(normalized)
    })

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>

    return (
        <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Ressources Numériques</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Gérez les documents numériques disponibles pour les membres.</p>
            </div>
            <Link href="/admin/numerique/new">
            <Button className="bg-amber-500 hover:bg-amber-600 text-white"><Plus className="w-4 h-4 mr-2" /> Ajouter une ressource</Button>
            </Link>
        </div>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardContent className="p-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Rechercher par titre, document ou auteur..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            </CardContent>
        </Card>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto">
            <table className="w-full min-w-[900px]">
            <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Titre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Accès</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredResources.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">Aucune ressource numérique trouvée.</td></tr>
                ) : (
                filteredResources.map((resource) => (
                    <tr key={resource.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-900 dark:text-white">{resource.title}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{resource.description}</div>
                    </td>
                    <td className="px-6 py-4">
                        <Badge variant="outline" className="border-slate-300 dark:border-slate-700 capitalize">{resource.type}</Badge>
                    </td>
                    <td className="px-6 py-4">
                        <Badge className={resource.access_level === "all" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" : resource.access_level === "student" ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400" : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"}>
                        {resource.access_level === "all" ? "Tous" : resource.access_level === "student" ? "Étudiants" : "Staff"}
                        </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                        <a href={resource.url} target="_blank" rel="noopener noreferrer">
                            <Button size="icon" variant="ghost" className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white" title="Voir le fichier">
                            <ExternalLink className="w-4 h-4" />
                            </Button>
                        </a>
                        <Link href={`/admin/numerique/${resource.id}/edit`}>
                            <Button size="icon" variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950" title="Modifier">
                            <Pencil className="w-4 h-4" />
                            </Button>
                        </Link>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(resource.id, resource.url)} className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950" title="Supprimer">
                            <Trash2 className="w-4 h-4" />
                        </Button>
                        </div>
                    </td>
                    </tr>
                ))
                )}
            </tbody>
            </table>
        </div>
        </div>
    )
    }