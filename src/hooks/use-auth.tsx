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
        // ✅ Utilisation de getUser() au lieu de getSession() (plus sécurisé)
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError) {
            console.error('Erreur utilisateur:', userError)
            setMember(null)
            setLoading(false)
            return
        }

        if (!user) {
            setMember(null)
            setLoading(false)
            return
        }

        const { data, error } = await supabase
            .from('members')
            .select('*')
            .eq('id', user.id)
            .maybeSingle()

        if (error) {
            console.error('Erreur chargement membre:', error)
            
            if (error.code === 'PGRST303' || error.message?.includes('JWT')) {
            console.warn('JWT expiré détecté, nettoyage...')
            await supabase.auth.signOut({ scope: 'local' })
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('sb-')) localStorage.removeItem(key)
            })
            }
            setMember(null)
        } else if (!data) {
            console.warn('Utilisateur connecté mais pas de profil member')
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
        // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMember()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_OUT') {
            setMember(null)
            setLoading(false)
            return
        }
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            fetchMember()
        }
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