import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, firstName, lastName, phone, role, department } = body

    if (!email || !password || !firstName || !lastName || !role) {
      return NextResponse.json(
        { error: "Tous les champs obligatoires doivent être remplis." },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 6 caractères." },
        { status: 400 }
      )
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    })

    if (authError) {
      const msg = authError.message.includes("already")
        ? "Un compte avec cet email existe déjà."
        : authError.message
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Erreur lors de la création du compte." },
        { status: 500 }
      )
    }

    const roleLimits: Record<string, { max_loans: number; max_loans_duration: number; max_digital_loans: number }> = {
      teacher: { max_loans: 10, max_loans_duration: 30, max_digital_loans: 5 },
      student: { max_loans: 5, max_loans_duration: 15, max_digital_loans: 3 },
      external: { max_loans: 3, max_loans_duration: 7, max_digital_loans: 1 },
    }
    const limits = roleLimits[role] || roleLimits.student

    const { error: memberError } = await supabaseAdmin.from("members").insert({
      id: authData.user.id,
      email,
      first_name: firstName,
      last_name: lastName,
      phone: phone || null,
      role,
      department: department || null,
      status: "pending",
      max_loans: limits.max_loans,
      max_loans_duration: limits.max_loans_duration,
      max_digital_loans: limits.max_digital_loans,
      email_notifications: true,
      sms_notifications: false,
    })

    if (memberError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: `Erreur base de données: ${memberError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: "Une erreur inattendue est survenue." },
      { status: 500 }
    )
  }
}
