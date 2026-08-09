"use client"

import { LogOut } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"

export function LogoutButton() {
  const { signOut } = useAuth()
  
  return (
    <Button 
      variant="ghost" 
      onClick={signOut} 
      className="w-full justify-start text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
    >
      <LogOut className="w-4 h-4 mr-2" />
      Déconnexion
    </Button>
  )
}
