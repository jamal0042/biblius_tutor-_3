    import { Header } from "@/components/header"
    import { Footer } from "@/components/footer"
    import Link from "next/link"
    import Image from "next/image"
    import { Calendar, Clock, ArrowRight, BookOpen, TrendingUp, Users } from "lucide-react"
    import { Badge } from "@/components/ui/badge"
    import { Card, CardContent } from "@/components/ui/card"

    const articles = [
    {
        slug: "nouveautes-septembre-2026",
        title: "Les nouveautés littéraires de septembre 2026",
        excerpt: "Découvrez notre sélection des meilleurs livres ajoutés ce mois-ci à la bibliothèque.",
        category: "Nouveautés",
        author: "Marie Dupont",
        date: "10 Sept 2026",
        readTime: "5 min",
        featured: true,
        image: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800&h=600&fit=crop"
    },
    {
        slug: "comment-bien-choisir-ses-lectures",
        title: "Comment bien choisir ses lectures universitaires",
        excerpt: "Conseils pratiques pour optimiser votre temps de lecture et sélectionner les ouvrages pertinents.",
        category: "Conseils",
        author: "Prof. Jean Mukendi",
        date: "5 Sept 2026",
        readTime: "7 min",
        featured: false,
        image: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&h=400&fit=crop"
    },
    {
        slug: "ressources-numeriques-guide",
        title: "Guide complet : accéder aux ressources numériques",
        excerpt: "Tout ce que vous devez savoir pour télécharger et consulter les PDF et mémoires en ligne.",
        category: "Tutoriels",
        author: "Équipe Biblius",
        date: "20 Août 2026",
        readTime: "4 min",
        featured: false,
        image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&h=400&fit=crop"
    }
    ]

    export default function BlogPage() {
    const featuredArticle = articles.find(a => a.featured)
    const regularArticles = articles.filter(a => !a.featured)

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
        <Header />
        
        <section className="bg-gradient-to-br from-amber-590 via-amber-600 to-orange-60 text-white py-16 px-6">
            <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-6 h-6" />
                <span className="text-sm font-semibold uppercase tracking-wider">Blog Biblius</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Actualités et ressources</h1>
            <p className="text-lg text-amber-50 max-w-2xl">
                Restez informé des nouveautés, événements et conseils de lecture de votre bibliothèque.
            </p>
            </div>
        </section>

        <main className="flex-1 max-w-6xl mx-auto px-6 py-12 w-full space-y-12">
            {featuredArticle && (
            <section>
                <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-amber-500" />
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">À la une</h2>
                </div>
                <Link href={`/blog/${featuredArticle.slug}`}>
                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-500/50 transition-all cursor-pointer group">
                    <CardContent className="p-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="relative h-64 md:h-full min-h-[300px] rounded-t-lg md:rounded-l-lg md:rounded-tr-none overflow-hidden">
                        <Image
                            src={featuredArticle.image}
                            alt={featuredArticle.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        </div>
                        
                        <div className="p-6 md:p-8 flex flex-col justify-center">
                        <Badge className="w-fit mb-4 bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-500/30">
                            {featuredArticle.category}
                        </Badge>
                        <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors">
                            {featuredArticle.title}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                            {featuredArticle.excerpt}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-6">
                            <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {featuredArticle.author}</span>
                            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {featuredArticle.date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 font-semibold">
                            Lire l&apos;article <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                        </div>
                    </div>
                    </CardContent>
                </Card>
                </Link>
            </section>
            )}

            <section>
            <div className="flex items-center gap-2 mb-6">
                <BookOpen className="w-5 h-5 text-amber-500" />
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Tous les articles</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {regularArticles.map((article) => (
                <Link key={article.slug} href={`/blog/${article.slug}`}>
                    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-500/50 hover:shadow-lg transition-all h-full group cursor-pointer">
                    <CardContent className="p-6 flex flex-col h-full">
                        <div className="relative h-48 mb-4 rounded-lg overflow-hidden">
                        <Image
                            src={article.image}
                            alt={article.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        </div>
                        
                        <Badge className="w-fit mb-3 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700">
                        {article.category}
                        </Badge>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors line-clamp-2">
                        {article.title}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-3 flex-1">
                        {article.excerpt}
                        </p>
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <span>{article.date}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {article.readTime}</span>
                        </div>
                    </CardContent>
                    </Card>
                </Link>
                ))}
            </div>
            </section>
        </main>

        <Footer />
        </div>
    )
    }