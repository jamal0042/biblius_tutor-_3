    import { NextResponse } from "next/server"
    import { createClient } from "@supabase/supabase-js"
    import { getCurrentMember } from "@/lib/supabase/server"
    import { isStaff } from "@/lib/roles"
    import { getRoleLimits } from "@/lib/role-limits"

    // Server-only admin client (service role). NEVER exposed to the browser.
    const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const INVITE_TTL_SECONDS = 7 * 24 * 60 * 60 // 7 days

    function toJson(data: unknown) {
    return data as Record<string, unknown>
    }

    export async function GET() {
    // Staff only
    const member = await getCurrentMember()
    if (!member || !isStaff(member.role)) {
        return NextResponse.json({ error: "Non autorisé." }, { status: 403 })
    }

    try {
        const { data, error } = await supabaseAdmin
        .from("members")
        .select("id, first_name, last_name, email, role, status, invite_status, invite_sent_at, invite_expires_at, invite_accepted_at, created_at")
        .not("invite_status", "is", null)
        .order("created_at", { ascending: false })

        if (error) throw error

        const invitations = (data || []).map((row) => {
        const r = toJson(row)
        return {
            id: r.id,
            first_name: r.first_name,
            last_name: r.last_name,
            email: r.email,
            role: r.role,
            status: r.invite_status,
            sent_at: r.invite_sent_at,
            expires_at: r.invite_expires_at,
            accepted_at: r.invite_accepted_at,
            created_at: r.created_at,
        }
        })

        return NextResponse.json({ invitations })
    } catch (err) {
        const msg = err instanceof Error ? err.message : "Erreur lors de la récupération."
        return NextResponse.json({ error: msg }, { status: 500 })
    }
    }

    export async function POST(request: Request) {
    // Staff only
    const member = await getCurrentMember()
    if (!member || !isStaff(member.role)) {
        return NextResponse.json({ error: "Non autorisé." }, { status: 403 })
    }

    let body: Record<string, unknown>
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 })
    }

    const email = String(body.email || "").trim().toLowerCase()
    const firstName = String(body.first_name || "").trim()
    const lastName = String(body.last_name || "").trim()
    const role = String(body.role || "student").toLowerCase()
    const department = body.department ? String(body.department).trim() || null : null
    const matricule = body.matricule ? String(body.matricule).trim() || null : null
    const phone = body.phone ? String(body.phone).trim() || null : null
    const birthDate = body.birth_date ? String(body.birth_date) || null : null
    const address = body.address ? String(body.address).trim() || null : null
    const city = body.city ? String(body.city).trim() || null : null
    const level = body.level ? String(body.level).trim() || null : null
    const speciality = body.speciality ? String(body.speciality).trim() || null : null
    const notes = body.notes ? String(body.notes).trim() || null : null

    if (!email || !firstName || !lastName || !role) {
        return NextResponse.json(
        { error: "L'email, le prénom, le nom et le rôle sont obligatoires." },
        { status: 400 }
        )
    }

    try {
        // ---- Case B : email already used by an active member ----
        const { data: existing } = await supabaseAdmin
        .from("members")
        .select("id, email, status, invite_status, invite_expires_at, first_name, last_name")
        .eq("email", email)
        .maybeSingle()

        if (existing) {
        const ex = toJson(existing)
        // Already has an active/usable account
        if (ex.status === "active") {
            return NextResponse.json(
            { error: "Un compte actif existe déjà avec cet email.", code: "EMAIL_ALREADY_ACTIVE" },
            { status: 409 }
            )
        }
        // Already has a pending invitation that hasn't expired => offer resend
        if (
            ex.invite_status === "pending" &&
            ex.invite_expires_at &&
            new Date(String(ex.invite_expires_at)).getTime() > Date.now()
        ) {
            return NextResponse.json(
            { error: "Une invitation est déjà en attente pour cet email.", code: "INVITE_PENDING" },
            { status: 409 }
            )
        }
        // Otherwise (expired, revoked, or suspended/inactive): re-invite this member
        const memberDbId = String(ex.id)
        await reinviteMember(memberDbId, email, role)
        await logActivity(member, "invitation_sent", memberDbId, { email, role })
        return NextResponse.json({ success: true, re_invited: true })
        }

        // ---- Case A : new user ----
        // Create the auth user WITHOUT confirming email; the invitation email
        // prompts the user to activate. The account is prepared server-side.
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: false,
        user_metadata: { first_name: firstName, last_name: lastName, is_invited: true },
        })

        if (authError) {
        const msg = authError.message.toLowerCase().includes("already")
            ? "Un compte avec cet email existe déjà."
            : authError.message
        return NextResponse.json({ error: msg }, { status: 400 })
        }

        if (!authData.user) {
        return NextResponse.json({ error: "Erreur lors de la création du compte." }, { status: 500 })
        }

        const limits = getRoleLimits(role)
        const now = new Date()
        const expiresAt = new Date(now.getTime() + INVITE_TTL_SECONDS * 1000)

        const { error: memberError } = await supabaseAdmin.from("members").insert({
        id: authData.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        phone,
        matricule,
        role,
        department,
        status: "pending",
        invite_status: "pending",
        invite_sent_at: now.toISOString(),
        invite_expires_at: expiresAt.toISOString(),
        invited_by: member.id,
        birth_date: birthDate,
        address,
        city,
        level,
        speciality,
        notes,
        max_loans: limits.max_loans,
        max_loans_duration: limits.max_loans_duration,
        max_digital_loans: limits.max_digital_loans,
        email_notifications: true,
        sms_notifications: false,
        })

        if (memberError) {
        // Roll back the auth user
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        return NextResponse.json(
            { error: `Erreur base de données: ${memberError.message}` },
            { status: 500 }
        )
        }

        // Send the invitation email via Supabase native auth
        const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/callback?next=/premiere-connexion`
        const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo,
        data: { first_name: firstName, last_name: lastName, is_invited: true },
        })

        if (inviteError) {
        // The account exists but the email could not be sent — keep the invite
        // pending so the admin can resend later.
        await logActivity(member, "invitation_send_failed", authData.user.id, { email, error: inviteError.message })
        }

        await logActivity(member, "invitation_sent", authData.user.id, { email, role })

        return NextResponse.json({ success: true, id: authData.user.id }, { status: 201 })
    } catch (err) {
        const msg = err instanceof Error ? err.message : "Erreur lors de l'invitation."
        return NextResponse.json({ error: msg }, { status: 500 })
    }
    }

    async function reinviteMember(memberId: string, email: string, role: string) {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + INVITE_TTL_SECONDS * 1000)

    const limits = getRoleLimits(role)
    await supabaseAdmin.from("members").update({
        role,
        status: "pending",
        invite_status: "pending",
        invite_sent_at: now.toISOString(),
        invite_expires_at: expiresAt.toISOString(),
        invite_accepted_at: null,
        max_loans: limits.max_loans,
        max_loans_duration: limits.max_loans_duration,
        max_digital_loans: limits.max_digital_loans,
    }).eq("id", memberId)

    const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/callback?next=/premiere-connexion`
    await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo,
        data: { is_invited: true },
    })
    }

    async function logActivity(
    actor: { id: string },
    action: string,
    entityId: string,
    details: Record<string, unknown>
    ) {
    await supabaseAdmin.from("activity_log").insert({
        actor_id: actor.id,
        action,
        entity: "member",
        entity_id: entityId,
        details,
    }).maybeSingle()
    }
