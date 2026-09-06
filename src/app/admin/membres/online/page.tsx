"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
    ROLE_LABELS,
    STATUS_LABELS,
    STATUS_COLORS,
    type Member,
    type Role,
    type MemberStatus,
} from "@/lib/roles"
import {
    Users,
    UserCheck,
    Clock,
    UserPlus,
    Pencil,
    Trash2,
    Save,
    PlusCircle,
    ArrowLeft,
    Search,
    Loader2,
    Mail,
    Phone,
    Hash,
    ChevronDown,
    ChevronUp,
    Shield,
    X,
    CheckCircle2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
    const [searchQuery, setSearchQuery] = useState("")
    const [filterRole, setFilterRole] = useState<Role | "all">("all")
    const [filterStatus, setFilterStatus] = useState<MemberStatus | "all">("all")
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [expandedMobile, setExpandedMobile] = useState<string | null>(null)

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
        setDeletingId(memberId)
        const { error } = await supabase.from("members").delete().eq("id", memberId)
        if (!error) {
            setMembers((prev) => prev.filter((m) => m.id !== memberId))
        }
        setDeletingId(null)
    }

    const startEdit = (member: Member) => {
        setEditingMember(member)
        setShowCreateForm(false)
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
            setMembers((prev) =>
                prev.map((m) =>
                    m.id === editingMember.id
                        ? { ...m, ...formData, phone: formData.phone || undefined, matricule: formData.matricule || undefined, department: formData.department || undefined }
                        : m
                )
            )
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

        setMembers((prev) => [
            {
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
            },
            ...prev,
        ])
        setShowCreateForm(false)
        setFormData(emptyForm)
    }

    const activeCount = members.filter((m) => m.status === "active").length
    const pendingCount = members.filter((m) => m.status === "pending").length

    const filteredMembers = members.filter((m) => {
        const matchesSearch =
            !searchQuery ||
            `${m.first_name} ${m.last_name} ${m.email} ${m.matricule ?? ""} ${m.department ?? ""}`
                .toLowerCase()
                .includes(searchQuery.toLowerCase())
        const matchesRole = filterRole === "all" || m.role === filterRole
        const matchesStatus = filterStatus === "all" || m.status === filterStatus
        return matchesSearch && matchesRole && matchesStatus
    })

    return (
        <div className="space-y-6">

            <header className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_30px_80px_rgba(15,23,42,0.45)] backdrop-blur-xl">
                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/admin"
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-slate-100 text-slate-700 transition hover:border-slate-400 hover:bg-slate-200 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-white"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
                                    Biblius
                                </p>
                                <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400">
                                    <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                                    En ligne
                                </Badge>
                            </div>
                            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                Membres
                            </h1>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                Gérez les comptes, rôles et statuts des membres de la bibliothèque.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            onClick={() => {
                                setShowCreateForm((prev) => !prev)
                                setEditingMember(null)
                            }}
                            className="h-10 bg-amber-500 text-white hover:bg-amber-600"
                        >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Nouveau membre
                        </Button>
                        <Link href="/admin/membres/invitations">
                            <Button
                                variant="outline"
                                className="h-10 border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
                            >
                                <UserPlus className="mr-2 h-4 w-4" />
                                Inviter
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="border-t border-slate-200 bg-slate-100 px-5 py-3 dark:border-white/10 dark:bg-slate-950/40">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                        <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-emerald-600 dark:text-emerald-400">
                            <UserCheck className="h-3.5 w-3.5" />
                            {activeCount} actifs
                        </div>
                        <div className="flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1.5 text-amber-600 dark:text-amber-400">
                            <Clock className="h-3.5 w-3.5" />
                            {pendingCount} en attente
                        </div>
                        <div className="flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1.5 text-blue-600 dark:text-blue-400">
                            <Users className="h-3.5 w-3.5" />
                            {members.length} total
                        </div>
                    </div>
                </div>
            </header>

            {showCreateForm && (
                <Card className="overflow-hidden border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/70 dark:shadow-[0_20px_60px_rgba(15,23,42,0.4)] backdrop-blur-sm">
                    <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-amber-500/10 via-white to-emerald-500/10 dark:border-white/10 dark:via-slate-900/70">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 ring-1 ring-amber-400/30">
                                    <UserPlus className="h-5 w-5 text-amber-600 dark:text-amber-300" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg text-slate-900 dark:text-white">
                                        Nouveau membre
                                    </CardTitle>
                                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                                        Créez un compte et envoyez les identifiants par email.
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowCreateForm(false)}
                                className="text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                    Prénom *
                                </label>
                                <Input
                                    value={formData.first_name}
                                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                    placeholder="Prénom"
                                    className="h-10 border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-950/80 dark:text-white"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                    Nom *
                                </label>
                                <Input
                                    value={formData.last_name}
                                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                    placeholder="Nom"
                                    className="h-10 border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-950/80 dark:text-white"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                    Email *
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="nom@exemple.com"
                                        type="email"
                                        className="h-10 border-slate-300 bg-slate-100 pl-9 dark:border-slate-700 dark:bg-slate-950/80 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                    Téléphone
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+237 6XX XXX XXX"
                                        className="h-10 border-slate-300 bg-slate-100 pl-9 dark:border-slate-700 dark:bg-slate-950/80 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                    Matricule
                                </label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        value={formData.matricule}
                                        onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
                                        placeholder="MAT2024001"
                                        className="h-10 border-slate-300 bg-slate-100 pl-9 dark:border-slate-700 dark:bg-slate-950/80 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                    Département
                                </label>
                                <Input
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    placeholder="Informatique, Médecine..."
                                    className="h-10 border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-950/80 dark:text-white"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                    Rôle
                                </label>
                                <div className="relative">
                                    <Shield className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                                        className="h-10 w-full rounded-md border border-slate-300 bg-slate-100 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-950/80 dark:text-white"
                                    >
                                        {Object.entries(ROLE_LABELS).map(([key, label]) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                    Statut
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as MemberStatus })}
                                    className="h-10 w-full rounded-md border border-slate-300 bg-slate-100 px-3 text-sm text-slate-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-950/80 dark:text-white"
                                >
                                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <Button variant="outline" onClick={() => setShowCreateForm(false)} className="border-slate-300 dark:border-slate-700">
                                Annuler
                            </Button>
                            <Button onClick={handleCreateMember} className="bg-amber-500 hover:bg-amber-600 text-white">
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Créer le membre
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {editingMember && (
                <Card className="overflow-hidden border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/70 dark:shadow-[0_20px_60px_rgba(15,23,42,0.4)] backdrop-blur-sm">
                    <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-sky-500/10 via-white to-violet-500/10 dark:border-white/10 dark:via-slate-900/70">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/20 to-indigo-500/20 ring-1 ring-sky-400/30">
                                    <Pencil className="h-5 w-5 text-sky-600 dark:text-sky-300" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg text-slate-900 dark:text-white">
                                        Modifier {editingMember.first_name} {editingMember.last_name}
                                    </CardTitle>
                                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                                        Mettez à jour les informations de ce membre.
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditingMember(null)}
                                className="text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Prénom</label>
                                <Input
                                    value={formData.first_name}
                                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                    className="h-10 border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-950/80 dark:text-white"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Nom</label>
                                <Input
                                    value={formData.last_name}
                                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                    className="h-10 border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-950/80 dark:text-white"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Email</label>
                                <Input
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="h-10 border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-950/80 dark:text-white"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Téléphone</label>
                                <Input
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="h-10 border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-950/80 dark:text-white"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Matricule</label>
                                <Input
                                    value={formData.matricule}
                                    onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
                                    className="h-10 border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-950/80 dark:text-white"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Département</label>
                                <Input
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    className="h-10 border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-950/80 dark:text-white"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Rôle</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                                    className="h-10 w-full rounded-md border border-slate-300 bg-slate-100 px-3 text-sm text-slate-900 outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-950/80 dark:text-white"
                                >
                                    {Object.entries(ROLE_LABELS).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Statut</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as MemberStatus })}
                                    className="h-10 w-full rounded-md border border-slate-300 bg-slate-100 px-3 text-sm text-slate-900 outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-950/80 dark:text-white"
                                >
                                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <Button variant="outline" onClick={() => setEditingMember(null)} className="border-slate-300 dark:border-slate-700">
                                Annuler
                            </Button>
                            <Button onClick={handleSave} className="bg-sky-500 hover:bg-sky-600 text-white">
                                <Save className="mr-2 h-4 w-4" />
                                Enregistrer
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card className="overflow-hidden border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/70 dark:shadow-[0_20px_60px_rgba(15,23,42,0.42)] backdrop-blur-sm">
                <CardContent className="p-0">

                    <div className="border-b border-slate-200 p-4 dark:border-slate-800">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                <Input
                                    placeholder="Rechercher par nom, email, matricule..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-10 border-slate-300 bg-slate-100 pl-10 text-slate-900 placeholder:text-slate-500 dark:border-slate-700 dark:bg-slate-950/80 dark:text-white"
                                />
                            </div>
                            <div className="flex gap-2">
                                <select
                                    value={filterRole}
                                    onChange={(e) => setFilterRole(e.target.value as Role | "all")}
                                    className="h-10 rounded-lg border border-slate-300 bg-slate-100 px-3 text-sm text-slate-900 outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-950/80 dark:text-white"
                                >
                                    <option value="all">Tous les rôles</option>
                                    {Object.entries(ROLE_LABELS).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value as MemberStatus | "all")}
                                    className="h-10 rounded-lg border border-slate-300 bg-slate-100 px-3 text-sm text-slate-900 outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-950/80 dark:text-white"
                                >
                                    <option value="all">Tous les statuts</option>
                                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center gap-2 p-10 text-sm text-slate-600 dark:text-slate-400">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Chargement des membres...
                        </div>
                    ) : filteredMembers.length === 0 ? (
                        <div className="p-10 text-center">
                            <Users className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-700" />
                            <p className="mt-3 font-medium text-slate-700 dark:text-slate-300">
                                {searchQuery || filterRole !== "all" || filterStatus !== "all"
                                    ? "Aucun membre trouvé pour cette recherche."
                                    : "Aucun membre inscrit."}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-100 text-xs uppercase tracking-wider text-slate-500 dark:bg-[#091525]">
                                        <tr>
                                            <th className="px-5 py-3.5 font-medium">Membre</th>
                                            <th className="px-5 py-3.5 font-medium">Contact</th>
                                            <th className="px-5 py-3.5 font-medium">Identifiants</th>
                                            <th className="px-5 py-3.5 font-medium">Rôle</th>
                                            <th className="px-5 py-3.5 font-medium">Statut</th>
                                            <th className="px-5 py-3.5 text-right font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                        {filteredMembers.map((m) => (
                                            <tr key={m.id} className="transition hover:bg-slate-200 dark:hover:bg-slate-800/20">
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 ring-1 ring-amber-400/20">
                                                            <span className="text-sm font-bold text-amber-700 dark:text-amber-300">
                                                                {m.first_name[0]}{m.last_name[0]}
                                                            </span>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="truncate font-medium text-slate-900 dark:text-white">
                                                                {m.first_name} {m.last_name}
                                                            </p>
                                                            {m.department && (
                                                                <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                                                                    {m.department}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="space-y-0.5">
                                                        <p className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                                                            <Mail className="h-3 w-3 shrink-0 text-slate-400" />
                                                            <span className="truncate">{m.email}</span>
                                                        </p>
                                                        {m.phone && (
                                                            <p className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-500">
                                                                <Phone className="h-3 w-3 shrink-0 text-slate-400" />
                                                                {m.phone}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    {m.matricule ? (
                                                        <Badge variant="outline" className="border-slate-300 bg-white font-mono text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                                                            {m.matricule}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 dark:text-slate-600">—</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <Badge variant="outline" className="border-slate-300 bg-white text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                                                        {ROLE_LABELS[m.role]}
                                                    </Badge>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <Badge className={STATUS_COLORS[m.status]}>
                                                        {STATUS_LABELS[m.status]}
                                                    </Badge>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                startEdit(m)
                                                                window.scrollTo({ top: 0, behavior: "smooth" })
                                                            }}
                                                            className="border-slate-300 bg-white text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                                                        >
                                                            <Pencil className="mr-1 h-3.5 w-3.5" />
                                                            Modifier
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            disabled={deletingId === m.id}
                                                            onClick={() => handleDelete(m.id)}
                                                            className="border-red-300 bg-white text-red-600 hover:bg-red-50 dark:border-red-800 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-red-950"
                                                        >
                                                            {deletingId === m.id ? (
                                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="divide-y divide-slate-200 md:hidden dark:divide-slate-800">
                                {filteredMembers.map((m) => {
                                    const isExpanded = expandedMobile === m.id
                                    return (
                                        <div key={m.id} className="p-4">
                                            <div
                                                className="flex items-center gap-3 cursor-pointer"
                                                onClick={() => setExpandedMobile(isExpanded ? null : m.id)}
                                            >
                                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 ring-1 ring-amber-400/20">
                                                    <span className="text-sm font-bold text-amber-700 dark:text-amber-300">
                                                        {m.first_name[0]}{m.last_name[0]}
                                                    </span>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate font-medium text-slate-900 dark:text-white">
                                                        {m.first_name} {m.last_name}
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                                        {m.email}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <Badge className={STATUS_COLORS[m.status]}>
                                                        {STATUS_LABELS[m.status]}
                                                    </Badge>
                                                    {isExpanded ? (
                                                        <ChevronUp className="h-4 w-4 text-slate-400" />
                                                    ) : (
                                                        <ChevronDown className="h-4 w-4 text-slate-400" />
                                                    )}
                                                </div>
                                            </div>

                                            {isExpanded && (
                                                <div className="mt-4 space-y-3 pl-14">
                                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                                        <div>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">Téléphone</p>
                                                            <p className="font-medium text-slate-900 dark:text-white">
                                                                {m.phone || "—"}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">Matricule</p>
                                                            <p className="font-medium font-mono text-slate-900 dark:text-white">
                                                                {m.matricule || "—"}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">Département</p>
                                                            <p className="font-medium text-slate-900 dark:text-white">
                                                                {m.department || "—"}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">Rôle</p>
                                                            <Badge variant="outline" className="border-slate-300 bg-white text-xs dark:border-slate-700 dark:bg-slate-900">
                                                                {ROLE_LABELS[m.role]}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                startEdit(m)
                                                                window.scrollTo({ top: 0, behavior: "smooth" })
                                                            }}
                                                            className="flex-1 border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                                                        >
                                                            <Pencil className="mr-1.5 h-3.5 w-3.5" />
                                                            Modifier
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            disabled={deletingId === m.id}
                                                            onClick={() => handleDelete(m.id)}
                                                            className="border-red-300 bg-white text-red-600 hover:bg-red-50 dark:border-red-800 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-red-950"
                                                        >
                                                            {deletingId === m.id ? (
                                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                                                            )}
                                                            Supprimer
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </>
                    )}

                    {!loading && filteredMembers.length > 0 && (
                        <div className="border-t border-slate-200 bg-slate-100 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-[#091525] dark:text-slate-400">
                            {filteredMembers.length} membre{filteredMembers.length > 1 ? "s" : ""}
                            {searchQuery || filterRole !== "all" || filterStatus !== "all"
                                ? ` trouvé${filteredMembers.length > 1 ? "s" : ""} sur ${members.length}`
                                : ""}
                        </div>
                    )}

                </CardContent>
            </Card>
        </div>
    )
}
