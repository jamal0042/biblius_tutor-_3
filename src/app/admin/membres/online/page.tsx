    "use client"

    import { useCallback, useEffect, useState } from "react"
    import { createClient } from "@/lib/supabase/client"
    import { ROLE_LABELS, STATUS_LABELS, STATUS_COLORS, type Member, type Role, type MemberStatus } from "@/lib/roles"
    import { Users, UserCheck, Clock, UserPlus, Phone, Hash, Pencil, Trash2, Save, PlusCircle } from "lucide-react"
    import { Card, CardContent } from "@/components/ui/card"
    import { Badge } from "@/components/ui/badge"
    import { Button } from "@/components/ui/button"
    import { Input } from "@/components/ui/input"
    import Link from "next/link"

    const emptyForm = {
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    matricule: "",
    department: "",
    role: "student" as Role,
    status: "active" as MemberStatus,
    }

    export default function AdminMembersOnlinePage() {
    const supabase = createClient()
    const [members, setMembers] = useState<Member[]>([])
    const [loading, setLoading] = useState(true)
    const [editingMember, setEditingMember] = useState<Member | null>(null)
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [formData, setFormData] = useState(emptyForm)

    const fetchMembers = useCallback(async () => {
        setLoading(true)
        const { data, error } = await supabase
        .from("members")
        .select("*")
        .order("created_at", { ascending: false })

        if (!error && data) {
        setMembers(data as Member[])
        }
        setLoading(false)
    }, [supabase])

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
        void fetchMembers()
        }, 0)

        return () => window.clearTimeout(timeoutId)
    }, [fetchMembers])

    const handleDelete = async (memberId: string) => {
        if (!confirm("Voulez-vous vraiment supprimer ce membre ?")) return

        const { error } = await supabase.from("members").delete().eq("id", memberId)
        if (!error) {
        setMembers((prev) => prev.filter((member) => member.id !== memberId))
        }
    }

    const startEdit = (member: Member) => {
        setEditingMember(member)
        setFormData({
        first_name: member.first_name,
        last_name: member.last_name,
        email: member.email,
        phone: member.phone ?? "",
        matricule: member.matricule ?? "",
        department: member.department ?? "",
        role: member.role,
        status: member.status,
        })
    }

    const handleSave = async () => {
        if (!editingMember) return

        const { error } = await supabase
        .from("members")
        .update({
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            phone: formData.phone || null,
            matricule: formData.matricule || null,
            department: formData.department || null,
            role: formData.role,
            status: formData.status,
            updated_at: new Date().toISOString(),
        })
        .eq("id", editingMember.id)

        if (!error) {
        setMembers((prev) => prev.map((member) =>
            member.id === editingMember.id
            ? { ...member, ...formData, phone: formData.phone || undefined, matricule: formData.matricule || undefined, department: formData.department || undefined }
            : member
        ))
        setEditingMember(null)
        setFormData(emptyForm)
        }
    }

    const handleCreateMember = async () => {
        if (!formData.first_name || !formData.last_name || !formData.email) return

        const password = Math.random().toString(36).slice(2, 10) + "A!"
        const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password,
        options: { data: { first_name: formData.first_name, last_name: formData.last_name } },
        })

        if (authError) {
        alert(authError.message)
        return
        }

        const memberId = authData.user?.id ?? crypto.randomUUID()
        const { error } = await supabase.from("members").insert({
        id: memberId,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone || null,
        matricule: formData.matricule || null,
        department: formData.department || null,
        role: formData.role,
        status: formData.status,
        max_loans: formData.role === "teacher" ? 10 : 5,
        max_loans_duration: formData.role === "teacher" ? 30 : 15,
        max_digital_loans: 3,
        email_notifications: true,
        sms_notifications: false,
        })

        if (error) {
        alert(error.message)
        return
        }

        setMembers((prev) => [{
        id: memberId,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone || undefined,
        matricule: formData.matricule || undefined,
        department: formData.department || undefined,
        role: formData.role,
        status: formData.status,
        max_loans: formData.role === "teacher" ? 10 : 5,
        max_loans_duration: formData.role === "teacher" ? 30 : 15,
        max_digital_loans: 3,
        email_notifications: true,
        sms_notifications: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        }, ...prev])
        setShowCreateForm(false)
        setFormData(emptyForm)
    }

    return (
        <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Membres de la bibliothèque</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
                Liste complète des membres inscrits ({members.length} au total)
            </p>
            </div>
            <div className="flex gap-3">
            <Button onClick={() => setShowCreateForm((prev) => !prev)} className="bg-amber-500 hover:bg-amber-600 text-white">
                <PlusCircle className="w-4 h-4 mr-2" />
                Ajouter un membre
            </Button>
            <Link href="/admin/membres/invitations">
                <Button variant="outline" className="border-slate-200 dark:border-slate-700">
                <UserPlus className="w-4 h-4 mr-2" />
                Inviter un membre
                </Button>
            </Link>
            </div>
        </div>

        {showCreateForm && (
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardContent className="p-6 space-y-4">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Ajouter un membre</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} placeholder="Prénom" />
                <Input value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} placeholder="Nom" />
                <Input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Email" type="email" />
                <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Téléphone" />
                <Input value={formData.matricule} onChange={(e) => setFormData({ ...formData, matricule: e.target.value })} placeholder="Matricule" />
                <Input value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} placeholder="Département" />
                <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-800">
                    {Object.entries(ROLE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                    ))}
                </select>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as MemberStatus })} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-800">
                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                    ))}
                </select>
                </div>
                <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>Annuler</Button>
                <Button onClick={handleCreateMember} className="bg-amber-500 hover:bg-amber-600 text-white">Créer le membre</Button>
                </div>
            </CardContent>
            </Card>
        )}

        {editingMember && (
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardContent className="p-6 space-y-4">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Modifier le membre</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} placeholder="Prénom" />
                <Input value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} placeholder="Nom" />
                <Input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Email" />
                <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Téléphone" />
                <Input value={formData.matricule} onChange={(e) => setFormData({ ...formData, matricule: e.target.value })} placeholder="Matricule" />
                <Input value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} placeholder="Département" />
                <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-800">
                    {Object.entries(ROLE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                    ))}
                </select>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as MemberStatus })} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-800">
                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                    ))}
                </select>
                </div>
                <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setEditingMember(null)}>Annuler</Button>
                <Button onClick={handleSave} className="bg-amber-500 hover:bg-amber-600 text-white"><Save className="w-4 h-4 mr-2" /> Enregistrer</Button>
                </div>
            </CardContent>
            </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardContent className="flex items-center gap-4 p-6">
                <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-500/10">
                <UserCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
                </div>
                <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Membres actifs</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {members.filter((m) => m.status === "active").length}
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
                    {members.filter((m) => m.status === "pending").length}
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
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{members.length}</p>
                </div>
            </CardContent>
            </Card>
        </div>

        {loading ? (
            <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-amber-500" /></div>
        ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto">
            <table className="w-full min-w-[1100px]">
            <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nom</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Téléphone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Matricule</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Rôle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {members.map((m) => (
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
                    <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => startEdit(m)}>
                        <Pencil className="w-4 h-4 mr-1" /> Modifier
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(m.id)}>
                        <Trash2 className="w-4 h-4 mr-1" /> Supprimer
                        </Button>
                    </div>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
        )}
        </div>
    )
    }