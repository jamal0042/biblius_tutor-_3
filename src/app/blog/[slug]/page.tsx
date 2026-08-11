    import { Header } from "@/components/header"
    import { Footer } from "@/components/footer"
    import Link from "next/link"
    import { notFound } from "next/navigation"
    import { Calendar, Clock, Users, ArrowLeft, Tag, BookOpen, Share2 } from "lucide-react"
    import { Badge } from "@/components/ui/badge"
    import { Button } from "@/components/ui/button"
    import { Card, CardContent } from "@/components/ui/card"

    // Base de données d'articles (à remplacer par Supabase)
    const articlesDB: Record<string, {
    title: string;
    category: string;
    author: string;
    date: string;
    readTime: string;
    image: string;
    content: string[];
    }> = {
    "nouveautes-septembre-2026": {
        title: "Les nouveautés littéraires de septembre 2026",
        category: "Nouveautés",
        author: "Marie Dupont",
        date: "10 Sept 2026",
        readTime: "5 min",
        image: "📚",
        content: [
        "Chaque mois, notre équipe de bibliothécaires sélectionne avec soin les meilleurs ouvrages à ajouter à notre collection. Ce mois de septembre 2026 ne fait pas exception à la règle avec une sélection éclectique qui saura ravir tous les goûts littéraires.",
        "Parmi les highlights de ce mois, nous retrouvons plusieurs romans contemporains d'auteurs africains qui ont fait sensation lors des derniers prix littéraires. Ces œuvres offrent un regard neuf et puissant sur les réalités sociales et culturelles de notre continent.",
        "Côté essais, plusieurs ouvrages de référence ont rejoint nos rayonnages, notamment dans les domaines de la philosophie, de l'histoire et des sciences sociales. Ces titres seront particulièrement utiles pour les étudiants en préparation de leurs travaux de recherche.",
        "N'oubliez pas que tous ces nouveaux titres sont disponibles à l'emprunt pour les membres actifs de la bibliothèque. Vous pouvez les réserver en ligne via votre espace personnel ou venir les consulter directement sur place.",
        "Restez à l'écoute pour notre prochaine sélection d'octobre qui promet d'être tout aussi riche et diversifiée !"
        ]
    },
    "comment-bien-choisir-ses-lectures": {
        title: "Comment bien choisir ses lectures universitaires",
        category: "Conseils",
        author: "Prof. Jean Mukendi",
        date: "5 Sept 2026",
        readTime: "7 min",
        image: "🎓",
        content: [
        "La réussite universitaire passe en grande partie par la qualité de ses lectures. Mais face à l'abondance de ressources disponibles, comment faire les bons choix ? Voici quelques conseils éprouvés par des années d'expérience académique.",
        "Premièrement, commencez toujours par la bibliographie de votre cours. Votre professeur a sélectionné ces ouvrages pour une raison : ils constituent le socle de connaissances nécessaire pour réussir votre matière.",
        "Deuxièmement, ne négligez pas les articles scientifiques récents. Les livres sont essentiels, mais la recherche évolue rapidement. Consultez les revues académiques disponibles dans notre section ressources numériques pour rester à jour.",
        "Troisièmement, variez vos sources. Un bon travail universitaire s'appuie sur une diversité de points de vue. N'hésitez pas à consulter des ouvrages d'auteurs aux perspectives différentes sur un même sujet.",
        "Enfin, n'oubliez pas que la bibliothèque est là pour vous accompagner. Nos bibliothécaires sont formés pour vous orienter vers les ressources les plus pertinentes selon votre sujet de recherche. N'hésitez pas à les solliciter !"
        ]
    },
    "atelier-ecriture-creative": {
        title: "Atelier d'écriture créative : inscriptions ouvertes",
        category: "Événements",
        author: "Équipe Biblius",
        date: "1 Sept 2026",
        readTime: "3 min",
        image: "✍️",
        content: [
        "La bibliothèque universitaire est fière d'annoncer le lancement de son atelier mensuel d'écriture créative, ouvert à tous les étudiants et membres du personnel.",
        "Cet atelier, animé par des auteurs locaux reconnus, se tiendra chaque premier samedi du mois dans la salle de conférence de la bibliothèque, de 14h à 17h.",
        "Au programme : exercices d'écriture, partage de textes, conseils de professionnels et rencontres avec des auteurs publiés. C'est une opportunité unique de développer votre plume dans un environnement bienveillant et stimulant.",
        "Les inscriptions sont gratuites mais les places sont limitées à 20 participants par session. Inscrivez-vous dès maintenant à l'accueil de la bibliothèque ou via votre espace membre en ligne.",
        "Prochaine session : samedi 5 octobre 2026. Ne tardez pas !"
        ]
    },
    "focus-projets-tutores-2026": {
        title: "Focus : Les projets tutorés de l'année 2026",
        category: "Académique",
        author: "Dr. Sarah Kabila",
        date: "28 Août 2026",
        readTime: "6 min",
        image: "",
        content: [
        "L'année académique 2026 a été particulièrement riche en projets tutorés de qualité. Notre bibliothèque a eu le privilège d'accueillir le dépôt de plus de 150 mémoires et travaux de recherche.",
        "Parmi les sujets qui ont retenu notre attention, on retrouve des études innovantes sur les énergies renouvelables en milieu rural, l'impact des technologies numériques sur l'éducation, et plusieurs analyses socio-économiques pertinentes pour le développement local.",
        "Ces projets sont désormais consultables dans notre section dédiée aux projets tutorés. Nous encourageons vivement les étudiants de prochaine année à les consulter pour s'inspirer et comprendre les attentes académiques.",
        "Quelques conseils pour réussir votre propre projet tutoré : choisissez un sujet qui vous passionne vraiment, commencez vos recherches tôt, et n'hésitez pas à solliciter l'aide de nos bibliothécaires pour trouver les ressources documentaires nécessaires.",
        "La bibliothèque organise également des sessions d'accompagnement méthodologique tout au long de l'année. Renseignez-vous à l'accueil pour connaître le calendrier."
        ]
    },
    "ressources-numeriques-guide": {
        title: "Guide complet : accéder aux ressources numériques",
        category: "Tutoriels",
        author: "Équipe Biblius",
        date: "20 Août 2026",
        readTime: "4 min",
        image: "💻",
        content: [
        "Notre bibliothèque met à votre disposition une riche collection de ressources numériques : PDF, thèses, mémoires, articles scientifiques et bien plus encore. Voici comment y accéder facilement.",
        "Étape 1 : Connectez-vous à votre espace membre avec vos identifiants universitaires. Si vous n'avez pas encore de compte, rendez-vous à l'accueil pour créer votre profil.",
        "Étape 2 : Rendez-vous dans la section 'Ressources Numériques' du catalogue. Vous pouvez filtrer par type de document (PDF, EPUB, vidéo), par catégorie ou par niveau d'accès.",
        "Étape 3 : Cliquez sur le document qui vous intéresse. Selon le type de fichier, vous pourrez soit le consulter en ligne directement dans votre navigateur, soit le télécharger pour une lecture hors ligne.",
        "Important : certaines ressources sont réservées aux étudiants ou au personnel enseignant. Le système vérifie automatiquement votre profil pour vous donner accès aux documents appropriés.",
        "En cas de difficulté technique, n'hésitez pas à contacter notre support via la page 'Support technique' du site."
        ]
    },
    "rencontre-auteur-octobre": {
        title: "Rencontre avec l'auteur Patrick Mwamba en octobre",
        category: "Événements",
        author: "Équipe Biblius",
        date: "15 Août 2026",
        readTime: "2 min",
        image: "🎤",
        content: [
        "Nous avons l'honneur d'annoncer la venue de Patrick Mwamba, auteur congolais primé et figure incontournable de la littérature contemporaine africaine.",
        "Cette rencontre exclusive se tiendra le 15 octobre 2026 à 15h dans l'amphithéâtre principal de l'université. L'événement comprendra une lecture d'extraits de son dernier roman, une séance de questions-réponses, et une session de dédicace.",
        "Patrick Mwamba est l'auteur de plusieurs ouvrages acclamés par la critique, dont 'Les Racines du futur' qui a remporté le Grand Prix Littéraire d'Afrique Centrale en 2025.",
        "L'entrée est gratuite pour tous les membres de la communauté universitaire. Les places étant limitées, nous vous recommandons de vous inscrire rapidement via le formulaire disponible à l'accueil de la bibliothèque.",
        "Ne manquez pas cette opportunité unique de rencontrer l'un des plus grands auteurs de notre génération !"
        ]
    }
    }

    export default function BlogArticlePage({ params }: { params: { slug: string } }) {
    const article = articlesDB[params.slug]
    
    if (!article) {
        notFound()
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
        <Header />
        
        <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-8">
            <Link href="/blog" className="hover:text-amber-600 dark:hover:text-amber-500 flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" /> Blog
            </Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-white truncate">{article.title}</span>
            </nav>

            {/* Header de l'article */}
            <article>
            <div className="mb-8">
                <Badge className="mb-4 bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-500/30">
                {article.category}
                </Badge>
                <h1 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
                {article.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400 pb-6 border-b border-slate-200 dark:border-slate-800">
                <span className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-500" /> {article.author}
                </span>
                <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-500" /> {article.date}
                </span>
                <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" /> {article.readTime} de lecture
                </span>
                </div>
            </div>

            {/* Image/Emoji hero */}
            <div className="bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-500/20 dark:to-orange-500/20 rounded-2xl p-16 mb-8 flex items-center justify-center">
                <span className="text-9xl">{article.image}</span>
            </div>

            {/* Contenu de l'article */}
            <div className="prose prose-lg dark:prose-invert max-w-none">
                {article.content.map((paragraph, index) => (
                <p key={index} className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6 text-base md:text-lg">
                    {paragraph}
                </p>
                ))}
            </div>

            {/* Tags et partage */}
            <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-slate-500" />
                <Badge variant="outline" className="border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                    {article.category}
                </Badge>
                <Badge variant="outline" className="border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                    Bibliothèque
                </Badge>
                </div>
                <Button variant="outline" className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                <Share2 className="w-4 h-4 mr-2" /> Partager
                </Button>
            </div>
            </article>

            {/* Article connexe */}
            <section className="mt-16">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-500" /> Continuer la lecture
            </h3>
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-500/50 transition-all cursor-pointer group">
                <CardContent className="p-6">
                <Link href="/blog" className="flex items-center justify-between">
                    <div>
                    <p className="text-sm text-amber-600 dark:text-amber-500 font-semibold mb-1">Retour au blog</p>
                    <p className="text-slate-900 dark:text-white font-medium group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors">
                        Découvrez tous nos articles et actualités
                    </p>
                    </div>
                    <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:-translate-x-1 transition-transform rotate-180" />
                </Link>
                </CardContent>
            </Card>
            </section>
        </main>

        <Footer />
        </div>
    )
    }