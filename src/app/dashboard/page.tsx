    import { BookOpen, Clock, AlertCircle, CheckCircle, Calendar } from "lucide-react"
    import { Button } from "@/components/ui/button"
    import { Card, CardContent } from "@/components/ui/card"
    import { Badge } from "@/components/ui/badge"
    import Link from "next/link"
    import { redirect } from "next/navigation"
    import { getCurrentMember, createServerSupabaseClient } from "@/lib/supabase/server"
    import { ChatbotWidget } from "@/components/chatbot"

    // Interfaces adaptées à la nouvelle structure (auteurs)
    interface LoanData {
    id: string
    due_date: string
    status: string
    documents: {
        title: string
        auteurs: { name: string }[] | null
    }[] | null
    }

    interface ReservationData {
    id: string
    status: string
    documents: {
        title: string
        auteurs: { name: string }[] | null
    }[] | null
    }

    interface PenaltyData {
    amount: number
    }

    // Fonction pour extraire le nom de l'auteur (gère objet ET tableau)
    function getAuthorName(doc: LoanData["documents"] | ReservationData["documents"] | null | undefined): string {
    if (!doc) return "Auteur inconnu"
    const d = Array.isArray(doc) ? doc[0] : doc
    if (!d) return "Auteur inconnu"
    const auteur = d.auteurs?.[0]
    return auteur?.name || "Auteur inconnu"
    }

    function getDocTitle(doc: LoanData["documents"] | ReservationData["documents"] | null | undefined): string {
    if (!doc) return "Titre inconnu"
    const d = Array.isArray(doc) ? doc[0] : doc
    return d?.title || "Titre inconnu"
    }

    export default async function DashboardPage() {
    const member = await getCurrentMember()
    if (!member) redirect("/login")

    const supabase = await createServerSupabaseClient()

    // 🌟 Requête adaptée : utilise auteurs(name) au lieu de author
    const { data: loans } = await supabase
        .from("prets")
        .select(`id, due_date, status, documents (title, auteurs (name))`)
        .eq("member_id", member.id)
        .in("status", ["active", "overdue"])
        .order("due_date", { ascending: true })

    const { data: reservations } = await supabase
        .from("reservations")
        .select(`id, status, documents (title, auteurs (name))`)
        .eq("member_id", member.id)
        .in("status", ["pending", "ready"])
        .order("created_at", { ascending: false })

    const { data: penalties } = await supabase
        .from("penalites")
        .select("amount")
        .eq("member_id", member.id)
        .eq("status", "unpaid")

    const today = new Date()
    const typedLoans = (loans as LoanData[]) || []
    const typedReservations = (reservations as ReservationData[]) || []
    const typedPenalties = (penalties as PenaltyData[]) || []

    const activeLoans = typedLoans.filter((l) => l.status === "active" && new Date(l.due_date) >= today)
    const overdueLoans = typedLoans.filter((l) => l.status === "overdue" || new Date(l.due_date) < today)
    
    const totalUnpaidFines = typedPenalties.reduce((acc: number, curr: PenaltyData) => acc + (curr.amount || 0), 0)

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric"
        })
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Bonjour, {member.first_name} {member.last_name} 
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                Voici un aperçu de votre activité à la bibliothèque.
                </p>
            </div>
            <Link href="/catalogue">
                <Button className="bg-amber-500 hover:bg-amber-600 text-white shadow-sm">
                <BookOpen className="w-4 h-4 mr-2" />
                Parcourir le catalogue
                </Button>
            </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Emprunts en cours" value={activeLoans.length.toString()} icon={BookOpen} color="blue" />
            <StatCard title="En retard" value={overdueLoans.length.toString()} icon={AlertCircle} color="red" />
            <StatCard title="Réservations" value={typedReservations.length.toString()} icon={Calendar} color="amber" />
            <StatCard title="Amendes impayées" value={`${totalUnpaidFines.toLocaleString()} FC`} icon={CheckCircle} color="green" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <div className="lg:col-span-2 space-y-4">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Mes emprunts en cours
                </h2>
                
                {typedLoans.length === 0 ? (
                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                    <CheckCircle className="w-12 h-12 text-emerald-500/50 mb-3" />
                    <p className="text-slate-500 dark:text-slate-400">Vous n&apos;avez aucun emprunt en cours.</p>
                    </CardContent>
                </Card>
                ) : (
                <div className="space-y-3">
                    {[...overdueLoans, ...activeLoans].map((loan) => {
                    const isOverdue = new Date(loan.due_date) < today
                    
                    return (
                        <Card key={loan.id} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-500/30 transition-colors">
                        <CardContent className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-4">
                            <div className="w-12 h-16 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center shrink-0">
                                <BookOpen className="w-6 h-6 text-slate-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900 dark:text-white">
                                {getDocTitle(loan.documents)}
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                {getAuthorName(loan.documents)}
                                </p>
                            </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                            <Badge className={
                                isOverdue 
                                ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400" 
                                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                            }>
                                {isOverdue ? "En retard" : "À temps"}
                            </Badge>
                            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Retour : {formatDate(loan.due_date)}
                            </span>
                            </div>
                        </CardContent>
                        </Card>
                    )
                    })}
                </div>
                )}
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Mes réservations
                </h2>
                
                {typedReservations.length === 0 ? (
                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                    <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Aucune réservation en cours.</p>
                    </CardContent>
                </Card>
                ) : (
                <div className="space-y-3">
                    {typedReservations.map((res) => {
                    return (
                        <Card key={res.id} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-slate-900 dark:text-white text-sm line-clamp-1">
                                {getDocTitle(res.documents)}
                            </h3>
                            <Badge variant="outline" className={
                                res.status === "ready" 
                                ? "border-amber-500 text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10" 
                                : "border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                            }>
                                {res.status === "ready" ? "Disponible" : "En attente"}
                            </Badge>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                            {getAuthorName(res.documents)}
                            </p>
                            {res.status === "ready" && (
                            <Button size="sm" className="w-full bg-amber-500 hover:bg-amber-600 text-white h-8 text-xs">
                                Retirer à l&apos;accueil
                            </Button>
                            )}
                        </CardContent>
                        </Card>
                    )
                    })}
                </div>
                )}

                {/* 🤖 Carte de présentation du chatbot */}
                <Card className="bg-gradient-to-br from-amber-500 to-orange-500 border-0 text-white">
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    🤖 Assistant Biblius
                    </h3>
                    <p className="text-sm text-white/90 mb-4">
                    Besoin d&apos;aide ? Posez-moi vos questions sur vos emprunts, pénalités ou le catalogue !
                    </p>
                    <p className="text-xs text-white/70">
                    Cliquez sur l&apos;icône 💬 en bas à droite
                    </p>
                </CardContent>
                </Card>
            </div>
            </div>
        </main>

        {/* 🤖 Chatbot flottant */}
        <ChatbotWidget memberName={member.first_name} memberId={member.id} />
        </div>
    )
    }

    function StatCard({ title, value, icon: Icon, color }: { 
    title: string; 
    value: string; 
    icon: React.ElementType; 
    color: "blue" | "red" | "amber" | "green";
    }) {
    const colorClasses = {
        blue: "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
        red: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400",
        amber: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
        green: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
    }

    return (
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <CardContent className="flex items-center gap-4 p-6">
            <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
            </div>
            <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
            </div>
        </CardContent>
        </Card>
    )
    }