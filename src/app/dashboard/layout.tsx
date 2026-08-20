    import { redirect } from "next/navigation"
    import { getCurrentMember } from "@/lib/supabase/server"
    import { DashboardShell } from "@/components/dashboard/dashboard-shell"

    export default async function DashboardLayout({
    children,
    }: {
    children: React.ReactNode
    }) {
    const member = await getCurrentMember()

    if (!member) {
        redirect("/login")
    }

    if (member.status === "pending") {
        redirect("/pending")
    }

    if (member.status === "suspended" || member.status === "inactive") {
        redirect("/login?error=account_disabled")
    }

    return <DashboardShell member={member}>{children}</DashboardShell>
    }