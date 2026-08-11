    "use client"

    import { useState } from "react"
    import { useRouter } from "next/navigation"
    import { createClient } from "@/lib/supabase/client"
    import { BookOpen, Clock, AlertCircle } from "lucide-react"
    import { Button } from "@/components/ui/button"
    import { BorrowModal } from "@/components/catalogue/borrow-modal"

    interface BookActionsProps {
    bookId: string
    bookTitle: string
    bookType: string
    isAvailable: boolean
    }

    export default function BookActions({ bookId, bookTitle, bookType, isAvailable }: BookActionsProps) {
    const router = useRouter()
    const supabase = createClient()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)
    const [message, setMessage] = useState<{ type: "error"; text: string } | null>(null)

    const handleBorrowClick = async () => {
        setMessage(null)
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
        setMessage({ type: "error", text: "Veuillez vous connecter pour emprunter un livre." })
        setTimeout(() => router.push("/login"), 2000)
        return
        }

        const { data: member } = await supabase.from("members").select("status").eq("id", user.id).single()
        if (member?.status !== "active") {
        setMessage({ type: "error", text: "Votre compte n'est pas actif ou est en attente de validation." })
        return
        }

        setUserId(user.id)
        setIsModalOpen(true)
    }

    return (
        <>
        <div className="space-y-3">
            {message && (
            <div className="p-3 rounded-lg text-sm flex items-center gap-2 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {message.text}
            </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
                size="lg" 
                onClick={handleBorrowClick}
                disabled={!isAvailable}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isAvailable ? (
                <>
                    <BookOpen className="w-5 h-5 mr-2" />
                    Demander l&apos;emprunt
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

        {userId && (
            <BorrowModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            bookId={bookId}
            bookTitle={bookTitle}
            bookType={bookType}
            userId={userId}
            />
        )}
        </>
    )
    }