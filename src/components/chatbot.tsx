    "use client"

    import { useState, useRef, useEffect, useCallback } from "react"
    import { MessageCircle, X, Send, Bot, User, Sparkles } from "lucide-react"
    import { Button } from "@/components/ui/button"
    import { Input } from "@/components/ui/input"
    import { createClient } from "@/lib/supabase/client"

    interface Message {
    id: string
    role: "user" | "bot"
    content: string
    timestamp: Date
    }

    type DbConversationRole = "user" | "assistant" | "system"

    interface ChatbotProps {
    memberName?: string
    memberId?: string
    }

    export function ChatbotWidget({ memberName, memberId }: ChatbotProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [isTyping, setIsTyping] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()

    const createWelcomeMessage = useCallback(
        () => ({
        id: "welcome",
        role: "bot" as const,
        content: `Bonjour ${memberName || ""} ! Je suis Biblius, votre assistant de bibliothèque. Comment puis-je vous aider ?\n\nJe peux vous renseigner sur :\n• Vos emprunts en cours\n• Vos pénalités\n• Le catalogue\n• Les horaires`,
        timestamp: new Date(),
        }),
        [memberName],
    )

    const persistMessage = useCallback(
        async (role: Message["role"], content: string) => {
        if (!memberId) return

        const dbRole: DbConversationRole = role === "user" ? "user" : "assistant"

        const { error } = await supabase.from("ai_conversations").insert({
            member_id: memberId,
            role: dbRole,
            content,
        })

        if (error) {
            console.error("Erreur sauvegarde conversation IA:", error)
        }
        },
        [memberId, supabase],
    )

    useEffect(() => {
        if (!isOpen) return

        let isCancelled = false

        const loadConversation = async () => {
        if (!memberId) {
            if (!isCancelled) {
            setMessages([createWelcomeMessage()])
            }
            return
        }

        const { data, error } = await supabase
            .from("ai_conversations")
            .select("id, member_id, role, content, created_at")
            .eq("member_id", memberId)
            .order("created_at", { ascending: true })
            .limit(10)

        if (error) {
            console.error("Erreur chargement conversation IA:", error)
            if (!isCancelled) {
            setMessages([createWelcomeMessage()])
            }
            return
        }

        if (!data || data.length === 0) {
            if (!isCancelled) {
            setMessages([createWelcomeMessage()])
            }
            return
        }

        const history = data.map((row) => ({
            id: String(row.id),
            role: row.role === "user" ? "user" : "bot",
            content: String(row.content),
            timestamp: new Date(row.created_at),
        })) as Message[]

        if (!isCancelled) {
            setMessages(history)
        }
        }

        void loadConversation()

        return () => {
        isCancelled = true
        }
    }, [createWelcomeMessage, isOpen, memberId, supabase])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    const callGemini = async (userMessage: string): Promise<string | null> => {
        try {
        const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
            message: userMessage,
            history: messages.slice(-8),
            memberName,
            }),
        })

        if (!res.ok) return null

        const data = await res.json()
        return data.reply || null
        } catch {
        return null
        }
    }

    const getBotResponse = async (userMessage: string): Promise<string> => {
        const msg = userMessage.toLowerCase().trim()

        if (msg.includes("emprunt") || msg.includes("prêt")) {
        const { data: loans } = await supabase
            .from("prets")
            .select("due_date, documents (title, auteurs (name))")
            .eq("member_id", memberId)
            .in("status", ["active", "overdue"])

        if (!loans || loans.length === 0) {
            return "Vous n'avez aucun emprunt en cours. Souhaitez-vous parcourir le catalogue ? 📚"
        }

        const today = new Date()
        const overdue = loans.filter((l) => new Date(l.due_date) < today)

        let response = `Vous avez **${loans.length} emprunt(s)** en cours :\n\n`
        loans.slice(0, 3).forEach((loan) => {
            const doc = loan.documents as unknown as { title: string; auteurs?: { name: string }[] | null } | null
            const auteur = doc?.auteurs?.[0]?.name || "Auteur inconnu"
            const date = new Date(loan.due_date).toLocaleDateString("fr-FR")
            const isLate = new Date(loan.due_date) < today
            response += `• **${doc?.title || "Inconnu"}** (${auteur})\n  Retour : ${date}${isLate ? " ⚠️ En retard !" : ""}\n\n`
        })

        if (overdue.length > 0) {
            response += `${overdue.length} livre(s) en retard. Merci de les rapporter vite !`
        }
        return response
        }

        if (msg.includes("pénalité") || msg.includes("amende")) {
        const { data: penalties } = await supabase
            .from("penalites")
            .select("amount, reason")
            .eq("member_id", memberId)
            .eq("status", "unpaid")

        if (!penalties || penalties.length === 0) {
            return "Bonne nouvelle ! Vous n'avez aucune pénalité en cours."
        }

        const total = penalties.reduce((sum, p) => sum + (p.amount || 0), 0)
        return `Vous devez **${total.toLocaleString()} FCFA** (${penalties.length} pénalité(s)). Réglez à l'accueil de la bibliothèque.`
        }

        const geminiReply = await callGemini(userMessage)
        if (geminiReply) return geminiReply

        if (msg.includes("horaire") || msg.includes("ouvert")) {
        return "Horaires : Lun-Ven 8h-20h, Sam 9h-18h, Dim fermé."
        }
        if (msg.match(/^(bonjour|salut|hello)/)) {
        return `Bonjour ${memberName} ! Comment puis-je vous aider ?`
        }
        return "Je n'ai pas compris. Essayez « Mes emprunts », « Mes pénalités » ou posez votre question autrement !"
    }

    const handleSend = async () => {
        if (!input.trim()) return

        const currentInput = input.trim()
        const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: currentInput,
        timestamp: new Date(),
        }

        setMessages((prev) => [...prev, userMessage])
        setInput("")
        setIsTyping(true)

        if (memberId) {
        await persistMessage("user", currentInput)
        }

        await new Promise((r) => setTimeout(r, 600))

        const botResponse = await getBotResponse(currentInput)
        const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        content: botResponse,
        timestamp: new Date(),
        }

        setMessages((prev) => [...prev, botMessage])

        if (memberId) {
        await persistMessage("bot", botResponse)
        }

        setIsTyping(false)
    }

    const handleQuickSuggestion = (suggestion: string) => {
        setInput(suggestion)
        setTimeout(() => {
        const sendBtn = document.querySelector('button[aria-label="Envoyer"]') as HTMLButtonElement
        sendBtn?.click()
        }, 50)
    }

    return (
        <>
        <button
            onClick={() => setIsOpen(!isOpen)}
            className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center group"
            aria-label="Ouvrir le chatbot"
        >
            {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
            {!isOpen && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
            )}
        </button>

        {isOpen && (
            <div className="fixed bottom-24 right-6 z-50 w-[calc(100vw-3rem)] sm:w-96 h-[600px] max-h-[calc(100vh-8rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Bot className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                <h3 className="font-semibold text-white">Biblius</h3>
                <p className="text-xs text-white/80 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Assistant IA
                </p>
                </div>
                <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white"
                aria-label="Fermer"
                >
                <X className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                <div
                    key={msg.id}
                    className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                    {msg.role === "bot" && (
                    <div className="w-8 h-8 bg-amber-100 dark:bg-amber-500/20 rounded-full flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    )}
                    <div
                    className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                        msg.role === "user"
                        ? "bg-amber-500 text-white rounded-br-sm"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-sm"
                    }`}
                    >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p className={`text-xs mt-1 ${msg.role === "user" ? "text-white/70" : "text-slate-500"}`}>
                        {msg.timestamp.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    </div>
                    {msg.role === "user" && (
                    <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                    </div>
                    )}
                </div>
                ))}

                {isTyping && (
                <div className="flex gap-2 justify-start">
                    <div className="w-8 h-8 bg-amber-100 dark:bg-amber-500/20 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-bl-sm">
                    <div className="flex gap-1">
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    </div>
                </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {messages.length <= 1 && (
                <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
                {['Mes emprunts', 'Mes pénalités', 'Horaires', 'Aide'].map((s) => (
                    <button
                    key={s}
                    onClick={() => handleQuickSuggestion(s)}
                    className="px-3 py-1 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full whitespace-nowrap text-slate-700 dark:text-slate-300"
                    >
                    {s}
                    </button>
                ))}
                </div>
            )}

            <div className="p-3 border-t border-slate-200 dark:border-slate-800">
                <div className="flex gap-2">
                <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    placeholder="Écrivez votre message..."
                    className="flex-1"
                    disabled={isTyping}
                />
                <Button
                    onClick={handleSend}
                    disabled={!input.trim() || isTyping}
                    className="bg-amber-500 hover:bg-amber-600"
                    size="icon"
                    aria-label="Envoyer"
                >
                    <Send className="w-4 h-4" />
                </Button>
                </div>
            </div>
            </div>
        )}
        </>
    )
    }
