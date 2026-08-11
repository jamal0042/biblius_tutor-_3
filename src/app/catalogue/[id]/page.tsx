    import { ArrowLeft, BookOpen, Calendar, Globe, Hash, CheckCircle, Clock, Users } from "lucide-react"
    import { Badge } from "@/components/ui/badge"
    import { Card, CardContent } from "@/components/ui/card"
    import Link from "next/link"
    import { createServerSupabaseClient } from "@/lib/supabase/server"
    import { notFound } from "next/navigation"
    import BookActions from "@/components/catalogue/book-actions"

    interface SimilarBook {
    id: string
    title: string
    author: string
    type: string
    }

    export default async function BookDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params
    const bookId = params.id
    const supabase = await createServerSupabaseClient()

    const { data: book, error } = await supabase
        .from("documents")
        .select("*")
        .eq("id", bookId)
        .single()

    if (error || !book) {
        notFound()
    }

    const isAvailable = (book.exemplaires_disponibles || 0) > 0

    const { data: similarBooks } = await supabase
        .from("documents")
        .select("id, title, author, type")
        .neq("id", bookId)
        .limit(3)

    const getTypeLabel = (type: string) => {
        switch (type) {
        case "book": return "Livre"
        case "thesis": return "Mémoire / Thèse"
        case "projet_tutore": return "Projet tutoré"
        case "article": return "Article scientifique"
        default: return type
        }
    }

    return (
        <div className="space-y-8">
        <Link href="/catalogue" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Retour au catalogue
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
            <div className="aspect-[2/3] bg-slate-200 dark:bg-slate-800 rounded-lg overflow-hidden shadow-lg relative">
                <div className="absolute inset-0 flex items-center justify-center text-slate-400 dark:text-slate-600">
                <BookOpen className="w-32 h-32" />
                </div>
                <div className="absolute top-4 right-4">
                <Badge className={isAvailable ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}>
                    {isAvailable ? <><CheckCircle className="w-3 h-3 mr-1" /> Disponible</> : <><Clock className="w-3 h-3 mr-1" /> Indisponible</>}
                </Badge>
                </div>
            </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
            <div>
                <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">{book.title}</h1>
                <p className="text-xl text-slate-600 dark:text-slate-400">par <span className="font-medium text-amber-600 dark:text-amber-500">{book.author}</span></p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-y border-slate-200 dark:border-slate-800">
                {book.year && <MetaItem icon={Calendar} label="Année" value={book.year.toString()} />}
                {book.language && <MetaItem icon={Globe} label="Langue" value={book.language} />}
                {book.pages && <MetaItem icon={Hash} label="Pages" value={book.pages.toString()} />}
                <MetaItem icon={Users} label="Exemplaires" value={`${book.exemplaires_disponibles || 0}/${book.total_exemplaires || 0}`} />
            </div>

            {book.description && (
                <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">À propos de ce document</h2>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">{book.description}</p>
                </div>
            )}

            <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 capitalize">
                {getTypeLabel(book.type)}
                </Badge>
                {book.publisher && (
                <Badge variant="outline" className="border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                    {book.publisher}
                </Badge>
                )}
            </div>

            <BookActions 
            bookId={book.id} 
            bookTitle={book.title} 
            bookType={book.type} 
            isAvailable={isAvailable} 
            />
            </div>
        </div>

        {similarBooks && similarBooks.length > 0 && (
            <div className="border-t border-slate-200 dark:border-slate-800 pt-12">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Vous aimerez aussi</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {similarBooks.map((similar: SimilarBook) => (
                <Link key={similar.id} href={`/catalogue/${similar.id}`}>
                    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-500/50 transition-all cursor-pointer group h-full">
                    <CardContent className="p-4 flex flex-col h-full">
                        <div className="aspect-[2/3] bg-slate-100 dark:bg-slate-800 rounded mb-3 flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                        </div>
                        <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors line-clamp-1">{similar.title}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{similar.author}</p>
                        <div className="mt-auto">
                        <Badge variant="outline" className="border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs capitalize">
                            {getTypeLabel(similar.type)}
                        </Badge>
                        </div>
                    </CardContent>
                    </Card>
                </Link>
                ))}
            </div>
            </div>
        )}
        </div>
    )
    }

    function MetaItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
    return (
        <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
            <Icon className="w-4 h-4" />
            <span>{label}</span>
        </div>
        <span className="font-semibold text-slate-900 dark:text-white">{value}</span>
        </div>
    )
    }