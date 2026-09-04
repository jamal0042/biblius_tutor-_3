"use client"

import { useState } from "react"
import Link from "next/link"
import {
  User, Mail, Lock, Loader2, Eye, EyeOff, Phone,
  GraduationCap, Briefcase, AlertCircle, CheckCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"

const MEMBER_TYPES = [
  { value: "student", label: "Étudiant", icon: GraduationCap, desc: "5 emprunts · 15 jours" },
  { value: "teacher", label: "Enseignant", icon: Briefcase, desc: "10 emprunts · 30 jours" },
  { value: "external", label: "Lecteur externe", icon: User, desc: "3 emprunts · 7 jours" },
]

export default function RegisterPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "student",
    department: "",
    password: "",
    confirmPassword: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.")
      return
    }

    if (formData.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          role: formData.role,
          department: formData.department,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'inscription.")
      }

      setSuccess(true)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Une erreur est survenue."
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen grid lg:grid-cols-2 bg-white dark:bg-slate-950 transition-colors duration-300">
        <div className="hidden lg:flex flex-col justify-between p-12 bg-slate-50 dark:bg-slate-900/50 border-r border-slate-200 dark:border-slate-800">
          <Logo showSubtitle={true} />
          <div className="space-y-6">
            <div>
              <h2 className="text-5xl font-bold text-slate-900 dark:text-white leading-tight">
                Rejoignez notre communauté de lecteurs.
              </h2>
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
                Créez votre compte en quelques minutes. Votre inscription sera validée par notre équipe sous 24 à 48h.
              </p>
            </div>
          </div>
          <div className="text-slate-500 dark:text-slate-500 text-sm">© 2024 Biblius. Tous droits réservés.</div>
        </div>

        <div className="flex items-center justify-center p-6 sm:p-12 bg-white dark:bg-slate-950 relative">
          <div className="absolute top-6 right-6">
            <ThemeToggle />
          </div>

          <Card className="w-full max-w-lg bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-none">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Inscription réussie !
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Votre demande a bien été enregistrée. Un administrateur va examiner votre compte et l&apos;activer sous 24 à 48 heures.
              </p>

              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-3">
                  Prochaines étapes
                </h3>
                <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    Demande reçue et enregistrée
                  </li>
                  <li className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-amber-500 shrink-0" />
                    Vérification par l&apos;administration
                  </li>
                  <li className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-500 shrink-0" />
                    Email de confirmation
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-slate-400 shrink-0" />
                    Accès à votre espace membre
                  </li>
                </ul>
              </div>

              <Link href="/login">
                <Button className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-lg shadow-amber-500/25 transition-all">
                  Retour à la connexion
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white dark:bg-slate-950 transition-colors duration-300">
      {/* Côté gauche - Branding */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-slate-50 dark:bg-slate-900/50 border-r border-slate-200 dark:border-slate-800">
        <Logo showSubtitle={true} />
        <div className="space-y-6">
          <div>
            <h2 className="text-5xl font-bold text-slate-900 dark:text-white leading-tight">
              Rejoignez notre communauté de lecteurs.
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Créez votre compte en quelques minutes. Votre inscription sera validée par notre équipe sous 24 à 48h.
            </p>
          </div>
        </div>
        <div className="text-slate-500 dark:text-slate-500 text-sm">© 2024 Biblius. Tous droits réservés.</div>
      </div>

      {/* Côté droit - Formulaire */}
      <div className="flex items-center justify-center p-6 sm:p-12 bg-white dark:bg-slate-950 relative">
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-lg space-y-6">
          <Card className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-none">
            <CardHeader className="space-y-1">
              <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white text-center">Création de compte</CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400 text-center">
                Votre compte sera validé par un administrateur.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input id="firstName" name="firstName" placeholder="Jean" value={formData.firstName} onChange={handleChange} className="pl-10 h-11 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus-visible:ring-amber-500" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input id="lastName" name="lastName" placeholder="Dupont" value={formData.lastName} onChange={handleChange} className="pl-10 h-11 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus-visible:ring-amber-500" required />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input id="email" name="email" type="email" placeholder="jean@exemple.com" value={formData.email} onChange={handleChange} className="pl-10 h-11 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus-visible:ring-amber-500" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone (optionnel)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input id="phone" name="phone" type="tel" placeholder="+237 6XX XXX XXX" value={formData.phone} onChange={handleChange} className="pl-10 h-11 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus-visible:ring-amber-500" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Type de membre</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {MEMBER_TYPES.map((type) => {
                      const IconComponent = type.icon
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, role: type.value })}
                          className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border text-center transition-all ${
                            formData.role === type.value
                              ? "border-amber-500 bg-amber-50 dark:bg-amber-500/10 ring-2 ring-amber-500/20"
                              : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600"
                          }`}
                        >
                          <IconComponent className={`w-8 h-8 ${formData.role === type.value ? "text-amber-600 dark:text-amber-500" : "text-slate-500 dark:text-slate-400"}`} />
                          <span className="text-sm font-medium text-slate-900 dark:text-white">{type.label}</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">{type.desc}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {formData.role === "student" && (
                  <div className="space-y-2">
                    <Label htmlFor="department">Département / Filière</Label>
                    <Input id="department" name="department" placeholder="Ex: Informatique, Médecine..." value={formData.department} onChange={handleChange} className="h-11 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus-visible:ring-amber-500" />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={formData.password} onChange={handleChange} className="pl-10 pr-10 h-11 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus-visible:ring-amber-500" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} className="pl-10 pr-10 h-11 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus-visible:ring-amber-500" required />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-lg shadow-amber-500/25 transition-all mt-6">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Soumettre ma demande"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-slate-600 dark:text-slate-400">
                  Déjà un compte ?{" "}
                  <Link href="/login" className="text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 font-medium transition-colors">Se connecter</Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Message d'erreur en bas du formulaire */}
          {error && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 shadow-sm">
              <div className="shrink-0 mt-0.5">
                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-red-800 dark:text-red-300">Erreur d&apos;inscription</p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-0.5">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
