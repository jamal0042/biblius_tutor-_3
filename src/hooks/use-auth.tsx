    /* eslint-disable react-hooks/set-state-in-effect */
    "use client"

    import { useEffect, useState, createContext, useContext, useCallback } from 'react'
    import { createClient } from '@/lib/supabase/client'
    import type { Member, Role, MemberStatus } from '@/lib/roles'
    import { useRouter } from 'next/navigation'

    interface AuthContextType {
    member: Member | null
    loading: boolean
    signOut: () => Promise<void>
    refreshMember: () => Promise<void>
    }

    const AuthContext = createContext<AuthContextType>({
    member: null,
    loading: true,
    signOut: async () => {},
    refreshMember: async () => {},
    })

    export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [member, setMember] = useState<Member | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()
    const router = useRouter()

    const fetchMember = useCallback(async () => {
        try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
            setMember(null)
            setLoading(false)
            return
        }

        const { data, error } = await supabase
            .from('members')
            .select('*')
            .eq('id', session.user.id)
            .single()

        if (error || !data) {
            setMember(null)
        } else {
            setMember(data as Member)
        }
        } catch (error) {
        console.error('Erreur auth:', error)
        setMember(null)
        } finally {
        setLoading(false)
        }
    }, [supabase])

    useEffect(() => {
        fetchMember()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
        fetchMember()
        })

        return () => subscription.unsubscribe()
    }, [fetchMember, supabase.auth])

    const signOut = async () => {
        await supabase.auth.signOut()
        setMember(null)
        router.push('/login')
    }

    return (
        <AuthContext.Provider value={{ member, loading, signOut, refreshMember: fetchMember }}>
        {children}
        </AuthContext.Provider>
    )
    }

    export function useAuth() {
    return useContext(AuthContext)
    }

    export function useRequireAuth(requiredRole?: Role, requiredStatus: MemberStatus = 'active') {
    const { member, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (loading) return

        if (!member) {
        router.push('/login')
        return
        }

        if (member.status === 'pending') {
        router.push('/pending')
        return
        }

        if (member.status !== 'active') {
        router.push('/login?error=account_disabled')
        return
        }

        if (requiredRole && member.role !== requiredRole) {
        router.push('/dashboard')
        return
        }
    }, [member, loading, requiredRole, requiredStatus, router])

    return { member, loading }
    }