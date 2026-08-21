    import { getCurrentMember } from "@/lib/supabase/server"
        import { DashboardShell } from "@/components/dashboard/dashboard-shell"
        import { redirect } from "next/navigation"

    export default async function CatalogueLayout({
    children,
    }: {
    children: React.ReactNode
    }) {
    const member = await getCurrentMember()

    // Si l'utilisateur n'est pas connecté, on le redirige vers le login
    // (Vous pouvez retirer cette ligne si vous voulez un catalogue public)
    if (!member) redirect("/login")

    return <DashboardShell member={member}>{children}</DashboardShell>
    }