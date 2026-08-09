    import Link from "next/link"
    import { 
    ArrowLeft, BookOpen, Calendar, Globe, Hash, Star, Heart, 
    Share2, CheckCircle, Clock, Users
    } from "lucide-react"
    import { Button } from "@/components/ui/button"
    import { Badge } from "@/components/ui/badge"
    import { Card, CardContent } from "@/components/ui/card"
    import { Header } from "@/components/header"
    import { Footer } from "@/components/footer"

    // Données factices (à remplacer par votre base de données)
    const bookDetails = {
    id: 1,
    title: "Le Petit Prince",
    author: "Antoine de Saint-Exupery",
    publisher: "Gallimard",
    year: 1943,
    isbn: "978-2-07-040850-4",
    language: "Francais",
    pages: 96,
    category: "Fiction / Conte philosophique",
    rating: 4.8,
    reviews: 1247,
    available: true,
    totalCopies: 12,
    availableCopies: 8,
    synopsis: "Un aviateur, tombe en panne dans le desert du Sahara, rencontre un petit garcon venu d'une autre planete : le Petit Prince. Ce dernier lui raconte son voyage a travers l'univers et sa rencontre avec differentes personnes sur diverses planetes. Une oeuvre intemporelle qui aborde des themes universels comme l'amitie, l'amour et la responsabilite.",
    tags: ["Classique", "Philosophie", "Jeunesse", "Aventure"]
    }

    // Livres similaires
    const similarBooks = [
    { id: 2, title: "1984", author: "George Orwell", category: "Science-Fiction" },
    { id: 3, title: "L Etranger", author: "Albert Camus", category: "Philosophie" },
    { id: 4, title: "Dune", author: "Frank Herbert", category: "Science-Fiction" },
    ]

        export default function BookDetailPage({ params }: { params: { id: string } }) {
    const book = { ...bookDetails, id: params.id }
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 flex flex-col">
        <Header/>

        <main className="max-w-7xl mx-auto px-6 py-8 flex-1">
            
            {/* Lien retour */}
            <Link href="/catalogue" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Retour au catalogue
            </Link>

            {/* Section principale du livre */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            
            {/* Image du livre (1/3) */}
            <div className="lg:col-span-1">
                <div className="aspect-[2/3] bg-slate-200 dark:bg-slate-800 rounded-lg overflow-hidden shadow-lg relative">
                <div className="absolute inset-0 flex items-center justify-center text-slate-400 dark:text-slate-600">
                    <BookOpen className="w-32 h-32" />
                </div>
                {/* Badge de disponibilite */}
                {book.available && (
                    <div className="absolute top-4 right-4">
                    <Badge className="bg-emerald-500 text-white hover:bg-emerald-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Disponible
                    </Badge>
                    </div>
                )}
                </div>
            </div>

            {/* Informations du livre (2/3) */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* Titre et auteur */}
                <div>
                <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
                    {book.title}
                </h1>
                <p className="text-xl text-slate-600 dark:text-slate-400">
                    par <span className="font-medium text-amber-600 dark:text-amber-500">{book.author}</span>
                </p>
                </div>

                {/* Notation */}
                <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                    <Star 
                        key={i} 
                        className={`w-5 h-5 ${i < Math.floor(book.rating) ? "text-amber-500 fill-amber-500" : "text-slate-300 dark:text-slate-700"}`} 
                    />
                    ))}
                </div>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                    {book.rating}/5 ({book.reviews} avis)
                </span>
                </div>

                {/* Metadonnées */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-y border-slate-200 dark:border-slate-800">
                <MetaItem icon={Calendar} label="Annee" value={book.year.toString()} />
                <MetaItem icon={Globe} label="Langue" value={book.language} />
                <MetaItem icon={Hash} label="Pages" value={book.pages.toString()} />
                <MetaItem icon={Users} label="Exemplaires" value={`${book.availableCopies}/${book.totalCopies}`} />
                </div>

                {/* Synopsis */}
                <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                    A propos de ce livre
                </h2>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {book.synopsis}
                </p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                {book.tags.map((tag, i) => (
                    <Badge key={i} variant="outline" className="border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                    {tag}
                    </Badge>
                ))}
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button 
                    size="lg" 
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/25"
                    disabled={!book.available}
                >
                    {book.available ? (
                    <>
                        <BookOpen className="w-5 h-5 mr-2" />
                        Reserver ce livre
                    </>
                    ) : (
                    <>
                        <Clock className="w-5 h-5 mr-2" />
                        Ajouter a la liste d attente
                    </>
                    )}
                </Button>
                <Button variant="outline" size="lg" className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                    <Heart className="w-5 h-5 mr-2" />
                    Favoris
                </Button>
                <Button variant="outline" size="icon" className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                    <Share2 className="w-5 h-5" />
                </Button>
                </div>

            </div>
            </div>

            {/* Livres similaires */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-12">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                Vous aimerez aussi
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {similarBooks.map((similar) => (
                <Link key={similar.id} href={`/catalogue/${similar.id}`}>
                    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-500/50 transition-all cursor-pointer group">
                    <CardContent className="p-4">
                        <div className="aspect-[2/3] bg-slate-100 dark:bg-slate-800 rounded mb-3 flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                        </div>
                        <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors line-clamp-1">
                        {similar.title}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{similar.author}</p>
                        <Badge variant="outline" className="mt-2 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs">
                        {similar.category}
                        </Badge>
                    </CardContent>
                    </Card>
                </Link>
                ))}
            </div>
            </div>

        </main>

        <Footer />
        </div>
    )
    }

    // Composant interne pour les metadonnees
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