"use client"

import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { MainContent } from "@/components/main-content"
import { EstoqueProvider } from "@/components/estoque-context"
import { NavigationProvider } from "@/components/navigation-context"

export default function Page() {
  return (
    <EstoqueProvider>
      <NavigationProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger className="-ml-1" />
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold">Porteira de Minas - Sistema de Estoque</h1>
              </div>
            </header>
            <MainContent />
          </SidebarInset>
        </SidebarProvider>
      </NavigationProvider>
    </EstoqueProvider>
  )
}
