    import { createServerClient } from '@supabase/ssr'
    import { cookies } from 'next/headers'
    import type { Member } from '@/lib/roles'

    export async function createServerSupabaseClient() {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
        cookies: {
            get(name: string) {
            return cookieStore.get(name)?.value
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            set(name: string, value: string, options: any) {
            try {
                cookieStore.set({ name, value, ...options })
            } catch {
                // Ignore en Server Component
            }
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            remove(name: string, options: any) {
            try {
                cookieStore.set({ name, value: '', ...options })
            } catch {
                // Ignore en Server Component
            }
            },
        },
        }
    )
    }

    export async function getCurrentMember(): Promise<Member | null> {
    const supabase = await createServerSupabaseClient()
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return null

    const { data: member } = await supabase
        .from('members')
        .select('*')
        .eq('id', session.user.id)
        .single()

    return member as Member | null
    }