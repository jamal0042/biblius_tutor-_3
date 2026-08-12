  import type { Metadata } from "next"
  import { Inter } from "next/font/google"
  import "./globals.css"
  import { ThemeProvider } from "@/components/theme-provider"
  import { AuthProvider } from "@/hooks/use-auth"
  import { SplashScreen } from "@/components/splash-screen"
  import { useState, useEffect } from "react"

  const inter = Inter({ subsets: ["latin"] })

  export const metadata: Metadata = {
    title: "Biblius - Système de Gestion de Bibliothèque",
    description: "Plateforme moderne de gestion bibliothécaire",
  }

  export default function RootLayout({
    children,
  }: Readonly<{
    children: React.ReactNode
  }>) {
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
      // Simule un chargement initial de 2 secondes
      const timer = setTimeout(() => {
        setIsLoading(false)
      }, 2000)

      return () => clearTimeout(timer)
    }, [])

    return (
      <html lang="fr" suppressHydrationWarning>
        <body className={inter.className}>
          {/* On ne passe que defaultTheme pour éviter les conflits de types */}
          <ThemeProvider defaultTheme="system">
            <AuthProvider>
              <SplashScreen isLoading={isLoading} />
              {children}
            </AuthProvider>
          </ThemeProvider>
        </body>
      </html>
    )
  }