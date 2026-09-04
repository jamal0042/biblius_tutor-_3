/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9" disabled aria-label="Chargement">
        <div className="h-4 w-4" />
      </Button>
    )
  }

  const cycleTheme = () => {
    if (theme === "system") setTheme("light")
    else if (theme === "light") setTheme("dark")
    else setTheme("system")
  }

  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
  const label =
    theme === "system"
      ? "Thème système - " + (isDark ? "sombre" : "clair")
      : isDark
        ? "Passer en mode clair"
        : "Passer en mode sombre"

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      className="h-9 w-9 transition-all"
      aria-label={label}
      title={label}
    >
      {theme === "system" ? (
        <Monitor className="h-4 w-4 text-amber-500" />
      ) : isDark ? (
        <Sun className="h-4 w-4 text-amber-500" />
      ) : (
        <Moon className="h-4 w-4 text-blue-600" />
      )}
    </Button>
  )
}
