    "use client"

    import { useEffect, useState } from "react"
    import { Logo } from "@/components/logo"

    interface SplashScreenProps {
    isLoading: boolean
    }

    export function SplashScreen({ isLoading }: SplashScreenProps) {
    const [isVisible, setIsVisible] = useState(isLoading)
    const [isFadingOut, setIsFadingOut] = useState(false)

    useEffect(() => {
        if (!isLoading) {
        const fadeOutTimer = setTimeout(() => {
            setIsFadingOut(true)
        }, 500)

        const removeTimer = setTimeout(() => {
            setIsVisible(false)
        }, 2000)

        return () => {
            clearTimeout(fadeOutTimer)
            clearTimeout(removeTimer)
        }
        }
    }, [isLoading])

    if (!isVisible) return null

    return (
        <div
        className={`fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950 transition-opacity duration-700 ${
            isFadingOut ? "opacity-0" : "opacity-100"
        }`}
        >
        {/* Halo lumineux doré/orange en arrière-plan */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[600px] h-[400px] bg-gradient-to-r from-amber-500/30 via-orange-500/30 to-amber-500/30 rounded-full blur-3xl animate-pulse" />
        </div>

        {/* Carte principale avec contour doré clignotant */}
        <div className="relative z-10 animate-pulse-glow">
            <div className="relative bg-slate-900/95 backdrop-blur-md rounded-3xl border-2 border-amber-500/60 shadow-[0_0_80px_rgba(245,158,11,0.5)] px-16 py-12">
            
            {/* Contenu centré verticalement et horizontalement */}
            <div className="flex flex-col items-center gap-6">
                
                {/* Logo centré avec halo */}
                <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl blur-xl opacity-60 animate-pulse" />
                <div className="relative bg-slate-800/80 p-4 rounded-2xl border border-amber-500/40">
                    <div className="[&_h1]:!text-white [&_p]:!text-amber-400 [&_h1]:!text-4xl [&_p]:!text-base">
                    <Logo showSubtitle={true} />
                    </div>
                </div>
                </div>

                {/* Points de chargement animés dorés/orange */}
                <div className="flex justify-center gap-3 mt-2">
                <div 
                    className="w-3 h-3 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/50 animate-bounce"
                    style={{ animationDelay: '0ms', animationDuration: '600ms' }}
                />
                <div 
                    className="w-3 h-3 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/50 animate-bounce"
                    style={{ animationDelay: '150ms', animationDuration: '600ms' }}
                />
                <div 
                    className="w-3 h-3 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/50 animate-bounce"
                    style={{ animationDelay: '300ms', animationDuration: '600ms' }}
                />
                </div>
            </div>
            </div>
        </div>

        {/* Styles CSS globaux pour les animations */}
        <style jsx global>{`
            @keyframes pulse-glow {
            0%, 100% {
                filter: drop-shadow(0 0 20px rgba(245, 158, 11, 0.4));
            }
            50% {
                filter: drop-shadow(0 0 60px rgba(251, 146, 60, 0.9));
            }
            }
            .animate-pulse-glow {
            animation: pulse-glow 2s ease-in-out infinite;
            }
        `}</style>
        </div>
    )
    }