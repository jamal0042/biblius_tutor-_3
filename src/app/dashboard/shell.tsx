    "use client"

    import { useState } from "react"
    import { usePathname } from "next/navigation"
    import Link from "next/link"
    import {
    LayoutDashboard,
    BookOpen,
    Clock,
    BookMarked,
    FileText,
    UserRound,
    Settings,
    LogOut,
    Menu,
    Library,
    } from "lucide-react"
    import { Button } from "@/components/ui/button"
    import { ThemeToggle } from "@/components/theme-toggle"
    import { NotificationBell } from "@/components/dashboard/notification-bell"
    import { ROLE_LABELS, type Role } from "@/lib/roles"

    /* ---------- Navigation principale ---------- */
    const NAV_ITEMS = [
    { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
    { href: "/catalogue", label: "Catalogue", icon: BookOpen, exact: false },
    { href: "/dashboard/emprunts", label: "Mes Emprunts", icon: Clock, exact: false },
    { href: "/dashboard/numerique", label: "Ressources Numériques", icon: BookMarked, exact: false },
    { href: "/dashboard/rapports", label: "Mes Rapports", icon: FileText, exact: false },
    ]

    const ACCOUNT_ITEMS = [
    { href: "/dashboard/profil", label: "Mon Profil", icon: UserRound },
    { href: "/dashboard/parametres", label: "Paramètres", icon: Settings },
    ]

    /* ---------- Titres de page ---------- */
    const PAGE_TITLES: { prefix: string; label: string }[] = [
    { prefix: "/dashboard/emprunts", label: "Mes Emprunts" },
    { prefix: "/dashboard/numerique", label: "Ressources Numériques" },
    { prefix: "/dashboard/rapports", label: "Mes Rapports" },
    { prefix: "/dashboard/profil", label: "Mon Profil" },
    { prefix: "/dashboard/parametres", label: "Paramètres" },
    { prefix: "/catalogue", label: "Catalogue" },
    { prefix: "/dashboard", label: "Tableau de bord" },
    ]

    interface DashboardShellProps {
    role: Role
    firstName: string | null
    children: React.ReactNode
    }

    export function DashboardShell({ role, firstName, children }: DashboardShellProps) {
    const pathname = usePathname()
    const [mobileOpen, setMobileOpen] = useState(false)

    const isActive = (href: string, exact?: boolean) =>
        exact ? pathname === href : pathname.startsWith(href)

    const pageTitle =
        PAGE_TITLES.find((t) => pathname.startsWith(t.prefix))?.label ?? "Biblius"

    /* ---------- Contenu de la sidebar (identique desktop & mobile) ---------- */
    const sidebarContent = (
        <>
        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-5 dark:border-slate-800">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15">
            <Library className="h-6 w-6 text-amber-500" />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white">Biblius</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href, item.exact)
            return (
                <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                    ? "bg-amber-500/15 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                }`}
                >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {active && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                </Link>
            )
            })}

            <div className="my-3 border-t border-slate-200 dark:border-slate-800" />

            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Mon compte
            </p>

            {ACCOUNT_ITEMS.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
                <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                    ? "bg-amber-500/15 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                }`}
                >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {active && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                </Link>
            )
            })}
        </nav>

        {/* Pied de sidebar : rôle + déconnexion */}
        <div className="space-y-2 border-t border-slate-200 px-3 py-4 dark:border-slate-800">
            <div
            className="flex items-center gap-3 rounded-lg px-3 py-2"
            title={firstName || undefined}
            >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/15">
                <UserRound className="h-4 w-4 text-amber-500" />
            </div>
            <span className="truncate text-sm text-slate-600 dark:text-slate-300">
                {ROLE_LABELS[role] || role}
            </span>
            </div>

            <Link
            href="/logout"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
            >
            <LogOut className="h-5 w-5 shrink-0" />
            Déconnexion
            </Link>
        </div>
        </>
    )

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        {/* ---------- Sidebar desktop ---------- */}
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:flex">
            {sidebarContent}
        </aside>

        {/* ---------- Sidebar mobile ---------- */}
        {mobileOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
            <div
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                onClick={() => setMobileOpen(false)}
            />
            <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                {sidebarContent}
            </aside>
            </div>
        )}

        {/* ---------- Zone principale ---------- */}
        <div className="lg:pl-64">
            {/* Barre du haut : titre + cloche + thème */}
            <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
                <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Ouvrir le menu"
                >
                <Menu className="h-5 w-5" />
                </Button>
                <h1 className="truncate text-lg font-bold text-slate-900 dark:text-white">
                {pageTitle}
                </h1>
            </div>

            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                <NotificationBell />
                <ThemeToggle />
            </div>
            </header>

            {/* Contenu des pages */}
            <main className="p-4 sm:p-6">{children}</main>
        </div>
        </div>
    )
    }