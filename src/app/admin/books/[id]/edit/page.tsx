    "use client"
    /* eslint-disable react-hooks/set-state-in-effect */

    import { useState, useEffect, useCallback } from "react"
    import { useRouter, useParams } from "next/navigation"
    import { createClient } from "@/lib/supabase/client"
    import { Save, Loader2, ArrowLeft, BookOpen, FileText, HardDrive } from "lucide-react"
    import { Button } from "@/components/ui/button"
    import { Input } from "@/components/ui/input"
    import { Label } from "@/components/ui/label"
    import { Textarea } from "@/components/ui/textarea"
    import { Card, CardContent } from "@/components/ui/card"
    import Link from "next/link"

    export default function EditBookPage() {
    const router = useRouter()
    const params = useParams()
    const bookId = params.id as string
    const supabase = createClient()
    
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const [formData, setFormData] = useState({
        title: "", author: "", isbn: "", publisher: "", year: "",
        type: "book", language: "fr", pages: "", description: "",
        total_exemplaires: 0, digital_url: "", has_digital: false
    })

    const fetchBook = useCallback(async () => {
        setLoading(true)
        const { data, error } = await supabase.from("documents").select("*").eq("id", bookId).single()

        if (error || !data) {
        setError("Document non trouvé.")
        } else {
        setFormData({
            title: data.title || "", author: data.author || "", isbn: data.isbn || "",
            publisher: data.publisher || "", year: data.year?.toString() || "",
            type: data.type || "book", language: data.language || "fr",
            pages: data.pages?.toString() || "", description: data.description || "",
            total_exemplaires: data.total_exemplaires || 0,
            digital_url: data.digital_url || "", has_digital: !!data.digital_url
        })
        }
        setLoading(false)
    }, [bookId, supabase])

    useEffect(() => {
        fetchBook()
    }, [fetchBook])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const value = e.target.type === "number" ? parseInt(e.target.value) || 0 : e.target.value
        setFormData({ ...formData, [e.target.name]: value })
    }

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, has_digital: e.target.checked })
        if (!e.target.checked) setFormData({ ...formData, digital_url: "" })
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setSaving(true)
        setError(null)
        setSuccess(false)

        try {
        const { error: dbError } = await supabase.from("documents").update({
            title: formData.title, author: formData.author, isbn: formData.isbn || null,
            publisher: formData.publisher || null, year: parseInt(formData.year) || null,
            type: formData.type, language: formData.language, pages: parseInt(formData.pages) || null,
            description: formData.description || null, total_exemplaires: formData.total_exemplaires,
            digital_url: formData.has_digital ? formData.digital_url : null,
            total_acces_numeriques: formData.has_digital ? 1 : 0,
            acces_numeriques_disponibles: formData.has_digital ? 1 : 0
        }).eq("id", bookId)

        if (dbError) throw dbError

        setSuccess(true)
        setTimeout(() => router.push("/admin/books"), 1500)
        } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Erreur lors de la modification."
        setError(errorMessage)
        setSaving(false)
        }
    }

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>

    if (error && !formData.title) {
        return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Card className="border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20">
            <CardContent className="p-6 text-center">
                <p className="text-red-700 dark:text-red-400 mb-4">{error}</p>
                <Link href="/admin/books"><Button variant="outline">Retour à la liste</Button></Link>
            </CardContent>
            </Card>
        </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
            <Link href="/admin/books"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
            <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Modifier le document</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Mettez à jour les informations de ce document.</p>
            </div>
        </div>

        {error && <Card className="border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20"><CardContent className="p-4 text-sm text-red-700 dark:text-red-400">{error}</CardContent></Card>}
        {success && <Card className="border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/20"><CardContent className="p-4 text-sm text-emerald-700 dark:text-emerald-400">Document modifié avec succès ! Redirection en cours...</CardContent></Card>}

        <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardContent className="p-6 space-y-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2"><BookOpen className="w-5 h-5 text-amber-500" /> Informations principales</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2"><Label htmlFor="title">Titre du document *</Label><Input id="title" name="title" value={formData.title} onChange={handleChange} required /></div>
                <div className="space-y-2">
                    <Label htmlFor="author">Auteur(s) *</Label>
                    <Input id="author" name="author" value={formData.author} onChange={handleChange} required />
                    <p className="text-xs text-slate-500">Séparez les noms par des virgules s&apos;il y a plusieurs auteurs.</p>
                </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2"><Label htmlFor="isbn">ISBN</Label><Input id="isbn" name="isbn" value={formData.isbn} onChange={handleChange} /></div>
                <div className="space-y-2"><Label htmlFor="publisher">Éditeur / Établissement</Label><Input id="publisher" name="publisher" value={formData.publisher} onChange={handleChange} /></div>
                <div className="space-y-2"><Label htmlFor="year">Année de publication</Label><Input id="year" name="year" type="number" value={formData.year} onChange={handleChange} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="type">Type de document</Label>
                    <select id="type" name="type" value={formData.type} onChange={handleChange} className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
                    <option value="book">Livre</option>
                    <option value="thesis">Mémoire / Thèse</option>
                    <option value="projet_tutore">Projet tutoré</option>
                    <option value="article">Article scientifique</option>
                    <option value="other">Autre</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="language">Langue</Label>
                    <select id="language" name="language" value={formData.language} onChange={handleChange} className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
                    <option value="fr">Français</option><option value="en">Anglais</option><option value="ar">Arabe</option><option value="es">Espagnol</option><option value="de">Allemand</option>
                    </select>
                </div>
                <div className="space-y-2"><Label htmlFor="pages">Nombre de pages</Label><Input id="pages" name="pages" type="number" value={formData.pages} onChange={handleChange} /></div>
                </div>
            </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardContent className="p-6 space-y-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2"><HardDrive className="w-5 h-5 text-amber-500" /> Exemplaires physiques</h2>
                <div className="space-y-2">
                <Label htmlFor="total_exemplaires">Nombre total d&apos;exemplaires</Label>
                <Input id="total_exemplaires" name="total_exemplaires" type="number" min="0" value={formData.total_exemplaires} onChange={handleChange} />
                </div>
            </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardContent className="p-6 space-y-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2"><FileText className="w-5 h-5 text-amber-500" /> Version numérique</h2>
                <div className="flex items-center space-x-2">
                <input type="checkbox" id="has_digital" checked={formData.has_digital} onChange={handleCheckboxChange} className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500" />
                <Label htmlFor="has_digital" className="text-sm font-medium">Ce document a une version numérique disponible</Label>
                </div>
                {formData.has_digital && (
                <div className="space-y-2">
                    <Label htmlFor="digital_url">Lien vers le document numérique</Label>
                    <Input id="digital_url" name="digital_url" type="url" value={formData.digital_url} onChange={handleChange} placeholder="https://example.com/document.pdf" />
                </div>
                )}
            </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardContent className="p-6 space-y-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Description</h2>
                <div className="space-y-2">
                <Label htmlFor="description">Résumé / Description</Label>
                <Textarea id="description" name="description" rows={6} value={formData.description} onChange={handleChange} />
                </div>
            </CardContent>
            </Card>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Link href="/admin/books"><Button type="button" variant="outline">Annuler</Button></Link>
            <Button type="submit" disabled={saving} className="bg-amber-500 hover:bg-amber-600 text-white min-w-[150px]">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {saving ? "Enregistrement..." : "Enregistrer les modifications"}
            </Button>
            </div>
        </form>
        </div>
    )
    }