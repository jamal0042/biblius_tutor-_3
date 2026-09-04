    import { NextResponse } from "next/server"
    import { createServerSupabaseClient } from "@/lib/supabase/server"

    const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"

    interface DeweyRow {
        code: string
        libelle: string
        parent_code: string | null
    }

    interface Suggestion {
        code: string
        libelle: string
        confidence: number
        justification: string
    }

    // Le modèle doit répondre UNIQUEMENT avec des codes présents dans allowedCodes.
    function buildSystemPrompt(catalog: string): string {
        return `Tu es un bibliothécaire expert du catalogage universitaire.
Ta mission : proposer une classification selon la Classification Décimale de Dewey (CDD) pour un document, à partir de son titre, son type, son résumé et ses mots-clés.

RÈGLES STRICTES :
1. Tu dois choisir UNIQUEMENT parmi les codes Dewey de la liste fournie (champ "catalogue").
2. Renvoie EXACTEMENT 3 propositions, classées de la plus pertinente à la moins pertinente.
3. Pour chaque proposition : code (existant dans la liste), niveau de confiance (0-100), et une justification en 1 phrase en français.
4. Si aucun code ne correspond parfaitement, propose la classe la plus proche et explique le doute.
5. Réponds uniquement en JSON valide, sans texte autour, au format :
{"propositions":[{"code":"005","confidence":85,"justification":"...","path":"Informatique > Programmation, logiciels"}]}
6. N'invente JAMAIS un code absent de la liste.

Catalogue Dewey disponible :
${catalog}`
    }

    export async function POST(req: Request) {
        try {
            const apiKey = process.env.GEMINI_API_KEY
            if (!apiKey) {
                return NextResponse.json({ error: "Clé API manquante" }, { status: 500 })
            }

            const { title, type, subtitle, description, keywords } = await req.json()

            const supabase = await createServerSupabaseClient()
            const { data: classes } = await supabase
                .from("dewey_classes")
                .select("code, libelle, parent_code")
                .order("code", { ascending: true })

            const rows = (classes || []) as unknown as DeweyRow[]
            if (rows.length === 0) {
                return NextResponse.json({ error: "Catalogue Dewey vide." }, { status: 400 })
            }

            // Construit une liste "catalogue" lisible par l'IA (code + libellé + chemin)
            const byCode = new Map<string, DeweyRow>(rows.map((r) => [r.code, r]))
            const pathOf = (code: string): string => {
                const path: string[] = []
                let cur: string | null = code
                let guard = 0
                while (cur && byCode.has(cur) && guard < 10) {
                    const n: DeweyRow = byCode.get(cur)!
                    path.unshift(`${n.code} ${n.libelle}`)
                    cur = n.parent_code
                    guard++
                }
                return path.join(" > ")
            }

            const catalog = rows
                .map((r) => `${r.code} — ${r.libelle} (${pathOf(r.code)})`)
                .join("\n")

            const userPrompt = `Document à classer :
- Titre : ${title || "—"}
- Sous-titre : ${subtitle || "—"}
- Type : ${type || "—"}
- Résumé : ${description || "—"}
- Mots-clés : ${keywords || "—"}

Propose 3 classifications Dewey.`

            const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: buildSystemPrompt(catalog) }] },
                    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
                    generationConfig: { temperature: 0.4, maxOutputTokens: 700 },
                }),
            })

            if (!response.ok) {
                const body = await response.text()
                console.error("Erreur Gemini:", body)
                return NextResponse.json({ error: "Erreur du service de suggestion." }, { status: 500 })
            }

            const data = await response.json()
            const text = (data?.candidates?.[0]?.content?.parts?.[0]?.text || "") as string

            // Extrait le JSON (l'IA peut entourer d'un bloc ```json)
            const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/\{[\s\S]*\}/)
            const raw = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text

            let parsed: { propositions?: Suggestion[] }
            try {
                parsed = JSON.parse(raw)
            } catch {
                return NextResponse.json({ error: "Réponse IA invalide." }, { status: 502 })
            }

            const validCodes = new Set(rows.map((r) => r.code))
            const suggestions = (parsed.propositions || [])
                .filter((s) => validCodes.has(s.code))
                .map((s) => ({
                    code: s.code,
                    libelle: byCode.get(s.code)?.libelle ?? s.code,
                    confidence: Math.max(0, Math.min(100, s.confidence || 0)),
                    justification: s.justification || "",
                    path: pathOf(s.code),
                }))
                .slice(0, 3)

            return NextResponse.json({ suggestions })
        } catch (error) {
            console.error("Erreur /api/dewey-suggest:", error)
            return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
        }
    }
