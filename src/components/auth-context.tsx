"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { getUserPermissions } from "@/lib/users"

interface User {
  id: string
  email: string
  nome: string
  cargo: string
}

interface AuthContextType {
  user: User | null
  permissions: ReturnType<typeof getUserPermissions>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children, initialUser }: { children: ReactNode; initialUser: User | null }) {
  const [user, setUser] = useState<User | null>(initialUser)
  const [isLoading, setIsLoading] = useState(false)

  const permissions = user
    ? getUserPermissions(user.cargo)
    : {
        canViewDashboard: false,
        canManageStock: false,
        canManageSales: false,
        canViewReports: false,
        canCreateQuotes: false,
        canManageUsers: false,
      }

  return <AuthContext.Provider value={{ user, permissions, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
