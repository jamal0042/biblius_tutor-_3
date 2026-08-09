    /* eslint-disable react-hooks/set-state-in-effect */
    "use client"

    import * as React from "react"

    type Theme = "dark" | "light" | "system"

    type ThemeProviderProps = {
    children: React.ReactNode
    defaultTheme?: Theme
    storageKey?: string
    }

    export function ThemeProvider({
    children,
    defaultTheme = "dark",
    storageKey = "biblius-theme",
    }: ThemeProviderProps) {
    const [theme, setTheme] = React.useState<Theme>(defaultTheme)

    React.useEffect(() => {
        const savedTheme = localStorage.getItem(storageKey) as Theme
        if (savedTheme) {
        setTheme(savedTheme)
        }
    }, [storageKey])

    React.useEffect(() => {
        const root = window.document.documentElement
        root.classList.remove("light", "dark")
        
        if (theme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
        root.classList.add(systemTheme)
        } else {
        root.classList.add(theme)
        }
        
        localStorage.setItem(storageKey, theme)
    }, [theme, storageKey])

    return <>{children}</>
    }