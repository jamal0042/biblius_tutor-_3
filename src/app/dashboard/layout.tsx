    import { redirect } from "next/navigation"
    import Link from "next/link"
    import { BookOpen, LayoutDashboard, Clock, BookMarked, User, Menu } from "lucide-react"
    import { getCurrentMember } from "@/lib/supabase/server"
    import { ROLE_LABELS, isStaff } from "@/lib/roles"
    import { ThemeToggle } from "@/components/theme-toggle"
    import { Button } from "@/components/ui/button"
    import { Logo } from "@/components/logo"
    import { LogoutButton } from "@/components/dashboard/logout-button"

    export default async function DashboardLayout({
    children,
    }: {
    children: React.ReactNode
    }) {
    // 1. Vérification de l'authentification côté serveur
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

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300">
        
        {/* ============================================================
            BARRE LATÉRALE (SIDEBAR) - Visible sur grand écran
            ============================================================ */}
        <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 fixed h-full">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <Logo showSubtitle={false} />
            </div>
        
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <SidebarLink href="/dashboard" icon={LayoutDashboard} label="Tableau de bord" />
            <SidebarLink href="/catalogue" icon={BookOpen} label="Catalogue" />
            <SidebarLink href="/dashboard/emprunts" icon={Clock} label="Mes Emprunts" />
            <SidebarLink href="/dashboard/numerique" icon={BookMarked} label="Ressources Numériques" />
            
            {/* Section Admin visible uniquement pour le personnel */}
            {isStaff(member.role) && (
                <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
                <p className="px-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Administration
                </p>
                <SidebarLink href="/admin" icon={User} label="Gestion" />
                </div>
            )}
            </nav>

            {/* Profil utilisateur en bas de sidebar */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {member.first_name} {member.last_name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {ROLE_LABELS[member.role]}
                </p>
                </div>
            </div>
            <LogoutButton />
            </div>
        </aside>

        {/* ============================================================
            CONTENU PRINCIPAL
            ============================================================ */}
        <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
            
            {/* En-tête mobile/desktop */}
            <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-40">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="w-5 h-5" />
                </Button>
                <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
                Espace Membre
                </h1>
            </div>
            <div className="flex items-center gap-4">
                <ThemeToggle />
            </div>
            </header>

            {/* Zone de contenu des pages enfants */}
            <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
            {children}
            </main>
            
        </div>
        </div>
    )
    }

    // Composant utilitaire pour les liens du menu
    function SidebarLink({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
    return (
        <Link 
        href={href}
        className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-amber-600 dark:hover:text-amber-500 transition-colors"
        >
        <Icon className="w-5 h-5" />
        {label}
        </Link>
    )
    }