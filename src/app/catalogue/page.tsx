    import { Search, BookOpen, Filter, ArrowLeft, Pencil} from "lucide-react"
    import { Button } from "@/components/ui/button"
    import { Input } from "@/components/ui/input"
    import { Card, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
    import { Badge } from "@/components/ui/badge"
    import Link from "next/link"
    import { createServerSupabaseClient, getCurrentMember } from "@/lib/supabase/server"
    import { isStaff } from "@/lib/roles"
    import { DeleteBookButton } from "@/components/catalogue/delete-book-button"

    export default async function CataloguePage() {
    const supabase = await createServerSupabaseClient()
    const member = await getCurrentMember()
    
    // VÉRIFICATION STRICTE : Seul l'admin voit les boutons de suppression
    const isAdmin = member ? isStaff(member.role) : false

    const { data: books } = await supabase
        .from("documents")
        .select("*")
        .order("title", { ascending: true })

    return (
        <div className="space-y-8">
        <div className="space-y-4">
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Retour au tableau de bord
            </Link>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full md:max-w-xl">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                placeholder="Rechercher par titre, auteur..." 
                className="pl-10 h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus-visible:ring-amber-500"
                />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
                <Button variant="outline" className="flex items-center gap-2 border-slate-200 dark:border-slate-800">
                <Filter className="w-4 h-4" />
                Filtres
                </Button>
                
                {/* Ce bouton n'apparaît QUE si isAdmin est VRAI */}
                {isAdmin && (
                <Link href="/admin/books/new">
                    <Button className="bg-amber-500 hover:bg-amber-600 text-white">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Ajouter un livre
                    </Button>
                </Link>
                )}
            </div>
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {books && books.map((book) => (
            <div key={book.id} className="relative group">
                {/* Le lien amène vers la page de détail pour EMPRUNTER, pas supprimer */}
                <Link href={`/catalogue/${book.id}`} className="block h-full">
                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-500/50 dark:hover:border-amber-500/50 transition-all hover:shadow-lg overflow-hidden h-full flex flex-col">
                    <div className="aspect-[2/3] bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center text-slate-300 dark:text-slate-600 group-hover:scale-105 transition-transform duration-300">
                        <BookOpen className="w-16 h-16" />
                    </div>
                    <div className="absolute top-3 right-3">
                        <Badge className={
                        (book.exemplaires_disponibles || 0) > 0
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" 
                            : "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400"
                        }>
                        {(book.exemplaires_disponibles || 0) > 0 ? "Disponible" : "Indisponible"}
                        </Badge>
                    </div>
                    </div>
                    
                    <CardHeader className="pb-2 flex-1">
                    <CardTitle className="text-base font-semibold text-slate-900 dark:text-white line-clamp-1 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors">
                        {book.title}
                    </CardTitle>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{book.author}</p>
                    </CardHeader>
                    
                    <CardFooter className="pt-0 flex justify-between items-center">
                    <Badge variant="outline" className="border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs capitalize">
                        {book.type === "book" ? "Livre" : book.type}
                    </Badge>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                        {book.exemplaires_disponibles} dispo.
                    </span>
                    </CardFooter>
                </Card>
                </Link>

                {/* BOUTONS ADMIN : Ils sont TOTALEMENT INVISIBLES pour un étudiant grâce à {isAdmin && ...} */}
                {isAdmin && (
                <div className="absolute top-2 left-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <Link href={`/admin/books/${book.id}/edit`}>
                    <Button size="icon" variant="secondary" className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white">
                        <Pencil className="w-4 h-4" />
                    </Button>
                    </Link>
                    <DeleteBookButton bookId={book.id} bookTitle={book.title} />
                </div>
                )}
            </div>
            ))}
        </div>
        </div>
    )
    }