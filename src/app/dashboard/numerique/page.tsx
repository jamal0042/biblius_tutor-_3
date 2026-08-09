    "use client"

    import { Search, BookOpen, Headphones, FileText, Download, Eye } from "lucide-react"
    import { Button } from "@/components/ui/button"
    import { Input } from "@/components/ui/input"
    import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
    import { Badge } from "@/components/ui/badge"
    
    import { Footer } from "@/components/footer"

    // Données factices : Ressources numériques
    const digitalResources = [
    { id: 1, title: "Introduction à l'Algorithmique", author: "Thomas Cormen", format: "PDF", size: "4.2 Mo", type: "ebook" },
    { id: 2, title: "Les Misérables (Intégrale)", author: "Victor Hugo", format: "EPUB", size: "1.8 Mo", type: "ebook" },
    { id: 3, title: "Sapiens (Livre Audio)", author: "Yuval Noah Harari", format: "MP3", size: "345 Mo", type: "audio" },
    { id: 4, title: "Recherche en Sciences Sociales", author: "Quivy & Van Campenhoudt", format: "PDF", size: "12.5 Mo", type: "article" },
    { id: 5, title: "Dune (Livre Audio)", author: "Frank Herbert", format: "MP3", size: "410 Mo", type: "audio" },
    { id: 6, title: "Clean Code", author: "Robert C. Martin", format: "EPUB", size: "3.1 Mo", type: "ebook" },
    ]

    export default function NumeriquePage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 flex flex-col">
        

        <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full space-y-8">
            
            {/* En-tête de la page */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Ressources Numériques</h1>
                <p className="text-slate-500 dark:text-slate-400">E-books, livres audio et articles scientifiques à consulter en ligne.</p>
            </div>
            <div className="relative w-full md:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                placeholder="Rechercher une ressource..." 
                className="pl-10 h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus-visible:ring-amber-500"
                />
            </div>
            </div>

            {/* Grille des ressources */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {digitalResources.map((resource) => (
                <Card key={resource.id} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-500/50 dark:hover:border-amber-500/50 transition-all hover:shadow-lg group">
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-2">
                    <div className={`p-3 rounded-lg ${
                        resource.type === "audio" ? "bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400" :
                        resource.type === "article" ? "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400" :
                        "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400"
                    }`}>
                        {resource.type === "audio" ? <Headphones className="w-6 h-6" /> : 
                        resource.type === "article" ? <FileText className="w-6 h-6" /> : 
                        <BookOpen className="w-6 h-6" />}
                    </div>
                    <Badge variant="outline" className="border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-mono text-xs">
                        {resource.format}
                    </Badge>
                    </div>
                    <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white line-clamp-2 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors">
                    {resource.title}
                    </CardTitle>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{resource.author}</p>
                </CardHeader>
                
                <CardContent className="pb-2">
                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" /> {resource.size}
                    </span>
                    <span className="capitalize">{resource.type === "ebook" ? "Livre numérique" : resource.type === "audio" ? "Livre audio" : "Article"}</span>
                    </div>
                </CardContent>

                <CardFooter className="pt-2 flex gap-2">
                    <Button className="flex-1 bg-amber-500 hover:bg-amber-600 text-white shadow-sm">
                    <Eye className="w-4 h-4 mr-2" />
                    Lire
                    </Button>
                    <Button variant="outline" size="icon" className="border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800">
                    <Download className="w-4 h-4" />
                    </Button>
                </CardFooter>
                </Card>
            ))}
            </div>
        </main>

        <Footer />
        </div>
    )
    }