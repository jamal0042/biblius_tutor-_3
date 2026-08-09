    import Link from "next/link"

    interface LogoProps {
    showText?: boolean
    showSubtitle?: boolean
    className?: string
    }

    export function Logo({ showText = true, showSubtitle = false, className = "" }: LogoProps) {
    return (
        <Link href="/" className={`flex items-center gap-3 ${className}`}>
        {/* Logo SVG - T stylisé / Livres empilés */}
        <div className="relative p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <svg 
            className="w-8 h-8 text-amber-500" 
            viewBox="0 0 40 40" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            >
            {/* Livres empilés stylisés formant un T */}
            <path 
                d="M8 28V12C8 11.4477 8.44772 11 9 11H31C31.5523 11 32 11.4477 32 12V28" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round"
            />
            <path 
                d="M12 28V16C12 15.4477 12.4477 15 13 15H27C27.5523 15 28 15.4477 28 16V28" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round"
            />
            <path 
                d="M16 28V20C16 19.4477 16.4477 19 17 19H23C23.5523 19 24 19.4477 24 20V28" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round"
            />
            {/* Barre horizontale du T */}
            <path 
                d="M10 12H30" 
                stroke="currentColor" 
                strokeWidth="3" 
                strokeLinecap="round"
            />
            </svg>
        </div>
        
        {showText && (
            <div className="flex flex-col">
            <span className="text-xl font-bold text-slate-900 dark:text-white leading-none">
                Biblius
            </span>
            {showSubtitle && (
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                Système Intégré de Gestion de Bibliothèque
                </span>
            )}
            </div>
        )}
        </Link>
    )
    }