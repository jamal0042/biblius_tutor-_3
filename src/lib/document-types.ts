    // ============================================================================
    // Types documentaires du catalogue.
    // (documents.type est une colonne texte — on standardise les options UI ici.)
    // Liste alignée sur les options actuelles du formulaire.
    // ============================================================================

    export const DOCUMENT_TYPES: { value: string; label: string }[] = [
        { value: "book", label: "Livre" },
        { value: "thesis", label: "Thèse" },
        { value: "memoire", label: "Mémoire" },
        { value: "tfc", label: "TFC" },
        { value: "article", label: "Article scientifique" },
        { value: "projet_tutore", label: "Projet tutoré" },
        { value: "rapport_stage", label: "Rapport de stage" },
        { value: "other", label: "Autre document" },
    ]

    export function documentTypeLabel(type: string): string {
        const found = DOCUMENT_TYPES.find((t) => t.value === type)
        return found?.label ?? type
    }
