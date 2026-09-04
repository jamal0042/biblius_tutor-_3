    // ============================================================================
    // Rôles de contribution intellectuelle (document_auteurs.role)
    // Correspond au CHECK SQL appliqué en base.
    // ============================================================================

    export const CONTRIBUTION_ROLES = [
        { value: "principal", label: "Auteur principal" },
        { value: "coauteur", label: "Co-auteur" },
        { value: "secondaire", label: "Auteur secondaire" },
        { value: "encadreur", label: "Encadreur" },
        { value: "directeur_memoire", label: "Directeur de mémoire" },
        { value: "directeur_these", label: "Directeur de thèse" },
        { value: "editeur_scientifique", label: "Éditeur scientifique" },
        { value: "traducteur", label: "Traducteur" },
        { value: "illustrateur", label: "Illustrateur" },
        { value: "coordinateur", label: "Coordinateur" },
        { value: "responsable_institutionnel", label: "Responsable institutionnel" },
    ] as const

    export type ContributionRole = (typeof CONTRIBUTION_ROLES)[number]["value"]

    export function contributionRoleLabel(role: string): string {
        const found = CONTRIBUTION_ROLES.find((r) => r.value === role)
        return found?.label ?? role
    }
