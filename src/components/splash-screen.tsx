    "use client"

    import { useEffect, useState } from "react"

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
        }, 1500)

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
        <div className="flex flex-col items-center gap-6">
            <div className="relative">
            <div className="absolute inset-0 bg-amber-500/20 rounded-3xl blur-2xl animate-pulse" />
            
            <div className="relative w-24 h-24 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-2xl transform animate-bounce-slow">
                <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-14 h-14 text-white"
                >
                <path
                    d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-draw-line"
                />
                <path
                    d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M12 6c1.5 0 2.5.5 3 1.5M12 10c1.5 0 2.5.5 3 1.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="opacity-75"
                />
                </svg>
            </div>
            </div>

            <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
                Biblius
            </h1>
            <p className="text-amber-500 text-sm font-medium">
                Système de Gestion de Bibliothèque
            </p>
            </div>

            <div className="mt-4 flex gap-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
        </div>

        <style jsx>{`
            @keyframes bounce-slow {
            0%, 100% { transform: translateY(-5%); }
            50% { transform: translateY(5%); }
            }
            .animate-bounce-slow {
            animation: bounce-slow 2s ease-in-out infinite;
            }
            @keyframes draw-line {
            from { stroke-dasharray: 100; stroke-dashoffset: 100; }
            to { stroke-dasharray: 100; stroke-dashoffset: 0; }
            }
            .animate-draw-line {
            animation: draw-line 1s ease-out forwards;
            }
        `}</style>
        </div>
    )
    }