    "use client"

    import { useState } from "react"
    import { useRouter } from "next/navigation"
    import { createClient } from "@/lib/supabase/client"
    import { Button } from "@/components/ui/button"
    import { Card, CardContent } from "@/components/ui/card"
    import { Input } from "@/components/ui/input"
    import { Label } from "@/components/ui/label"
    import { Textarea } from "@/components/ui/textarea"
    import { FileText, Upload, X, ArrowRight } from "lucide-react"

    export default function EmpruntsPage() {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        type: "pdf",
        category: "projet_tutore",
        access_level: "all",
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
        setSelectedFile(e.target.files[0])
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (!selectedFile) {
        setError("Veuillez sélectionner un fichier depuis votre disque local.")
        return
        }

        setLoading(true)
        setError(null)
        setSuccess(false)

        try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            throw new Error("Vous devez être connecté pour ajouter une ressource numérique.")
        }

        const fileExt = selectedFile.name.split(".").pop() ?? "pdf"
        const fileName = `${crypto.randomUUID()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
            .from("digital-resources")
            .upload(fileName, selectedFile)

        if (uploadError) throw uploadError

        const { data: publicData } = supabase.storage
            .from("digital-resources")
            .getPublicUrl(fileName)

        const { error: dbError } = await supabase.from("digital_resources").insert({
            title: formData.title || selectedFile.name,
            description: formData.description,
            url: publicData.publicUrl,
            type: formData.type,
            category: formData.category,
            access_level: formData.access_level,
            document_id: null,
        })

        if (dbError) throw dbError

        setSuccess(true)
        setTimeout(() => router.push("/dashboard/numerique"), 1200)
        } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erreur lors de l'ajout de la ressource numérique."
        setError(message)
        setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Ressources numériques</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Ajoutez un document depuis votre disque local et il est automatiquement visible dans le catalogue numérique.</p>
            </div>
            <Button type="button" variant="outline" onClick={() => router.push("/dashboard/numerique")} className="border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10">
                Voir le catalogue
                <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
        </div>

        {error && (
            <Card className="border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20">
            <CardContent className="p-4 text-sm text-red-700 dark:text-red-400">{error}</CardContent>
            </Card>
        )}

        {success && (
            <Card className="border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/20">
            <CardContent className="p-4 text-sm text-emerald-700 dark:text-emerald-400">Ressource ajoutée avec succès. Redirection vers le catalogue...</CardContent>
            </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardContent className="p-6 space-y-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                Ajouter un document numérique
                </h2>

                <div className="space-y-2">
                <Label htmlFor="title">Titre</Label>
                <Input id="title" name="title" value={formData.title} onChange={handleChange} placeholder="Ex : Rapport de projet tutoré" required />
                </div>

                <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" rows={4} value={formData.description} onChange={handleChange} placeholder="Courte description de la ressource..." />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="type">Type de fichier</Label>
                    <select id="type" name="type" value={formData.type} onChange={handleChange} className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm">
                    <option value="pdf">PDF</option>
                    <option value="epub">EPUB</option>
                    <option value="video">Vidéo</option>
                    <option value="audio">Audio</option>
                    <option value="document">Document</option>
                    <option value="other">Autre</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="category">Catégorie</Label>
                    <select id="category" name="category" value={formData.category} onChange={handleChange} className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm">
                    <option value="projet_tutore">Projet tutoré</option>
                    <option value="article">Article scientifique</option>
                    <option value="thesis">Mémoire / Thèse</option>
                    <option value="book">Livre numérique</option>
                    <option value="course">Cours</option>
                    <option value="other">Autre</option>
                    </select>
                </div>
                </div>

                <div className="space-y-2">
                <Label htmlFor="access_level">Accès</Label>
                <select id="access_level" name="access_level" value={formData.access_level} onChange={handleChange} className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm">
                    <option value="all">Tous</option>
                    <option value="student">Étudiants</option>
                    <option value="staff">Staff</option>
                </select>
                </div>

                <div className="space-y-2">
                <Label htmlFor="file">Fichier local</Label>
                <div className="flex items-center gap-2">
                    <Input id="file" type="file" onChange={handleFileChange} accept=".pdf,.epub,.mp4,.mp3,.doc,.docx,.ppt,.pptx" className="cursor-pointer" required />
                    {selectedFile && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => setSelectedFile(null)} className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950">
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
                </div>
            </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.push("/dashboard/numerique")}>Annuler</Button>
            <Button type="submit" disabled={loading || !selectedFile} className="bg-amber-500 hover:bg-amber-600 text-white min-w-[180px]">
                {loading ? "Ajout en cours..." : "Ajouter au catalogue numérique"}
                {!loading && <Upload className="w-4 h-4 ml-2" />}
            </Button>
            </div>
        </form>
        </div>
    )
    }