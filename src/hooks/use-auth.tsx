    "use client"

    import { useEffect, useState, createContext, useContext, useCallback, useRef } from 'react'
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
    
    const isCleaningUp = useRef(false)

    // Fonction de nettoyage robuste de la session
    const cleanupSession = useCallback(async () => {
        if (isCleaningUp.current) return
        isCleaningUp.current = true

        try {
        await supabase.auth.signOut({ scope: 'local' })
        } catch {
        // Ignorer
        }

        try {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('sb-') || key.includes('supabase')) {
            localStorage.removeItem(key)
            }
        })
        Object.keys(sessionStorage).forEach(key => {
            if (key.startsWith('sb-') || key.includes('supabase')) {
            sessionStorage.removeItem(key)
            }
        })
        } catch {
        // Ignorer
        }

        setMember(null)
        setLoading(false)
        isCleaningUp.current = false
    }, [supabase])

    const fetchMember = useCallback(async () => {
        try {
        // 🌟 ÉTAPE 1 : Vérifier d'abord s'il y a une session
        const { data: { session } } = await supabase.auth.getSession()
        
        // Pas de session → utilisateur non connecté (état NORMAL, pas une erreur)
        if (!session) {
            setMember(null)
            setLoading(false)
            return
        }

        // 🌟 ÉTAPE 2 : Session existe, on vérifie l'utilisateur
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError) {
            const errorMessage = userError.message?.toLowerCase() || ''
            const errorName = userError.name || ''
            
            // 🌟 Cas 1 : JWT expiré ou invalide → nettoyer la session
            if (
            errorMessage.includes('expired') ||
            errorMessage.includes('invalid jwt') ||
            errorMessage.includes('invalid claims') ||
            errorName === 'AuthApiError' ||
            errorName === 'AuthSessionMissingError'
            ) {
            console.warn('🔐 Session invalide détectée, nettoyage...')
            await cleanupSession()
            return
            }
            
            // Autres erreurs → log + reset
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

        // 🌟 ÉTAPE 3 : Utilisateur valide → chercher son profil
        const { data, error } = await supabase
            .from('members')
            .select('*')
            .eq('id', user.id)
            .maybeSingle()

        if (error) {
            // Erreur JWT sur cette requête aussi → nettoyer
            if (error.code === 'PGRST303' || error.message?.toLowerCase().includes('jwt')) {
            console.warn('🔐 JWT expiré sur la requête membre, nettoyage...')
            await cleanupSession()
            return
            }
            
            console.error('Erreur chargement membre:', error)
            setMember(null)
        } else if (!data) {
            // Utilisateur connecté mais pas de profil member
            setMember(null)
        } else {
            setMember(data as Member)
        }
        } catch (error) {
        console.error('Erreur auth inattendue:', error)
        setMember(null)
        } finally {
        setLoading(false)
        }
    }, [supabase, cleanupSession])

    useEffect(() => {
        // Chargement initial du membre (synchronisation avec le système Auth externe)
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchMember()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_OUT') {
            setMember(null)
            setLoading(false)
            return
        }
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
            fetchMember()
        }
        })

        return () => subscription.unsubscribe()
    }, [fetchMember, supabase.auth])

    const signOut = async () => {
        await cleanupSession()
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