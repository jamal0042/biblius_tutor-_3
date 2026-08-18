    import { NextResponse } from "next/server"

    // 🌟 Modèle mis à jour vers gemini-2.5-flash (confirmé valide)
    const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"

    export async function POST(req: Request) {
    const apiKey = process.env.GEMINI_API_KEY
    console.log("🔑 Clé Gemini chargée:", apiKey ? `OK (${apiKey.substring(0, 8)}...)` : "❌ MANQUANTE")
    
    if (!apiKey) {
        return NextResponse.json(
        { error: "Clé API Gemini manquante. Vérifiez votre fichier .env.local" },
        { status: 500 }
        )
    }

    try {
        const { message, history, memberName } = await req.json()

        const systemPrompt = `Tu es "Biblius", l'assistant IA intelligent de la bibliothèque universitaire Biblius.
    Ton rôle : aider les étudiants et membres de la bibliothèque.

    Règles :
    - Réponds TOUJOURS en français.
    - Sois chaleureux, concis et utile (2-5 phrases maximum sauf si on demande une liste).
    - Tu connais la bibliothèque : horaires (Lun-Ven 8h-20h, Sam 9h-18h, Dim fermé), services (emprunts 15 jours, 5 livres max, réservations, ressources numériques).
    - Si on te demande des données PERSONNELLES précises (mes emprunts, mes pénalités), dis que tu vas les afficher dans le tableau de bord.
    - Utilise des emojis avec modération. 📚

    L'utilisateur qui te parle s'appelle : ${memberName || "un membre"}.`

        const contents = [
        ...(history || [])
            .slice(-8)
            .map((m: { role: string; content: string }) => ({
            role: m.role === "bot" ? "model" : "user",
            parts: [{ text: m.content }],
            })),
        { role: "user", parts: [{ text: message }] },
        ]

        const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents,
            generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
            },
        }),
        })

        if (!response.ok) {
        const errText = await response.text()
        console.error("❌ Erreur Gemini:", response.status, errText)
        return NextResponse.json(
            { error: `Erreur Gemini: ${response.status}` },
            { status: response.status }
        )
        }

        const data = await response.json()
        const reply =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Je n'ai pas pu générer de réponse. Réessayez."

        return NextResponse.json({ reply })
    } catch (error) {
        console.error("Erreur API chat:", error)
        return NextResponse.json(
        { error: "Erreur interne du serveur de chat" },
        { status: 500 }
        )
    }
    }