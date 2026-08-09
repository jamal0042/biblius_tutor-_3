    "use client"

    import { useState } from "react"
    import { createClient } from "@/lib/supabase/client"
    import { Trash2, Loader2, AlertTriangle } from "lucide-react"
    import { Button } from "@/components/ui/button"
    import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
    } from "@/components/ui/alert-dialog"

    interface DeleteBookButtonProps {
    bookId: string
    bookTitle: string
    onSuccess?: () => void
    }

    export function DeleteBookButton({ bookId, bookTitle, onSuccess }: DeleteBookButtonProps) {
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)

    const handleDelete = async () => {
        setLoading(true)
        try {
        const { error } = await supabase
            .from("documents")
            .delete()
            .eq("id", bookId)

        if (error) throw error

        setOpen(false)
        if (onSuccess) onSuccess()
        else window.location.reload()
        } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Erreur lors de la suppression."
        alert(errorMessage)
        setLoading(false)
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
            <Button
            size="icon"
            variant="ghost"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
            title="Supprimer ce livre"
            >
            <Trash2 className="w-4 h-4" />
            </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertTriangle className="w-5 h-5" />
                Confirmer la suppression
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
                Êtes-vous sûr de vouloir supprimer le livre{" "}
                <strong className="text-slate-900 dark:text-white">&quot;{bookTitle}&quot;</strong> ?
                Cette action est irréversible.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700">
                Annuler
            </AlertDialogCancel>
            <AlertDialogAction
                onClick={handleDelete}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white"
            >
                {loading ? (
                <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Suppression...
                </>
                ) : (
                <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Oui, supprimer
                </>
                )}
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
        </AlertDialog>
    )
    }