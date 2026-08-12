    "use client"

    import { useState, useEffect } from "react"
    import { ThemeProvider } from "@/components/theme-provider"
    import { AuthProvider } from "@/hooks/use-auth"
    import { SplashScreen } from "@/components/splash-screen"

    export function AppWrapper({ children }: { children: React.ReactNode }) {
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Simule un chargement initial de 2 secondes
        const timer = setTimeout(() => {
        setIsLoading(false)
        }, 2000)

        return () => clearTimeout(timer)
    }, [])

    return (
        <ThemeProvider defaultTheme="system">
        <AuthProvider>
            <SplashScreen isLoading={isLoading} />
            {children}
        </AuthProvider>
        </ThemeProvider>
    )
    }