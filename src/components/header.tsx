    "use client"

    import Link from "next/link"
    import { useState } from "react"
    import { useAuth } from "@/hooks/use-auth"
    import { isStaff, ROLE_LABELS } from "@/lib/roles"
    import { Logo } from "@/components/logo"
    import { ThemeToggle } from "@/components/theme-toggle"
    import { Button } from "@/components/ui/button"
    import { Menu, X, User, LogOut, LayoutDashboard, BookOpen } from "lucide-react"

    export function Header() {
    const { member, loading, signOut } = useAuth()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    if (loading) {
        return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md h-16" />
        )
    }

    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
            
            {/* CORRECTION ICI : Le Logo est SEUL, sans <Link> autour */}
            <Logo showSubtitle={false} className="flex items-center gap-2" />

            {/* Navigation Desktop */}
            <nav className="hidden md:flex items-center gap-6">
                <Link href="/about" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-500 transition-colors">
                A propos
                </Link>
                <Link href="/blog" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-500 transition-colors">
                Blog
                </Link>
                <Link href="/contact" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-500 transition-colors">
                Contactez-nous
                </Link>

                {member ? (
                <>
                    <Link href="/catalogue" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-500 transition-colors flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    Catalogue
                    </Link>
                    
                    {isStaff(member.role) ? (
                    <Link href="/admin" className="text-sm font-medium text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 transition-colors flex items-center gap-1">
                        <LayoutDashboard className="w-4 h-4" />
                        Administration
                    </Link>
                    ) : (
                    <Link href="/dashboard" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-500 transition-colors flex items-center gap-1">
                        <User className="w-4 h-4" />
                        Mon Espace
                    </Link>
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
                        Deconnexion
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
                        S inscrire
                    </Button>
                    </Link>
                </>
                )}

                <ThemeToggle />
            </nav>

            {/* Bouton Menu Mobile */}
            <div className="flex items-center gap-4 md:hidden">
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

        {/* Menu Mobile */}
        {isMobileMenuOpen && (
            <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
            <div className="px-4 py-4 space-y-3">
                <Link href="/about" className="block text-sm font-medium text-slate-600 dark:text-slate-300" onClick={() => setIsMobileMenuOpen(false)}>
                A propos
                </Link>
                <Link href="/blog" className="block text-sm font-medium text-slate-600 dark:text-slate-300" onClick={() => setIsMobileMenuOpen(false)}>
                Blog
                </Link>
                <Link href="/contact" className="block text-sm font-medium text-slate-600 dark:text-slate-300" onClick={() => setIsMobileMenuOpen(false)}>
                Contactez-nous
                </Link>

                {member ? (
                <>
                    <div className="h-px bg-slate-200 dark:bg-slate-800 my-2" />
                    <Link href="/catalogue" className="block text-sm font-medium text-slate-600 dark:text-slate-300" onClick={() => setIsMobileMenuOpen(false)}>
                    Catalogue
                    </Link>
                    {isStaff(member.role) ? (
                    <Link href="/admin" className="block text-sm font-medium text-amber-600 dark:text-amber-500" onClick={() => setIsMobileMenuOpen(false)}>
                        Administration
                    </Link>
                    ) : (
                    <Link href="/dashboard" className="block text-sm font-medium text-slate-600 dark:text-slate-300" onClick={() => setIsMobileMenuOpen(false)}>
                        Mon Espace ({ROLE_LABELS[member.role]})
                    </Link>
                    )}
                    <div className="h-px bg-slate-200 dark:bg-slate-800 my-2" />
                    <Button 
                    variant="ghost" 
                    className="w-full justify-start text-red-600 dark:text-red-400"
                    onClick={() => { signOut(); setIsMobileMenuOpen(false); }}
                    >
                    <LogOut className="w-4 h-4 mr-2" />
                    Deconnexion
                    </Button>
                </>
                ) : (
                <>
                    <div className="h-px bg-slate-200 dark:bg-slate-800 my-2" />
                    <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full">Connexion</Button>
                    </Link>
                    <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white">S inscrire</Button>
                    </Link>
                </>
                )}
            </div>
            </div>
        )}
        </header>
    )
    }