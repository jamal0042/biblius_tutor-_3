import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getRoleLimits } from "@/lib/role-limits"

// Client admin (service role) : bypass RLS, jamais exposé au navigateur
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json()

    /* ---------- Validation & nettoyage ---------- */
    const email = String(body.email || "").trim().toLowerCase()
    const password = String(body.password || "")
    const firstName = String(body.firstName || "").trim()
    const lastName = String(body.lastName || "").trim()
    const phone = String(body.phone || "").trim() || null
    const role = String(body.role || "student")
    const department = String(body.department || "").trim() || null

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: "Email, mot de passe, prénom et nom sont obligatoires." },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 6 caractères." },
        { status: 400 }
      )
    }

    // Uniquement les rôles autorisés à l'inscription publique
    if (!["student", "teacher", "external"].includes(role)) {
      return NextResponse.json(
        { error: "Type de membre invalide." },
        { status: 400 }
      )
    }

    /* ---------- Email déjà utilisé ? ---------- */
    const { data: existing } = await supabaseAdmin
      .from("members")
      .select("id")
      .eq("email", email)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet email." },
        { status: 409 }
      )
    }

    /* ---------- Création de l'utilisateur auth ---------- */
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: false, // activation après validation admin + confirmation email
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
        },
      })

    if (authError) {
      const msg = authError.message.toLowerCase().includes("already")
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

    /* ---------- Création du membre (statut PENDING) ---------- */
    const limits = getRoleLimits(role)

    const { error: memberError } = await supabaseAdmin.from("members").insert({
      id: authData.user.id,
      email,
      first_name: firstName,
      last_name: lastName,
      phone,
      role,
      department,
      status: "pending",        // ✅ autorisé par members_status_check
      invite_status: null,      // ✅ autorisé (NULL)
      max_loans: limits.max_loans,
      max_loans_duration: limits.max_loans_duration,
      max_digital_loans: limits.max_digital_loans,
      email_notifications: true,
      sms_notifications: false,
    })

    if (memberError) {
      // Rollback : on supprime l'utilisateur auth créé
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id).catch(() => {})
      return NextResponse.json(
        { error: `Erreur base de données : ${memberError.message}` },
        { status: 500 }
      )
    }
    return NextResponse.json({ success: true }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur lors de l'inscription." },
      { status: 500 }
    )
  }
}