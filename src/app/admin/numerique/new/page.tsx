    "use client"

    import { useState } from "react"
    import { useRouter } from "next/navigation"
    import { createClient } from "@/lib/supabase/client"
    import { Save, Loader2, ArrowLeft, FileText } from "lucide-react"
    import { Button } from "@/components/ui/button"
    import { Input } from "@/components/ui/input"
    import { Label } from "@/components/ui/label"
    import { Textarea } from "@/components/ui/textarea"
    import { Card, CardContent } from "@/components/ui/card"
    import Link from "next/link"

    interface DocumentOption {
    id: string
    title: string
    author: string
    }

    export default function AddDigitalResourcePage() {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [documents, setDocuments] = useState<DocumentOption[]>([])

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        url: "",
        type: "pdf",
        category: "projet_tutore",
        access_level: "all",
        document_id: ""
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const fetchDocuments = async () => {
        const { data } = await supabase
        .from("documents")
        .select("id, title, author")
        .order("title")
        
        if (data) setDocuments(data as DocumentOption[])
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccess(false)

        try {
        const { error: dbError } = await supabase.from("digital_resources").insert({
            title: formData.title,
            description: formData.description,
            url: formData.url,
            type: formData.type,
            category: formData.category,
            access_level: formData.access_level,
            document_id: formData.document_id || null
        })

        if (dbError) throw dbError

        setSuccess(true)
        setTimeout(() => router.push("/admin/numerique"), 1500)
        } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Erreur lors de l'ajout."
        setError(errorMessage)
        setLoading(false)
        }
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
            <Link href="/admin/numerique">
            <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
            </Button>
            </Link>
            <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Ajouter une ressource numérique</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
                Ajoutez un document numérique accessible aux membres.
            </p>
            </div>
        </div>

        {error && (
            <Card className="border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20">
            <CardContent className="p-4 text-sm text-red-700 dark:text-red-400">{error}</CardContent>
            </Card>
        )}

        {success && (
            <Card className="border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/20">
            <CardContent className="p-4 text-sm text-emerald-700 dark:text-emerald-400">
                Ressource ajoutée avec succès ! Redirection...
            </CardContent>
            </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardContent className="p-6 space-y-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                Informations de la ressource
                </h2>

                <div className="space-y-2">
                <Label htmlFor="title">Titre *</Label>
                <Input id="title" name="title" value={formData.title} onChange={handleChange} required />
                </div>

                <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" rows={3} value={formData.description} onChange={handleChange} />
                </div>

                <div className="space-y-2">
                <Label htmlFor="url">URL du fichier *</Label>
                <Input id="url" name="url" type="url" value={formData.url} onChange={handleChange} placeholder="https://example.com/document.pdf" required />
                <p className="text-xs text-slate-500">Lien direct vers le fichier PDF, EPUB, ou autre format</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="type">Type de fichier</Label>
                    <select id="type" name="type" value={formData.type} onChange={handleChange} className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm">
                    <option value="pdf">PDF</option>
                    <option value="epub">EPUB</option>
                    <option value="video">Vidéo</option>
                    <option value="audio">Audio</option>
                    <option value="other">Autre</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="category">Catégorie</Label>
                    <select id="category" name="category" value={formData.category} onChange={handleChange} className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm">
                    <option value="article">Article scientifique</option>
                    <option value="thesis">Thèse / Mémoire</option>
                    <option value="projet_tutore">Projet tutoré</option>
                    <option value="book">Livre numérique</option>
                    <option value="course">Cours</option>
                    <option value="other">Autre</option>
                    </select>
                </div>
                </div>

                <div className="space-y-2">
                <Label htmlFor="access_level">Niveau d&apos;accès</Label>
                <select id="access_level" name="access_level" value={formData.access_level} onChange={handleChange} className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm">
                    <option value="all">Tous les membres</option>
                    <option value="student">Étudiants uniquement</option>
                    <option value="staff">Staff uniquement (Admin/Bibliothécaire)</option>
                </select>
                </div>

                <div className="space-y-2">
                <Label htmlFor="document_id">Lier à un document du catalogue (optionnel)</Label>
                <select 
                    id="document_id" 
                    name="document_id" 
                    value={formData.document_id} 
                    onChange={handleChange}
                    onFocus={fetchDocuments}
                    className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
                >
                    <option value="">Aucun</option>
                    {documents.map((doc) => (
                    <option key={doc.id} value={doc.id}>{doc.title} - {doc.author}</option>
                    ))}
                </select>
                </div>
            </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
            <Link href="/admin/numerique">
                <Button type="button" variant="outline">Annuler</Button>
            </Link>
            <Button type="submit" disabled={loading} className="bg-amber-500 hover:bg-amber-600 text-white min-w-[150px]">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {loading ? "Enregistrement..." : "Enregistrer la ressource"}
            </Button>
            </div>
        </form>
        </div>
    )
    }