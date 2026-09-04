    export interface RoleLimits {
    max_loans: number
    max_loans_duration: number
    max_digital_loans: number
    }

    const ROLE_LIMITS: Record<string, RoleLimits> = {
    teacher: { max_loans: 10, max_loans_duration: 30, max_digital_loans: 5 },
    researcher: { max_loans: 10, max_loans_duration: 30, max_digital_loans: 5 },
    student: { max_loans: 5, max_loans_duration: 15, max_digital_loans: 3 },
    external: { max_loans: 3, max_loans_duration: 7, max_digital_loans: 1 },
    }

    export function getRoleLimits(role: string): RoleLimits {
    return ROLE_LIMITS[role] || ROLE_LIMITS.student
    }
