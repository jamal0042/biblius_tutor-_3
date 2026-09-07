    import { redirect } from "next/navigation"
    import { getCurrentMember } from "@/lib/supabase/server"
    import { DashboardShell } from "@/components/dashboard/shell"
    import type { Role } from "@/lib/roles"

    export default async function DashboardLayout({
    children,
    }: {
    children: React.ReactNode
    }) {
    const member = await getCurrentMember()
    if (!member) redirect("/login")

    return (
        <DashboardShell role={member.role as Role} firstName={member.first_name}>
        {children}
        </DashboardShell>
    )
    }