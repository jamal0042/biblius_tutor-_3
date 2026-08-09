    import { getCurrentMember } from "@/lib/supabase/server"
    import { isStaff, ROLE_LABELS } from "@/lib/roles"
    import { Logo } from "@/components/logo"
    import { ThemeToggle } from "@/components/theme-toggle"
    import { Button } from "@/components/ui/button"
    import { LogoutButton } from "@/components/dashboard/logout-button"
    import { BookOpen, LayoutDashboard, Clock, BookMarked, User, Menu } from "lucide-react"
    import Link from "next/link"
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

    const isAdmin = isStaff(member.role)

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300">
        
        {/* SIDEBAR STABLE (Même largeur que le dashboard pour éviter les sauts) */}
        <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 fixed h-full z-30">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <Logo showSubtitle={false} />
            </div>
            
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <SidebarLink href="/dashboard" icon={LayoutDashboard} label="Tableau de bord" />
            <SidebarLink href="/catalogue" icon={BookOpen} label="Catalogue" active />
            <SidebarLink href="/dashboard/emprunts" icon={Clock} label="Mes Emprunts" />
            <SidebarLink href="/dashboard/numerique" icon={BookMarked} label="Ressources Numériques" />
            
            {isAdmin && (
                <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
                <p className="px-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Administration
                </p>
                <SidebarLink href="/admin" icon={User} label="Panneau Admin" />
                </div>
            )}
            </nav>

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

        {/* CONTENU PRINCIPAL */}
        <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
            {/* Petit header interne simple pour le thème et le menu mobile */}
            <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-20 lg:hidden">
            <Button variant="ghost" size="icon"><Menu className="w-5 h-5" /></Button>
            <ThemeToggle />
            </header>
            
            {/* C'est ici que s'affichera la page.tsx ou [id]/page.tsx */}
            <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
            {children}
            </main>
        </div>
        </div>
    )
    }

    function SidebarLink({ href, icon: Icon, label, active = false }: { href: string; icon: React.ElementType; label: string; active?: boolean }) {
    return (
        <Link 
        href={href}
        className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            active 
            ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500" 
            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        }`}
        >
        <Icon className="w-5 h-5" />
        {label}
        </Link>
    )
    }