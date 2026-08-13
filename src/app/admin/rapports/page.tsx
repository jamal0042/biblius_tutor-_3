    "use client"
    /* eslint-disable react-hooks/set-state-in-effect */

    import { useEffect, useState, useCallback } from "react"
    import { createClient } from "@/lib/supabase/client"
    import { BarChart3, BookOpen, Users, AlertCircle, TrendingUp, Download } from "lucide-react"
    import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
    import { Button } from "@/components/ui/button"
    import jsPDF from "jspdf"
    import autoTable from "jspdf-autotable"

    interface LoanData {
    status: string
    due_date: string
    }

    interface PenaltyData {
    amount: number
    }

    export default function RapportsPage() {
    const supabase = createClient()
    const [stats, setStats] = useState({
        totalDocuments: 0,
        totalMembers: 0,
        activeLoans: 0,
        overdueLoans: 0,
        totalPenaltiesAmount: 0
    })
    const [loading, setLoading] = useState(true)
    const [exporting, setExporting] = useState(false)

    const fetchReports = useCallback(async () => {
        setLoading(true)
        const [docs, members, loans, penalties] = await Promise.all([
        supabase.from("documents").select("*", { count: "exact", head: true }),
        supabase.from("members").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("prets").select("status, due_date"),
        supabase.from("penalites").select("amount").eq("status", "unpaid")
        ])

        const today = new Date()
        const loanData = (loans.data as LoanData[]) || []
        const active = loanData.filter((l: LoanData) => l.status === "active" && new Date(l.due_date) >= today).length
        const overdue = loanData.filter((l: LoanData) => l.status === "overdue" || new Date(l.due_date) < today).length
        
        const penaltyData = (penalties.data as PenaltyData[]) || []
        const penaltyTotal = penaltyData.reduce((acc: number, curr: PenaltyData) => acc + (curr.amount || 0), 0)

        setStats({
        totalDocuments: docs.count || 0,
        totalMembers: members.count || 0,
        activeLoans: active,
        overdueLoans: overdue,
        totalPenaltiesAmount: penaltyTotal
        })
        setLoading(false)
    }, [supabase])

    useEffect(() => {
        fetchReports()
    }, [fetchReports])

    // Fonction d'export PDF
    const handleExportPDF = async () => {
        setExporting(true)
        
        try {
        const doc = new jsPDF()
        
        // En-tête du PDF
        doc.setFontSize(20)
        doc.setTextColor(245, 158, 11) // Couleur amber
        doc.text("Biblius - Rapport Statistique", 14, 20)
        
        doc.setFontSize(12)
        doc.setTextColor(100, 100, 100)
        doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 14, 28)
        
        // Ligne de séparation
        doc.setDrawColor(245, 158, 11)
        doc.setLineWidth(0.5)
        doc.line(14, 32, 196, 32)
        
        // Section : Statistiques générales
        doc.setFontSize(16)
        doc.setTextColor(30, 41, 59) // slate-800
        doc.text("Statistiques Générales", 14, 42)
        
        doc.setFontSize(11)
        doc.setTextColor(71, 85, 105) // slate-600
        
        const statsData = [
            ["Total Documents", stats.totalDocuments.toString()],
            ["Membres Actifs", stats.totalMembers.toString()],
            ["Emprunts en Cours", stats.activeLoans.toString()],
            ["Emprunts en Retard", stats.overdueLoans.toString()],
            ["Amendes Impayées", `${stats.totalPenaltiesAmount.toLocaleString()} FCFA`]
        ]
        
        autoTable(doc, {
            startY: 46,
            head: [["Indicateur", "Valeur"]],
            body: statsData,
            theme: 'striped',
            headStyles: { 
            fillColor: [245, 158, 11],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
            },
            alternateRowStyles: {
            fillColor: [254, 243, 199] // amber-100
            }
        })
        
        // Section : Indicateurs de performance
        const finalY = (doc as any).lastAutoTable.finalY || 100
        doc.setFontSize(16)
        doc.setTextColor(30, 41, 59)
        doc.text("Indicateurs de Performance", 14, finalY + 15)
        
        const circulationRate = stats.totalDocuments > 0 ? Math.round((stats.activeLoans / stats.totalDocuments) * 100) : 0
        const overdueRate = (stats.activeLoans + stats.overdueLoans) > 0 
            ? Math.round((stats.overdueLoans / (stats.activeLoans + stats.overdueLoans)) * 100) 
            : 0
        
        doc.setFontSize(11)
        doc.setTextColor(71, 85, 105)
        
        const perfData = [
            ["Taux de circulation", `${circulationRate}%`],
            ["Taux de retard", `${overdueRate}%`]
        ]
        
        autoTable(doc, {
            startY: finalY + 20,
            head: [["Indicateur", "Pourcentage"]],
            body: perfData,
            theme: 'striped',
            headStyles: { 
            fillColor: [239, 68, 68], // red-500
            textColor: [255, 255, 255],
            fontStyle: 'bold'
            },
            alternateRowStyles: {
            fillColor: [254, 226, 226] // red-100
            }
        })
        
        // Pied de page
        const pageCount = doc.getNumberOfPages()
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i)
            doc.setFontSize(8)
            doc.setTextColor(150, 150, 150)
            doc.text(
            `Page ${i} sur ${pageCount} - Biblius © ${new Date().getFullYear()}`,
            14,
            290
            )
        }
        
        // Télécharger le PDF
        doc.save(`rapport-biblius-${new Date().toISOString().split('T')[0]}.pdf`)
        
        } catch (error) {
        console.error("Erreur lors de l'export PDF:", error)
        alert("Une erreur est survenue lors de la génération du PDF.")
        } finally {
        setExporting(false)
        }
    }

    if (loading) return <div className="p-8 text-center text-slate-500">Chargement des rapports...</div>

    const circulationRate = stats.totalDocuments > 0 ? Math.round((stats.activeLoans / stats.totalDocuments) * 100) : 0
    const overdueRate = (stats.activeLoans + stats.overdueLoans) > 0 
        ? Math.round((stats.overdueLoans / (stats.activeLoans + stats.overdueLoans)) * 100) 
        : 0

    return (
        <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Rapports Statistiques</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Vue d&apos;ensemble automatisée de l&apos;activité de la bibliothèque.</p>
            </div>
            <Button 
            variant="outline" 
            className="gap-2"
            onClick={handleExportPDF}
            disabled={exporting}
            >
            {exporting ? (
                <>
                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                Génération...
                </>
            ) : (
                <>
                <Download className="w-4 h-4" /> Exporter en PDF
                </>
            )}
            </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Documents" value={stats.totalDocuments} icon={BookOpen} color="text-blue-600" bg="bg-blue-100 dark:bg-blue-500/10" />
            <StatCard title="Membres Actifs" value={stats.totalMembers} icon={Users} color="text-emerald-600" bg="bg-emerald-100 dark:bg-emerald-500/10" />
            <StatCard title="Emprunts en Retard" value={stats.overdueLoans} icon={AlertCircle} color="text-red-600" bg="bg-red-100 dark:bg-red-500/10" />
            <StatCard title="Amendes Impayées" value={`${stats.totalPenaltiesAmount.toLocaleString()} FCFA`} icon={TrendingUp} color="text-amber-600" bg="bg-amber-100 dark:bg-amber-500/10" />
        </div>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-500" />
                Indicateurs de Performance
            </CardTitle>
            </CardHeader>
            <CardContent>
            <div className="space-y-4">
                <div>
                <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600 dark:text-slate-400">Taux de documents en circulation</span>
                    <span className="font-semibold">{circulationRate}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full transition-all" style={{ width: `${Math.min(circulationRate, 100)}%` }}></div>
                </div>
                </div>
                <div>
                <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600 dark:text-slate-400">Taux de retard sur les emprunts</span>
                    <span className="font-semibold text-red-600">{overdueRate}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                    <div className="bg-red-600 h-2.5 rounded-full transition-all" style={{ width: `${Math.min(overdueRate, 100)}%` }}></div>
                </div>
                </div>
            </div>
            </CardContent>
        </Card>
        </div>
    )
    }

    interface StatCardProps {
    title: string
    value: number | string
    icon: React.ElementType
    color: string
    bg: string
    }

    function StatCard({ title, value, icon: Icon, color, bg }: StatCardProps) {
    return (
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <CardContent className="flex items-center gap-4 p-6">
            <div className={`p-3 rounded-lg ${bg}`}><Icon className={`w-6 h-6 ${color}`} /></div>
            <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
            </div>
        </CardContent>
        </Card>
    )
    }