    "use client"

    import { useEffect, useState } from "react"
    import { Logo } from "@/components/logo"
    import { Loader2 } from "lucide-react"

    interface SplashScreenProps {
    isLoading: boolean
    }

    export function SplashScreen({ isLoading }: SplashScreenProps) {
    const [isVisible, setIsVisible] = useState(isLoading)
    const [isFadingOut, setIsFadingOut] = useState(false)
    const [progress, setProgress] = useState(0)

    // 🌟 Un SEUL effect avec un SEUL interval qui gère les deux cas
    // setProgress est TOUJOURS appelé dans un callback (setInterval) → autorisé par React
    useEffect(() => {
        // Vitesse différente selon l'état :
        // - Chargement : 300ms (progression lente jusqu'à 90%)
        // - Fini : 50ms (animation rapide vers 100%)
        const speed = isLoading ? 300 : 50
        
        const interval = setInterval(() => {
        setProgress((prev) => {
            if (!isLoading) {
            // Mode completion : accélérer vers 100%
            const next = prev + 20
            return next >= 100 ? 100 : next
            }
            // Mode loading : progression aléatoire jusqu'à 90%
            return prev >= 90 ? prev : prev + Math.random() * 15
        })
        }, speed)
        
        return () => clearInterval(interval)
    }, [isLoading])

    // Effect pour gérer la disparition (séparé pour clarté)
    useEffect(() => {
        if (!isLoading && progress >= 100) {
        const fadeOutTimer = setTimeout(() => setIsFadingOut(true), 400)
        const removeTimer = setTimeout(() => setIsVisible(false), 1200)
        return () => {
            clearTimeout(fadeOutTimer)
            clearTimeout(removeTimer)
        }
        }
    }, [isLoading, progress])

    if (!isVisible) return null

    return (
        <div
        className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 transition-opacity duration-700 ${
            isFadingOut ? "opacity-0" : "opacity-100"
        }`}
        >
        {/* Effets de fond animés */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl animate-float-1" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-500/20 rounded-full blur-3xl animate-float-2" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl animate-pulse" />
        </div>

        {/* Contenu principal - Format mobile optimisé */}
        <div className="relative z-10 flex flex-col items-center gap-6 sm:gap-8 px-6 max-w-sm w-full">
            
            {/* Logo avec halo */}
            <div className="relative animate-fade-in-down">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl blur-2xl opacity-50 animate-pulse" />
            <div className="relative bg-slate-800/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border-2 border-amber-500/40 shadow-2xl shadow-amber-500/20">
                <div className="[&_h1]:!text-white [&_p]:!text-amber-400 [&_h1]:!text-3xl sm:[&_h1]:!text-4xl [&_p]:!text-sm sm:[&_p]:!text-base">
                <Logo showSubtitle={true} />
                </div>
            </div>
            </div>

            {/* Texte de chargement */}
            <div className="flex flex-col items-center gap-3 animate-fade-in-up">
            <div className="flex items-center gap-2 text-amber-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm sm:text-base font-medium">
                {progress < 100 ? "Chargement en cours..." : "Prêt !"}
                </span>
            </div>
            
            {/* Barre de progression */}
            <div className="w-full max-w-xs bg-slate-800/50 rounded-full h-2 overflow-hidden backdrop-blur-sm border border-slate-700/50">
                <div
                className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600 rounded-full transition-all duration-300 ease-out shadow-lg shadow-amber-500/50"
                style={{ width: `${progress}%` }}
                />
            </div>
            
            <p className="text-xs text-slate-400 mt-2 text-center">
                {progress < 30 && "Initialisation..."}
                {progress >= 30 && progress < 60 && "Connexion à la base de données..."}
                {progress >= 60 && progress < 90 && "Chargement des ressources..."}
                {progress >= 90 && "Presque terminé..."}
            </p>
            </div>

            {/* Points décoratifs animés */}
            <div className="flex justify-center gap-2 mt-4 animate-fade-in">
            {[0, 1, 2].map((i) => (
                <div
                key={i}
                className="w-2 h-2 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/50 animate-bounce"
                style={{
                    animationDelay: `${i * 150}ms`,
                    animationDuration: "800ms"
                }}
                />
            ))}
            </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-6 left-0 right-0 text-center animate-fade-in">
            <p className="text-xs text-slate-500">
            © 2026 Biblius • Bibliothèque Universitaire
            </p>
        </div>

        {/* Styles CSS pour animations fluides */}
        <style jsx global>{`
            @keyframes float-1 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(20px, -30px) scale(1.1); }
            }
            @keyframes float-2 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(-25px, 20px) scale(1.15); }
            }
            @keyframes fade-in-down {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
            }
            @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
            }
            @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
            }
            .animate-float-1 { animation: float-1 8s ease-in-out infinite; }
            .animate-float-2 { animation: float-2 10s ease-in-out infinite; }
            .animate-fade-in-down { animation: fade-in-down 0.8s ease-out forwards; }
            .animate-fade-in-up { animation: fade-in-up 0.8s ease-out 0.2s forwards; opacity: 0; }
            .animate-fade-in { animation: fade-in 0.6s ease-out 0.4s forwards; opacity: 0; }
        `}</style>
        </div>
    )
    }