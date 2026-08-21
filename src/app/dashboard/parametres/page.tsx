    "use client"

    import { useState } from "react"
    import { createClient } from "@/lib/supabase/client"
    import { useAuth } from "@/hooks/use-auth"
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
    import { Button } from "@/components/ui/button"
    import { Input } from "@/components/ui/input"
    import { Label } from "@/components/ui/label"
    import { 
    Settings, 
    Lock, 
    User, 
    Bell, 
    Save, 
    Loader2, 
    ArrowLeft,
    CheckCircle2,
    AlertCircle,
    Shield,
    Eye,
    EyeOff
    } from "lucide-react"
    import Link from "next/link"

    export default function ParametresPage() {
    const supabase = createClient()
    const { member, loading: authLoading, refreshMember } = useAuth()

    const getStoredBool = (key: string, fallback: boolean) => {
        if (typeof window === "undefined") return fallback

        const saved = window.localStorage.getItem(key)
        return saved === null ? fallback : saved === "true"
    }

    // États pour le mot de passe
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPasswords, setShowPasswords] = useState(false)
    const [passwordLoading, setPasswordLoading] = useState(false)
    const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

    // États pour le profil
    const [phone, setPhone] = useState(() => member?.phone ?? "")
    const [department, setDepartment] = useState(() => member?.department ?? "")
    const [profileLoading, setProfileLoading] = useState(false)
    const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

    // États pour les notifications
    const [notifOverdue, setNotifOverdue] = useState(() => getStoredBool("biblius_notif_overdue", true))
    const [notifNewBooks, setNotifNewBooks] = useState(() => getStoredBool("biblius_notif_newbooks", true))
    const [notifReservations, setNotifReservations] = useState(() => getStoredBool("biblius_notif_reservations", true))
    const [notifLoading, setNotifLoading] = useState(false)
    const [notifMessage, setNotifMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

    if (authLoading || !member) {
        return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
        )
    }

    // ========== CHANGEMENT DE MOT DE PASSE ==========
    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setPasswordMessage(null)

        // Validations
        if (!currentPassword || !newPassword || !confirmPassword) {
        setPasswordMessage({ type: "error", text: "Veuillez remplir tous les champs." })
        return
        }

        if (newPassword.length < 8) {
        setPasswordMessage({ type: "error", text: "Le mot de passe doit contenir au moins 8 caractères." })
        return
        }

        if (newPassword !== confirmPassword) {
        setPasswordMessage({ type: "error", text: "Les mots de passe ne correspondent pas." })
        return
        }

        if (currentPassword === newPassword) {
        setPasswordMessage({ type: "error", text: "Le nouveau mot de passe doit être différent de l'actuel." })
        return
        }

        setPasswordLoading(true)

        try {
        const { error } = await supabase.auth.updateUser({ password: newPassword })

        if (error) throw error

        setPasswordMessage({ type: "success", text: "Mot de passe modifié avec succès !" })
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erreur lors du changement de mot de passe."
        setPasswordMessage({ type: "error", text: message })
        } finally {
        setPasswordLoading(false)
        }
    }

    // ========== MISE À JOUR DU PROFIL ==========
    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        setProfileMessage(null)
        setProfileLoading(true)

        try {
        const { error } = await supabase
            .from("members")
            .update({
            phone: phone || null,
            department: department || null,
            updated_at: new Date().toISOString(),
            })
            .eq("id", member.id)

        if (error) throw error

        setProfileMessage({ type: "success", text: "Profil mis à jour avec succès !" })
        await refreshMember()
        } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erreur lors de la mise à jour."
        setProfileMessage({ type: "error", text: message })
        } finally {
        setProfileLoading(false)
        }
    }

    // ========== SAUVEGARDE DES NOTIFICATIONS ==========
    const handleSaveNotifications = async () => {
        setNotifMessage(null)
        setNotifLoading(true)

        try {
        localStorage.setItem("biblius_notif_overdue", String(notifOverdue))
        localStorage.setItem("biblius_notif_newbooks", String(notifNewBooks))
        localStorage.setItem("biblius_notif_reservations", String(notifReservations))

        setNotifMessage({ type: "success", text: "Préférences sauvegardées !" })
        
        setTimeout(() => setNotifMessage(null), 3000)
        } catch {
        setNotifMessage({ type: "error", text: "Erreur lors de la sauvegarde." })
        } finally {
        setNotifLoading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="flex items-center gap-4">
            <Link href="/dashboard">
            <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
            </Button>
            </Link>
            <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Settings className="w-8 h-8 text-amber-500" />
                Paramètres
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
                Personnalisez votre compte et vos préférences.
            </p>
            </div>
        </div>

        {/* ========== SECTION SÉCURITÉ ========== */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-500" />
                Sécurité
            </CardTitle>
            <CardDescription>
                Modifiez votre mot de passe pour sécuriser votre compte.
            </CardDescription>
            </CardHeader>
            <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
                {passwordMessage && (
                <div className={`p-3 rounded-lg flex items-start gap-2 ${
                    passwordMessage.type === "success"
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400"
                }`}>
                    {passwordMessage.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                    ) : (
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    )}
                    <span className="text-sm">{passwordMessage.text}</span>
                </div>
                )}

                <div className="space-y-2">
                <Label htmlFor="current-password">Mot de passe actuel</Label>
                <div className="relative">
                    <Input
                    id="current-password"
                    type={showPasswords ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pr-10"
                    />
                    <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                    {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="new-password">Nouveau mot de passe</Label>
                    <Input
                    id="new-password"
                    type={showPasswords ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 caractères"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmer</Label>
                    <Input
                    id="confirm-password"
                    type={showPasswords ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    />
                </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Votre mot de passe doit contenir au moins 8 caractères.
                </p>

                <div className="flex justify-end">
                <Button type="submit" disabled={passwordLoading} className="bg-amber-500 hover:bg-amber-600 text-white">
                    {passwordLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                    <Shield className="w-4 h-4 mr-2" />
                    )}
                    Modifier le mot de passe
                </Button>
                </div>
            </form>
            </CardContent>
        </Card>

        {/* ========== SECTION PROFIL ========== */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-amber-500" />
                Mon Profil
            </CardTitle>
            <CardDescription>
                Mettez à jour vos informations personnelles.
            </CardDescription>
            </CardHeader>
            <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
                {profileMessage && (
                <div className={`p-3 rounded-lg flex items-start gap-2 ${
                    profileMessage.type === "success"
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400"
                }`}>
                    {profileMessage.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                    ) : (
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    )}
                    <span className="text-sm">{profileMessage.text}</span>
                </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Nom complet</Label>
                    <Input
                    value={`${member.first_name} ${member.last_name}`}
                    disabled
                    className="bg-slate-50 dark:bg-slate-800"
                    />
                    <p className="text-xs text-slate-500">Non modifiable</p>
                </div>

                <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                    value={member.email}
                    disabled
                    className="bg-slate-50 dark:bg-slate-800"
                    />
                    <p className="text-xs text-slate-500">Non modifiable</p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+221 77 123 45 67"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="department">Département / Filière</Label>
                    <Input
                    id="department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Ex : Informatique, Droit..."
                    />
                </div>
                </div>

                <div className="flex justify-end">
                <Button type="submit" disabled={profileLoading} className="bg-amber-500 hover:bg-amber-600 text-white">
                    {profileLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                    <Save className="w-4 h-4 mr-2" />
                    )}
                    Enregistrer les modifications
                </Button>
                </div>
            </form>
            </CardContent>
        </Card>

        {/* ========== SECTION NOTIFICATIONS ========== */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-500" />
                Notifications
            </CardTitle>
            <CardDescription>
                Choisissez les notifications que vous souhaitez recevoir.
            </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            {notifMessage && (
                <div className={`p-3 rounded-lg flex items-start gap-2 ${
                notifMessage.type === "success"
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400"
                }`}>
                {notifMessage.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                ) : (
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                )}
                <span className="text-sm">{notifMessage.text}</span>
                </div>
            )}

            <div className="space-y-3">
                <NotificationToggle
                title="Rappels d'emprunt"
                description="Recevoir un email 3 jours avant la date de retour"
                checked={notifOverdue}
                onChange={setNotifOverdue}
                />

                <NotificationToggle
                title="Nouveautés du catalogue"
                description="Être informé des nouveaux livres ajoutés"
                checked={notifNewBooks}
                onChange={setNotifNewBooks}
                />

                <NotificationToggle
                title="Réservations disponibles"
                description="Notification quand un livre réservé est disponible"
                checked={notifReservations}
                onChange={setNotifReservations}
                />
            </div>

            <div className="flex justify-end pt-2">
                <Button onClick={handleSaveNotifications} disabled={notifLoading} className="bg-amber-500 hover:bg-amber-600 text-white">
                {notifLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                    <Save className="w-4 h-4 mr-2" />
                )}
                Sauvegarder les préférences
                </Button>
            </div>
            </CardContent>
        </Card>

        {/* ========== INFO SESSION ========== */}
        <Card className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
            <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm">
                <div>
                <p className="font-medium text-slate-700 dark:text-slate-300">
                    Connecté en tant que {member.email}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    ID : {member.id}
                </p>
                </div>
                <Link href="/dashboard">
                <Button variant="outline" size="sm">
                    Retour au tableau de bord
                </Button>
                </Link>
            </div>
            </CardContent>
        </Card>
        </div>
    )
    }

    // Composant pour les toggles de notification
    function NotificationToggle({
    title,
    description,
    checked,
    onChange,
    }: {
    title: string
    description: string
    checked: boolean
    onChange: (value: boolean) => void
    }) {
    return (
        <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
        <div className="flex-1">
            <p className="font-medium text-slate-900 dark:text-white">{title}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
        </div>
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            checked ? "bg-amber-500" : "bg-slate-300 dark:bg-slate-600"
            }`}
        >
            <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                checked ? "translate-x-6" : "translate-x-1"
            }`}
            />
        </button>
        </div>
    )
    }