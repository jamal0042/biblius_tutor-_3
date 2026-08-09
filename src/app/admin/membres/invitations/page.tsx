    "use client"

    import { useState } from "react"
    import { createClient } from "@/lib/supabase/client"
    import { UserPlus, Loader2, ArrowLeft, Mail, Phone, User, Briefcase } from "lucide-react"
    import { Button } from "@/components/ui/button"
    import { Input } from "@/components/ui/input"
    import { Label } from "@/components/ui/label"
    import { Card, CardContent } from "@/components/ui/card"
    import Link from "next/link"

    export default function InviteMemberPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [generatedPassword, setGeneratedPassword] = useState("")

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        matricule: "",
        role: "student" as "student" | "teacher" | "external",
        department: ""
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const generatePassword = () => {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$"
        let password = ""
        for (let i = 0; i < 10; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return password
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccess(false)

        const password = generatePassword()
        setGeneratedPassword(password)

        try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: formData.email,
            password: password,
            options: {
            data: {
                first_name: formData.firstName,
                last_name: formData.lastName,
            }
            }
        })

        if (authError) throw authError
        if (!authData.user) throw new Error("Erreur lors de la creation du compte")

        const { error: memberError } = await supabase.from('members').insert({
            id: authData.user.id,
            email: formData.email,
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone || null,
            matricule: formData.matricule || null,
            role: formData.role,
            department: formData.department || null,
            status: 'active',
            max_loans: formData.role === 'teacher' ? 10 : 5,
            max_loans_duration: formData.role === 'teacher' ? 30 : 15,
            max_digital_loans: 3,
            email_notifications: true,
            sms_notifications: false,
        })

        if (memberError) throw memberError

        setSuccess(true)
        setLoading(false)
        } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Erreur lors de la creation du compte."
        setError(errorMessage)
        setLoading(false)
        }
    }

    if (success) {
        return (
        <div className="max-w-2xl mx-auto space-y-6">
            <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900">
            <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                <UserPlus className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-emerald-900 dark:text-emerald-400 mb-2">
                Compte cree avec succes !
                </h2>
                <p className="text-emerald-700 dark:text-emerald-300 mb-6">
                Le compte de <strong>{formData.firstName} {formData.lastName}</strong> a ete cree et est maintenant actif.
                </p>

                <div className="bg-white dark:bg-slate-900 rounded-lg p-6 text-left space-y-3 border border-emerald-200 dark:border-emerald-900">
                <div>
                    <Label className="text-xs text-slate-500">Email de connexion</Label>
                    <p className="font-mono text-sm text-slate-900 dark:text-white">{formData.email}</p>
                </div>
                <div>
                    <Label className="text-xs text-slate-500">Mot de passe temporaire</Label>
                    <p className="font-mono text-sm text-slate-900 dark:text-white bg-amber-50 dark:bg-amber-500/10 p-2 rounded border border-amber-200 dark:border-amber-900">
                    {generatedPassword}
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    Copiez ce mot de passe et communiquez-le a l&apos;utilisateur.
                    </p>
                </div>
                </div>

                <div className="flex gap-3 mt-6">
                <Button
                    onClick={() => {
                    navigator.clipboard.writeText(generatedPassword)
                    alert("Mot de passe copie !")
                    }}
                    variant="outline"
                    className="flex-1"
                >
                    Copier le mot de passe
                </Button>
                <Button
                    onClick={() => {
                    setSuccess(false)
                    setFormData({ firstName: "", lastName: "", email: "", phone: "", matricule: "", role: "student", department: "" })
                    }}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
                >
                    Creer un autre compte
                </Button>
                </div>

                <Link href="/admin/membres/online">
                <Button variant="ghost" className="mt-4 w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour a la liste des membres
                </Button>
                </Link>
            </CardContent>
            </Card>
        </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
            <Link href="/admin/membres/online">
            <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
            </Button>
            </Link>
            <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Inviter un nouveau membre</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
                Creez un compte pour un etudiant, enseignant ou lecteur externe.
            </p>
            </div>
        </div>

        {error && (
            <Card className="border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20">
            <CardContent className="p-4 text-sm text-red-700 dark:text-red-400">
                {error}
            </CardContent>
            </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardContent className="p-6 space-y-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-amber-500" />
                Informations personnelles
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="firstName">Prenom *</Label>
                    <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="Jean" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="lastName">Nom *</Label>
                    <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Dupont" required />
                </div>
                </div>

                <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="jean.dupont@exemple.com" className="pl-10" required />
                </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="phone">Telephone</Label>
                    <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="+237 6XX XXX XXX" className="pl-10" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="matricule">Matricule</Label>
                    <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input id="matricule" name="matricule" value={formData.matricule} onChange={handleChange} placeholder="MAT2024001" className="pl-10" />
                    </div>
                </div>
                </div>
            </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardContent className="p-6 space-y-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Type de membre</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { value: "student", label: "Etudiant", desc: "5 emprunts max, 15 jours" },
                    { value: "teacher", label: "Enseignant", desc: "10 emprunts max, 30 jours" },
                    { value: "external", label: "Lecteur externe", desc: "3 emprunts max, 7 jours" }
                ].map((type) => (
                    <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, role: type.value as "student" | "teacher" | "external" })}
                    className={`p-4 rounded-lg border text-left transition-all ${
                        formData.role === type.value
                        ? "border-amber-500 bg-amber-50 dark:bg-amber-500/10 ring-2 ring-amber-500/20"
                        : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-slate-300"
                    }`}
                    >
                    <div className="font-semibold text-slate-900 dark:text-white text-sm">{type.label}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{type.desc}</div>
                    </button>
                ))}
                </div>

                <div className="space-y-2">
                <Label htmlFor="department">Departement / Filiere</Label>
                <Input id="department" name="department" value={formData.department} onChange={handleChange} placeholder="Ex: Informatique, Medecine, Droit..." />
                </div>
            </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
            <Link href="/admin/membres/online">
                <Button type="button" variant="outline">Annuler</Button>
            </Link>
            <Button type="submit" disabled={loading} className="bg-amber-500 hover:bg-amber-600 text-white min-w-[200px]">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
                {loading ? "Creation en cours..." : "Creer le compte"}
            </Button>
            </div>
        </form>
        </div>
    )
    }