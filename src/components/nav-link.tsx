    "use client"

    import Link from "next/link"
    import { usePathname } from "next/navigation"

    interface NavLinkProps {
    href: string
    children: React.ReactNode
    className?: string
    activeClassName?: string
    onClick?: () => void // <-- CETTE LIGNE EST ESSENTIELLE
    }

    export function NavLink({ href, children, className = "", activeClassName = "", onClick }: NavLinkProps) {
    const pathname = usePathname()
    
    // Vérifie si l'URL actuelle correspond au lien ou commence par ce lien
    const isActive = pathname === href || pathname.startsWith(href + "/")

    const finalClassName = isActive 
        ? `${className} ${activeClassName}`.trim() 
        : className

    return (
        <Link href={href} className={finalClassName} onClick={onClick}>
        {children}
        </Link>
    )
    }