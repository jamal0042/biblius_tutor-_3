    import { createClient } from "@/lib/supabase/client"
    import type { ContributionRole } from "@/lib/contribution-roles"

    export interface Contributor {
        id?: string
        name: string
        role: ContributionRole
        order: number
    }

    // Enregistre la liste structurée des contributeurs d'un document.
    // Réutilise la table `auteurs` (match par nom exact, sinon création)
    // et la table junction `document_auteurs` (document_id, author_id, role, author_order).
    export async function saveDocumentContributors(
        documentId: string,
        contributors: Contributor[],
    ): Promise<void> {
        const supabase = createClient()
        const valid = contributors
            .map((c) => ({ ...c, name: c.name.trim() }))
            .filter((c) => c.name.length > 0)

        if (valid.length === 0) return

        const relations: {
            document_id: string
            author_id: string
            role: string
            author_order: number
        }[] = []

        for (const contributor of valid) {
            const { data: existing, error: findError } = await supabase
                .from("auteurs")
                .select("id")
                .eq("name", contributor.name)
                .maybeSingle()

            if (findError) throw findError

            let authorId = existing?.id
            if (!authorId) {
                const { data: created, error: createError } = await supabase
                    .from("auteurs")
                    .insert({ name: contributor.name })
                    .select("id")
                    .single()
                if (createError) throw createError
                authorId = created.id
            }

            relations.push({
                document_id: documentId,
                author_id: authorId,
                role: contributor.role,
                author_order: contributor.order,
            })
        }

        const { error } = await supabase.from("document_auteurs").insert(relations)
        if (error) throw error
    }
