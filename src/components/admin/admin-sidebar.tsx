    "use client"

    import Link from "next/link"
    import { usePathname } from "next/navigation"
    import { 
    LayoutDashboard, Users, BookOpen, UserCheck, 
    Settings, TrendingUp, AlertCircle 
    } from "lucide-react"
    import { Logo } from "@/components/logo"
    import { LogoutButton } from "@/components/dashboard/logout-button"
    import { ROLE_LABELS, type Member } from "@/lib/roles"

    const adminLinks = [
    { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
    { href: "/admin/membres", label: "Membres en attente", icon: UserCheck, badge: "12" },
    { href: "/admin/membres/online", label: "Tous les membres", icon: Users },
    { href: "/admin/books", label: "Gestion des livres", icon: BookOpen },
    { href: "/admin/circulation", label: "Circulation", icon: TrendingUp },
    { href: "/admin/penalites", label: "Pénalités", icon: AlertCircle },
    { href: "/admin/systeme", label: "Paramètres", icon: Settings },
    ]

    export function AdminSidebar({ member }: { member: Member }) {
    const pathname = usePathname()

    return (
        <aside className="hidden lg:flex w-72 flex-col border-r border-slate-800 bg-slate-900 dark:bg-slate-900 fixed h-full">
        <div className="p-6 border-b border-slate-800">
            <Logo showSubtitle={false} />
            <div className="mt-2 px-2">
            <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">
                Administration
            </span>
            </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {adminLinks.map((link) => {
            // Vérifie si le chemin actuel correspond au lien
            const isActive = pathname === link.href
            
            return (
                <Link 
                key={link.href}
                href={link.href}
                className={`flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive 
                    ? "bg-amber-500/10 text-amber-500 border-r-2 border-amber-500" 
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
                >
                <div className="flex items-center gap-3">
                    <link.icon className="w-5 h-5" />
                    {link.label}
                </div>
                {link.badge && (
                    <span className="px-2 py-0.5 text-xs font-semibold bg-amber-500 text-white rounded-full">
                    {link.badge}
                    </span>
                )}
                </Link>
            )
            })}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                {member.first_name} {member.last_name}
                </p>
                <p className="text-xs text-slate-400 truncate">
                {ROLE_LABELS[member.role]}
                </p>
            </div>
            </div>
            <LogoutButton />
        </div>
        </aside>
    )
    }