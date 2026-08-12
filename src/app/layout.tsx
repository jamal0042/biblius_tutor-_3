import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AppWrapper } from "@/components/app-wrapper"

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
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className}>
        <AppWrapper>{children}</AppWrapper>
      </body>
    </html>
  )
}