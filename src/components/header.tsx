    "use client"

    import { useState, useEffect } from "react"
    import Link from "next/link"
    import { useAuth } from "@/hooks/use-auth"
    import { isStaff, ROLE_LABELS } from "@/lib/roles"
    import { Logo } from "@/components/logo"
    import { ThemeToggle } from "@/components/theme-toggle"
    import { NavLink } from "@/components/nav-link"
    import { Button } from "@/components/ui/button"
    import { Menu, X, User, LogOut, LayoutDashboard, BookOpen } from "lucide-react"

    export function Header() {
    const { member, loading, signOut } = useAuth()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    // 🌟 Bloquer le scroll du body quand le menu mobile est ouvert
    useEffect(() => {
        if (isMobileMenuOpen) {
        document.body.style.overflow = "hidden"
        } else {
        document.body.style.overflow = ""
        }
        return () => {
        document.body.style.overflow = ""
        }
    }, [isMobileMenuOpen])

    // 🌟 Fermer le menu au redimensionnement (passage mobile → desktop)
    useEffect(() => {
        const handleResize = () => {
        if (window.innerWidth >= 768 && isMobileMenuOpen) {
            setIsMobileMenuOpen(false)
        }
        }
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [isMobileMenuOpen])

    if (loading) {
        return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md h-16" />
        )
    }

    const linkClass = "text-sm font-medium transition-colors"
    const normalColor = "text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-500"
    const activeColor = "text-amber-600 dark:text-amber-500 font-semibold"

    const closeMobileMenu = () => setIsMobileMenuOpen(false)

    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
            
            <Logo showSubtitle={false} className="flex items-center gap-2" />

            {/* ========== Navigation Desktop ========== */}
            <nav className="hidden md:flex items-center gap-6">
                <NavLink href="/about" className={`${linkClass} ${normalColor}`} activeClassName={activeColor}>
                À propos
                </NavLink>
                
                <NavLink href="/blog" className={`${linkClass} ${normalColor}`} activeClassName={activeColor}>
                Blog
                </NavLink>
                
                <NavLink href="/contact" className={`${linkClass} ${normalColor}`} activeClassName={activeColor}>
                Contactez-nous
                </NavLink>

                {member ? (
                <>
                    <NavLink href="/catalogue" className={`${linkClass} ${normalColor} flex items-center gap-1`} activeClassName={activeColor}>
                    <BookOpen className="w-4 h-4" />
                    Catalogue
                    </NavLink>
                    
                    {isStaff(member.role) ? (
                    <NavLink href="/admin" className={`${linkClass} text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 flex items-center gap-1`} activeClassName="font-bold underline underline-offset-4">
                        <LayoutDashboard className="w-4 h-4" />
                        Administration
                    </NavLink>
                    ) : (
                    <NavLink href="/dashboard" className={`${linkClass} ${normalColor} flex items-center gap-1`} activeClassName={activeColor}>
                        <User className="w-4 h-4" />
                        Mon Espace
                    </NavLink>
                    )}

                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-2" />

                    <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-500 dark:text-slate-400 hidden lg:block">
                        {member.first_name}
                    </span>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={signOut}
                        className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Déconnexion
                    </Button>
                    </div>
                </>
                ) : (
                <>
                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-2" />
                    <Link href="/login">
                    <Button variant="ghost" size="sm">Connexion</Button>
                    </Link>
                    <Link href="/register">
                    <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white">
                        S&apos;inscrire
                    </Button>
                    </Link>
                </>
                )}

                <ThemeToggle />
            </nav>

            {/* ========== Bouton Menu Mobile ========== */}
            <div className="flex items-center gap-2 md:hidden">
                <ThemeToggle />
                <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Ouvrir le menu"
                >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </Button>
            </div>
            </div>
        </div>

        {/* ========== Menu Mobile (Drawer) ========== */}
        {isMobileMenuOpen && (
            <div className="md:hidden fixed inset-0 top-16 z-40">
            {/* Overlay sombre */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
                onClick={closeMobileMenu}
            />
            
            {/* Panneau latéral qui glisse */}
            <aside className="absolute left-0 top-0 bottom-0 w-80 max-w-[85%] bg-white dark:bg-slate-950 shadow-2xl overflow-y-auto animate-slide-in-left">
                
                {/* En-tête du menu mobile */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    {member && (
                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                        <User className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                    </div>
                    )}
                    <div>
                    {member ? (
                        <>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {member.first_name} {member.last_name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {ROLE_LABELS[member.role]}
                        </p>
                        </>
                    ) : (
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">Menu</p>
                    )}
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={closeMobileMenu}
                    aria-label="Fermer le menu"
                >
                    <X className="w-5 h-5" />
                </Button>
                </div>

                {/* Liens de navigation */}
                <nav className="p-4 space-y-1">
                <p className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Navigation
                </p>
                <NavLink
                    href="/about"
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    activeClassName="bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400"
                    onClick={closeMobileMenu}
                >
                    À propos
                </NavLink>
                <NavLink
                    href="/blog"
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    activeClassName="bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400"
                    onClick={closeMobileMenu}
                >
                    Blog
                </NavLink>
                <NavLink
                    href="/contact"
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    activeClassName="bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400"
                    onClick={closeMobileMenu}
                >
                    Contactez-nous
                </NavLink>

                {member && (
                    <>
                    <div className="h-px bg-slate-200 dark:bg-slate-800 my-3" />
                    <p className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Mon Espace
                    </p>
                    <NavLink
                        href="/catalogue"
                        className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        activeClassName="bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400"
                        onClick={closeMobileMenu}
                    >
                        <BookOpen className="w-4 h-4" />
                        Catalogue
                    </NavLink>
                    {isStaff(member.role) ? (
                        <NavLink
                        href="/admin"
                        className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-amber-600 dark:text-amber-500 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-500/10"
                        activeClassName="bg-amber-100 dark:bg-amber-500/20 font-bold"
                        onClick={closeMobileMenu}
                        >
                        <LayoutDashboard className="w-4 h-4" />
                        Administration
                        </NavLink>
                    ) : (
                        <NavLink
                        href="/dashboard"
                        className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        activeClassName="bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400"
                        onClick={closeMobileMenu}
                        >
                        <User className="w-4 h-4" />
                        Tableau de bord
                        </NavLink>
                    )}
                    </>
                )}
                </nav>

                {/* Actions en bas */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 mt-auto">
                {member ? (
                    <Button 
                    variant="ghost" 
                    className="w-full justify-start text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                    onClick={() => { signOut(); closeMobileMenu(); }}
                    >
                    <LogOut className="w-4 h-4 mr-2" />
                    Déconnexion
                    </Button>
                ) : (
                    <div className="space-y-2">
                    <Link href="/login" onClick={closeMobileMenu}>
                        <Button variant="outline" className="w-full">Connexion</Button>
                    </Link>
                    <Link href="/register" onClick={closeMobileMenu}>
                        <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white">
                        S&apos;inscrire
                        </Button>
                    </Link>
                    </div>
                )}
                </div>
            </aside>
            </div>
        )}

        {/* Animations CSS */}
        <style jsx global>{`
            @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
            }
            @keyframes slide-in-left {
            from { transform: translateX(-100%); }
            to { transform: translateX(0); }
            }
            .animate-fade-in {
            animation: fade-in 0.2s ease-out;
            }
            .animate-slide-in-left {
            animation: slide-in-left 0.25s ease-out;
            }
        `}</style>
        </header>
    )
    }