    import { getCurrentMember } from "@/lib/supabase/server"
    import { redirect } from "next/navigation"
    import { isStaff, ROLE_LABELS, STATUS_LABELS, STATUS_COLORS, type Member } from "@/lib/roles"
    import { createServerSupabaseClient } from "@/lib/supabase/server"
    import { Users, UserCheck, Clock, UserPlus, Phone, Hash } from "lucide-react"
    import { Card, CardContent } from "@/components/ui/card"
    import { Badge } from "@/components/ui/badge"
    import { Button } from "@/components/ui/button"
    import Link from "next/link"

    export default async function AdminMembersOnlinePage() {
    const member = await getCurrentMember()

    if (!member || !isStaff(member.role)) {
        redirect("/dashboard")
    }

    const supabase = await createServerSupabaseClient()
    
    const { data: members } = await supabase
        .from("members")
        .select("*")
        .order("created_at", { ascending: false })

    const typedMembers = members as Member[] | null

    return (
        <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Membres de la bibliothèque</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
                Liste complète des membres inscrits ({typedMembers?.length || 0} au total)
            </p>
            </div>
            <Link href="/admin/membres/invitations">
            <Button className="bg-amber-500 hover:bg-amber-600 text-white">
                <UserPlus className="w-4 h-4 mr-2" />
                Inviter un membre
            </Button>
            </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardContent className="flex items-center gap-4 p-6">
                <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-500/10">
                <UserCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
                </div>
                <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Membres actifs</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {typedMembers?.filter(m => m.status === 'active').length || 0}
                </p>
                </div>
            </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardContent className="flex items-center gap-4 p-6">
                <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-500/10">
                <Clock className="w-6 h-6 text-amber-600 dark:text-amber-500" />
                </div>
                <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">En attente</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {typedMembers?.filter(m => m.status === 'pending').length || 0}
                </p>
                </div>
            </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardContent className="flex items-center gap-4 p-6">
                <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-500/10">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-500" />
                </div>
                <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {typedMembers?.length || 0}
                </p>
                </div>
            </CardContent>
            </Card>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto">
            <table className="w-full min-w-[1000px]">
            <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nom</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Téléphone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Matricule</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Rôle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Statut</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {typedMembers?.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                    {m.first_name} {m.last_name}
                    {m.department && <div className="text-xs text-slate-500 font-normal">{m.department}</div>}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{m.email}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                    {m.phone ? (
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {m.phone}</span>
                    ) : (
                        <span className="text-slate-300 dark:text-slate-600">-</span>
                    )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                    {m.matricule ? (
                        <span className="flex items-center gap-1"><Hash className="w-3 h-3" /> {m.matricule}</span>
                    ) : (
                        <span className="text-slate-300 dark:text-slate-600">-</span>
                    )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{ROLE_LABELS[m.role]}</td>
                    <td className="px-6 py-4 text-sm">
                    <Badge className={STATUS_COLORS[m.status]}>
                        {STATUS_LABELS[m.status]}
                    </Badge>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
        </div>
    )
    }