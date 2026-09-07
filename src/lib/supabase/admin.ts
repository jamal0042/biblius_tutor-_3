    import { createClient, type SupabaseClient } from "@supabase/supabase-js"

    let adminClient: SupabaseClient | null = null

    /**
     * Client Supabase "service role" (admin).
     * Initialisation paresseuse : ne crash plus au build si les
     * variables d'environnement sont absentes.
     */
    export function getSupabaseAdmin(): SupabaseClient {
    if (adminClient) return adminClient

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
        throw new Error(
        "Supabase admin : NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis."
        )
    }

    adminClient = createClient(url, key, {
        auth: { persistSession: false },
    })

    return adminClient
    }