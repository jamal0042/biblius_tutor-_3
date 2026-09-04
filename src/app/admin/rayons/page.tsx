import { createServerSupabaseClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    BookOpen,
    ArrowLeft,
    Library,
    ChevronRight,
    BookMarked,
    Layers,
    Computer,
    Brain,
    Church,
    Users,
    Languages,
    FlaskConical,
    Cog,
    Palette,
    Globe,
    BookText,
    } from "lucide-react"
    import Link from "next/link"

    const ROOT_ICONS: Record<string, React.ElementType> = {
    "000": Computer,
    "100": Brain,
    "200": Church,
    "300": Users,
    "400": Languages,
    "500": FlaskConical,
    "600": Cog,
    "700": Palette,
    "800": BookOpen,
    "900": Globe,
    }

    const DEFAULT_ICON = BookText

    function getIconForCode(code: string): React.ElementType {
    const root = code.substring(0, 3).padEnd(3, "0")
    return ROOT_ICONS[root] || DEFAULT_ICON
    }

    interface DeweyClassRow {
    code: string
    libelle: string
    }

    interface DocumentWithCote {
    id: string
    title: string
    cote_dewey: string | null
    cote_complete: string | null
    exemplaires_disponibles: number
    total_exemplaires: number
    auteurs: Array<{ name: string }> | null
    }

    export default async function RayonsPage() {
    const supabase = await createServerSupabaseClient()

    const { data: deweyRows } = await supabase
        .from("dewey_classes")
        .select("code, libelle")
        .order("code", { ascending: true })

    const DEWEY_CLASSES: Array<{ code: string; libelle: string; icon: React.ElementType }> =
        (deweyRows || []).map((row: DeweyClassRow) => ({
        code: row.code,
        libelle: row.libelle,
        icon: getIconForCode(row.code),
        }))

    if (DEWEY_CLASSES.length === 0) {
        DEWEY_CLASSES.push(
        ...[
            { code: "000", libelle: "Informatique, information, généralités", icon: Computer },
            { code: "100", libelle: "Philosophie et psychologie", icon: Brain },
            { code: "200", libelle: "Religion", icon: Church },
            { code: "300", libelle: "Sciences sociales", icon: Users },
            { code: "400", libelle: "Langues", icon: Languages },
            { code: "500", libelle: "Sciences pures", icon: FlaskConical },
            { code: "600", libelle: "Sciences appliquées, technologie", icon: Cog },
            { code: "700", libelle: "Arts et loisirs", icon: Palette },
            { code: "800", libelle: "Littérature", icon: BookOpen },
            { code: "900", libelle: "Histoire et géographie", icon: Globe },
        ]
        )
    }

    const [{ data: documents }, { data: exemplaires }] = await Promise.all([
        supabase
        .from("documents")
        .select(`
        id,
        title,
        cote_dewey,
        cote_complete,
        auteurs (name)
        `)
        .not("cote_dewey", "is", null)
        .order("cote_dewey", { ascending: true }),
        supabase.from("exemplaires").select("document_id, status"),
    ])

    const allDocs = (documents || []) as unknown as DocumentWithCote[]

    const totalByDoc = new Map<string, number>()
    const availByDoc = new Map<string, number>()
    for (const ex of (exemplaires || []) as Array<{ document_id: string; status: string }>) {
    totalByDoc.set(ex.document_id, (totalByDoc.get(ex.document_id) || 0) + 1)
    if (ex.status === "available") availByDoc.set(ex.document_id, (availByDoc.get(ex.document_id) || 0) + 1)
    }
    for (const doc of allDocs) {
    doc.total_exemplaires = totalByDoc.get(doc.id) || 0
    doc.exemplaires_disponibles = availByDoc.get(doc.id) || 0
    }

    // Grouper par classe Dewey principale (3 premiers chiffres)
    const livresParClasse = DEWEY_CLASSES.map((classe) => {
        const livres = allDocs.filter((doc) =>
        doc.cote_dewey?.startsWith(classe.code)
        )
        return {
        ...classe,
        livres,
        count: livres.length,
        }
    })

    const totalLivresClasses = allDocs.length
    const classesUtilisees = livresParClasse.filter((c) => c.count > 0)

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12">
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">

            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
                <Link href="/admin">
                <Button variant="outline" size="icon" className="shrink-0">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                </Link>
                <div>
                <div className="mb-2 flex items-center gap-2">
                    <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                    <Library className="mr-1 h-3 w-3" />
                    BIBLIOTHÈQUE
                    </Badge>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                    Classement des rayons
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Classification Dewey • {totalLivresClasses} livre{totalLivresClasses > 1 ? "s" : ""} classé{totalLivresClasses > 1 ? "s" : ""} dans {classesUtilisees.length} rayon{classesUtilisees.length > 1 ? "s" : ""}
                </p>
                </div>
            </div>
            </div>

            {/* Statistiques globales */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <CardContent className="p-4">
                <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-500/10">
                    <BookOpen className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Total classé</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalLivresClasses}</p>
                    </div>
                </div>
                </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <CardContent className="p-4">
                <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-500/10">
                    <Layers className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Rayons actifs</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{classesUtilisees.length}</p>
                    </div>
                </div>
                </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <CardContent className="p-4">
                <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-500/10">
                    <BookMarked className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Exemplaires</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {allDocs.reduce((sum, doc) => sum + (doc.total_exemplaires || 0), 0)}
                    </p>
                    </div>
                </div>
                </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <CardContent className="p-4">
                <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-violet-100 p-2 dark:bg-violet-500/10">
                    <Library className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Disponibles</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {allDocs.reduce((sum, doc) => sum + (doc.exemplaires_disponibles || 0), 0)}
                    </p>
                    </div>
                </div>
                </CardContent>
            </Card>
            </div>

            {/* Navigation rapide */}
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                <Library className="h-5 w-5 text-amber-500" />
                Navigation rapide par rayon
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
                {livresParClasse.map((classe) => {
                    const Icone = classe.icon
                    return (
                    <a
                        key={classe.code}
                        href={`#rayon-${classe.code}`}
                        className={`flex items-center gap-2 rounded-lg border p-3 transition-all hover:shadow-md ${
                        classe.count > 0
                            ? "border-amber-200 bg-amber-50 hover:border-amber-400 dark:border-amber-900/40 dark:bg-amber-950/20"
                            : "border-slate-200 bg-slate-50 opacity-50 dark:border-slate-800 dark:bg-slate-900/50"
                        }`}
                    >
                        <div className="rounded-md bg-white p-2 shadow-sm dark:bg-slate-800">
                        <Icone className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                        <p className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                            {classe.code}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                            {classe.count} livre{classe.count > 1 ? "s" : ""}
                        </p>
                        </div>
                    </a>
                    )
                })}
                </div>
            </CardContent>
            </Card>

            {/* Liste des rayons avec livres */}
            {livresParClasse.map((classe) => {
            const Icone = classe.icon
            return (
                <Card
                key={classe.code}
                id={`rayon-${classe.code}`}
                className="overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 scroll-mt-20"
                >
                <CardHeader className={`${classe.count > 0 ? "bg-gradient-to-r from-amber-50 to-white dark:from-amber-950/20 dark:to-slate-900" : "bg-slate-50 dark:bg-slate-900/50"} border-b border-slate-200 dark:border-slate-800`}>
                    <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white shadow-md dark:bg-slate-800">
                        <Icone className="h-7 w-7 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                            {classe.code}
                            </span>
                            <ChevronRight className="h-5 w-5 text-slate-400" />
                            <span className="text-slate-900 dark:text-white">
                            {classe.libelle}
                            </span>
                        </CardTitle>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {classe.count} livre{classe.count > 1 ? "s" : ""} dans ce rayon
                        </p>
                        </div>
                    </div>
                    {classe.count > 0 && (
                        <Badge className="bg-amber-500 text-white">
                        {classe.count}
                        </Badge>
                    )}
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {classe.count === 0 ? (
                    <div className="p-12 text-center">
                        <BookOpen className="mx-auto mb-3 h-12 w-12 text-slate-300 dark:text-slate-700" />
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                        Aucun livre classé dans ce rayon
                        </p>
                        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                        Ajoutez des livres avec une cote Dewey {classe.code}...
                        </p>
                    </div>
                    ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {classe.livres.map((livre) => {
                        const auteurs = Array.isArray(livre.auteurs) ? livre.auteurs : []
                        const auteurNames = auteurs.map((a) => a.name).join(", ") || "Auteur inconnu"

                        return (
                            <Link
                            key={livre.id}
                            href={`/admin/books/${livre.id}/edit`}
                            className="block p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                            >
                            <div className="flex items-start gap-4">
                                {/* Cote complète (style étiquette) */}
                                <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-lg border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/30">
                                <p className="font-mono text-xs font-bold text-amber-900 dark:text-amber-200 text-center leading-tight">
                                    {livre.cote_complete || livre.cote_dewey}
                                </p>
                                </div>

                                {/* Infos du livre */}
                                <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                    <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                                        {livre.title}
                                    </h3>
                                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400 truncate">
                                        {auteurNames}
                                    </p>
                                    </div>

                                    <Badge
                                    variant="outline"
                                    className={`shrink-0 ${
                                        livre.exemplaires_disponibles > 0
                                        ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                                        : "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950/30 dark:text-red-400"
                                    }`}
                                    >
                                    {livre.exemplaires_disponibles}/{livre.total_exemplaires} dispo.
                                    </Badge>
                                </div>

                                <div className="mt-2 flex items-center gap-2">
                                    <Badge variant="outline" className="font-mono text-xs">
                                    {livre.cote_dewey}
                                    </Badge>
                                    {livre.cote_complete && livre.cote_complete !== livre.cote_dewey && (
                                    <Badge variant="outline" className="font-mono text-xs">
                                        <ChevronRight className="mr-1 h-3 w-3" />
                                        {livre.cote_complete}
                                    </Badge>
                                    )}
                                </div>
                                </div>

                                <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
                            </div>
                            </Link>
                        )
                        })}
                    </div>
                    )}
                </CardContent>
                </Card>
            )
            })}

            {/* Rayons vides */}
            {classesUtilisees.length < DEWEY_CLASSES.length && (
            <Card className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
                <CardHeader>
                <CardTitle className="text-base text-slate-700 dark:text-slate-300">
                    Rayons sans livres ({DEWEY_CLASSES.length - classesUtilisees.length})
                </CardTitle>
                </CardHeader>
                <CardContent>
                <div className="flex flex-wrap gap-2">
                    {livresParClasse
                    .filter((c) => c.count === 0)
                    .map((classe) => {
                        const Icone = classe.icon
                        return (
                        <Badge
                            key={classe.code}
                            variant="outline"
                            className="border-slate-300 text-slate-500 dark:border-slate-700 dark:text-slate-400"
                        >
                            <Icone className="mr-1 h-3 w-3" />
                            {classe.code} - {classe.libelle}
                        </Badge>
                        )
                    })}
                </div>
                </CardContent>
            </Card>
            )}

        </div>
        </div>
    )
    }

    