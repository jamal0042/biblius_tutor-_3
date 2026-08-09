    import { redirect } from "next/navigation"
    import Link from "next/link"
    import { 
    LayoutDashboard, 
    User, 
    Menu, 
    UserCheck, 
    Users, 
    BookOpen, 
    Settings, 
    TrendingUp, 
    AlertCircle, 
    UserPlus, 
    FileText 
    } from "lucide-react"
    import { getCurrentMember } from "@/lib/supabase/server"
    import { ROLE_LABELS, isStaff } from "@/lib/roles"
    import { ThemeToggle } from "@/components/theme-toggle"
    import { Button } from "@/components/ui/button"
    import { Logo } from "@/components/logo"
    import { LogoutButton } from "@/components/dashboard/logout-button"

    export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const member = await getCurrentMember()

    if (!member || !isStaff(member.role)) {
        redirect("/dashboard")
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300">
        <aside className="hidden lg:flex w-72 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 fixed h-full">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <Logo showSubtitle={false} />
            <div className="mt-2 px-2">
                <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">Administration</span>
            </div>
            </div>
            
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <SidebarLink href="/admin" icon={LayoutDashboard} label="Tableau de bord" />
            <SidebarLink href="/admin/membres/demandes" icon={UserCheck} label="Demandes d'inscription" />
            <SidebarLink href="/admin/membres/online" icon={Users} label="Tous les membres" />
            <SidebarLink href="/admin/membres/invitations" icon={UserPlus} label="Invitations" />
            <SidebarLink href="/admin/books" icon={BookOpen} label="Gestion des livres" />
            <SidebarLink href="/admin/circulation" icon={TrendingUp} label="Circulation" />
            <SidebarLink href="/admin/penalites" icon={AlertCircle} label="Pénalités" />
            <SidebarLink href="/admin/numerique" icon={FileText} label="Ressources Numériques" />
            <SidebarLink href="/admin/systeme" icon={Settings} label="Paramètres" />
            </nav>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{member.first_name} {member.last_name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{ROLE_LABELS[member.role] || member.role}</p>
                </div>
            </div>
            <LogoutButton />
            </div>
        </aside>

        <div className="flex-1 lg:ml-72 flex flex-col min-h-screen">
            <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-40">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="lg:hidden"><Menu className="w-5 h-5" /></Button>
                <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Panneau d&apos;administration</h1>
            </div>
            <ThemeToggle />
            </header>
            <main className="flex-1 p-6 lg:p-8 overflow-y-auto">{children}</main>
        </div>
        </div>
    )
    }

    function SidebarLink({ href, icon: Icon, label, badge }: { href: string; icon: React.ElementType; label: string; badge?: string }) {
    return (
        <Link href={href} className="flex items-center justify-between px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-amber-600 dark:hover:text-amber-500 transition-colors">
        <div className="flex items-center gap-3">
            <Icon className="w-5 h-5" />
            {label}
        </div>
        {badge && (
            <span className="px-2 py-0.5 text-xs font-semibold bg-amber-500 text-white rounded-full">{badge}</span>
        )}
        </Link>
    )
    }