    export type Role = 'admin' | 'librarian' | 'teacher' | 'researcher' | 'student' | 'external'
    export type MemberStatus = 'active' | 'suspended' | 'inactive' | 'pending'

    export const ROLE_LABELS: Record<Role, string> = {
    admin: 'Administrateur',
    librarian: 'Bibliothécaire',
    teacher: 'Enseignant',
    researcher: 'Chercheur',
    student: 'Étudiant',
    external: 'Lecteur externe',
    }

    export const STATUS_LABELS: Record<MemberStatus, string> = {
    active: 'Actif',
    suspended: 'Suspendu',
    inactive: 'Inactif',
    pending: 'En attente',
    }

    export function isStaff(role: Role): boolean {
    return role === 'admin' || role === 'librarian'
    }

    export const ROLE_DASHBOARD: Record<Role, string> = {
    admin: '/admin',
    librarian: '/admin/reception',
    teacher: '/dashboard',
    researcher: '/dashboard',
    student: '/dashboard',
    external: '/catalogue',
    }

    export interface Member {
    id: string
    role: Role
    first_name: string
    last_name: string
    email: string
    phone?: string
    matricule?: string
    department?: string
    status: MemberStatus
    max_loans: number
    max_loans_duration: number
    max_digital_loans: number
    email_notifications: boolean
    sms_notifications: boolean
    created_at: string
    updated_at: string
    }
        export const STATUS_COLORS: Record<MemberStatus, string> = {
    active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
    suspended: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
    inactive: 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400',
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    }