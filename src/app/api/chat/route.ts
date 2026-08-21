    import { NextResponse } from "next/server"
    import { createServerSupabaseClient } from "@/lib/supabase/server"

    const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"

    // 🛠️ Définition des "outils" que Gemini peut utiliser
    const TOOLS = [
    {
        functionDeclarations: [
        {
            name: "search_documents",
            description: "Recherche des livres/documents dans le catalogue de la bibliothèque. Utilise cette fonction quand l'utilisateur cherche un livre, demande une recommandation, ou veut savoir quels livres sont disponibles.",
            parameters: {
            type: "OBJECT",
            properties: {
                query: {
                type: "STRING",
                description: "Mots-clés de recherche (titre, auteur, sujet). Laisse vide pour lister tous les livres.",
                },
                type: {
                type: "STRING",
                description: "Type de document : 'book', 'article', 'thesis', 'magazine', etc. Utilise 'all' ou laisse vide pour tous les types.",
                },
                limit: {
                type: "INTEGER",
                description: "Nombre maximum de résultats (défaut 5, max 10).",
                },
            },
            },
        },
        {
            name: "get_user_loans",
            description: "Récupère les emprunts en cours de l'utilisateur connecté. Utilise cette fonction quand l'utilisateur demande 'mes emprunts', 'quels livres j'ai', 'ce que j'ai emprunté'.",
            parameters: { type: "OBJECT", properties: {} },
        },
        {
            name: "get_user_penalties",
            description: "Récupère les pénalités/amendes impayées de l'utilisateur. Utilise quand l'utilisateur demande ses pénalités, amendes, ou combien il doit.",
            parameters: { type: "OBJECT", properties: {} },
        },
        {
            name: "get_library_info",
            description: "Renvoie des informations générales sur la bibliothèque : horaires, localisation, règles d'emprunt. Utilise pour les questions sur la bibliothèque elle-même.",
            parameters: { type: "OBJECT", properties: {} },
        },
        ],
    },
    ]

    // 🛠️ Implémentation des outils (ce qu'ils font réellement)
    type ToolArgs = Record<string, unknown>
    type SupabaseClient = Awaited<ReturnType<typeof createServerSupabaseClient>>

    interface DocumentRow {
    title: string
    author: string | null
    type: string
    exemplaires_disponibles: number | null
    auteurs: { name: string }[] | { name: string } | null
    }

    interface LoanRow {
    due_date: string
    status: string
    documents: {
        title: string
        auteurs: { name: string }[] | { name: string } | null
    }[] | {
        title: string
        auteurs: { name: string }[] | { name: string } | null
    } | null
    }

    interface PenaltyRow {
    amount: number | null
    reason: string | null
    created_at: string
    }

    interface HistoryMessage {
    role: string
    content: string
    }

    interface GeminiPart {
    text?: string
    functionCall?: {
        name: string
        args?: ToolArgs
    }
    functionResponse?: {
        name: string
        response: { result: unknown }
    }
    }

    interface GeminiContent {
    role: "user" | "model"
    parts: GeminiPart[]
    }

    function getString(value: unknown): string | undefined {
    return typeof value === "string" ? value : undefined
    }

    function getNumber(value: unknown): number | undefined {
    return typeof value === "number" ? value : undefined
    }

    function getAuthorName(auteurs: DocumentRow["auteurs"]): string {
    const auteur = Array.isArray(auteurs) ? auteurs[0] : auteurs
    return auteur?.name || "Inconnu"
    }

    async function executeTool(toolName: string, args: ToolArgs, supabase: SupabaseClient, memberId?: string) {
    try {
        switch (toolName) {
        case "search_documents": {
            let query = supabase
            .from("documents")
            .select(`id, title, author, type, exemplaires_disponibles, auteurs (name)`)
            .order("title", { ascending: true })
            .limit(getNumber(args.limit) || 5)

            const searchTerm = getString(args.query)
            if (searchTerm?.trim()) {
            const term = searchTerm.trim()
            query = query.or(`title.ilike.%${term}%,author.ilike.%${term}%`)
            }
            const documentType = getString(args.type)
            if (documentType && documentType !== "all") {
            query = query.eq("type", documentType)
            }

            const { data } = await query
            return ((data || []) as unknown as DocumentRow[]).map((d) => ({
            title: d.title,
            author: getAuthorName(d.auteurs) || d.author || "Inconnu",
            type: d.type,
            available: (d.exemplaires_disponibles || 0) > 0,
            count: d.exemplaires_disponibles || 0,
            }))
        }

        case "get_user_loans": {
            if (!memberId) return { error: "Non connecté" }
            const { data } = await supabase
            .from("prets")
            .select(`due_date, status, documents (title, auteurs (name))`)
            .eq("member_id", memberId)
            .in("status", ["active", "overdue"])
            
            return ((data || []) as unknown as LoanRow[]).map((l) => {
            const document = Array.isArray(l.documents) ? l.documents[0] : l.documents
            const auteur = document?.auteurs
            const firstAuthor = Array.isArray(auteur) ? auteur[0] : auteur
            return {
            title: document?.title || "Inconnu",
            author: firstAuthor?.name || "Inconnu",
            dueDate: l.due_date,
            status: l.status,
            isLate: new Date(l.due_date) < new Date(),
            }
            })
        }

        case "get_user_penalties": {
            if (!memberId) return { error: "Non connecté" }
            const { data } = await supabase
            .from("penalites")
            .select("amount, reason, created_at")
            .eq("member_id", memberId)
            .eq("status", "unpaid")
            
            const penalties = (data || []) as unknown as PenaltyRow[]
            const total = penalties.reduce((sum, penalty) => sum + (penalty.amount || 0), 0)
            return { penalties: data || [], total }
        }

        case "get_library_info": {
            return {
            horaires: "Lundi-Vendredi 8h-20h, Samedi 9h-18h, Dimanche fermé",
            localisation: "Bâtiment principal, Rez-de-chaussée",
            regles: "Emprunt de 15 jours, maximum 5 livres simultanés, réservation possible",
            contact: "accueil@biblius.fr",
            }
        }

        default:
            return { error: "Outil inconnu" }
        }
    } catch (err) {
        console.error(`Erreur outil ${toolName}:`, err)
        return { error: "Erreur lors de l'exécution" }
    }
    }

    export async function POST(req: Request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) {
        return NextResponse.json({ error: "Clé API manquante" }, { status: 500 })
        }

        const { message, history, memberName, memberId } = await req.json()
        const supabase = await createServerSupabaseClient()

        const systemPrompt = `Tu es Biblius, l'assistant IA de la bibliothèque universitaire Biblius.

    IDENTITÉ :
    - Tu es chaleureux, cultivé et serviable
    - Tu parles français avec élégance mais sans être pompeux
    - Tu utilises des emojis avec parcimonie (📚 📖 ✨)

    RÈGLES IMPORTANTES :
    1. Quand l'utilisateur demande un livre, une recommandation, ou veut savoir ce qui est disponible : APPELLE l'outil search_documents
    2. Quand il demande ses emprunts : APPELLE get_user_loans
    3. Quand il demande ses pénalités : APPELLE get_user_penalties
    4. Quand il demande les horaires ou infos générales : APPELLE get_library_info
    5. Base tes réponses UNIQUEMENT sur les données des outils, n'invente JAMAIS de titres ou auteurs
    6. Sois concis (3-6 phrases max sauf liste de livres)
    7. Si aucun résultat, propose des alternatives ou suggère d'explorer le catalogue

    L'utilisateur s'appelle : ${memberName || "un membre"}.`

        // Historique au format Gemini
        const contents = [
        ...(history || [])
            .slice(-8)
            .map((m: HistoryMessage): GeminiContent => ({
            role: m.role === "bot" ? "model" : "user",
            parts: [{ text: m.content }],
            })),
        { role: "user", parts: [{ text: message }] },
        ] as GeminiContent[]

        // 🔄 Boucle de conversation (peut appeler plusieurs outils)
        let finalReply = ""
        let iterations = 0
        const MAX_ITERATIONS = 3

        while (iterations < MAX_ITERATIONS) {
        iterations++

        const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents,
            tools: TOOLS,
            generationConfig: { temperature: 0.7, maxOutputTokens: 800 },
            }),
        })

        if (!response.ok) {
            const errText = await response.text()
            console.error("Erreur Gemini:", errText)
            return NextResponse.json({ error: "Erreur Gemini" }, { status: 500 })
        }

        const data = await response.json()
        const candidate = data?.candidates?.[0]
        const parts = candidate?.content?.parts || []

        // Chercher s'il y a un appel de fonction
        const functionCall = (parts as GeminiPart[]).find((p) => p.functionCall)

        if (!functionCall) {
            // Pas d'appel → réponse textuelle finale
            finalReply = parts[0]?.text || "Je n'ai pas pu formuler de réponse."
            break
        }

        // 🛠️ Exécuter l'outil demandé par Gemini
        const requestedFunction = functionCall.functionCall
        if (!requestedFunction) break

        const toolName = requestedFunction.name
        const toolArgs = requestedFunction.args || {}
        
        console.log(`🔧 Gemini appelle: ${toolName}`, toolArgs)
        const toolResult = await executeTool(toolName, toolArgs, supabase, memberId)

        // Ajouter la réponse de l'outil à la conversation
        contents.push({
            role: "model",
            parts: [{ functionCall: requestedFunction }],
        })
        contents.push({
            role: "user",
            parts: [
            {
                functionResponse: {
                name: toolName,
                response: { result: toolResult },
                },
            },
            ],
        })
        }

        return NextResponse.json({ reply: finalReply })
    } catch (error) {
        console.error("Erreur API chat:", error)
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
    }
    }