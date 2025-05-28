"use client"

import { BarChart3, Package, ShoppingCart, Home } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { useNavigation } from "@/components/navigation-context"

const menuItems = [
  {
    title: "Dashboard",
    icon: Home,
    component: "dashboard",
  },
  {
    title: "Gestão de Estoque",
    icon: Package,
    component: "estoque",
  },
  {
    title: "Vendas e Pedidos",
    icon: ShoppingCart,
    component: "vendas",
  },
  {
    title: "Relatórios",
    icon: BarChart3,
    component: "relatorios",
  },
]

export function AppSidebar() {
  const { activeComponent, setActiveComponent } = useNavigation()

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-2">
          <Package className="h-6 w-6 text-green-600" />
          <div>
            <h2 className="font-semibold">Porteira de Minas</h2>
            <p className="text-xs text-muted-foreground">Sistema de Estoque</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => setActiveComponent(item.component)}
                    isActive={activeComponent === item.component}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="text-xs text-muted-foreground">
          <p>© 2024 Porteira de Minas</p>
          <p>Versão 1.0.0</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
