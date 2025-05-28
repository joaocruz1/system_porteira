"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface NavigationContextType {
  activeComponent: string
  setActiveComponent: (component: string) => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [activeComponent, setActiveComponent] = useState("dashboard")

  return (
    <NavigationContext.Provider value={{ activeComponent, setActiveComponent }}>{children}</NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (context === undefined) {
    throw new Error("useNavigation must be used within a NavigationProvider")
  }
  return context
}
