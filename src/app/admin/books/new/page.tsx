    "use client"

    import { useState, useEffect } from "react"
    import { useRouter } from "next/navigation"
    import { createClient } from "@/lib/supabase/client"
    import { Save, Loader2, ArrowLeft, BookOpen, FileText, HardDrive, Plus, AlertCircle } from "lucide-react"
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
    const [authorSearch, setAuthorSearch] = useState("")
    const [showAuthorSuggestions, setShowAuthorSuggestions] = useState(false)
    const [selectedDigitalFile, setSelectedDigitalFile] = useState<File | null>(null)

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
        has_digital: false,
    })

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

    const filteredAuteurs = authorSearch.trim()
        ? auteurs.filter((a) => a.name.toLowerCase().includes(authorSearch.trim().toLowerCase()))
        : auteurs.slice(0, 6)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const rawValue = e.target.value
        const value = e.target.type === "number"
        ? (e.target.name === "total_exemplaires" ? Math.max(0, Number(rawValue) || 0) : Number(rawValue) || 0)
        : rawValue
        setFormData((prev) => ({ ...prev, [e.target.name]: value }))
    }

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, has_digital: e.target.checked }))
        if (!e.target.checked) {
        setSelectedDigitalFile(null)
        setFormData((prev) => ({ ...prev, digital_url: "" }))
        }
    }

    const handleDigitalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
        setSelectedDigitalFile(e.target.files[0])
        }
    }

    const ensureAuthor = async (name: string) => {
        const trimmedName = name.trim()
        if (!trimmedName) return null

        const existing = auteurs.find((a) => a.name.toLowerCase() === trimmedName.toLowerCase())
        if (existing) {
        setFormData((prev) => ({ ...prev, author_id: existing.id }))
        setAuthorSearch(existing.name)
        setShowAuthorSuggestions(false)
        return existing.id
        }

        const { data, error } = await supabase
        .from("auteurs")
        .insert({ name: trimmedName })
        .select("id, name")
        .single()

        if (error && error.code === "23505") {
        const { data: duplicated } = await supabase
            .from("auteurs")
            .select("id, name")
            .eq("name", trimmedName)
            .maybeSingle()

        if (duplicated) {
            setFormData((prev) => ({ ...prev, author_id: duplicated.id }))
            setAuthorSearch(duplicated.name)
            setShowAuthorSuggestions(false)
            return duplicated.id
        }
        }

        if (error) throw new Error(error.message)

        if (data) {
        setAuteurs((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
        setFormData((prev) => ({ ...prev, author_id: data.id }))
        setAuthorSearch(data.name)
        setShowAuthorSuggestions(false)
        return data.id
        }

        return null
    }

    const selectAuthor = (author: Auteur) => {
        setFormData((prev) => ({ ...prev, author_id: author.id }))
        setAuthorSearch(author.name)
        setShowAuthorSuggestions(false)
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
        // Vérification de l'utilisateur connecté
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            throw new Error("Vous devez être connecté pour ajouter un document.")
        }

        // Résolution de l'auteur
        let resolvedAuthorId = formData.author_id
        if (!resolvedAuthorId && authorSearch.trim()) {
            resolvedAuthorId = await ensureAuthor(authorSearch)
        }

        if (!resolvedAuthorId) {
            throw new Error("Veuillez sélectionner ou créer un auteur")
        }

        // Validation : il faut au moins un exemplaire physique OU une version numérique
        if (formData.total_exemplaires === 0 && !formData.has_digital) {
            throw new Error("Vous devez ajouter soit des exemplaires physiques, soit une version numérique (ou les deux).")
        }

        const hasPhysical = formData.total_exemplaires > 0
        const format = hasPhysical && formData.has_digital
            ? "hybrid"
            : hasPhysical
            ? "physique"
            : "numerique"

        // Upload du fichier numérique si présent
        let uploadedDigitalUrl = formData.digital_url || null

        if (formData.has_digital && selectedDigitalFile) {
            try {
            const fileExt = selectedDigitalFile.name.split(".").pop() ?? "pdf"
            const fileName = `${crypto.randomUUID()}.${fileExt}`
            
            const { error: uploadError } = await supabase.storage
                .from("digital-resources")
                .upload(fileName, selectedDigitalFile, {
                cacheControl: "3600",
                upsert: false,
                })

            if (uploadError) {
                throw new Error(`Échec de l'upload du fichier : ${uploadError.message}. Vérifiez que le bucket "digital-resources" existe et est public.`)
            }

            const { data: publicData } = supabase.storage
                .from("digital-resources")
                .getPublicUrl(fileName)

            uploadedDigitalUrl = publicData.publicUrl
            } catch (uploadErr) {
            throw uploadErr instanceof Error ? uploadErr : new Error("Erreur lors de l'upload du fichier")
            }
        }

        // 1. Création de la notice bibliographique
        const { data: doc, error: dbError } = await supabase
            .from("documents")
            .insert({
            title: formData.title,
            author_id: resolvedAuthorId,
            isbn: formData.isbn || null,
            publisher: formData.publisher || null,
            year: parseInt(formData.year) || null,
            type: formData.type,
            language: formData.language,
            pages: parseInt(formData.pages) || null,
            description: formData.description || null,
            format: format,
            digital_url: formData.has_digital ? (uploadedDigitalUrl || formData.digital_url || null) : null,
            file_path: formData.has_digital ? (uploadedDigitalUrl || formData.digital_url || null) : null,
            total_acces_numeriques: formData.has_digital ? 1 : 0,
            acces_numeriques_disponibles: formData.has_digital ? 1 : 0,
            total_exemplaires: hasPhysical ? formData.total_exemplaires : 0,
            exemplaires_disponibles: hasPhysical ? formData.total_exemplaires : 0,
            })
            .select()
            .single()

        if (dbError) {
            console.error("Erreur Supabase documents:", dbError)
            throw new Error(`Erreur base de données : ${dbError.message}`)
        }
        if (!doc) throw new Error("Document non créé")

        // 2. Création de l'entrée dans digital_resources (pour que le livre apparaisse dans le catalogue numérique)
        if (formData.has_digital && uploadedDigitalUrl) {
            const { error: digitalError } = await supabase.from("digital_resources").insert({
            title: formData.title,
            description: formData.description || null,
            url: uploadedDigitalUrl,
            type: selectedDigitalFile 
                ? (selectedDigitalFile.name.split(".").pop() ?? "pdf") 
                : (formData.type === "book" ? "pdf" : formData.type),
            category: formData.type,
            access_level: "all",
            document_id: doc.id,
            })

            if (digitalError) {
            console.error("Erreur digital_resources:", digitalError)
            throw new Error(`Document créé, mais erreur dans le catalogue numérique : ${digitalError.message}`)
            }
        }

        // 3. Création des exemplaires physiques
        if (hasPhysical) {
            const exemplaires = Array.from({ length: formData.total_exemplaires }, (_, i) => ({
            document_id: doc.id,
            barcode: generateBarcode(i),
            inventory_code: `INV-${doc.id.slice(0, 8)}-${i + 1}`,
            status: "available",
            acquisition_date: new Date().toISOString().split("T")[0],
            }))

            const { error: exError } = await supabase.from("exemplaires").insert(exemplaires)
            if (exError) {
            console.error("Erreur exemplaires:", exError)
            throw new Error(`Document créé mais erreur sur les exemplaires : ${exError.message}`)
            }
        }

        setSuccess(true)
        setTimeout(() => {
            router.push("/admin/books")
        }, 1500)
        } catch (err: unknown) {
        console.error("Erreur complète:", err)
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
            <CardContent className="p-4 text-sm text-red-700 dark:text-red-400 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
            </CardContent>
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

                <div className="space-y-2">
                    <Label htmlFor="author_search">Auteur *</Label>
                    <div className="relative">
                    <Input
                        id="author_search"
                        value={authorSearch}
                        onChange={(e) => {
                        setAuthorSearch(e.target.value)
                        setShowAuthorSuggestions(true)
                        if (!e.target.value.trim()) {
                            setFormData((prev) => ({ ...prev, author_id: "" }))
                        }
                        }}
                        onFocus={() => setShowAuthorSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowAuthorSuggestions(false), 200)}
                        placeholder="Tapez le nom de l'auteur..."
                        required
                    />
                    {showAuthorSuggestions && authorSearch.trim() && filteredAuteurs.length > 0 && (
                        <div className="absolute z-10 mt-2 w-full rounded-md border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                        {filteredAuteurs.map((author) => (
                            <button
                            key={author.id}
                            type="button"
                            className="flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => selectAuthor(author)}
                            >
                            <span>{author.name}</span>
                            </button>
                        ))}
                        </div>
                    )}
                    </div>
                    {authorSearch.trim() && !formData.author_id && (
                    <div className="flex items-center gap-2 pt-1">
                        <Button
                        type="button"
                        variant="outline"
                        onClick={async () => {
                            try {
                            await ensureAuthor(authorSearch)
                            } catch (err) {
                            setError(err instanceof Error ? err.message : "Erreur lors de la création de l'auteur")
                            }
                        }}
                        >
                        <Plus className="w-4 h-4 mr-2" />
                        Créer cet auteur
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
                    className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
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
                    className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
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
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Mettez 0 si le document est uniquement numérique. Chaque exemplaire recevra un code-barres unique.
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
                <div className="space-y-4">
                    <div className="space-y-2">
                    <Label htmlFor="digital_file">Fichier numérique depuis votre PC</Label>
                    <Input
                        id="digital_file"
                        type="file"
                        accept=".pdf,.epub,.mp4,.mp3,.doc,.docx,.ppt,.pptx"
                        onChange={handleDigitalFileChange}
                        className="cursor-pointer"
                    />
                    {selectedDigitalFile && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        ✅ {selectedDigitalFile.name} ({(selectedDigitalFile.size / 1024 / 1024).toFixed(2)} Mo)
                        </p>
                    )}
                    </div>

                    <div className="space-y-2">
                    <Label htmlFor="digital_url">Lien externe (optionnel)</Label>
                    <Input
                        id="digital_url"
                        name="digital_url"
                        value={formData.digital_url}
                        onChange={handleChange}
                        placeholder="https://example.com/document.pdf"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Si vous ne téléchargez pas de fichier, collez ici une URL vers le document.
                    </p>
                    </div>
                </div>
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
                placeholder="Décrivez le contenu du document..."
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