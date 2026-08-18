    import { UserCircle } from "lucide-react"
    import { Card, CardContent } from "@/components/ui/card"
    import { getCurrentMember } from "@/lib/supabase/server"
    import { redirect } from "next/navigation"
    import { ROLE_LABELS } from "@/lib/roles"

    export default async function ProfilPage() {
    const member = await getCurrentMember()
    if (!member) redirect("/login")

    return (
        <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Mon Profil</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
            Informations personnelles de votre compte.
            </p>
        </div>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                <UserCircle className="w-8 h-8 text-amber-600 dark:text-amber-500" />
                </div>
                <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                    {member.first_name} {member.last_name}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    {ROLE_LABELS[member.role]}
                </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow label="Email" value={member.email} />
                <InfoRow label="Rôle" value={ROLE_LABELS[member.role]} />
                <InfoRow label="Téléphone" value={member.phone || "Non renseigné"} />
                <InfoRow label="Matricule" value={member.matricule || "Non renseigné"} />
                <InfoRow label="Département" value={member.department || "Non renseigné"} />
                <InfoRow label="Statut" value={member.status} />
            </div>
            </CardContent>
        </Card>
        </div>
    )
    }

    function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
        <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
        <span className="text-sm font-medium text-slate-900 dark:text-white">{value}</span>
        </div>
    )
    }