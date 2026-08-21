    import { NextResponse } from "next/server"
    import { createServerSupabaseClient } from "@/lib/supabase/server"

    const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"

    // 🛠️ Outils disponibles pour Gemini (Function Calling)
    const TOOLS = [
    {
        functionDeclarations: [
        {
            name: "search_documents",
            description: "Recherche dans le catalogue : livres physiques ET ressources numériques. À utiliser quand l'utilisateur cherche un livre, demande une recommandation, ou veut savoir ce qui est disponible.",
            parameters: {
            type: "OBJECT",
            properties: {
                query: { type: "STRING", description: "Mots-clés (titre, auteur, sujet). Vide pour lister." },
                limit: { type: "INTEGER", description: "Nombre max de résultats (défaut 5, max 8)." },
            },
            },
        },
        {
            name: "get_user_loans",
            description: "Emprunts en cours de l'utilisateur connecté.",
            parameters: { type: "OBJECT", properties: {} },
        },
        {
            name: "get_user_penalties",
            description: "Pénalités/amendes impayées de l'utilisateur.",
            parameters: { type: "OBJECT", properties: {} },
        },
        {
            name: "get_library_info",
            description: "Infos générales : horaires, localisation, règles d'emprunt.",
            parameters: { type: "OBJECT", properties: {} },
        },
        ],
    },
    ]

    type ToolArgs = Record<string, unknown>
    type SupabaseClient = Awaited<ReturnType<typeof createServerSupabaseClient>>

    interface AuthorRow {
    id?: string
    name: string
    }

    interface BookRow {
    id: string
    title: string
    type: string
    exemplaires_disponibles: number | null
    auteurs: AuthorRow[] | AuthorRow | null
    }

    interface DigitalResourceRow {
    id: string
    title: string
    type: string
    category: string | null
    }

    interface LoanRow {
    due_date: string
    documents: {
        title: string
        auteurs: AuthorRow[] | AuthorRow | null
    }[] | {
        title: string
        auteurs: AuthorRow[] | AuthorRow | null
    } | null
    }

    interface PenaltyRow {
    amount: number | null
    reason: string | null
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

    function getAuthorName(auteurs: BookRow["auteurs"]): string {
    const auteur = Array.isArray(auteurs) ? auteurs[0] : auteurs
    return auteur?.name || "Auteur inconnu"
    }

    function getString(value: unknown): string {
    return typeof value === "string" ? value : ""
    }

    function getNumber(value: unknown): number {
    return typeof value === "number" ? value : 0
    }

    // 🛠️ Exécution réelle des outils (accès à VOTRE base de données)
    async function executeTool(toolName: string, args: ToolArgs, supabase: SupabaseClient, memberId?: string) {
    try {
        switch (toolName) {
        case "search_documents": {
            const term = getString(args.query).trim()
            const limit = Math.min(Math.max(getNumber(args.limit) || 5, 1), 8)

            // ---------- 1. LIVRES PHYSIQUES (table documents + auteurs) ----------
            let books: BookRow[] = []

            if (term) {
            // Recherche par TITRE
            const { data: titleMatches } = await supabase
                .from("documents")
                .select(`id, title, type, exemplaires_disponibles, auteurs (name)`)
                .ilike("title", `%${term}%`)
                .limit(limit)
            books = titleMatches || []

            // Recherche par AUTEUR (via la table auteurs)
            if (books.length < limit) {
                const { data: authors } = await supabase
                .from("auteurs")
                .select("id")
                .ilike("name", `%${term}%`)

                if (authors && authors.length > 0) {
                const { data: authorBooks } = await supabase
                    .from("documents")
                    .select(`id, title, type, exemplaires_disponibles, auteurs (name)`)
                        .in("author_id", (authors as unknown as AuthorRow[]).map((a) => a.id))
                    .limit(limit - books.length)
                books = [...books, ...(authorBooks || [])]
                }
            }
            } else {
            const { data } = await supabase
                .from("documents")
                .select(`id, title, type, exemplaires_disponibles, auteurs (name)`)
                .order("title", { ascending: true })
                .limit(limit)
            books = data || []
            }

            const livres = books.map((b) => ({
            type: "livre_physique",
            title: b.title,
            author: getAuthorName(b.auteurs),
            available: (b.exemplaires_disponibles || 0) > 0,
            link: `/catalogue/${b.id}`,
            }))

            // ---------- 2. RESSOURCES NUMÉRIQUES ----------
            let numQuery = supabase
            .from("digital_resources")
            .select(`id, title, type, category`)
            .order("created_at", { ascending: false })

            if (term) {
            numQuery = numQuery.ilike("title", `%${term}%`)
            }
            numQuery = numQuery.limit(limit)

            const { data: nums } = await numQuery

            const ressources = (nums as unknown as DigitalResourceRow[] || []).map((n) => ({
            type: "ressource_numerique",
            title: n.title,
            category: n.category,
            link: `/dashboard/numerique?open=${n.id}`,
            }))

            return { livres, ressources_numeriques: ressources }
        }

        case "get_user_loans": {
            if (!memberId) return { error: "Utilisateur non connecté" }
            const { data } = await supabase
            .from("prets")
            .select(`due_date, status, documents (title, auteurs (name))`)
            .eq("member_id", memberId)
            .in("status", ["active", "overdue"])

            return ((data || []) as unknown as LoanRow[]).map((l) => {
            const doc = Array.isArray(l.documents) ? l.documents[0] : l.documents
            const auteur = doc?.auteurs
            const firstAuthor = Array.isArray(auteur) ? auteur[0] : auteur
            return {
                title: doc?.title || "Inconnu",
                author: firstAuthor?.name || "Inconnu",
                dueDate: l.due_date,
                isLate: new Date(l.due_date) < new Date(),
            }
            })
        }

        case "get_user_penalties": {
            if (!memberId) return { error: "Utilisateur non connecté" }
            const { data } = await supabase
            .from("penalites")
            .select("amount, reason")
            .eq("member_id", memberId)
            .eq("status", "unpaid")

            const total = (data as unknown as PenaltyRow[] || []).reduce(
            (sum, penalty) => sum + (penalty.amount || 0),
            0,
            )
            return { penalties: data || [], total }
        }

        case "get_library_info": {
            return {
            horaires: "Lundi-Vendredi 8h-20h, Samedi 9h-18h, Dimanche fermé",
            localisation: "Bâtiment principal, Rez-de-chaussée",
            regles: "Emprunt de 15 jours, maximum 5 livres simultanés, réservation possible",
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

    IDENTITÉ : chaleureux, cultivé, serviable. Tu parles français. Emojis avec parcimonie (📚  ✨).

    RÈGLES IMPORTANTES :
    1. Pour toute recherche de livre/recommandation : APPELLE search_documents.
    2. Pour les emprunts de l'utilisateur : APPELLE get_user_loans.
    3. Pour les pénalités : APPELLE get_user_penalties.
    4. Pour horaires/règles : APPELLE get_library_info.
    5. N'invente JAMAIS de titres ou d'auteurs : base-toi UNIQUEMENT sur les résultats des outils.
    6. 🌟 LIENS OBLIGATOIRES : quand tu proposes un document, inclus TOUJOURS son lien cliquable au format markdown [texte](url) en utilisant EXACTEMENT le champ "link" fourni par l'outil.
    Exemple : [📖 Lire « la vie » dans la plateforme](/dashboard/numerique?open=abc-123)
    ou [📚 Voir la fiche du livre](/catalogue/xyz-456)
    7. Sois concis (3-6 phrases max, sauf listes).
    8. Si aucun résultat, propose d'élargir la recherche ou de parcourir le catalogue : [Parcourir le catalogue](/catalogue)

    L'utilisateur s'appelle : ${memberName || "un membre"}.`

        // Historique au format Gemini (roles: user / model)
        const contents: GeminiContent[] = [
        ...(history || [])
            .slice(-8)
            .map((m: HistoryMessage) => ({
            role: m.role === "bot" ? "model" : "user",
            parts: [{ text: m.content }],
            })),
        { role: "user", parts: [{ text: message }] },
        ]

        // 🔄 Boucle de function calling (max 3 tours)
        let finalReply = ""
        let iterations = 0

        while (iterations < 3) {
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
            console.error("Erreur Gemini:", await response.text())
            return NextResponse.json({ error: "Erreur Gemini" }, { status: 500 })
        }

        const data = await response.json()
        const parts = (data?.candidates?.[0]?.content?.parts || []) as GeminiPart[]
        const functionCall = parts.find((p) => p.functionCall)

        if (!functionCall) {
            // Pas d'appel d'outil → réponse textuelle finale
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

        // Renvoyer le résultat à Gemini pour qu'il formule la réponse
        contents.push({ role: "model", parts: [{ functionCall: requestedFunction }] })
        contents.push({
            role: "user",
            parts: [{ functionResponse: { name: toolName, response: { result: toolResult } } }],
        })
        }

        return NextResponse.json({ reply: finalReply })
    } catch (error) {
        console.error("Erreur API chat:", error)
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
    }
    }