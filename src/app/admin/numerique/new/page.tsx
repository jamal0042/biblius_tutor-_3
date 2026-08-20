    "use client"

    import { useEffect, useState } from "react"
    import { useRouter } from "next/navigation"
    import { createClient } from "@/lib/supabase/client"
    import { Loader2, ArrowLeft, FileText, Upload, X } from "lucide-react"
    import { Button } from "@/components/ui/button"
    import { Input } from "@/components/ui/input"
    import { Label } from "@/components/ui/label"
    import { Textarea } from "@/components/ui/textarea"
    import { Card, CardContent } from "@/components/ui/card"
    import Link from "next/link"

    interface Auteur {
    id: string
    name: string
    }

    interface DocumentOption {
    id: string
    title: string
    auteurs: { name: string }[] | { name: string } | null
    }

    export default function AddDigitalResourcePage() {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [documents, setDocuments] = useState<DocumentOption[]>([])
    const [auteurs, setAuteurs] = useState<Auteur[]>([])
    const [authorSearch, setAuthorSearch] = useState("")
    const [showAuthorSuggestions, setShowAuthorSuggestions] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        type: "pdf",
        category: "projet_tutore",
        access_level: "all",
        document_id: "",
        author_id: "",
        downloadable: true
    })

    useEffect(() => {
        const loadAuteurs = async () => {
        const { data } = await supabase.from("auteurs").select("id, name").order("name")
        setAuteurs((data as Auteur[]) || [])
        }
        loadAuteurs()
    }, [supabase])

    const filteredAuteurs = authorSearch.trim()
        ? auteurs.filter((author) => author.name.toLowerCase().includes(authorSearch.trim().toLowerCase()))
        : auteurs.slice(0, 6)

    const selectAuthor = (author: Auteur) => {
        setFormData((prev) => ({ ...prev, author_id: author.id }))
        setAuthorSearch(author.name)
        setShowAuthorSuggestions(false)
    }

    const ensureAuthor = async () => {
        const name = authorSearch.trim()
        if (!name) return null
        const existing = auteurs.find((author) => author.name.toLowerCase() === name.toLowerCase())
        if (existing) return existing.id
        const { data, error } = await supabase.from("auteurs").insert({ name }).select("id, name").single()
        if (error) throw new Error(`Impossible de créer l'auteur : ${error.message}`)
        if (data) {
        setAuteurs((prev) => [...prev, data as Auteur].sort((a, b) => a.name.localeCompare(b.name)))
        return data.id
        }
        return null
    }

    const getDocumentAuthor = (document: DocumentOption) => {
        if (!document.auteurs) return "Auteur inconnu"
        return Array.isArray(document.auteurs) ? document.auteurs[0]?.name || "Auteur inconnu" : document.auteurs.name
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
        setSelectedFile(e.target.files[0])
        }
    }

    const fetchDocuments = async () => {
        const { data } = await supabase
        .from("documents")
        .select("id, title, auteurs(name)")
        .order("title")
        
        if (data) setDocuments(data as DocumentOption[])
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        
        if (!selectedFile) {
        setError("Veuillez sélectionner un fichier à uploader.")
        return
        }

        setLoading(true)
        setError(null)
        setSuccess(false)

        try {
        const authorId = await ensureAuthor()
        if (!authorId) throw new Error("Veuillez sélectionner ou saisir un auteur.")
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            throw new Error("Vous devez être connecté pour ajouter une ressource numérique.")
        }

        // 1. Générer un nom de fichier unique pour éviter les conflits
        const fileExt = selectedFile.name.split('.').pop()
        const fileName = `${crypto.randomUUID()}.${fileExt}`
        const filePath = fileName

        // 2. Uploader le fichier dans le bucket 'digital-resources'
        const { error: uploadError } = await supabase.storage
            .from('digital-resources')
            .upload(filePath, selectedFile)

        if (uploadError) throw uploadError

        // 3. Récupérer l'URL publique du fichier uploadé
        const { data: { publicUrl } } = supabase.storage
            .from('digital-resources')
            .getPublicUrl(filePath)

        // 4. Enregistrer les métadonnées dans la table 'digital_resources'
        const { error: dbError } = await supabase.from("digital_resources").insert({
            title: formData.title,
            description: formData.description,
            url: publicUrl, // <-- On utilise l'URL générée par Supabase
            type: formData.type,
            category: formData.category,
            access_level: formData.access_level,
            document_id: formData.document_id || null,
            author_id: authorId,
            downloadable: formData.downloadable
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
                Uploadez un document numérique accessible aux membres.
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
                <Label htmlFor="title">Titre </Label>
                <Input id="title" name="title" value={formData.title} onChange={handleChange} required />
                </div>

                <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" rows={3} value={formData.description} onChange={handleChange} />
                </div>

                <div className="space-y-2 relative">
                <Label htmlFor="authorSearch">Auteur de la ressource</Label>
                <Input id="authorSearch" value={authorSearch} onChange={(e) => { setAuthorSearch(e.target.value); setFormData((prev) => ({ ...prev, author_id: "" })); setShowAuthorSuggestions(true) }} onFocus={() => setShowAuthorSuggestions(true)} placeholder="Rechercher ou saisir un auteur" required />
                {showAuthorSuggestions && filteredAuteurs.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                    {filteredAuteurs.map((author) => <button type="button" key={author.id} onClick={() => selectAuthor(author)} className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">{author.name}</button>)}
                    </div>
                )}
                </div>

                {/* ZONE D'UPLOAD DE FICHIER */}
                <div className="space-y-2">
                <Label htmlFor="file">Fichier </Label>
                <div className="flex items-center gap-2">
                    <Input
                    id="file"
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.epub,.mp4,.mp3,.doc,.docx,.ppt,.pptx"
                    className="cursor-pointer"
                    required
                    />
                    {selectedFile && (
                    <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setSelectedFile(null)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                    )}
                </div>
                {selectedFile && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                    <FileText className="w-3 h-3" /> 
                    {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                )}
                <p className="text-xs text-slate-500">Formats acceptés : PDF, EPUB, Vidéo, Audio, Word, PowerPoint.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="type">Type de fichier</Label>
                    <select id="type" name="type" value={formData.type} onChange={handleChange} className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm">
                    <option value="pdf">PDF</option>
                    <option value="epub">EPUB</option>
                    <option value="video">Vidéo</option>
                    <option value="audio">Audio</option>
                    <option value="document">Document (Word/PPT)</option>
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

                <label className="flex items-center gap-3 rounded-md border border-slate-200 p-3 text-sm dark:border-slate-700">
                <input type="checkbox" name="downloadable" checked={formData.downloadable} onChange={(e) => setFormData((prev) => ({ ...prev, downloadable: e.target.checked }))} className="h-4 w-4 accent-amber-500" />
                <span><strong className="text-slate-900 dark:text-white">Autoriser le téléchargement</strong><span className="block text-xs text-slate-500">Sinon, la ressource reste consultable dans le navigateur uniquement.</span></span>
                </label>

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
                    <option key={doc.id} value={doc.id}>{doc.title} - {getDocumentAuthor(doc)}</option>
                    ))}
                </select>
                </div>
            </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
            <Link href="/admin/numerique">
                <Button type="button" variant="outline">Annuler</Button>
            </Link>
            <Button type="submit" disabled={loading || !selectedFile} className="bg-amber-500 hover:bg-amber-600 text-white min-w-[150px]">
                {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                <Upload className="w-4 h-4 mr-2" />
                )}
                {loading ? "Upload en cours..." : "Uploader et enregistrer"}
            </Button>
            </div>
        </form>
        </div>
    )
    }