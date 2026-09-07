    import { NextResponse } from "next/server"
    import { getCurrentMember } from "@/lib/supabase/server"
    import { isStaff } from "@/lib/roles"
    import { getSupabaseAdmin } from "@/lib/supabase/admin"

    const INVITE_TTL_SECONDS = 7 * 24 * 60 * 60 // 7 days

    function toJson(data: unknown) {
    return data as Record<string, unknown>
    }

    async function ensureStaff() {
    const member = await getCurrentMember()
    if (!member || !isStaff(member.role)) return null
    return member
    }

    async function logActivity(
    actor: { id: string },
    action: string,
    entityId: string,
    details: Record<string, unknown>
    ) {
    try {
        const supabaseAdmin = getSupabaseAdmin()
        await supabaseAdmin
        .from("activity_log")
        .insert({
            actor_id: actor.id,
            action,
            entity: "member",
            entity_id: entityId,
            details,
        })
        .maybeSingle()
    } catch (err) {
        console.error("Erreur logActivity:", err)
        // Ne pas bloquer la route si le log échoue
    }
    }

    /* =========================================================
    PATCH : Renvoyer une invitation
    ========================================================= */
    export async function PATCH(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
    ) {
    const { id } = await params
    const actor = await ensureStaff()
    if (!actor) {
        return NextResponse.json({ error: "Non autorisé." }, { status: 403 })
    }

    try {
        const supabaseAdmin = getSupabaseAdmin()

        const { data: existing } = await supabaseAdmin
        .from("members")
        .select("id, email")
        .eq("id", id)
        .maybeSingle()

        if (!existing) {
        return NextResponse.json(
            { error: "Invitation introuvable." },
            { status: 404 }
        )
        }

        const email = String(toJson(existing).email)
        const now = new Date()
        const expiresAt = new Date(now.getTime() + INVITE_TTL_SECONDS * 1000)

        const { error: updateError } = await supabaseAdmin
        .from("members")
        .update({
            status: "pending",
            invite_status: "pending",
            invite_sent_at: now.toISOString(),
            invite_expires_at: expiresAt.toISOString(),
            invite_accepted_at: null,
        })
        .eq("id", id)

        if (updateError) throw updateError

        const redirectTo = `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        }/auth/callback?next=/premiere-connexion`

        const { error: inviteError } =
        await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            redirectTo,
            data: { is_invited: true },
        })

        if (inviteError) {
        await logActivity(actor, "invitation_resend_failed", id, {
            email,
            error: inviteError.message,
        })
        return NextResponse.json(
            { error: `Erreur lors de l'envoi: ${inviteError.message}` },
            { status: 500 }
        )
        }

        await logActivity(actor, "invitation_resend", id, { email })
        return NextResponse.json({
        success: true,
        expires_at: expiresAt.toISOString(),
        })
    } catch (err) {
        const msg = err instanceof Error ? err.message : "Erreur lors du renvoi."
        return NextResponse.json({ error: msg }, { status: 500 })
    }
    }

    /* =========================================================
    DELETE : Révoquer une invitation (non destructif)
    ========================================================= */
    export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
    ) {
    const { id } = await params
    const actor = await ensureStaff()
    if (!actor) {
        return NextResponse.json({ error: "Non autorisé." }, { status: 403 })
    }

    try {
        const supabaseAdmin = getSupabaseAdmin()

        const { data: existing } = await supabaseAdmin
        .from("members")
        .select("id, email")
        .eq("id", id)
        .maybeSingle()

        if (!existing) {
        return NextResponse.json(
            { error: "Invitation introuvable." },
            { status: 404 }
        )
        }

        // Révoquer l'invitation (on NE supprime PAS le membre)
        const { error } = await supabaseAdmin
        .from("members")
        .update({
            invite_status: "revoked",
            invite_expires_at: null,
        })
        .eq("id", id)

        if (error) throw error

        const email = String(toJson(existing).email)
        await logActivity(actor, "invitation_revoked", id, { email })
        return NextResponse.json({ success: true })
    } catch (err) {
        const msg =
        err instanceof Error ? err.message : "Erreur lors de la révocation."
        return NextResponse.json({ error: msg }, { status: 500 })
    }
    }