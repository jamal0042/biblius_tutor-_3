    import { FileBarChart } from "lucide-react"
    import { Card, CardContent } from "@/components/ui/card"

    export default function RapportsPage() {
    return (
        <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Mes Rapports</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
            Consultez l&apos;historique de vos activités et statistiques personnelles.
            </p>
        </div>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileBarChart className="w-12 h-12 text-amber-500 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Rapports en construction</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md">
                Vous pourrez bientôt consulter :
            </p>
            <ul className="mt-4 text-sm text-slate-600 dark:text-slate-300 space-y-2 text-left">
                <li>• Historique de vos emprunts</li>
                <li>• Statistiques de lecture</li>
                <li>• Pénalités réglées</li>
                <li>• Activité mensuelle</li>
            </ul>
            </CardContent>
        </Card>
        </div>
    )
    }