    "use client"

    import { useState } from "react"
    import { useRouter } from "next/navigation"
    import { createClient } from "@/lib/supabase/client"
    import { BookOpen, Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
    import { Button } from "@/components/ui/button"

    interface BookActionsProps {
    bookId: string
    isAvailable: boolean
    }

    export default function BookActions({ bookId, isAvailable }: BookActionsProps) {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

    const handleBorrow = async () => {
        setLoading(true)
        setMessage(null)

        try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
            setMessage({ type: "error", text: "Vous devez être connecté pour emprunter un livre." })
            setTimeout(() => router.push("/login"), 2000)
            return
        }

        const { data: member } = await supabase
            .from("members")
            .select("status, max_loans_duration")
            .eq("id", user.id)
            .single()

        if (member?.status !== "active") {
            setMessage({ type: "error", text: "Votre compte n'est pas actif ou est en attente de validation." })
            setLoading(false)
            return
        }

        const dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + (member?.max_loans_duration || 15))

        const { error: pretError } = await supabase.from("prets").insert({
            member_id: user.id,
            document_id: bookId,
            loan_date: new Date().toISOString().split("T")[0],
            due_date: dueDate.toISOString().split("T")[0],
            status: "active"
        })

        if (pretError) throw pretError

        setMessage({ type: "success", text: "Livre emprunté avec succès ! Redirection..." })
        setTimeout(() => {
            router.push("/dashboard/emprunts")
        }, 2000)

        } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Une erreur est survenue."
        setMessage({ type: "error", text: errorMessage })
        } finally {
        setLoading(false)
        }
    }

    return (
        <div className="space-y-3">
        {message && (
            <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
            message.type === "success" 
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20" 
                : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20"
            }`}>
            {message.type === "success" ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            {message.text}
            </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
            size="lg" 
            onClick={handleBorrow}
            disabled={loading || !isAvailable}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
            {loading ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : isAvailable ? (
                <>
                <BookOpen className="w-5 h-5 mr-2" />
                Emprunter ce livre
                </>
            ) : (
                <>
                <Clock className="w-5 h-5 mr-2" />
                Ajouter à la liste d&apos;attente
                </>
            )}
            </Button>
        </div>
        </div>
    )
    }