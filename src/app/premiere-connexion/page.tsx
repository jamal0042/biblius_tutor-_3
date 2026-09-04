"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Eye, EyeOff, Loader2, Lock, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/theme-toggle"
import { Logo } from "@/components/logo"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import { ROLE_DASHBOARD } from "@/lib/roles"

export default function FirstLoginPage() {
  const router = useRouter()
  const { member, loading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading && !member) router.replace("/login")
  }, [authLoading, member, router])

  if (authLoading || !member) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-amber-500" /></div>
  }

  return <FirstLoginForm member={member} />
}

function FirstLoginForm({ member }: { member: NonNullable<ReturnType<typeof useAuth>["member"]> }) {
  const router = useRouter()
  const supabase = createClient()
  const [firstName, setFirstName] = useState(member.first_name || "")
  const [lastName, setLastName] = useState(member.last_name || "")
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [showPasswords, setShowPasswords] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.")
      return
    }
    if (password !== confirmation) {
      setError("Les mots de passe ne correspondent pas.")
      return
    }
    setLoading(true)
    const { error: authError } = await supabase.auth.updateUser({
      password,
      data: { first_name: firstName, last_name: lastName, is_invited: false },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    const { error: memberError } = await supabase
      .from("members")
      .update({
        first_name: firstName,
        last_name: lastName,
        status: "active",
        invite_status: "accepted",
        invite_accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", member.id)

    if (memberError) {
      setError(memberError.message)
      setLoading(false)
      return
    }

    setSaved(true)
    setLoading(false)
    setTimeout(() => router.replace(ROLE_DASHBOARD[member.role as keyof typeof ROLE_DASHBOARD] || "/dashboard"), 1200)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center p-6 relative">
      <div className="absolute top-6 left-6"><Logo showSubtitle={false} /></div>
      <div className="absolute top-6 right-6"><ThemeToggle /></div>
      <Card className="w-full max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-slate-900 dark:text-white">Bienvenue dans Biblius</CardTitle>
          <CardDescription>Personnalisez votre profil et choisissez votre nouveau mot de passe.</CardDescription>
        </CardHeader>
        <CardContent>
          {saved ? (
            <div className="py-8 text-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="mx-auto mb-3 h-10 w-10" />
              <p className="font-medium">Votre compte est prêt. Redirection en cours...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/20 dark:text-red-400">{error}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="firstName">Prénom</Label><div className="relative"><User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input id="firstName" value={firstName} onChange={(event) => setFirstName(event.target.value)} className="pl-10" required /></div></div>
                <div className="space-y-2"><Label htmlFor="lastName">Nom</Label><div className="relative"><User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input id="lastName" value={lastName} onChange={(event) => setLastName(event.target.value)} className="pl-10" required /></div></div>
              </div>
              <div className="space-y-2"><Label htmlFor="password">Nouveau mot de passe</Label><div className="relative"><Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input id="password" type={showPasswords ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} className="pl-10 pr-10" required /><button type="button" aria-label="Afficher le mot de passe" onClick={() => setShowPasswords(!showPasswords)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
              <div className="space-y-2"><Label htmlFor="confirmation">Confirmer le mot de passe</Label><Input id="confirmation" type={showPasswords ? "text" : "password"} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required /></div>
              <Button type="submit" disabled={loading} className="w-full bg-amber-500 text-white hover:bg-amber-600">{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Enregistrer et accéder à mon espace"}</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}