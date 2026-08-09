    "use client"
    /* eslint-disable react-hooks/set-state-in-effect */

    import { useEffect, useState, useCallback } from "react"
    import { createClient } from "@/lib/supabase/client"
    import Link from "next/link"
    import { Plus, Pencil, BookOpen, Loader2, Search } from "lucide-react"
    import { Button } from "@/components/ui/button"
    import { Badge } from "@/components/ui/badge"
    import { Card, CardContent } from "@/components/ui/card"
    import { Input } from "@/components/ui/input"
    import { DeleteBookButton } from "@/components/admin/delete-book-button"

    interface Document {
    id: string
    title: string
    author: string
    type: string
    total_exemplaires: number
    exemplaires_disponibles: number
    digital_url: string | null
    created_at: string
    }

    export default function AdminBooksPage() {
    const supabase = createClient()
    const [books, setBooks] = useState<Document[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    const fetchBooks = useCallback(async () => {
        setLoading(true)
        const { data, error } = await supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false })

        if (!error && data) {
        setBooks(data as Document[])
        }
        setLoading(false)
    }, [supabase])

    useEffect(() => {
        fetchBooks()
    }, [fetchBooks])

    const filteredBooks = books.filter((book) =>
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
        )
    }

    return (
        <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Gestion des livres</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
                Ajoutez, modifiez ou supprimez des documents du catalogue.
            </p>
            </div>
            <Link href="/admin/books/new">
            <Button className="bg-amber-500 hover:bg-amber-600 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un livre
            </Button>
            </Link>
        </div>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardContent className="p-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                placeholder="Rechercher par titre ou auteur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                />
            </div>
            </CardContent>
        </Card>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto">
            <table className="w-full min-w-[800px]">
            <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Titre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Auteur</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Exemplaires</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Numérique</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredBooks.length === 0 ? (
                <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                        <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                        <p>{searchTerm ? "Aucun livre ne correspond à votre recherche" : "Aucun livre dans le catalogue"}</p>
                        {!searchTerm && (
                        <Link href="/admin/books/new">
                            <Button className="bg-amber-500 hover:bg-amber-600 text-white">
                            <Plus className="w-4 h-4 mr-2" />
                            Ajouter le premier livre
                            </Button>
                        </Link>
                        )}
                    </div>
                    </td>
                </tr>
                ) : (
                filteredBooks.map((book) => (
                    <tr key={book.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{book.title}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{book.author}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                        <Badge variant="outline" className="border-slate-300 dark:border-slate-700 capitalize">
                        {book.type === "book" ? "Livre" : book.type}
                        </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{book.exemplaires_disponibles}/{book.total_exemplaires}</td>
                    <td className="px-6 py-4 text-sm">
                        {book.digital_url ? (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">Disponible</Badge>
                        ) : (
                        <Badge variant="outline" className="border-slate-300 dark:border-slate-700 text-slate-500">Non</Badge>
                        )}
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                        <div className="flex justify-end gap-2">
                        <Link href={`/admin/books/${book.id}/edit`}>
                            <Button size="icon" variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950" title="Modifier">
                            <Pencil className="w-4 h-4" />
                            </Button>
                        </Link>
                        <DeleteBookButton bookId={book.id} bookTitle={book.title} onSuccess={fetchBooks} />
                        </div>
                    </td>
                    </tr>
                ))
                )}
            </tbody>
            </table>
        </div>
        </div>
    )
    }