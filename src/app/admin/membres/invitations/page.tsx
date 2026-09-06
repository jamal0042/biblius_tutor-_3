"use client"

import { useCallback, useEffect, useState } from "react"
import {
    UserPlus, Loader2, ArrowLeft, Mail, Phone, Briefcase, MapPin, Calendar,
    GraduationCap, RotateCcw, Ban, Inbox, CheckCircle2, XCircle, Hourglass,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ROLE_LABELS, type Role } from "@/lib/roles"
import Link from "next/link"

type InviteStatus = "pending" | "accepted" | "expired" | "revoked"

interface Invitation {
    id: string
    first_name: string | null
    last_name: string | null
    email: string
    role: Role
    status: InviteStatus
    sent_at: string | null
    expires_at: string | null
    accepted_at: string | null
    created_at: string
}

interface FormData {
    firstName: string
    lastName: string
    email: string
    phone: string
    matricule: string
    role: Role
    department: string
    birthDate: string
    address: string
    city: string
    level: string
    speciality: string
    notes: string
}

const emptyForm: FormData = {
    firstName: "", lastName: "", email: "", phone: "", matricule: "",
    role: "student", department: "", birthDate: "", address: "", city: "",
    level: "", speciality: "", notes: "",
}

const STATUS_META: Record<InviteStatus, { label: string; className: string; icon: React.ElementType }> = {
    pending: { label: "En attente", className: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400", icon: Hourglass },
    accepted: { label: "Acceptée", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400", icon: CheckCircle2 },
    expired: { label: "Expirée", className: "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400", icon: XCircle },
    revoked: { label: "Révoquée", className: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400", icon: Ban },
}

export default function InviteMemberPage() {
    const [formData, setFormData] = useState<FormData>(emptyForm)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [invitations, setInvitations] = useState<Invitation[]>([])
    const [listLoading, setListLoading] = useState(true)
    const [actionId, setActionId] = useState<string | null>(null)
    const [revokeConfirmId, setRevokeConfirmId] = useState<string | null>(null)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const fetchInvitations = useCallback(async () => {
        setListLoading(true)
        try {
        const res = await fetch("/api/invitations")
        const json = await res.json()
        if (res.ok) {
            setInvitations(json.invitations || [])
        }
        } catch {
        // ignore
        } finally {
        setListLoading(false)
        }
    }, [])

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void fetchInvitations()
    }, [fetchInvitations])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccess(null)

        try {
        const res = await fetch("/api/invitations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
            email: formData.email,
            first_name: formData.firstName,
            last_name: formData.lastName,
            role: formData.role,
            phone: formData.phone,
            matricule: formData.matricule,
            department: formData.department,
            birth_date: formData.birthDate,
            address: formData.address,
            city: formData.city,
            level: formData.level,
            speciality: formData.speciality,
            notes: formData.notes,
            }),
        })
        const json = await res.json()

        if (!res.ok) {
            setError(json.error || "Erreur lors de l'invitation.")
            return
        }

        setSuccess(json.re_invited
            ? `Une nouvelle invitation a été envoyée à ${formData.email}.`
            : `Invitation envoyée avec succès à ${formData.email}. Un email de confirmation lui a été envoyé.`
        )
        setFormData(emptyForm)
        void fetchInvitations()
        } catch {
        setError("Une erreur inattendue est survenue.")
        } finally {
        setLoading(false)
        }
    }

    const handleResend = async (inv: Invitation) => {
        setActionId(inv.id)
        setError(null)
        setSuccess(null)
        try {
        const res = await fetch(`/api/invitations/${inv.id}`, { method: "PATCH" })
        const json = await res.json()
        if (!res.ok) {
            setError(json.error || "Erreur lors du renvoi.")
            return
        }
        setSuccess(`Invitation renvoyée à ${inv.email}.`)
        void fetchInvitations()
        } catch {
        setError("Une erreur est survenue lors du renvoi.")
        } finally {
        setActionId(null)
        }
    }

    const handleRevoke = async (inv: Invitation) => {
        setActionId(inv.id)
        setError(null)
        setSuccess(null)
        try {
        const res = await fetch(`/api/invitations/${inv.id}`, { method: "DELETE" })
        const json = await res.json()
        if (!res.ok) {
            setError(json.error || "Erreur lors de la révocation.")
            return
        }
        setSuccess(`Invitation de ${inv.email} révoquée.`)
        setRevokeConfirmId(null)
        void fetchInvitations()
        } catch {
        setError("Une erreur est survenue lors de la révocation.")
        } finally {
        setActionId(null)
        }
    }

    const formatDate = (date: string | null) => {
        if (!date) return "—"
        return new Date(date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
            <Link href="/admin/membres/online">
            <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
            </Button>
            </Link>
            <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Invitations</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
                Invitez une personne à rejoindre Biblius. Son compte est préparé avec le rôle choisi.
            </p>
            </div>
        </div>

        {error && (
            <Card className="border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20">
            <CardContent className="p-4 text-sm text-red-700 dark:text-red-400">{error}</CardContent>
            </Card>
        )}

        {success && (
            <Card className="border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/20">
            <CardContent className="p-4 text-sm text-emerald-700 dark:text-emerald-400">{success}</CardContent>
            </Card>
        )}

        
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardContent className="p-6 space-y-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-500" />
                Nouvelle invitation
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom *</Label>
                    <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="nom" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="lastName">Nom </Label>
                    <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="post-nom" required />
                </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="email">Email </Label>
                    <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="nom.postnom@exemple.com" className="pl-10" required />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="+237 6XX XXX XXX" className="pl-10" />
                    </div>
                </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="matricule">Matricule / N° d&apos;inscription</Label>
                    <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input id="matricule" name="matricule" value={formData.matricule} onChange={handleChange} placeholder="MAT2024001" className="pl-10" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="department">Département / Filière</Label>
                    <Input id="department" name="department" value={formData.department} onChange={handleChange} placeholder="Informatique, Médecine, Droit..." />
                </div>
                </div>

                <div className="space-y-2">
                <Label htmlFor="role">Rôle </Label>
                <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                    {Object.entries(ROLE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                    ))}
                </select>
                </div>

                {["student", "teacher"].includes(formData.role) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {formData.role === "student" && (
                    <div className="space-y-2">
                        <Label htmlFor="level">Niveau d&apos;études</Label>
                        <div className="relative">
                        <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input id="level" name="level" value={formData.level} onChange={handleChange} placeholder="L1, L2, M1, Doctorat..." className="pl-10" />
                        </div>
                    </div>
                    )}
                    {formData.role === "teacher" && (
                    <div className="space-y-2">
                        <Label htmlFor="speciality">Spécialité / Matière</Label>
                        <Input id="speciality" name="speciality" value={formData.speciality} onChange={handleChange} placeholder="Mathématiques, Physique..." />
                    </div>
                    )}
                    <div className="space-y-2">
                    <Label htmlFor="birthDate">Date de naissance</Label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input id="birthDate" name="birthDate" type="date" value={formData.birthDate} onChange={handleChange} className="pl-10" />
                    </div>
                    </div>
                </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="address">Adresse</Label>
                    <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input id="address" name="address" value={formData.address} onChange={handleChange} placeholder="Quartier, rue, numéro..." className="pl-10" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="city">Ville</Label>
                    <Input id="city" name="city" value={formData.city} onChange={handleChange} placeholder="Yaoundé, Douala..." />
                </div>
                </div>

                <div className="space-y-2">
                <Label htmlFor="notes">Notes internes (optionnel)</Label>
                <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={2} placeholder="Informations complémentaires..." />
                </div>
            </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
            <Link href="/admin/membres/online">
                <Button type="button" variant="outline">Annuler</Button>
            </Link>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[220px]">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
                {loading ? "Envoi en cours..." : "Envoyer l&apos;invitation"}
            </Button>
            </div>
        </form>

        
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                <Inbox className="w-5 h-5 text-amber-500" />
                Invitations envoyées
                <Badge className="ml-2 bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">{invitations.length}</Badge>
            </h2>

            {listLoading ? (
                <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                </div>
            ) : invitations.length === 0 ? (
                <div className="py-10 text-center">
                <Inbox className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Aucune invitation envoyée pour le moment.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                    <thead className="bg-slate-50 dark:bg-slate-800">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Utilisateur</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Rôle</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Statut</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Envoyée</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Expire</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {invitations.map((inv) => {
                        const meta = STATUS_META[inv.status] || STATUS_META.pending
                        const StatusIcon = meta.icon
                        const isPending = inv.status === "pending"
                        const isBusy = actionId === inv.id
                        return (
                        <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">
                            {inv.first_name} {inv.last_name}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{inv.email}</td>
                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{ROLE_LABELS[inv.role] || inv.role}</td>
                            <td className="px-4 py-3 text-sm">
                            <Badge className={meta.className}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {meta.label}
                            </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{formatDate(inv.sent_at)}</td>
                            <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{formatDate(inv.expires_at)}</td>
                            <td className="px-4 py-3 text-sm">
                            {isPending ? (
                                <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={isBusy}
                                    onClick={() => handleResend(inv)}
                                    className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-950"
                                >
                                    {isBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3 mr-1" />} Renvoyer
                                </Button>
                                {revokeConfirmId === inv.id ? (
                                    <Button
                                    size="sm"
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                    disabled={isBusy}
                                    onClick={() => handleRevoke(inv)}
                                    >
                                    Confirmer
                                    </Button>
                                ) : (
                                    <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={isBusy}
                                    onClick={() => setRevokeConfirmId(inv.id)}
                                    className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950"
                                    >
                                    <Ban className="w-3 h-3 mr-1" /> Révoquer
                                    </Button>
                                )}
                                </div>
                            ) : (
                                <span className="text-xs text-slate-400">—</span>
                            )}
                            </td>
                        </tr>
                        )
                    })}
                    </tbody>
                </table>
                </div>
            )}
            </CardContent>
        </Card>

        {revokeConfirmId && (
            <Card className="border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20">
            <CardContent className="p-4 flex items-center justify-between gap-3">
                <p className="text-sm text-red-700 dark:text-red-400">
                Confirmer la révocation de cette invitation ? L&apos;utilisateur ne pourra plus activer son compte avec ce lien.
                </p>
                <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="outline" onClick={() => setRevokeConfirmId(null)}>Annuler</Button>
                </div>
            </CardContent>
            </Card>
        )}
        </div>
    )
}
