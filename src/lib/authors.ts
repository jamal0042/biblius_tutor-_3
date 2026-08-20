import { createClient } from "@/lib/supabase/client"

export async function saveDocumentAuthors(documentId: string, authorsInput: string) {
    const supabase = createClient()
    const authorNames = authorsInput
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean)

    if (authorNames.length === 0) return

    const relations: { document_id: string; author_id: string; role: "principal" | "coauteur"; author_order: number }[] = []

    for (const [index, name] of authorNames.entries()) {
        const { data: existing, error: findError } = await supabase
            .from("auteurs")
            .select("id")
            .eq("name", name)
            .maybeSingle()

        if (findError) throw findError

        let authorId = existing?.id
        if (!authorId) {
            const { data: created, error: createError } = await supabase
                .from("auteurs")
                .insert({ name })
                .select("id")
                .single()
            if (createError) throw createError
            authorId = created.id
        }

        relations.push({
            document_id: documentId,
            author_id: authorId,
            role: index === 0 ? "principal" : "coauteur",
            author_order: index + 1,
        })
    }

    const { error } = await supabase.from("document_auteurs").insert(relations)
    if (error) throw error
}