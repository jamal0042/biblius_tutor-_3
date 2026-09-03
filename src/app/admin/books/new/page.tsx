        "use client"

        import {
        useEffect,
        useRef,
        useState,
        type ChangeEvent,
        type FormEvent,
        } from "react"
        import { useRouter } from "next/navigation"
        import Link from "next/link"
        import Image from "next/image"

        import { createClient } from "@/lib/supabase/client"
        import { saveDocumentAuthors } from "@/lib/authors"

        import {
        AlertCircle,
        ArrowLeft,
        BookOpen,
        CheckCircle2,
        FileText,
        ImagePlus,
        Info,
        Loader2,
        Save,
        Trash2,
        Upload,
        UserRound,
        X,
        } from "lucide-react"

        import { Button } from "@/components/ui/button"
        import { Input } from "@/components/ui/input"
        import { Label } from "@/components/ui/label"
        import { Textarea } from "@/components/ui/textarea"
        import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
        } from "@/components/ui/card"


        /* =========================================================
        TYPES
        ========================================================= */

        type DocumentType =
        | "book"
        | "thesis"
        | "memoire"
        | "tfc"
        | "article"
        | "projet_tutore"
        | "rapport_stage"
        | "other"

        type Language = "fr" | "en" | "ar"

        interface FormData {
        title: string
        subtitle: string
        isbn: string
        publisher: string
        year: string
        type: DocumentType
        language: Language
        pages: string
        description: string
        keywords: string
        total_exemplaires: number
        digital_url: string
        has_digital: boolean
        }


        /* =========================================================
        CONSTANTES
        ========================================================= */

        const COVER_BUCKET = "document-covers"
        const DIGITAL_BUCKET = "digital-resources"

        const MAX_COVER_SIZE = 5 * 1024 * 1024
        const MAX_DIGITAL_SIZE = 100 * 1024 * 1024

        const COVER_ACCEPTED_TYPES = [
        "image/jpeg",
        "image/png",
        "image/webp",
        ]

        // 🌟 CORRECTION : Utilisation de DIGITAL_ACCEPTED_TYPES dans la validation
        const DIGITAL_ACCEPTED_TYPES = [
        "application/pdf",
        "application/epub+zip",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "audio/mpeg",
        "video/mp4",
        ]

        const DOCUMENT_TYPES: {
        value: DocumentType
        label: string
        }[] = [
        { value: "book", label: "Livre" },
        { value: "thesis", label: "Thèse" },
        { value: "memoire", label: "Mémoire" },
        { value: "tfc", label: "TFC" },
        { value: "article", label: "Article scientifique" },
        { value: "projet_tutore", label: "Projet tutoré" },
        { value: "rapport_stage", label: "Rapport de stage" },
        { value: "other", label: "Autre document" },
        ]


        /* =========================================================
        PAGE
        ========================================================= */

        export default function AddBookPage() {
        const router = useRouter()
        const supabase = createClient()

        const coverInputRef = useRef<HTMLInputElement | null>(null)
        const digitalInputRef = useRef<HTMLInputElement | null>(null)

        const [loading, setLoading] = useState(false)
        const [error, setError] = useState<string | null>(null)
        const [success, setSuccess] = useState(false)

        const [authorsInput, setAuthorsInput] = useState("")

        const [coverFile, setCoverFile] = useState<File | null>(null)
        const [coverPreview, setCoverPreview] = useState<string | null>(null)

        const [selectedDigitalFile, setSelectedDigitalFile] =
            useState<File | null>(null)

        const [formData, setFormData] = useState<FormData>({
            title: "",
            subtitle: "",
            isbn: "",
            publisher: "",
            year: new Date().getFullYear().toString(),
            type: "book",
            language: "fr",
            pages: "",
            description: "",
            keywords: "",
            total_exemplaires: 1,
            digital_url: "",
            has_digital: false,
        })


        /* =========================================================
            NETTOYAGE APERÇU IMAGE
        ========================================================= */

        useEffect(() => {
            return () => {
            if (coverPreview) {
                URL.revokeObjectURL(coverPreview)
            }
            }
        }, [coverPreview])


        /* =========================================================
            CHANGEMENT CHAMPS
        ========================================================= */

        const handleChange = (
            e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
        ) => {
            const { name, value, type } = e.target

            if (type === "number") {
            const numericValue = Math.max(0, Number(value) || 0)

            setFormData((prev) => ({
                ...prev,
                [name]: numericValue,
            }))

            return
            }

            setFormData((prev) => ({
            ...prev,
            [name]: value,
            }))
        }


        /* =========================================================
            COUVERTURE
        ========================================================= */

        const handleCoverChange = (
            e: ChangeEvent<HTMLInputElement>
        ) => {
            const file = e.target.files?.[0]

            if (!file) return

            setError(null)

            if (!COVER_ACCEPTED_TYPES.includes(file.type)) {
            setError(
                "Format de couverture invalide. Utilisez JPG, PNG ou WEBP."
            )

            e.target.value = ""
            return
            }

            if (file.size > MAX_COVER_SIZE) {
            setError(
                "La couverture ne doit pas dépasser 5 Mo."
            )

            e.target.value = ""
            return
            }

            if (coverPreview) {
            URL.revokeObjectURL(coverPreview)
            }

            const previewUrl = URL.createObjectURL(file)

            setCoverFile(file)
            setCoverPreview(previewUrl)
        }


        const removeCover = () => {
            if (coverPreview) {
            URL.revokeObjectURL(coverPreview)
            }

            setCoverFile(null)
            setCoverPreview(null)

            if (coverInputRef.current) {
            coverInputRef.current.value = ""
            }
        }


        /* =========================================================
            FICHIER NUMÉRIQUE
        ========================================================= */

        const handleDigitalFileChange = (
            e: ChangeEvent<HTMLInputElement>
        ) => {
            const file = e.target.files?.[0]

            if (!file) return

            setError(null)

            // 🌟 CORRECTION : Utilisation de DIGITAL_ACCEPTED_TYPES
            if (!DIGITAL_ACCEPTED_TYPES.includes(file.type)) {
            setError(
                "Format de fichier invalide. Utilisez PDF, EPUB, DOC, DOCX, PPT, PPTX, MP3 ou MP4."
            )
            e.target.value = ""
            return
            }

            if (file.size > MAX_DIGITAL_SIZE) {
            setError(
                "Le fichier numérique ne doit pas dépasser 100 Mo."
            )

            e.target.value = ""
            return
            }

            setSelectedDigitalFile(file)
        }


        const removeDigitalFile = () => {
            setSelectedDigitalFile(null)

            if (digitalInputRef.current) {
            digitalInputRef.current.value = ""
            }
        }


        /* =========================================================
            CHECKBOX NUMÉRIQUE
        ========================================================= */

        const handleDigitalToggle = (
            e: ChangeEvent<HTMLInputElement>
        ) => {
            const checked = e.target.checked

            setFormData((prev) => ({
            ...prev,
            has_digital: checked,
            digital_url: checked ? prev.digital_url : "",
            }))

            if (!checked) {
            setSelectedDigitalFile(null)

            if (digitalInputRef.current) {
                digitalInputRef.current.value = ""
            }
            }
        }


        /* =========================================================
            BARCODE
        ========================================================= */

        const generateBarcode = (index: number) => {
            const timestamp = Date.now()
            .toString(36)
            .toUpperCase()
            .slice(-5)

            const random = crypto
            .randomUUID()
            .replace(/-/g, "")
            .slice(0, 5)
            .toUpperCase()

            return `BIB-${timestamp}-${random}-${String(index + 1).padStart(
            3,
            "0"
            )}`
        }


        /* =========================================================
            EXTENSION
        ========================================================= */

        const getExtension = (file: File) => {
            const parts = file.name.split(".")

            return parts.length > 1
            ? parts.pop()!.toLowerCase()
            : "bin"
        }


        /* =========================================================
            TYPE DOCUMENT
        ========================================================= */

        const getDocumentTypeLabel = () => {
            return (
            DOCUMENT_TYPES.find(
                (item) => item.value === formData.type
            )?.label ?? "Document"
            )
        }


        /* =========================================================
            VALIDATION
        ========================================================= */

        const validateForm = () => {
            if (!formData.title.trim()) {
            return "Le titre du document est obligatoire."
            }

            if (!authorsInput.trim()) {
            return "Veuillez saisir au moins un auteur."
            }

            if (!coverFile) {
            return (
                "La couverture ou la page de garde du document est obligatoire."
            )
            }

            if (
            formData.total_exemplaires === 0 &&
            !formData.has_digital
            ) {
            return (
                "Vous devez ajouter au moins un exemplaire physique ou une version numérique."
            )
            }

            const year = Number(formData.year)

            if (
            !Number.isInteger(year) ||
            year < 1000 ||
            year > new Date().getFullYear() + 1
            ) {
            return "Veuillez saisir une année de publication valide."
            }

            if (
            formData.pages &&
            Number(formData.pages) < 1
            ) {
            return "Le nombre de pages doit être supérieur à 0."
            }

            if (
            formData.has_digital &&
            !selectedDigitalFile &&
            !formData.digital_url.trim()
            ) {
            return (
                "Ajoutez un fichier numérique ou renseignez une URL."
            )
            }

            if (
            formData.digital_url &&
            !/^https?:\/\/.+/i.test(
                formData.digital_url.trim()
            )
            ) {
            return "L'URL numérique n'est pas valide."
            }

            return null
        }


        /* =========================================================
            SUBMIT
        ========================================================= */

        const handleSubmit = async (
            e: FormEvent<HTMLFormElement>
        ) => {
            e.preventDefault()

            if (loading) return

            setLoading(true)
            setError(null)
            setSuccess(false)

            let uploadedCoverPath: string | null = null
            let uploadedDigitalPath: string | null = null

            try {
            /* ---------------------------------------------
                VALIDATION
            --------------------------------------------- */

            const validationError = validateForm()

            if (validationError) {
                throw new Error(validationError)
            }


            /* ---------------------------------------------
                UTILISATEUR
            --------------------------------------------- */

            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser()

            if (userError || !user) {
                throw new Error(
                "Votre session a expiré. Veuillez vous reconnecter."
                )
            }


            /* ---------------------------------------------
                FORMAT
            --------------------------------------------- */

            const hasPhysical =
                formData.total_exemplaires > 0

            const format =
                hasPhysical && formData.has_digital
                ? "hybrid"
                : hasPhysical
                    ? "physique"
                    : "numerique"


            /* ---------------------------------------------
                UPLOAD COUVERTURE
            --------------------------------------------- */

            if (!coverFile) {
                throw new Error(
                "La couverture ou page de garde est obligatoire."
                )
            }

            const coverExtension = getExtension(coverFile)

            const coverPath =
                `${new Date().getFullYear()}/` +
                `${crypto.randomUUID()}.${coverExtension}`

            const {
                error: coverUploadError,
            } = await supabase.storage
                .from(COVER_BUCKET)
                .upload(
                coverPath,
                coverFile,
                {
                    cacheControl: "3600",
                    upsert: false,
                    contentType: coverFile.type,
                }
                )

            if (coverUploadError) {
                throw new Error(
                `Impossible d'envoyer la couverture : ${coverUploadError.message}`
                )
            }

            uploadedCoverPath = coverPath

            const {
                data: coverPublicData,
            } = supabase.storage
                .from(COVER_BUCKET)
                .getPublicUrl(coverPath)

            const coverUrl =
                coverPublicData.publicUrl


            /* ---------------------------------------------
                UPLOAD DOCUMENT NUMÉRIQUE
            --------------------------------------------- */

            let uploadedDigitalUrl =
                formData.digital_url.trim() || null

            if (
                formData.has_digital &&
                selectedDigitalFile
            ) {
                const extension =
                getExtension(selectedDigitalFile)

                const digitalPath =
                `${new Date().getFullYear()}/` +
                `${crypto.randomUUID()}.${extension}`

                const {
                error: digitalUploadError,
                } = await supabase.storage
                .from(DIGITAL_BUCKET)
                .upload(
                    digitalPath,
                    selectedDigitalFile,
                    {
                    cacheControl: "3600",
                    upsert: false,
                    contentType:
                        selectedDigitalFile.type,
                    }
                )

                if (digitalUploadError) {
                throw new Error(
                    `Impossible d'envoyer le fichier numérique : ${digitalUploadError.message}`
                )
                }

                uploadedDigitalPath = digitalPath

                const {
                data: digitalPublicData,
                } = supabase.storage
                .from(DIGITAL_BUCKET)
                .getPublicUrl(digitalPath)

                uploadedDigitalUrl =
                digitalPublicData.publicUrl
            }


            /* ---------------------------------------------
                CRÉATION DOCUMENT
            --------------------------------------------- */

            const {
                data: doc,
                error: dbError,
            } = await supabase
                .from("documents")
                .insert({
                title: formData.title.trim(),

                subtitle:
                    formData.subtitle.trim() || null,

                isbn:
                    formData.isbn.trim() || null,

                publisher:
                    formData.publisher.trim() || null,

                year:
                    Number(formData.year) || null,

                type: formData.type,

                language:
                    formData.language,

                pages:
                    formData.pages
                    ? Number(formData.pages)
                    : null,

                description:
                    formData.description.trim() || null,

                keywords:
                    formData.keywords.trim() || null,

                cover_url: coverUrl,

                format,

                digital_url:
                    formData.has_digital
                    ? uploadedDigitalUrl
                    : null,

                file_path:
                    formData.has_digital
                    ? uploadedDigitalUrl
                    : null,

                total_acces_numeriques:
                    formData.has_digital ? 1 : 0,

                acces_numeriques_disponibles:
                    formData.has_digital ? 1 : 0,

                total_exemplaires:
                    hasPhysical
                    ? formData.total_exemplaires
                    : 0,

                exemplaires_disponibles:
                    hasPhysical
                    ? formData.total_exemplaires
                    : 0,
                })
                .select()
                .single()

            if (dbError) {
                throw new Error(
                `Erreur base de données : ${dbError.message}`
                )
            }

            if (!doc) {
                throw new Error(
                "Le document n'a pas pu être créé."
                )
            }


            /* ---------------------------------------------
                AUTEURS
            --------------------------------------------- */

            await saveDocumentAuthors(
                doc.id,
                authorsInput.trim()
            )


            /* ---------------------------------------------
                RESSOURCE NUMÉRIQUE
            --------------------------------------------- */

            if (
                formData.has_digital &&
                uploadedDigitalUrl
            ) {
                const extension = selectedDigitalFile
                ? getExtension(selectedDigitalFile)
                : "pdf"

                const {
                error: digitalResourceError,
                } = await supabase
                .from("digital_resources")
                .insert({
                    title:
                    formData.title.trim(),

                    description:
                    formData.description.trim() || null,

                    url:
                    uploadedDigitalUrl,

                    type:
                    extension,

                    category:
                    formData.type,

                    access_level:
                    "all",

                    document_id:
                    doc.id,
                })

                if (digitalResourceError) {
                throw new Error(
                    `Le document a été créé, mais la ressource numérique n'a pas pu être enregistrée : ${digitalResourceError.message}`
                )
                }
            }


            /* ---------------------------------------------
                EXEMPLAIRES
            --------------------------------------------- */

            if (hasPhysical) {
                const exemplaires =
                Array.from(
                    {
                    length:
                        formData.total_exemplaires,
                    },
                    (_, index) => ({
                    document_id: doc.id,

                    barcode:
                        generateBarcode(index),

                    inventory_code:
                        `INV-${doc.id.slice(
                        0,
                        8
                        ).toUpperCase()}-${String(
                        index + 1
                        ).padStart(3, "0")}`,

                    status:
                        "available",

                    acquisition_date:
                        new Date()
                        .toISOString()
                        .split("T")[0],
                    })
                )

                const {
                error: exemplairesError,
                } = await supabase
                .from("exemplaires")
                .insert(exemplaires)

                if (exemplairesError) {
                throw new Error(
                    `Le document a été créé, mais les exemplaires n'ont pas pu être créés : ${exemplairesError.message}`
                )
                }
            }


            /* ---------------------------------------------
                SUCCÈS
            --------------------------------------------- */

            setSuccess(true)
            setLoading(false)

            setTimeout(() => {
                router.push("/admin/books")
                router.refresh()
            }, 1200)

            } catch (err) {
            console.error(
                "Erreur création document :",
                err
            )

            /*
            * Nettoyage des fichiers déjà uploadés
            * si une étape suivante échoue.
            */
            if (uploadedCoverPath) {
                await supabase.storage
                .from(COVER_BUCKET)
                .remove([uploadedCoverPath])
                .catch(() => {})
            }

            if (uploadedDigitalPath) {
                await supabase.storage
                .from(DIGITAL_BUCKET)
                .remove([uploadedDigitalPath])
                .catch(() => {})
            }

            setError(
                err instanceof Error
                ? err.message
                : "Une erreur inattendue est survenue."
            )

            setLoading(false)
            }
        }


        /* =========================================================
            RENDER
        ========================================================= */

        return (
            <div className="min-h-full bg-slate-50 dark:bg-slate-950">

            <div className="mx-auto max-w-6xl space-y-8 p-4 sm:p-6 lg:p-8">

                {/* =================================================
                HEADER
                ================================================= */}

                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                <div className="flex items-start gap-4">

                    <Link href="/admin/books">
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="
                        shrink-0
                        border-blue-200
                        bg-white
                        text-blue-700
                        hover:bg-blue-50
                        dark:border-blue-900
                        dark:bg-slate-900
                        dark:text-blue-300
                        dark:hover:bg-blue-950/40
                        "
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    </Link>

                    <div>
                    <div className="mb-2 flex items-center gap-2">

                        <span
                        className="
                            rounded-full
                            bg-blue-100
                            px-3
                            py-1
                            text-xs
                            font-semibold
                            text-blue-700
                            dark:bg-blue-500/10
                            dark:text-blue-300
                        "
                        >
                        CATALOGUE
                        </span>

                        <span className="h-1 w-1 rounded-full bg-amber-500" />

                        <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                        NOUVEAU DOCUMENT
                        </span>

                    </div>

                    <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                        Ajouter un document
                    </h1>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Créez une notice bibliographique complète
                        avec sa couverture ou sa page de garde.
                    </p>
                    </div>

                </div>

                </div>


                {/* =================================================
                ALERTES
                ================================================= */}

                {error && (
                <Card
                    className="
                    border-red-200
                    bg-red-50
                    dark:border-red-900/50
                    dark:bg-red-950/20
                    "
                >
                    <CardContent className="flex items-start gap-3 p-4">

                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />

                    <div className="flex-1">
                        <p className="font-semibold text-red-800 dark:text-red-300">
                        Impossible d&apos;enregistrer le document
                        </p>

                        <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                        {error}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setError(null)}
                        className="text-red-500 hover:text-red-700"
                    >
                        <X className="h-4 w-4" />
                    </button>

                    </CardContent>
                </Card>
                )}


                {success && (
                <Card
                    className="
                    border-blue-200
                    bg-blue-50
                    dark:border-blue-900/50
                    dark:bg-blue-950/20
                    "
                >
                    <CardContent className="flex items-center gap-3 p-4">

                    <div className="rounded-full bg-amber-100 p-2 dark:bg-amber-500/10">
                        <CheckCircle2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>

                    <div>
                        <p className="font-semibold text-blue-900 dark:text-blue-200">
                        Document enregistré avec succès
                        </p>

                        <p className="text-sm text-blue-700 dark:text-blue-300">
                        Redirection vers le catalogue...
                        </p>
                    </div>

                    </CardContent>
                </Card>
                )}


                {/* =================================================
                FORMULAIRE
                ================================================= */}

                <form
                onSubmit={handleSubmit}
                className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]"
                >

                {/* =================================================
                    COLONNE PRINCIPALE
                ================================================= */}

                <div className="space-y-6">

                    {/* ---------------------------------------------
                    INFORMATIONS BIBLIOGRAPHIQUES
                    --------------------------------------------- */}

                    <Card className="overflow-hidden border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

                    <CardHeader className="border-b border-slate-100 dark:border-slate-800">

                        <CardTitle className="flex items-center gap-3 text-lg">

                        <span className="rounded-lg bg-blue-100 p-2 dark:bg-blue-500/10">
                            <BookOpen className="h-5 w-5 text-blue-700 dark:text-blue-400" />
                        </span>

                        <div>
                            <p className="text-slate-950 dark:text-white">
                            Informations bibliographiques
                            </p>

                            <p className="mt-0.5 text-xs font-normal text-slate-500">
                            Informations principales du document
                            </p>
                        </div>

                        </CardTitle>

                    </CardHeader>

                    <CardContent className="space-y-6 p-6">

                        {/* TITRE */}

                        <div className="space-y-2">
                        <Label htmlFor="title">
                            Titre du document
                            <span className="ml-1 text-amber-600"></span>
                        </Label>

                        <Input
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Ex. Introduction aux réseaux informatiques"
                            required
                            className="
                            border-slate-200
                            focus-visible:border-blue-600
                            focus-visible:ring-blue-600
                            dark:border-slate-700
                            "
                        />
                        </div>


                        {/* SOUS-TITRE */}

                        <div className="space-y-2">
                        <Label htmlFor="subtitle">
                            Sous-titre
                            <span className="ml-2 text-xs font-normal text-slate-400">
                            (optionnel)
                            </span>
                        </Label>

                        <Input
                            id="subtitle"
                            name="subtitle"
                            value={formData.subtitle}
                            onChange={handleChange}
                            placeholder="Ex. Concepts, architectures et protocoles"
                        />
                        </div>


                        {/* AUTEURS */}

                        <div className="space-y-2">

                        <Label
                            htmlFor="authors"
                            className="flex items-center gap-2"
                        >
                            <UserRound className="h-4 w-4 text-amber-500" />
                            Auteur(s)
                        </Label>

                        <Input
                            id="authors"
                            value={authorsInput}
                            onChange={(e) =>
                            setAuthorsInput(e.target.value)
                            }
                            placeholder="Ex. Jean Dupont, Marie Kabila"
                            required
                        />

                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Séparez plusieurs auteurs par des virgules.
                        </p>

                        </div>


                        {/* ISBN / EDITEUR / ANNEE */}

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

                        <div className="space-y-2">
                            <Label htmlFor="isbn">
                            ISBN
                            </Label>

                            <Input
                            id="isbn"
                            name="isbn"
                            value={formData.isbn}
                            onChange={handleChange}
                            placeholder="978-..."
                            />
                        </div>


                        <div className="space-y-2">
                            <Label htmlFor="publisher">
                            Éditeur / Institution
                            </Label>

                            <Input
                            id="publisher"
                            name="publisher"
                            value={formData.publisher}
                            onChange={handleChange}
                            placeholder="Université..."
                            />
                        </div>


                        <div className="space-y-2">
                            <Label htmlFor="year">
                            Année
                            </Label>

                            <Input
                            id="year"
                            name="year"
                            type="number"
                            min="1000"
                            max={new Date().getFullYear() + 1}
                            value={formData.year}
                            onChange={handleChange}
                            />
                        </div>

                        </div>


                        {/* TYPE / LANGUE / PAGES */}

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

                        <div className="space-y-2">
                            <Label htmlFor="type">
                            Type de document
                            </Label>

                            <select
                            id="type"
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className="
                                flex
                                h-10
                                w-full
                                rounded-md
                                border
                                border-slate-200
                                bg-white
                                px-3
                                py-2
                                text-sm
                                text-slate-900
                                outline-none
                                transition
                                focus:border-blue-600
                                focus:ring-2
                                focus:ring-blue-600/20
                                dark:border-slate-700
                                dark:bg-slate-800
                                dark:text-white
                            "
                            >
                            {DOCUMENT_TYPES.map((item) => (
                                <option
                                key={item.value}
                                value={item.value}
                                >
                                {item.label}
                                </option>
                            ))}
                            </select>
                        </div>


                        <div className="space-y-2">
                            <Label htmlFor="language">
                            Langue
                            </Label>

                            <select
                            id="language"
                            name="language"
                            value={formData.language}
                            onChange={handleChange}
                            className="
                                flex
                                h-10
                                w-full
                                rounded-md
                                border
                                border-slate-200
                                bg-white
                                px-3
                                py-2
                                text-sm
                                text-slate-900
                                outline-none
                                focus:border-blue-600
                                focus:ring-2
                                focus:ring-blue-600/20
                                dark:border-slate-700
                                dark:bg-slate-800
                                dark:text-white
                            "
                            >
                            <option value="fr">
                                Français
                            </option>

                            <option value="en">
                                Anglais
                            </option>

                            <option value="ar">
                                Arabe
                            </option>
                            </select>
                        </div>


                        <div className="space-y-2">
                            <Label htmlFor="pages">
                            Nombre de pages
                            </Label>

                            <Input
                            id="pages"
                            name="pages"
                            type="number"
                            min="1"
                            value={formData.pages}
                            onChange={handleChange}
                            placeholder="Ex. 120"
                            />
                        </div>

                        </div>


                        {/* MOTS-CLES */}

                        <div className="space-y-2">

                        <Label htmlFor="keywords">
                            Mots-clés
                        </Label>

                        <Input
                            id="keywords"
                            name="keywords"
                            value={formData.keywords}
                            onChange={handleChange}
                            placeholder="Réseaux, informatique, TCP/IP, sécurité..."
                        />

                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Séparez les mots-clés par des virgules.
                        </p>

                        </div>

                    </CardContent>

                    </Card>


                    {/* ---------------------------------------------
                    COUVERTURE
                    --------------------------------------------- */}

                    <Card
                    className="
                        overflow-hidden
                        border-blue-200
                        bg-white
                        shadow-sm
                        dark:border-blue-900/50
                        dark:bg-slate-900
                    "
                    >

                    <CardHeader className="border-b border-blue-100 dark:border-blue-900/40">

                        <CardTitle className="flex items-center gap-3 text-lg">

                        <span className="rounded-lg bg-amber-100 p-2 dark:bg-amber-500/10">
                            <ImagePlus className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </span>

                        <div>
                            <p className="text-slate-950 dark:text-white">
                            Couverture / page de garde
                            </p>

                            <p className="mt-0.5 text-xs font-normal text-slate-500">
                            Image obligatoire pour identifier le document
                            </p>
                        </div>

                        </CardTitle>

                    </CardHeader>


                    <CardContent className="p-6">

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-[220px_1fr]">

                        {/* APERCU */}

                        <div className="flex justify-center">

                            <div
                            className="
                                relative
                                flex
                                h-[280px]
                                w-[200px]
                                items-center
                                justify-center
                                overflow-hidden
                                rounded-xl
                                border-2
                                border-dashed
                                border-blue-200
                                bg-blue-50
                                dark:border-blue-900
                                dark:bg-blue-950/20
                            "
                            >

                            {coverPreview ? (
                                <>
                                {/* 🌟 CORRECTION : Utilisation de next/image */}
                                <Image
                                    src={coverPreview}
                                    alt="Aperçu de la couverture"
                                    fill
                                    unoptimized
                                    className="object-cover"
                                />

                                <button
                                    type="button"
                                    onClick={removeCover}
                                    className="
                                    absolute
                                    right-2
                                    top-2
                                    rounded-full
                                    bg-slate-950/80
                                    p-2
                                    text-white
                                    transition
                                    hover:bg-slate-950
                                    "
                                    aria-label="Supprimer la couverture"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                                </>
                            ) : (
                                <div className="px-5 text-center">

                                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm dark:bg-slate-900">
                                    <ImagePlus className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                                </div>

                                <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                                    Aucune image
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                    Aperçu de la couverture
                                </p>

                                </div>
                            )}

                            </div>

                        </div>


                        {/* UPLOAD */}

                        <div className="flex flex-col justify-center">

                            <div
                            className="
                                rounded-xl
                                border
                                border-slate-200
                                bg-slate-50
                                p-5
                                dark:border-slate-800
                                dark:bg-slate-950/50
                            "
                            >

                            <div className="mb-4 flex items-start gap-3">

                                <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-500/10">
                                <Upload className="h-5 w-5 text-blue-700 dark:text-blue-400" />
                                </div>

                                <div>
                                <p className="font-semibold text-slate-900 dark:text-white">
                                    Ajouter l&apos;image
                                </p>

                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Pour un livre : couverture.
                                    Pour un TFC, mémoire, article,
                                    projet tutoré ou rapport : page de garde.
                                </p>
                                </div>

                            </div>


                            <input
                                ref={coverInputRef}
                                id="cover"
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleCoverChange}
                                className="hidden"
                            />

                            <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                coverInputRef.current?.click()
                                }
                                className="
                                w-full
                                border-blue-200
                                bg-white
                                text-blue-700
                                hover:bg-blue-50
                                dark:border-blue-900
                                dark:bg-slate-900
                                dark:text-blue-300
                                dark:hover:bg-blue-950/40
                                "
                            >
                                <ImagePlus className="mr-2 h-4 w-4" />

                                {coverFile
                                ? "Changer l'image"
                                : "Choisir une image"}
                            </Button>


                            <div className="mt-4 space-y-2 text-xs text-slate-500 dark:text-slate-400">

                                <p>
                                • Formats acceptés : JPG, PNG, WEBP
                                </p>

                                <p>
                                • Taille maximale : 5 Mo
                                </p>

                                <p>
                                • Une image verticale est recommandée
                                </p>

                            </div>


                            {coverFile && (
                                <div className="mt-4 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">

                                <div className="min-w-0">

                                    <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                                    {coverFile.name}
                                    </p>

                                    <p className="text-xs text-slate-500">
                                    {(coverFile.size / 1024 / 1024).toFixed(2)} Mo
                                    </p>

                                </div>

                                <CheckCircle2 className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />

                                </div>
                            )}

                            </div>

                        </div>

                        </div>

                    </CardContent>

                    </Card>


                    {/* ---------------------------------------------
                    EXEMPLAIRES
                    --------------------------------------------- */}

                    <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-lg">

                        <span className="rounded-lg bg-blue-100 p-2 dark:bg-blue-500/10">
                            <BookOpen className="h-5 w-5 text-blue-700 dark:text-blue-400" />
                        </span>

                        Exemplaires physiques

                        </CardTitle>
                    </CardHeader>

                    <CardContent>

                        <div className="max-w-sm space-y-2">

                        <Label htmlFor="total_exemplaires">
                            Nombre d&apos;exemplaires
                        </Label>

                        <Input
                            id="total_exemplaires"
                            name="total_exemplaires"
                            type="number"
                            min="0"
                            value={formData.total_exemplaires}
                            onChange={handleChange}
                        />

                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Chaque exemplaire recevra automatiquement
                            un code-barres et un numéro d&apos;inventaire.
                        </p>

                        </div>

                    </CardContent>

                    </Card>


                    {/* ---------------------------------------------
                    NUMERIQUE
                    --------------------------------------------- */}

                    <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-lg">

                        <span className="rounded-lg bg-amber-100 p-2 dark:bg-amber-500/10">
                            <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </span>

                        Version numérique

                        </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-5">

                        <label
                        htmlFor="has_digital"
                        className="
                            flex
                            cursor-pointer
                            items-start
                            gap-3
                            rounded-xl
                            border
                            border-slate-200
                            p-4
                            transition
                            hover:border-blue-300
                            dark:border-slate-800
                            dark:hover:border-blue-800
                        "
                        >

                        <input
                            type="checkbox"
                            id="has_digital"
                            checked={formData.has_digital}
                            onChange={handleDigitalToggle}
                            className="
                            mt-1
                            h-4
                            w-4
                            rounded
                            border-slate-300
                            text-blue-600
                            accent-blue-600
                            "
                        />

                        <div>
                            <p className="font-medium text-slate-900 dark:text-white">
                            Ce document possède une version numérique
                            </p>

                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            PDF, EPUB, Word, PowerPoint, audio ou vidéo.
                            </p>
                        </div>

                        </label>


                        {formData.has_digital && (
                        <div className="space-y-5 rounded-xl bg-slate-50 p-5 dark:bg-slate-950/50">

                            <div className="space-y-2">

                            <Label htmlFor="digital_file">
                                Fichier numérique
                            </Label>

                            <input
                                ref={digitalInputRef}
                                id="digital_file"
                                type="file"
                                accept=".pdf,.epub,.doc,.docx,.ppt,.pptx,.mp3,.mp4"
                                onChange={handleDigitalFileChange}
                                className="hidden"
                            />

                            <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                digitalInputRef.current?.click()
                                }
                                className="
                                w-full
                                border-blue-200
                                text-blue-700
                                hover:bg-blue-50
                                dark:border-blue-900
                                dark:text-blue-300
                                dark:hover:bg-blue-950/40
                                "
                            >
                                <Upload className="mr-2 h-4 w-4" />
                                Choisir un fichier
                            </Button>

                            {selectedDigitalFile && (
                                <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/20">

                                <div className="flex min-w-0 items-center gap-3">

                                    <FileText className="h-5 w-5 shrink-0 text-blue-600" />

                                    <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                                        {selectedDigitalFile.name}
                                    </p>

                                    <p className="text-xs text-slate-500">
                                        {(
                                        selectedDigitalFile.size /
                                        1024 /
                                        1024
                                        ).toFixed(2)}{" "}
                                        Mo
                                    </p>
                                    </div>

                                </div>

                                <button
                                    type="button"
                                    onClick={removeDigitalFile}
                                    className="rounded-md p-2 text-slate-500 hover:bg-white hover:text-red-600 dark:hover:bg-slate-900"
                                >
                                    <X className="h-4 w-4" />
                                </button>

                                </div>
                            )}

                            </div>


                            <div className="relative">

                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                            </div>

                            <div className="relative flex justify-center">
                                <span className="bg-slate-50 px-3 text-xs text-slate-400 dark:bg-slate-950/50">
                                OU
                                </span>
                            </div>

                            </div>


                            <div className="space-y-2">

                            <Label htmlFor="digital_url">
                                URL externe
                            </Label>

                            <Input
                                id="digital_url"
                                name="digital_url"
                                value={formData.digital_url}
                                onChange={handleChange}
                                placeholder="https://..."
                            />

                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Utilisez cette option si le document
                                est hébergé sur une autre plateforme.
                            </p>

                            </div>

                        </div>
                        )}

                    </CardContent>

                    </Card>


                    {/* ---------------------------------------------
                    DESCRIPTION
                    --------------------------------------------- */}

                    <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-lg">

                        <span className="rounded-lg bg-blue-100 p-2 dark:bg-blue-500/10">
                            <Info className="h-5 w-5 text-blue-700 dark:text-blue-400" />
                        </span>

                        Description

                        </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-2">

                        <Textarea
                        id="description"
                        name="description"
                        rows={6}
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Présentez brièvement le contenu, le sujet ou l'intérêt du document..."
                        className="resize-y"
                        />

                        <p className="text-xs text-slate-500 dark:text-slate-400">
                        Cette description pourra être affichée dans
                        le catalogue de la bibliothèque.
                        </p>

                    </CardContent>

                    </Card>

                </div>


                {/* =================================================
                    COLONNE DROITE
                ================================================= */}

                <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">

                    {/* RESUME */}

                    <Card className="overflow-hidden border-blue-200 bg-white shadow-sm dark:border-blue-900/50 dark:bg-slate-900">

                    <div className="h-1 bg-gradient-to-r from-blue-700 via-blue-600 to-amber-500" />

                    <CardHeader>
                        <CardTitle className="text-base text-slate-950 dark:text-white">
                        Résumé du document
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">

                        <div className="flex items-center gap-3">

                        {coverPreview ? (
                            // 🌟 CORRECTION : Utilisation de next/image
                            <Image
                            src={coverPreview}
                            alt=""
                            width={56}
                            height={80}
                            unoptimized
                            className="h-20 w-14 rounded-md object-cover shadow-sm"
                            />
                        ) : (
                            <div className="flex h-20 w-14 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/30">
                            <BookOpen className="h-6 w-6 text-blue-400" />
                            </div>
                        )}

                        <div className="min-w-0">

                            <p className="truncate font-semibold text-slate-900 dark:text-white">
                            {formData.title ||
                                "Titre du document"}
                            </p>

                            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                            {getDocumentTypeLabel()}
                            </p>

                        </div>

                        </div>


                        <div className="space-y-2 border-t border-slate-100 pt-4 dark:border-slate-800">

                        <SummaryRow
                            label="Auteur(s)"
                            value={
                            authorsInput ||
                            "Non renseigné"
                            }
                        />

                        <SummaryRow
                            label="Année"
                            value={
                            formData.year ||
                            "Non renseignée"
                            }
                        />

                        <SummaryRow
                            label="Langue"
                            value={
                            formData.language === "fr"
                                ? "Français"
                                : formData.language === "en"
                                ? "Anglais"
                                : "Arabe"
                            }
                        />

                        <SummaryRow
                            label="Physique"
                            value={`${formData.total_exemplaires} exemplaire(s)`}
                        />

                        <SummaryRow
                            label="Numérique"
                            value={
                            formData.has_digital
                                ? "Oui"
                                : "Non"
                            }
                        />

                        </div>

                    </CardContent>

                    </Card>


                    {/* CONSEIL */}

                    <Card className="border-amber-200 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-950/10">

                    <CardContent className="p-5">

                        <div className="flex items-start gap-3">

                        <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-500/10">
                            <Info className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>

                        <div>

                            <p className="font-semibold text-amber-900 dark:text-amber-200">
                            Conseil bibliothécaire
                            </p>

                            <p className="mt-2 text-xs leading-5 text-amber-800 dark:text-amber-300">
                            Utilisez une image claire de la couverture
                            pour les livres et de la page de garde
                            pour les travaux académiques.
                            </p>

                        </div>

                        </div>

                    </CardContent>

                    </Card>


                    {/* ACTIONS */}

                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">

                    <Button
                        type="submit"
                        disabled={loading || success}
                        className="
                        w-full
                        bg-blue-700
                        text-white
                        shadow-sm
                        hover:bg-blue-800
                        focus-visible:ring-blue-600
                        dark:bg-blue-600
                        dark:hover:bg-blue-700
                        "
                    >

                        {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Enregistrement...
                        </>
                        ) : success ? (
                        <>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Enregistré
                        </>
                        ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Enregistrer le document
                        </>
                        )}

                    </Button>


                    <Link
                        href="/admin/books"
                        className="mt-2 block"
                    >
                        <Button
                        type="button"
                        variant="ghost"
                        className="
                            w-full
                            text-slate-600
                            hover:bg-slate-100
                            dark:text-slate-400
                            dark:hover:bg-slate-800
                        "
                        >
                        Annuler
                        </Button>
                    </Link>

                    </div>

                </aside>

                </form>

            </div>

            </div>
        )
        }

        /* =========================================================
    COMPOSANT RÉSUMÉ
    ========================================================= */

    function SummaryRow({
    label,
    value,
    }: {
    label: string
    value: string
    }) {
    return (
        <div className="flex items-start justify-between gap-4 text-sm">

        <span className="shrink-0 text-slate-500 dark:text-slate-400">
            {label}
        </span>

        <span className="max-w-[180px] truncate text-right font-medium text-slate-900 dark:text-white">
            {value}
        </span>

        </div>
    )
    }
