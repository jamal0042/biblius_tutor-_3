    import { BookOpen, Clock, AlertCircle, CheckCircle, Calendar, Plus } from "lucide-react"
    import { Button } from "@/components/ui/button"
    import { Badge } from "@/components/ui/badge"
    import { Card, CardContent } from "@/components/ui/card"
    import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
    import Link from "next/link"
    import { createServerSupabaseClient, getCurrentMember } from "@/lib/supabase/server"
    import { redirect } from "next/navigation"

    export default async function EmpruntsPage() {
    const member = await getCurrentMember()
    if (!member) redirect("/login")

    const supabase = await createServerSupabaseClient()

    // Récupérer les vrais emprunts de l'utilisateur
    const { data: prets, error } = await supabase
        .from("prets")
        .select(`
        id,
        loan_date,
        due_date,
        return_date,
        status,
        documents (
            id,
            title,
            author
        )
        `)
        .eq("member_id", member.id)
        .order("loan_date", { ascending: false })

    const currentLoans = prets?.filter((p: any) => p.status === "active" || p.status === "overdue") || []
    const historyLoans = prets?.filter((p: any) => p.status === "returned") || []

    return (
        <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Mes Emprunts</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
                Gérez vos livres en cours et consultez votre historique.
            </p>
            </div>
            <Link href="/catalogue">
            <Button className="bg-amber-500 hover:bg-amber-600 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Emprunter un livre
            </Button>
            </Link>
        </div>

        <Tabs defaultValue="current" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-6 bg-slate-100 dark:bg-slate-900">
            <TabsTrigger value="current" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-amber-600 dark:data-[state=active]:text-amber-500">
                En cours ({currentLoans.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-amber-600 dark:data-[state=active]:text-amber-500">
                Historique ({historyLoans.length})
            </TabsTrigger>
            </TabsList>

            {/* Onglet : En cours */}
            <TabsContent value="current" className="space-y-4">
            {currentLoans.length === 0 ? (
                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Aucun emprunt en cours</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 mb-4">Vous n'avez pas de livre en ce moment.</p>
                    <Link href="/catalogue">
                    <Button variant="outline" className="border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10">
                        Parcourir le catalogue
                    </Button>
                    </Link>
                </CardContent>
                </Card>
            ) : (
                currentLoans.map((loan: any) => {
                const isOverdue = loan.status === "overdue" || new Date(loan.due_date) < new Date()
                return (
                    <Card key={loan.id} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-500/30 transition-colors">
                    <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-16 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center shrink-0">
                            <BookOpen className="w-6 h-6 text-slate-400" />
                            </div>
                            <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white text-lg">{loan.documents?.title || "Titre inconnu"}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{loan.documents?.author || "Auteur inconnu"}</p>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Prêté le : {new Date(loan.loan_date).toLocaleDateString("fr-FR")}</span>
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Retour le : {new Date(loan.due_date).toLocaleDateString("fr-FR")}</span>
                            </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:items-end gap-3 sm:min-w-[150px]">
                            <Badge className={
                            isOverdue 
                                ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400" 
                                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                            }>
                            {isOverdue ? (
                                <><AlertCircle className="w-3 h-3 mr-1" /> En retard</>
                            ) : (
                                <><CheckCircle className="w-3 h-3 mr-1" /> À temps</>
                            )}
                            </Badge>
                            
                            {isOverdue && (
                            <Button size="sm" className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white">
                                Régulariser
                            </Button>
                            )}
                        </div>
                        </div>
                    </CardContent>
                    </Card>
                )
                })
            )}
            </TabsContent>

            {/* Onglet : Historique */}
            <TabsContent value="history" className="space-y-4">
            {historyLoans.length === 0 ? (
                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-slate-500 dark:text-slate-400">Votre historique d'emprunt est vide.</p>
                </CardContent>
                </Card>
            ) : (
                historyLoans.map((loan: any) => (
                <Card key={loan.id} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-80">
                    <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                        <div className="w-12 h-16 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center shrink-0">
                            <BookOpen className="w-6 h-6 text-slate-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white">{loan.documents?.title || "Titre inconnu"}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{loan.documents?.author || "Auteur inconnu"}</p>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-2">
                            <span>Du {new Date(loan.loan_date).toLocaleDateString("fr-FR")} au {new Date(loan.return_date).toLocaleDateString("fr-FR")}</span>
                            </div>
                        </div>
                        </div>
                        <Badge variant="outline" className="border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 w-fit">
                        <CheckCircle className="w-3 h-3 mr-1" /> Retourné
                        </Badge>
                    </div>
                    </CardContent>
                </Card>
                ))
            )}
            </TabsContent>
        </Tabs>
        </div>
    )
    }