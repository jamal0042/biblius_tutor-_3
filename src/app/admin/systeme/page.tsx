    "use client"

    import { useState } from "react"
    import { Save, Building, BookOpen, AlertCircle, Mail, Loader2 } from "lucide-react"
    import { Button } from "@/components/ui/button"
    import { Input } from "@/components/ui/input"
    import { Label } from "@/components/ui/label"
    import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
    import { createClient } from "@/lib/supabase/client"

    export default function AdminSystemePage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    // État local pour les paramètres (à connecter à une table 'settings' dans Supabase si besoin)
    const [settings, setSettings] = useState({
        library_name: "Bibliothèque Universitaire de Yaoundé",
        library_address: "Avenue de l'Indépendance, Yaoundé",
        library_phone: "+237 222 00 00 00",
        library_email: "contact@biblius.cm",
        
        max_physical_loans: 5,
        max_loan_duration_days: 15,
        max_renewals: 2,
        max_digital_loans: 3,
        
        penalty_per_day_late: 100, // en FCFA
        penalty_lost_book: 15000,  // en FCFA
        penalty_damaged_book: 5000, // en FCFA
        
        enable_email_notifications: true,
        enable_sms_notifications: false
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target
        setSettings(prev => ({
        ...prev,
        [name]: type === "checkbox" ? checked : (name.includes("max") || name.includes("penalty") ? parseInt(value) || 0 : value)
        }))
    }

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setSuccess(false)

        try {
        // NOTE: Pour une persistance réelle, vous pouvez créer une table 'settings' dans Supabase
        // et faire : await supabase.from('settings').upsert({ key: '...', value: '...' })
        
        console.log("Paramètres sauvegardés :", settings)
        
        // Simulation d'un délai réseau
        await new Promise(resolve => setTimeout(resolve, 800))
        
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
        } catch (error) {
        console.error("Erreur lors de la sauvegarde:", error)
        alert("Une erreur est survenue lors de la sauvegarde.")
        } finally {
        setLoading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
        <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Paramètres du système</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
            Configurez les règles globde la bibliothèque, les tarifs et les notifications.
            </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
            
            {/* Section 1: Informations de la bibliothèque */}
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Building className="w-5 h-5 text-amber-500" />
                Informations de la bibliothèque
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="library_name">Nom de la bibliothèque</Label>
                    <Input id="library_name" name="library_name" value={settings.library_name} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="library_email">Email de contact</Label>
                    <Input id="library_email" name="library_email" type="email" value={settings.library_email} onChange={handleChange} />
                </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="library_address">Adresse physique</Label>
                    <Input id="library_address" name="library_address" value={settings.library_address} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="library_phone">Téléphone</Label>
                    <Input id="library_phone" name="library_phone" value={settings.library_phone} onChange={handleChange} />
                </div>
                </div>
            </CardContent>
            </Card>

            {/* Section 2: Règles de prêt */}
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-500" />
                Règles de prêt par défaut
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="max_physical_loans">Max livres physiques</Label>
                    <Input id="max_physical_loans" name="max_physical_loans" type="number" min="1" value={settings.max_physical_loans} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="max_loan_duration_days">Durée max (jours)</Label>
                    <Input id="max_loan_duration_days" name="max_loan_duration_days" type="number" min="1" value={settings.max_loan_duration_days} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="max_renewals">Renouvellements max</Label>
                    <Input id="max_renewals" name="max_renewals" type="number" min="0" value={settings.max_renewals} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="max_digital_loans">Max accès numériques</Label>
                    <Input id="max_digital_loans" name="max_digital_loans" type="number" min="1" value={settings.max_digital_loans} onChange={handleChange} />
                </div>
                </div>
            </CardContent>
            </Card>

            {/* Section 3: Pénalités */}
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                Tarifs des pénalités (en FCFA)
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="penalty_per_day_late">Retard / jour</Label>
                    <Input id="penalty_per_day_late" name="penalty_per_day_late" type="number" min="0" value={settings.penalty_per_day_late} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="penalty_lost_book">Livre perdu</Label>
                    <Input id="penalty_lost_book" name="penalty_lost_book" type="number" min="0" value={settings.penalty_lost_book} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="penalty_damaged_book">Livre dégradé</Label>
                    <Input id="penalty_damaged_book" name="penalty_damaged_book" type="number" min="0" value={settings.penalty_damaged_book} onChange={handleChange} />
                </div>
                </div>
            </CardContent>
            </Card>

            {/* Section 4: Notifications */}
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-amber-500" />
                Notifications
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                <input
                    type="checkbox"
                    id="enable_email_notifications"
                    name="enable_email_notifications"
                    checked={settings.enable_email_notifications}
                    onChange={handleChange}
                    className="h-5 w-5 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                />
                <Label htmlFor="enable_email_notifications" className="text-sm font-medium cursor-pointer">
                    Activer les notifications par email (rappels de retour, validation de compte)
                </Label>
                </div>
                <div className="flex items-center space-x-3">
                <input
                    type="checkbox"
                    id="enable_sms_notifications"
                    name="enable_sms_notifications"
                    checked={settings.enable_sms_notifications}
                    onChange={handleChange}
                    className="h-5 w-5 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                />
                <Label htmlFor="enable_sms_notifications" className="text-sm font-medium cursor-pointer">
                    Activer les notifications par SMS (nécessite une clé API tierce)
                </Label>
                </div>
            </CardContent>
            </Card>

            {/* Bouton de sauvegarde */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            {success && (
                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <Save className="w-4 h-4" /> Paramètres enregistrés avec succès !
                </span>
            )}
            <div className="flex justify-end w-full">
                <Button 
                type="submit" 
                disabled={loading} 
                className="bg-amber-500 hover:bg-amber-600 text-white min-w-[200px]"
                >
                {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                    <Save className="w-4 h-4 mr-2" />
                )}
                {loading ? "Enregistrement..." : "Enregistrer les modifications"}
                </Button>
            </div>
            </div>
        </form>
        </div>
    )
    }