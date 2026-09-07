    import { getCurrentMember } from "@/lib/supabase/server"
    import { redirect } from "next/navigation"
    import Link from "next/link"
    import { Button } from "@/components/ui/button"
    import {
    LayoutDashboard,
    BookOpen,
    FileText,
    BookMarked,
    History,
    FileDown,
    LogOut,
    Library,
    Sparkles,
    } from "lucide-react"
    import { ThemeToggle } from "@/components/theme-toggle"
    import { NotificationBell } from "@/components/dashboard/notification-bell"

    const NAV_LINKS = [
    { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { href: "/dashboard/emprunts", label: "Mes emprunts", icon: History },
    { href: "/dashboard/reservations", label: "Mes réservations", icon: BookMarked },
    { href: "/dashboard/numerique", label: "Ressources numériques", icon: FileText },
    { href: "/dashboard/rapports", label: "Mes rapports", icon: FileDown },
    { href: "/catalogue", label: "Catalogue", icon: Library },
    ]

    export default async function DashboardLayout({
    children,
    }: {
    children: React.ReactNode
    }) {
    const member = await getCurrentMember()
    if (!member) redirect("/login")

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link href="/dashboard" className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 shadow-sm">
                <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                Biblius
                </span>
            </Link>

            <div className="flex items-center gap-1 sm:gap-2">
                <NotificationBell />
                <ThemeToggle />
                <Link href="/logout">
                <Button variant="ghost" size="icon" aria-label="Déconnexion">
                    <LogOut className="h-5 w-5" />
                </Button>
                </Link>
            </div>
            </div>
        </header>

        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:px-8">
            {/* Navigation latérale (desktop) */}
            <aside className="hidden lg:block lg:w-64 shrink-0">
            <nav className="sticky top-20 space-y-1">
                {NAV_LINKS.map((link) => {
                const Icon = link.icon
                return (
                    <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                    >
                    <Icon className="h-4 w-4" />
                    {link.label}
                    </Link>
                )
                })}
                <div className="my-2 border-t border-slate-200 dark:border-slate-800" />
                <Link
                href="/catalogue"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-amber-600 transition-colors hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30"
                >
                <BookOpen className="h-4 w-4" />
                Explorer le catalogue
                </Link>
            </nav>
            </aside>

            {/* Contenu principal */}
            <main className="flex-1 min-w-0">{children}</main>
        </div>
        </div>
    )
    }