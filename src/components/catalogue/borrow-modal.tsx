    "use client"

    import { useState } from "react"
    import { useRouter } from "next/navigation"
    import { createClient } from "@/lib/supabase/client"
    import { BookOpen, CheckCircle, AlertCircle, Loader2, Calendar } from "lucide-react"
    import { Button } from "@/components/ui/button"
    import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    } from "@/components/ui/dialog"

    interface BorrowModalProps {
    isOpen: boolean
    onClose: () => void
    bookId: string
    bookTitle: string
    bookType: string
    userId: string
    }

    export function BorrowModal({ isOpen, onClose, bookId, bookTitle, bookType, userId }: BorrowModalProps) {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [dueDate, setDueDate] = useState<string>("")
    const [isRestricted, setIsRestricted] = useState(false)

    // Calculer la date de retour dès l'ouverture de la modale
    useState(() => {
        if (isOpen) {
        const today = new Date()
        let daysToAdd = 15 // Par défaut

        // RÈGLE MÉTIER : TFC et Projets tutorés = 1 jour max
        if (bookType === "projet_tutore" || bookType === "thesis") {
            daysToAdd = 1
            setIsRestricted(true)
        }

        const returnDate = new Date(today)
        returnDate.setDate(today.getDate() + daysToAdd)
        setDueDate(returnDate.toLocaleDateString("fr-FR", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))
        }
    })

    const handleConfirm = async () => {
        setLoading(true)
        try {
        const todayStr = new Date().toISOString().split("T")[0]
        const dueDateStr = new Date(new Date().setDate(new Date().getDate() + (isRestricted ? 1 : 15))).toISOString().split("T")[0]

        const { error } = await supabase.from("prets").insert({
            member_id: userId,
            document_id: bookId,
            loan_date: todayStr,
            due_date: dueDateStr,
            status: "active"
        })

        if (error) throw error

        onClose()
        router.push("/dashboard/emprunts")
        router.refresh()
        } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Erreur lors de l'emprunt."
        alert(errorMessage)
        setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                <BookOpen className="w-5 h-5 text-amber-500" />
                Confirmer l&apos;emprunt
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400 pt-2">
                Vous êtes sur le point d&apos;emprunter : <br />
                <span className="font-semibold text-slate-900 dark:text-white">&quot;{bookTitle}&quot;</span>
            </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
            {isRestricted ? (
                <div className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">Document à consultation restreinte</p>
                    <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                    Ce type de document (TFC / Projet tutoré) ne peut être emprunté que pour <strong>1 jour</strong> maximum.
                    </p>
                </div>
                </div>
            ) : (
                <div className="p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg flex gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-500 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800 dark:text-blue-400">
                    Durée d&apos;emprunt standard appliquée selon votre profil.
                </p>
                </div>
            )}

            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <Calendar className="w-5 h-5 text-slate-500" />
                <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Date de retour prévue</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white capitalize">{dueDate}</p>
                </div>
            </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={onClose} disabled={loading}>
                Annuler
            </Button>
            <Button onClick={handleConfirm} disabled={loading} className="bg-amber-500 hover:bg-amber-600 text-white">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Confirmer l&apos;emprunt
            </Button>
            </DialogFooter>
        </DialogContent>
        </Dialog>
    )
    }