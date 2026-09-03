    "use client"

    import { useState } from "react"
    import { createClient } from "@/lib/supabase/client"
    import { UserPlus, Loader2, ArrowLeft, Mail, Phone, User, Briefcase, MapPin, Calendar, GraduationCap, Copy, Check } from "lucide-react"
    import { Button } from "@/components/ui/button"
    import { Input } from "@/components/ui/input"
    import { Label } from "@/components/ui/label"
    import { Card, CardContent } from "@/components/ui/card"
    import { Textarea } from "@/components/ui/textarea"
    import Link from "next/link"

    type MemberRole = "student" | "teacher" | "external"

    interface FormData {
    firstName: string
    lastName: string
    email: string
    phone: string
    matricule: string
    role: MemberRole
    department: string
    birthDate: string
    address: string
    city: string
    level: string
    speciality: string
    notes: string
    }

    export default function InviteMemberPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [generatedPassword, setGeneratedPassword] = useState("")
    const [copied, setCopied] = useState(false)

    const [formData, setFormData] = useState<FormData>({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        matricule: "",
        role: "student",
        department: "",
        birthDate: "",
        address: "",
        city: "",
        level: "",
        speciality: "",
        notes: ""
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const generatePassword = () => {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$"
        let password = ""
        for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return password
    }

    const copyPassword = async () => {
        await navigator.clipboard.writeText(generatedPassword)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const getRoleLimits = (role: MemberRole) => {
        switch (role) {
        case "teacher":
            return { max_loans: 10, max_loans_duration: 30, max_digital_loans: 5 }
        case "student":
            return { max_loans: 5, max_loans_duration: 15, max_digital_loans: 3 }
        case "external":
            return { max_loans: 3, max_loans_duration: 7, max_digital_loans: 1 }
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccess(false)

        const password = generatePassword()

        try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: formData.email,
            password: password,
            options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/premiere-connexion`,
            data: {
                first_name: formData.firstName,
                last_name: formData.lastName,
                is_invited: true,
            }
            }
        })

        if (authError) throw authError
        if (!authData.user) throw new Error("Erreur lors de la création du compte")

        const roleLimits = getRoleLimits(formData.role)

        const { error: memberError } = await supabase.from('members').insert({
            id: authData.user.id,
            email: formData.email,
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone || null,
            matricule: formData.matricule || null,
            role: formData.role,
            department: formData.department || null,
            birth_date: formData.birthDate || null,
            address: formData.address || null,
            city: formData.city || null,
            level: formData.level || null,
            speciality: formData.speciality || null,
            notes: formData.notes || null,
            status: 'active',
            max_loans: roleLimits.max_loans,
            max_loans_duration: roleLimits.max_loans_duration,
            max_digital_loans: roleLimits.max_digital_loans,
            email_notifications: true,
            sms_notifications: false,
        })

        if (memberError) throw memberError

        setGeneratedPassword(password)
        setSuccess(true)
        setLoading(false)
        } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Erreur lors de la création du compte."
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
                Compte créé avec succès !
                </h2>
                <p className="text-emerald-700 dark:text-emerald-300 mb-6">
                Le compte de <strong>{formData.firstName} {formData.lastName}</strong> a été créé. Un email de confirmation lui a été envoyé.
                </p>

                <div className="bg-white dark:bg-slate-900 rounded-lg p-6 text-left space-y-4 border border-emerald-200 dark:border-emerald-900">
                <div>
                    <Label className="text-xs text-slate-500">Email de connexion</Label>
                    <p className="font-mono text-sm text-slate-900 dark:text-white">{formData.email}</p>
                </div>
                
                <div>
                    <Label className="text-xs text-slate-500">Mot de passe temporaire</Label>
                    <div className="flex items-center gap-2 mt-1">
                    <p className="font-mono text-sm text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded flex-1">
                        {generatedPassword}
                    </p>
                    <Button
                        size="icon"
                        variant="outline"
                        onClick={copyPassword}
                        className="shrink-0"
                    >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                        Notez ce mot de passe et communiquez-le à l &apos utilisateur. Il devra le changer à sa première connexion.
                    </p>
                </div>

                <div>
                    <Label className="text-xs text-slate-500">Prochaine étape</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                    L &apos utilisateur doit ouvrir le lien reçu par email pour définir son nouveau mot de passe et compléter son profil.
                    </p>
                </div>
                </div>

                <div className="flex gap-3 mt-6">
                <Button
                    onClick={() => {
                    setSuccess(false)
                    setGeneratedPassword("")
                    setFormData({ 
                        firstName: "", 
                        lastName: "", 
                        email: "", 
                        phone: "", 
                        matricule: "", 
                        role: "student", 
                        department: "",
                        birthDate: "",
                        address: "",
                        city: "",
                        level: "",
                        speciality: "",
                        notes: ""
                    })
                    }}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                >
                    Créer un autre compte
                </Button>
                </div>

                <Link href="/admin/membres/online">
                <Button variant="ghost" className="mt-4 w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour à la liste des membres
                </Button>
                </Link>
            </CardContent>
            </Card>
        </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
            <Link href="/admin/membres/online">
            <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
            </Button>
            </Link>
            <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Inviter un nouveau membre</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
                Créez un compte pour un étudiant, enseignant ou lecteur externe.
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
            {/* INFORMATIONS PERSONNELLES */}
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardContent className="p-6 space-y-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-amber-500" />
                Informations personnelles
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom *</Label>
                    <Input 
                    id="firstName" 
                    name="firstName" 
                    value={formData.firstName} 
                    onChange={handleChange} 
                    placeholder="Jean" 
                    required 
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="lastName">Nom *</Label>
                    <Input 
                    id="lastName" 
                    name="lastName" 
                    value={formData.lastName} 
                    onChange={handleChange} 
                    placeholder="Dupont" 
                    required 
                    />
                </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="birthDate">Date de naissance</Label>
                    <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                        id="birthDate" 
                        name="birthDate" 
                        type="date"
                        value={formData.birthDate} 
                        onChange={handleChange} 
                        className="pl-10" 
                    />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="matricule">Matricule / N° d&apo inscription</Label>
                    <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                        id="matricule" 
                        name="matricule" 
                        value={formData.matricule} 
                        onChange={handleChange} 
                        placeholder="MAT2024001" 
                        className="pl-10" 
                    />
                    </div>
                </div>
                </div>

                <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    placeholder="jean.dupont@exemple.com" 
                    className="pl-10" 
                    required 
                    />
                </div>
                </div>

                <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                    id="phone" 
                    name="phone" 
                    type="tel" 
                    value={formData.phone} 
                    onChange={handleChange} 
                    placeholder="+237 6XX XXX XXX" 
                    className="pl-10" 
                    />
                </div>
                </div>
            </CardContent>
            </Card>

            {/* ADRESSE */}
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardContent className="p-6 space-y-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-500" />
                Adresse de résidence
                </h2>

                <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Textarea 
                    id="address" 
                    name="address" 
                    value={formData.address} 
                    onChange={handleChange} 
                    placeholder="Quartier, rue, numéro..."
                    rows={2}
                />
                </div>

                <div className="space-y-2">
                <Label htmlFor="city">Ville</Label>
                <Input 
                    id="city" 
                    name="city" 
                    value={formData.city} 
                    onChange={handleChange} 
                    placeholder="Yaoundé, Douala, Bafoussam..." 
                />
                </div>
            </CardContent>
            </Card>

            {/* TYPE DE MEMBRE */}
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardContent className="p-6 space-y-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Type de membre *</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { value: "student", label: "Étudiant", desc: "5 emprunts max, 15 jours" },
                    { value: "teacher", label: "Enseignant", desc: "10 emprunts max, 30 jours" },
                    { value: "external", label: "Lecteur externe", desc: "3 emprunts max, 7 jours" }
                ].map((type) => (
                    <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, role: type.value as MemberRole })}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="department">Département / Filière</Label>
                    <Input 
                    id="department" 
                    name="department" 
                    value={formData.department} 
                    onChange={handleChange} 
                    placeholder="Ex: Informatique, Médecine, Droit..." 
                    />
                </div>

                {formData.role === "student" && (
                    <div className="space-y-2">
                    <Label htmlFor="level">Niveau d &apos études</Label>
                    <div className="relative">
                        <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                        id="level" 
                        name="level" 
                        value={formData.level} 
                        onChange={handleChange} 
                        placeholder="L1, L2, M1, Doctorat..." 
                        className="pl-10"
                        />
                    </div>
                    </div>
                )}

                {formData.role === "teacher" && (
                    <div className="space-y-2">
                    <Label htmlFor="speciality">Spécialité / Matière</Label>
                    <Input 
                        id="speciality" 
                        name="speciality" 
                        value={formData.speciality} 
                        onChange={handleChange} 
                        placeholder="Ex: Mathématiques, Physique..." 
                    />
                    </div>
                )}
                </div>
            </CardContent>
            </Card>

            {/* NOTES */}
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardContent className="p-6 space-y-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Notes administratives</h2>

                <div className="space-y-2">
                <Label htmlFor="notes">Notes internes (optionnel)</Label>
                <Textarea 
                    id="notes" 
                    name="notes" 
                    value={formData.notes} 
                    onChange={handleChange} 
                    placeholder="Informations complémentaires, remarques..."
                    rows={3}
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Ces notes ne sont visibles que par les administrateurs et bibliothécaires.
                </p>
                </div>
            </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
            <Link href="/admin/membres/online">
                <Button type="button" variant="outline">Annuler</Button>
            </Link>
            <Button type="submit" disabled={loading} className="bg-amber-500 hover:bg-amber-600 text-white min-w-[200px]">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
                {loading ? "Création en cours..." : "Créer le compte"}
            </Button>
            </div>
        </form>
        </div>
    )
    }