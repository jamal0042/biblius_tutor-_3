    "use client"

    import { useState, useEffect, useCallback } from "react"
    import Image from "next/image"
    import { Search, BookOpen, ArrowLeft, Pencil, X, Loader2, Grid2x2, LayoutGrid } from "lucide-react"
    import { Button } from "@/components/ui/button"
    import { Input } from "@/components/ui/input"
    import { Badge } from "@/components/ui/badge"
    import Link from "next/link"
    import { createClient } from "@/lib/supabase/client"
    import { useAuth } from "@/hooks/use-auth"
    import { isStaff } from "@/lib/roles"
    import { DeleteBookButton } from "@/components/catalogue/delete-book-button"

    // Types flexibles (objet OU tableau)
    type MaybeArray<T> = T | T[] | null

    interface AuteurInfo {
    id: string
    name: string
    }

    interface Document {
    id: string
    title: string
    author: string | null
    type: string
    category_id: string | null
    cover_url: string | null
    exemplaires_disponibles: number | null
    auteurs: MaybeArray<AuteurInfo>
    }

    type ViewMode = "grid" | "compact"

    function toSingle<T>(rel: MaybeArray<T>): T | null {
    if (!rel) return null
    if (Array.isArray(rel)) return rel[0] ?? null
    return rel
    }

    function getAuthorName(doc: Document): string {
    const auteur = toSingle(doc.auteurs)
    return auteur?.name || doc.author || "Auteur inconnu"
    }

    export default function CataloguePage() {
    const supabase = createClient()
    const { member } = useAuth()
    const isAdmin = member ? isStaff(member.role) : false

    const [documents, setDocuments] = useState<Document[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedType, setSelectedType] = useState<string>("all")
    const [viewMode, setViewMode] = useState<ViewMode>("grid")

    const fetchDocuments = useCallback(async () => {
        setLoading(true)
        const { data } = await supabase
        .from("documents")
        .select(`
            *,
            auteurs (id, name)
        `)
        .order("title", { ascending: true })
        
        setDocuments((data as unknown as Document[]) || [])
        setLoading(false)
    }, [supabase])

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchDocuments()
    }, [fetchDocuments])

    // Filtrage côté client
    const filteredDocs = documents.filter((doc) => {
        const q = searchTerm.trim().toLowerCase()
        const matchesSearch = !q || 
        doc.title.toLowerCase().includes(q) || 
        getAuthorName(doc).toLowerCase().includes(q)
        
        const matchesType = selectedType === "all" || doc.type === selectedType
        
        return matchesSearch && matchesType
    })

    // Types uniques pour le filtre
    const availableTypes = Array.from(new Set(documents.map((d) => d.type)))

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12">
        {/* ===== EN-TÊTE STICKY ===== */}
        <div className="sticky top-16 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-3">
            
            {/* Ligne 1 : Retour + Titre */}
            <div className="flex items-center justify-between">
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Retour</span>
                </Link>
                
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-amber-500" />
                Catalogue
                <Badge variant="outline" className="text-xs ml-2">
                    {filteredDocs.length}
                </Badge>
                </h1>
                
                <div className="flex items-center gap-1">
                <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("grid")}
                    className={viewMode === "grid" ? "bg-amber-500 hover:bg-amber-600" : ""}
                >
                    <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                    variant={viewMode === "compact" ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("compact")}
                    className={viewMode === "compact" ? "bg-amber-500 hover:bg-amber-600" : ""}
                >
                    <Grid2x2 className="w-4 h-4" />
                </Button>
                </div>
            </div>

            {/* Ligne 2 : Recherche + Filtres */}
            <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Rechercher par titre, auteur..."
                    className="pl-10 pr-10 h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus-visible:ring-amber-500"
                />
                {searchTerm && (
                    <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                    <X className="w-4 h-4" />
                    </button>
                )}
                </div>

                <div className="flex gap-2">
                <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="h-10 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
                >
                    <option value="all">Tous les types</option>
                    {availableTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                    ))}
                </select>

                {isAdmin && (
                    <Link href="/admin/books/new">
                    <Button className="bg-amber-500 hover:bg-amber-600 text-white h-10 px-3 sm:px-4">
                        <BookOpen className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Ajouter</span>
                    </Button>
                    </Link>
                )}
                </div>
            </div>
            </div>
        </div>

        {/* ===== CONTENU ===== */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            
            {loading ? (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
            ) : filteredDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <BookOpen className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Aucun livre trouvé</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                {searchTerm ? "Essayez d'autres mots-clés." : "Le catalogue est vide."}
                </p>
            </div>
            ) : (
            <div
                className={
                viewMode === "grid"
                    ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4"
                    : "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3"
                }
            >
                {filteredDocs.map((doc) => (
                <BookCard key={doc.id} doc={doc} isAdmin={isAdmin} compact={viewMode === "compact"} />
                ))}
            </div>
            )}
        </div>
        </div>
    )
    }

    // ============================================================
    // CARTE DE LIVRE COMPACTE
    // ============================================================
    function BookCard({ doc, isAdmin, compact }: { doc: Document; isAdmin: boolean; compact: boolean }) {
    const authorName = getAuthorName(doc)
    const isAvailable = (doc.exemplaires_disponibles || 0) > 0

    return (
        <div className="relative group">
        <Link href={`/catalogue/${doc.id}`} className="block h-full">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 rounded-lg overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5 flex flex-col h-full">
            
            {/* Couverture COMPACTE avec Image Next.js */}
            <div className={`relative ${compact ? "h-24 sm:h-28" : "h-32 sm:h-40"} bg-slate-100 dark:bg-slate-800 overflow-hidden`}>
                {doc.cover_url ? (
                <Image
                    src={doc.cover_url}
                    alt={doc.title}
                    fill
                    unoptimized
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-300 dark:text-slate-600 group-hover:scale-110 transition-transform duration-300">
                    <BookOpen className={compact ? "w-6 h-6" : "w-8 h-8"} />
                </div>
                )}
                
                <Badge
                className={`absolute top-1 right-1 text-[9px] sm:text-[10px] px-1.5 py-0 shadow-sm ${
                    isAvailable
                    ? "bg-emerald-500 text-white"
                    : "bg-rose-500 text-white"
                }`}
                >
                {isAvailable ? "Dispo" : "Indispo"}
                </Badge>
            </div>

            <div className={`${compact ? "p-2" : "p-2.5 sm:p-3"} flex-1 flex flex-col`}>
                <h3
                className={`${compact ? "text-xs" : "text-xs sm:text-sm"} font-semibold text-slate-900 dark:text-white line-clamp-2 leading-tight group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors`}
                title={doc.title}
                >
                {doc.title}
                </h3>
                
                {!compact && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5" title={authorName}>
                    {authorName}
                </p>
                )}

                <div className="flex items-center justify-between mt-auto pt-1.5">
                <Badge
                    variant="outline"
                    className={`${compact ? "text-[8px] px-1 py-0" : "text-[10px] px-1.5 py-0"} border-slate-300 dark:border-slate-700 capitalize`}
                >
                    {doc.type === "book" ? "Livre" : doc.type}
                </Badge>
                {!compact && (
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {doc.exemplaires_disponibles || 0}
                    </span>
                )}
                </div>
            </div>
            </div>
        </Link>

        {isAdmin && (
            <div className="absolute top-1 left-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <Link href={`/admin/books/${doc.id}/edit`}>
                <Button
                size="icon"
                variant="secondary"
                className="w-7 h-7 bg-blue-500 hover:bg-blue-600 text-white shadow-md"
                >
                <Pencil className="w-3 h-3" />
                </Button>
            </Link>
            <DeleteBookButton bookId={doc.id} bookTitle={doc.title} />
            </div>
        )}
        </div>
    )
    }