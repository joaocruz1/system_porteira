import type React from "react"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { EstoqueProvider } from "@/components/estoque-context"
import { NavigationProvider } from "@/components/navigation-context"
import { AuthProvider } from "@/components/auth-context"
import { UserMenu } from "@/components/user-menu"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  const user = {
    id: session.userId,
    email: session.email,
    nome: session.nome,
    cargo: session.cargo,
  }

  return (
    <AuthProvider initialUser={user}>
      <EstoqueProvider>
        <NavigationProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
                <div className="flex items-center gap-2">
                  <SidebarTrigger className="-ml-1" />
                  <h1 className="text-lg font-semibold">Porteira de Minas - Sistema de Estoque</h1>
                </div>
                <UserMenu />
              </header>
              <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
            </SidebarInset>
          </SidebarProvider>
        </NavigationProvider>
      </EstoqueProvider>
    </AuthProvider>
  )
}
