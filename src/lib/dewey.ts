    // ============================================================================
    // Classification Décimale de Dewey — helpers applicatif
    // Source hiérarchique : table Supabase `dewey_classes` (code, libelle, parent_code)
    // ============================================================================

    // Génère la cote complète collée sur le dos du livre
    // Ex : code "005" + auteur "Lavoisier" + année 2026 → "005 LAV 2026"
    export function genererCoteComplete(
        codeDewey: string | null,
        auteur: string,
        annee?: string | number | null,
    ): string {
        const cleanCode = (codeDewey ?? "").trim()
        const cleanAuteur = auteur.trim()

        if (!cleanCode) return ""
        if (!cleanAuteur) return cleanCode

        const mots = cleanAuteur.split(/\s+/)
        const nom = mots[mots.length - 1] ?? cleanAuteur
        const lettres =
            nom.replace(/[^a-zA-Z]/g, "").substring(0, 3).toUpperCase() || "XXX"

        const anneePart = annee ? String(annee).trim() : ""
        return anneePart ? `${cleanCode} ${lettres} ${anneePart}` : `${cleanCode} ${lettres}`
    }

    // Extrait le code de la classe "racine de centaine" (3 premiers caractères)
    export function racineDewey(code: string | null): string {
        if (!code) return ""
        const digits = code.replace(/[^0-9]/g, "")
        return digits.slice(0, 3)
    }

    // Vérifie si un code Dewey est valide (3 à 7 digits, éventuellement pointés)
    export function estCodeDeweyValide(code: string): boolean {
        return /^[0-9]{3}(\.[0-9]{1,3})*$/.test(code.trim())
    }

    // Norme Cutter : transforme un nom d'auteur en "cote d'auteur" (3 premières lettres)
    export function cutterAuteur(nomComplet: string): string {
        const mots = nomComplet.trim().split(/\s+/)
        const nom = mots[mots.length - 1] ?? ""
        return nom.replace(/[^a-zA-Z]/g, "").substring(0, 3).toUpperCase() || "XXX"
    }

    export interface DeweyNode {
        code: string
        libelle: string
        level: number | null
        children: DeweyNode[]
    }

    // Construit l'arbre Dewey à partir d'une liste plate {code, libelle, parent_code}
    export function construireArbreDewey(
        classes: Array<{ code: string; libelle: string; parent_code: string | null; level?: number | null }>,
    ): DeweyNode[] {
        const map = new Map<string, DeweyNode>()
        for (const c of classes) {
            map.set(c.code, {
                code: c.code,
                libelle: c.libelle,
                level: c.level ?? null,
                children: [],
            })
        }

        const racines: DeweyNode[] = []
        for (const c of classes) {
            const node = map.get(c.code)!
            if (c.parent_code && map.has(c.parent_code)) {
                map.get(c.parent_code)!.children.push(node)
            } else {
                racines.push(node)
            }
        }

        const sortNodes = (nodes: DeweyNode[]) => {
            nodes.sort((a, b) => a.code.localeCompare(b.code, "en", { numeric: true }))
            nodes.forEach((n) => sortNodes(n.children))
        }
        sortNodes(racines)
        return racines
    }

    // Retourne les "notions" d'un code Dewey : code exact + tous ses ancêtres
    export function cheminDewey(
        code: string | null,
        classes: Array<{ code: string; libelle: string; parent_code: string | null }>,
    ): Array<{ code: string; libelle: string }> {
        if (!code) return []
        const byCode = new Map<string, { code: string; libelle: string; parent_code: string | null }>(classes.map((c) => [c.code, c]))
        const path: Array<{ code: string; libelle: string }> = []
        let current: string | null = code
        let guard = 0
        while (current && byCode.has(current) && guard < 20) {
            const node: { code: string; libelle: string; parent_code: string | null } = byCode.get(current)!
            path.unshift({ code: node.code, libelle: node.libelle })
            current = node.parent_code
            guard++
        }
        return path
    }

    // Construit une clause de plage SQL pour un intervalle Dewey (ex : "600-699")
    // Retourne { borneMin, borneMax } ou null si le format est invalide.
    export function intervalleDewey(intervalle: string): { min: string; max: string } | null {
        const m = intervalle.trim().match(/^(\d{3,4})(?:\s*-\s*(\d{3,4}))?$/)
        if (!m) return null
        const debut = m[1]
        const fin = m[2] || debut
        const len = Math.max(debut.length, fin.length)
        return {
            min: debut.padEnd(len, "0"),
            max: fin.padEnd(len, "9"),
        }
    }
