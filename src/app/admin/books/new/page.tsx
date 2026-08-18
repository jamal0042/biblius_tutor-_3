    "use client"

    import { useState, useEffect } from "react"
    import { useRouter } from "next/navigation"
    import { createClient } from "@/lib/supabase/client"
    import { Save, Loader2, ArrowLeft, BookOpen, FileText, HardDrive, Plus } from "lucide-react"
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

    export default function AddBookPage() {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const [auteurs, setAuteurs] = useState<Auteur[]>([])
    const [newAuteurName, setNewAuteurName] = useState("")
    const [showNewAuteur, setShowNewAuteur] = useState(false)

    const [formData, setFormData] = useState({
        title: "",
        author_id: "",
        isbn: "",
        publisher: "",
        year: new Date().getFullYear().toString(),
        type: "book" as "book" | "thesis" | "memoire" | "article" | "other",
        language: "fr",
        pages: "",
        description: "",
        total_exemplaires: 1,
        digital_url: "",
        has_digital: false
    })

    // Charger la liste des auteurs
    useEffect(() => {
        const loadAuteurs = async () => {
        const { data } = await supabase
            .from("auteurs")
            .select("id, name")
            .order("name", { ascending: true })
        setAuteurs((data as Auteur[]) || [])
        }
        loadAuteurs()
    }, [supabase])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const value = e.target.type === "number" ? parseInt(e.target.value) || 0 : e.target.value
        setFormData({ ...formData, [e.target.name]: value })
    }

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, has_digital: e.target.checked })
        if (!e.target.checked) {
        setFormData({ ...formData, digital_url: "" })
        }
    }

    // Créer un nouvel auteur à la volée
    const handleCreateAuteur = async () => {
        if (!newAuteurName.trim()) return

        const { data, error } = await supabase
        .from("auteurs")
        .insert({ name: newAuteurName.trim() })
        .select()
        .single()

        if (error) {
        // Si l'auteur existe déjà, le récupérer
        if (error.code === "23505") {
            const { data: existing } = await supabase
            .from("auteurs")
            .select("id")
            .eq("name", newAuteurName.trim())
            .single()
            if (existing) {
            setFormData({ ...formData, author_id: existing.id })
            setNewAuteurName("")
            setShowNewAuteur(false)
            alert("Auteur existant sélectionné.")
            }
        } else {
            alert("Erreur : " + error.message)
        }
        return
        }

        if (data) {
        setAuteurs([...auteurs, data].sort((a, b) => a.name.localeCompare(b.name)))
        setFormData({ ...formData, author_id: data.id })
        setNewAuteurName("")
        setShowNewAuteur(false)
        }
    }

    const generateBarcode = (index: number) => {
        const timestamp = Date.now().toString(36).toUpperCase().slice(-4)
        const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
        return `BIB-${timestamp}-${rand}-${String(index + 1).padStart(3, "0")}`
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccess(false)

        try {
        if (!formData.author_id) {
            throw new Error("Veuillez sélectionner ou créer un auteur")
        }

        const hasPhysical = formData.total_exemplaires > 0
        const format = hasPhysical && formData.has_digital
            ? "hybrid"
            : hasPhysical
            ? "physique"
            : "numerique"

        // 1. Créer la notice
        const { data: doc, error: dbError } = await supabase
            .from("documents")
            .insert({
            title: formData.title,
            author_id: formData.author_id, // 🌟 NOUVEAU : ID au lieu de texte
            isbn: formData.isbn || null,
            publisher: formData.publisher || null,
            year: parseInt(formData.year) || null,
            type: formData.type,
            language: formData.language,
            pages: parseInt(formData.pages) || null,
            description: formData.description || null,
            format: format,
            digital_url: formData.has_digital ? formData.digital_url : null,
            file_path: formData.has_digital ? formData.digital_url : null,
            total_acces_numeriques: formData.has_digital ? 1 : 0,
            acces_numeriques_disponibles: formData.has_digital ? 1 : 0,
            total_exemplaires: 0,
            exemplaires_disponibles: 0
            })
            .select()
            .single()

        if (dbError) throw dbError
        if (!doc) throw new Error("Document non créé")

        // 2. Créer les exemplaires
        if (hasPhysical) {
            const exemplaires = Array.from({ length: formData.total_exemplaires }, (_, i) => ({
            document_id: doc.id,
            barcode: generateBarcode(i),
            inventory_code: `INV-${doc.id.slice(0, 8)}-${i + 1}`,
            status: "available",
            acquisition_date: new Date().toISOString().split("T")[0]
            }))

            const { error: exError } = await supabase.from("exemplaires").insert(exemplaires)
            if (exError) throw new Error(`Document créé mais erreur sur les exemplaires : ${exError.message}`)
        }

        setSuccess(true)
        setTimeout(() => {
            router.push("/admin/books")
        }, 1500)
        } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Erreur lors de l'ajout."
        setError(errorMessage)
        setLoading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
            <Link href="/admin/books">
            <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
            </Button>
            </Link>
            <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Ajouter un nouveau document</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
                Créez la notice bibliographique et ses exemplaires physiques.
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
                ✅ Document et exemplaires créés avec succès !
            </CardContent>
            </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardContent className="p-6 space-y-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-500" />
                Informations principales
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="title">Titre du document *</Label>
                    <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Ex: Le Petit Prince"
                    required
                    />
                </div>

                {/* 🌟 NOUVEAU : Sélection ou création d'auteur */}
                <div className="space-y-2">
                    <Label htmlFor="author_id">Auteur *</Label>
                    {!showNewAuteur ? (
                    <div className="flex gap-2">
                        <select
                        id="author_id"
                        name="author_id"
                        value={formData.author_id}
                        onChange={handleChange}
                        className="flex-1 h-10 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                        required
                        >
                        <option value="">-- Sélectionner un auteur --</option>
                        {auteurs.map((a) => (
                            <option key={a.id} value={a.id}>
                            {a.name}
                            </option>
                        ))}
                        </select>
                        <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowNewAuteur(true)}
                        size="icon"
                        title="Créer un nouvel auteur"
                        >
                        <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                    ) : (
                    <div className="flex gap-2">
                        <Input
                        value={newAuteurName}
                        onChange={(e) => setNewAuteurName(e.target.value)}
                        placeholder="Nom du nouvel auteur"
                        autoFocus
                        />
                        <Button type="button" onClick={handleCreateAuteur}>
                        Créer
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setShowNewAuteur(false)}>
                        Annuler
                        </Button>
                    </div>
                    )}
                </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="isbn">ISBN</Label>
                    <Input id="isbn" name="isbn" value={formData.isbn} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="publisher">Éditeur</Label>
                    <Input id="publisher" name="publisher" value={formData.publisher} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="year">Année</Label>
                    <Input id="year" name="year" type="number" value={formData.year} onChange={handleChange} />
                </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
                    >
                    <option value="book">Livre</option>
                    <option value="thesis">Thèse</option>
                    <option value="memoire">Mémoire</option>
                    <option value="article">Article</option>
                    <option value="other">Autre</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="language">Langue</Label>
                    <select
                    id="language"
                    name="language"
                    value={formData.language}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
                    >
                    <option value="fr">Français</option>
                    <option value="en">Anglais</option>
                    <option value="ar">Arabe</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="pages">Pages</Label>
                    <Input id="pages" name="pages" type="number" value={formData.pages} onChange={handleChange} />
                </div>
                </div>
            </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardContent className="p-6 space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-amber-500" />
                Exemplaires physiques
                </h2>
                <div className="space-y-2">
                <Label htmlFor="total_exemplaires">Nombre d&apos;exemplaires</Label>
                <Input
                    id="total_exemplaires"
                    name="total_exemplaires"
                    type="number"
                    min="0"
                    value={formData.total_exemplaires}
                    onChange={handleChange}
                />
                <p className="text-xs text-slate-500">
                    Chaque exemplaire recevra automatiquement un code-barres unique.
                </p>
                </div>
            </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardContent className="p-6 space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                Version numérique
                </h2>
                <div className="flex items-center space-x-2">
                <input
                    type="checkbox"
                    id="has_digital"
                    checked={formData.has_digital}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 rounded border-slate-300 text-amber-500"
                />
                <Label htmlFor="has_digital">Ce document a une version numérique</Label>
                </div>
                {formData.has_digital && (
                <Input
                    id="digital_url"
                    name="digital_url"
                    value={formData.digital_url}
                    onChange={handleChange}
                    placeholder="/documents/fichier.pdf ou https://..."
                />
                )}
            </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardContent className="p-6">
                <Label htmlFor="description">Description</Label>
                <Textarea
                id="description"
                name="description"
                rows={5}
                value={formData.description}
                onChange={handleChange}
                className="mt-2"
                />
            </CardContent>
            </Card>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Link href="/admin/books">
                <Button type="button" variant="outline">Annuler</Button>
            </Link>
            <Button
                type="submit"
                disabled={loading}
                className="bg-amber-500 hover:bg-amber-600 text-white min-w-[150px]"
            >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {loading ? "Enregistrement..." : "Enregistrer"}
            </Button>
            </div>
        </form>
        </div>
    )
    }