    "use client"

    import { useState } from "react"
    import Link from "next/link"
    import { usePathname } from "next/navigation"
    import {
    BookOpen,
    LayoutDashboard,
    Clock,
    BookMarked,
    User,
    Menu,
    FileBarChart,
    Settings,
    UserCircle,
    X,
    } from "lucide-react"
    import type { Member } from "@/lib/roles"
    import { ROLE_LABELS, isStaff } from "@/lib/roles"
    import { ThemeToggle } from "@/components/theme-toggle"
    import { Button } from "@/components/ui/button"
    import { Logo } from "@/components/logo"
    import { LogoutButton } from "@/components/dashboard/logout-button"

    // ============================================================
    // LIEN DE NAVIGATION AVEC ÉTAT ACTIF (coloré selon la page)
    // ============================================================
    function SidebarLink({
    href,
    icon: Icon,
    label,
    onNavigate,
    }: {
    href: string
    icon: React.ElementType
    label: string
    onNavigate?: () => void
    }) {
    const pathname = usePathname()
    const isActive =
        href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href)

    return (
        <Link
        href={href}
        onClick={onNavigate}
        className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            isActive
            ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400"
            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-amber-600 dark:hover:text-amber-500"
        }`}
        >
        <Icon className={`w-5 h-5 ${isActive ? "text-amber-600 dark:text-amber-500" : ""}`} />
        {label}
        {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-500" />}
        </Link>
    )
    }

    // ============================================================
    // NAVIGATION (réutilisée desktop + mobile)
    // ============================================================
    function SidebarNav({ member, onNavigate }: { member: Member; onNavigate?: () => void }) {
    return (
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <SidebarLink href="/dashboard" icon={LayoutDashboard} label="Tableau de bord" onNavigate={onNavigate} />
        <SidebarLink href="/catalogue" icon={BookOpen} label="Catalogue" onNavigate={onNavigate} />
        <SidebarLink href="/dashboard/emprunts" icon={Clock} label="Mes Emprunts" onNavigate={onNavigate} />
        <SidebarLink href="/dashboard/numerique" icon={BookMarked} label="Ressources Numériques" onNavigate={onNavigate} />
        <SidebarLink href="/dashboard/rapports" icon={FileBarChart} label="Mes Rapports" onNavigate={onNavigate} />

        {isStaff(member.role) && (
            <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
            <p className="px-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Administration
            </p>
            <SidebarLink href="/admin" icon={User} label="Gestion" onNavigate={onNavigate} />
            </div>
        )}

        <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
            <p className="px-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Mon compte
            </p>
            <SidebarLink href="/dashboard/profil" icon={UserCircle} label="Mon Profil" onNavigate={onNavigate} />
            <SidebarLink href="/dashboard/parametres" icon={Settings} label="Paramètres" onNavigate={onNavigate} />
        </div>
        </nav>
    )
    }

    // ============================================================
    // PIED DE SIDEBAR (profil + déconnexion)
    // ============================================================
    function SidebarFooter({ member }: { member: Member }) {
    return (
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
    )
    }

    // ============================================================
    // TITRE DYNAMIQUE DU HEADER
    // ============================================================
    function getHeaderTitle(pathname: string): string {
    if (pathname.startsWith("/dashboard/parametres")) return "Paramètres"
    if (pathname.startsWith("/dashboard/profil")) return "Mon Profil"
    if (pathname.startsWith("/dashboard/rapports")) return "Mes Rapports"
    if (pathname.startsWith("/dashboard/numerique")) return "Ressources Numériques"
    if (pathname.startsWith("/dashboard/emprunts")) return "Mes Emprunts"
    if (pathname.startsWith("/catalogue")) return "Catalogue"
    if (pathname.startsWith("/admin")) return "Panneau d'administration"
    if (pathname === "/dashboard") return "Tableau de bord"
    return "Espace Membre"
    }

    // ============================================================
    // SHELL PRINCIPAL (sidebar desktop + drawer mobile + header)
    // ============================================================
    export function DashboardShell({ member, children }: { member: Member; children: React.ReactNode }) {
    const [mobileOpen, setMobileOpen] = useState(false)
    const pathname = usePathname()

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300">
        
        {/* ===== SIDEBAR DESKTOP ===== */}
        <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 fixed h-full">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <Logo showSubtitle={false} />
            </div>
            <SidebarNav member={member} />
            <SidebarFooter member={member} />
        </aside>

        {/* ===== DRAWER MOBILE (s'ouvre avec le bouton ☰) ===== */}
        {mobileOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
            {/* Overlay sombre (clic = fermer) */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setMobileOpen(false)}
            />
            {/* Panneau latéral */}
            <aside className="absolute left-0 top-0 h-full w-72 max-w-[85%] bg-white dark:bg-slate-900 flex flex-col shadow-2xl animate-slide-in-left">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <Logo showSubtitle={false} />
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileOpen(false)}
                    aria-label="Fermer le menu"
                >
                    <X className="w-5 h-5" />
                </Button>
                </div>
                <SidebarNav member={member} onNavigate={() => setMobileOpen(false)} />
                <SidebarFooter member={member} />
            </aside>
            </div>
        )}

        {/* ===== CONTENU PRINCIPAL ===== */}
        <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
            <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40">
            <div className="flex items-center gap-3">
                {/* 🌟 Bouton menu mobile FONCTIONNEL */}
                <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Ouvrir le menu"
                >
                <Menu className="w-5 h-5" />
                </Button>
                <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
                {getHeaderTitle(pathname)}
                </h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
                <ThemeToggle />
            </div>
            </header>

            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">{children}</main>
        </div>

        {/* Animation d'ouverture du drawer */}
        <style jsx global>{`
            @keyframes slide-in-left {
            from { transform: translateX(-100%); }
            to { transform: translateX(0); }
            }
            .animate-slide-in-left {
            animation: slide-in-left 0.25s ease-out;
            }
        `}</style>
        </div>
    )
    }