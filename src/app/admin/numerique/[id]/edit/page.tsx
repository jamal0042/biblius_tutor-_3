    "use client"

    import { useState, useEffect } from "react"
    import { useRouter, useParams } from "next/navigation"
    import { createClient } from "@/lib/supabase/client"
    import { Save, Loader2, ArrowLeft, FileText, X } from "lucide-react"
    import { Button } from "@/components/ui/button"
    import { Input } from "@/components/ui/input"
    import { Label } from "@/components/ui/label"
    import { Textarea } from "@/components/ui/textarea"
    import { Card, CardContent } from "@/components/ui/card"
    import Link from "next/link"

    interface DocumentOption { id: string; title: string; author: string }

    export default function EditDigitalResourcePage() {
    const router = useRouter()
    const params = useParams()
    const resourceId = params.id as string
    const supabase = createClient()
    
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [documents, setDocuments] = useState<DocumentOption[]>([])
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [currentFileName, setCurrentFileName] = useState<string>("")

    const [formData, setFormData] = useState({
        title: "", description: "", url: "", type: "pdf", category: "projet_tutore", access_level: "all", document_id: ""
    })

    useEffect(() => {
        const fetchData = async () => {
        const { data: resource, error: resError } = await supabase.from("digital_resources").select("*").eq("id", resourceId).single()
        if (resError || !resource) {
            setError("Ressource introuvable.")
        } else {
            setFormData({
            title: resource.title || "", description: resource.description || "", url: resource.url || "",
            type: resource.type || "pdf", category: resource.category || "projet_tutore",
            access_level: resource.access_level || "all", document_id: resource.document_id || ""
            })
            // Extraire le nom du fichier de l'URL pour l'affichage
            if (resource.url) setCurrentFileName(resource.url.split('/').pop() || "Fichier actuel")
        }
        setLoading(false)
        }
        fetchData()
    }, [resourceId, supabase])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0])
    }

    const fetchDocuments = async () => {
        const { data } = await supabase.from("documents").select("id, title, author").order("title")
        if (data) setDocuments(data as DocumentOption[])
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setSaving(true)
        setError(null)
        setSuccess(false)

        try {
        let finalUrl = formData.url

        // Si un nouveau fichier est sélectionné, on l'upload et on met à jour l'URL
        if (selectedFile) {
            const fileExt = selectedFile.name.split('.').pop()
            const fileName = `${crypto.randomUUID()}.${fileExt}`
            
            const { error: uploadError } = await supabase.storage.from('digital-resources').upload(fileName, selectedFile)
            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage.from('digital-resources').getPublicUrl(fileName)
            finalUrl = publicUrl
            
            // (Optionnel) Supprimer l'ancien fichier du stockage pour économiser de l'espace
            if (currentFileName && currentFileName !== "Fichier actuel") {
                await supabase.storage.from('digital-resources').remove([currentFileName])
            }
        }

        const { error: dbError } = await supabase.from("digital_resources").update({
            title: formData.title,
            description: formData.description,
            url: finalUrl,
            type: formData.type,
            category: formData.category,
            access_level: formData.access_level,
            document_id: formData.document_id || null,
            updated_at: new Date().toISOString()
        }).eq("id", resourceId)

        if (dbError) throw dbError

        setSuccess(true)
        setTimeout(() => router.push("/admin/numerique"), 1500)
        } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Erreur lors de la modification."
        setError(errorMessage)
        setSaving(false)
        }
    }

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
    if (error && !formData.title) return <div className="p-8 text-center text-red-500">{error} <br/><Link href="/admin/numerique" className="text-amber-500 underline">Retour</Link></div>

    return (
        <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
            <Link href="/admin/numerique"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
            <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Modifier la ressource</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Mettez à jour les informations ou remplacez le fichier.</p>
            </div>
        </div>

        {error && <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900"><CardContent className="p-4 text-sm text-red-700 dark:text-red-400">{error}</CardContent></Card>}
        {success && <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-900"><CardContent className="p-4 text-sm text-emerald-700 dark:text-emerald-400">Ressource modifiée avec succès ! Redirection...</CardContent></Card>}

        <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                <Label htmlFor="title">Titre *</Label>
                <Input id="title" name="title" value={formData.title} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" rows={3} value={formData.description} onChange={handleChange} />
                </div>

                {/* Gestion du fichier existant / nouveau */}
                <div className="space-y-2">
                <Label>Fichier actuel</Label>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <FileText className="w-4 h-4 text-amber-500" /> {currentFileName}
                </div>
                </div>

                <div className="space-y-2">
                <Label htmlFor="file">Remplacer par un nouveau fichier (optionnel)</Label>
                <div className="flex items-center gap-2">
                    <Input id="file" type="file" onChange={handleFileChange} accept=".pdf,.epub,.mp4,.mp3,.doc,.docx,.ppt,.pptx" className="cursor-pointer" />
                    {selectedFile && <Button type="button" variant="ghost" size="icon" onClick={() => setSelectedFile(null)} className="text-red-500"><X className="w-4 h-4" /></Button>}
                </div>
                {selectedFile && <p className="text-xs text-emerald-600 font-medium">{selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="type">Type de fichier</Label>
                    <select id="type" name="type" value={formData.type} onChange={handleChange} className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm dark:text-white">
                    <option value="pdf">PDF</option><option value="epub">EPUB</option><option value="video">Vidéo</option><option value="audio">Audio</option><option value="document">Document</option><option value="other">Autre</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="category">Catégorie</Label>
                    <select id="category" name="category" value={formData.category} onChange={handleChange} className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm dark:text-white">
                    <option value="article">Article scientifique</option><option value="thesis">Thèse / Mémoire</option><option value="projet_tutore">Projet tutoré</option><option value="book">Livre numérique</option><option value="course">Cours</option><option value="other">Autre</option>
                    </select>
                </div>
                </div>

                <div className="space-y-2">
                <Label htmlFor="access_level">Niveau d&apos;accès</Label>
                <select id="access_level" name="access_level" value={formData.access_level} onChange={handleChange} className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm dark:text-white">
                    <option value="all">Tous les membres</option><option value="student">Étudiants uniquement</option><option value="staff">Staff uniquement</option>
                </select>
                </div>

                <div className="space-y-2">
                <Label htmlFor="document_id">Lier à un document du catalogue (optionnel)</Label>
                <select id="document_id" name="document_id" value={formData.document_id} onChange={handleChange} onFocus={fetchDocuments} className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm dark:text-white">
                    <option value="">Aucun</option>
                    {documents.map((doc) => (<option key={doc.id} value={doc.id}>{doc.title} - {doc.author}</option>))}
                </select>
                </div>
            </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
            <Link href="/admin/numerique"><Button type="button" variant="outline">Annuler</Button></Link>
            <Button type="submit" disabled={saving} className="bg-amber-500 hover:bg-amber-600 text-white min-w-[150px]">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {saving ? "Enregistrement..." : "Enregistrer les modifications"}
            </Button>
            </div>
        </form>
        </div>
    )
    }