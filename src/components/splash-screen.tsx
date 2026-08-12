    "use client"

    import { useEffect, useState } from "react"
    import { Logo } from "@/components/logo" // <-- On utilise le MÊME logo que le header

    interface SplashScreenProps {
    isLoading: boolean
    }

    export function SplashScreen({ isLoading }: SplashScreenProps) {
    const [isVisible, setIsVisible] = useState(isLoading)
    const [isFadingOut, setIsFadingOut] = useState(false)

    useEffect(() => {
        if (!isLoading) {
        // Commencer la disparition après 500ms
        const fadeOutTimer = setTimeout(() => {
            setIsFadingOut(true)
        }, 500)

        // Supprimer complètement après l'animation
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
        <div className="flex flex-col items-center gap-8 transform scale-150">
            
            {/* 
            On utilise le composant Logo existant.
            Les classes [&_h1]:!text-white et [&_p]:!text-amber-500 forcent 
            les couleurs pour qu'elles soient parfaites sur le fond sombre (bg-slate-950).
            */}
            <div className="[&_h1]:!text-white [&_p]:!text-amber-500">
            <Logo showSubtitle={true} className="justify-center" />
            </div>

            {/* Animation de chargement (points qui rebondissent) */}
            <div className="mt-4 flex gap-2">
            <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
        </div>
        </div>
    )
    }