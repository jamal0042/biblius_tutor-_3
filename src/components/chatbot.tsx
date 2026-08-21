    "use client"

    import { useState, useRef, useEffect } from "react"
    import Link from "next/link"
    import { MessageCircle, X, Send, Bot, User, Sparkles } from "lucide-react"
    import { Button } from "@/components/ui/button"
    import { Input } from "@/components/ui/input"

    interface Message {
    id: string
    role: "user" | "bot"
    content: string
    timestamp: Date
    }

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

    // Message de bienvenue
    useEffect(() => {
        if (isOpen && messages.length === 0) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMessages([
            {
            id: "welcome",
            role: "bot",
            content: `Bonjour ${memberName || ""} ! 👋 Je suis Biblius, votre assistant IA.\n\nJe peux :\n• 📚 Vous recommander des livres du catalogue\n• 🔍 Rechercher un titre ou un auteur\n• 📖 Vous donner vos emprunts et pénalités\n• ℹ️ Répondre à vos questions\n\nEssayez : « Recommande-moi un livre »`,
            timestamp: new Date(),
            },
        ])
        }
    }, [isOpen, messages.length, memberName])

    // Auto-scroll vers le bas
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages, isTyping])

    // 🌟 Convertit les liens markdown [texte](url) en liens cliquables
    const renderContent = (text: string) => {
        const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g)
        return parts.map((part, i) => {
        const match = part.match(/\[([^\]]+)\]\(([^)]+)\)/)
        if (match) {
            const [, label, url] = match
            if (url.startsWith("/")) {
            return (
                <Link
                key={i}
                href={url}
                className="text-amber-600 dark:text-amber-400 font-semibold underline underline-offset-2 hover:text-amber-700 dark:hover:text-amber-300 break-all"
                >
                {label}
                </Link>
            )
            }
            return (
            <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-600 dark:text-amber-400 underline break-all"
            >
                {label}
            </a>
            )
        }
        return <span key={i}>{part}</span>
        })
    }

    // 🤖 Tout passe par Gemini + Function Calling (recherche dans votre base)
    const getBotResponse = async (userMessage: string): Promise<string> => {
        try {
        const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
            message: userMessage,
            history: messages.slice(-8),
            memberName,
            memberId,
            }),
        })

        if (!res.ok) {
            return "Je suis temporairement indisponible. Réessayez dans un instant. 🙏"
        }

        const data = await res.json()
        return data.reply || "Je n'ai pas pu formuler de réponse."
        } catch {
        return "Une erreur de connexion est survenue. Vérifiez votre connexion internet."
        }
    }

    const handleSend = async () => {
        if (!input.trim()) return

        const currentInput = input
        const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: currentInput.trim(),
        timestamp: new Date(),
        }

        setMessages((prev) => [...prev, userMessage])
        setInput("")
        setIsTyping(true)

        // Petit délai de réflexion pour un rendu naturel
        await new Promise((r) => setTimeout(r, 500))

        const botResponse = await getBotResponse(currentInput)

        const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        content: botResponse,
        timestamp: new Date(),
        }

        setMessages((prev) => [...prev, botMessage])
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
        {/* Bouton flottant */}
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

        {/* Fenêtre du chatbot */}
        {isOpen && (
            <div className="fixed bottom-24 right-6 z-50 w-[calc(100vw-3rem)] sm:w-96 h-[600px] max-h-[calc(100vh-8rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
            {/* En-tête */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Bot className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                <h3 className="font-semibold text-white">Biblius</h3>
                <p className="text-xs text-white/80 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Assistant IA connecté au catalogue
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

            {/* Messages */}
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
                    <p className="text-sm whitespace-pre-wrap">{renderContent(msg.content)}</p>
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

            {/* Suggestions rapides */}
            {messages.length <= 1 && (
                <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
                {["Recommande-moi un livre", "Mes emprunts", "Mes pénalités", "Horaires"].map((s) => (
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

            {/* Input */}
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