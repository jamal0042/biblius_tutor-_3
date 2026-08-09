    "use client"

    import { Trash2 } from "lucide-react"
    import { Button } from "@/components/ui/button"
    import { createClient } from "@/lib/supabase/client"

    export function DeleteBookButton({ bookId, bookTitle }: { bookId: string; bookTitle: string }) {
    const handleDelete = async () => {
        if (!confirm(`Voulez-vous vraiment supprimer "${bookTitle}" ?`)) return
        
        const supabase = createClient()
        const { error } = await supabase.from("documents").delete().eq("id", bookId)
        
        if (error) {
        alert("Erreur lors de la suppression")
        } else {
        window.location.reload()
        }
    }

    return (
        <Button 
        size="icon" 
        variant="destructive" 
        onClick={handleDelete}
        className="w-8 h-8 bg-red-500 hover:bg-red-600"
        >
        <Trash2 className="w-4 h-4" />
        </Button>
    )
    }