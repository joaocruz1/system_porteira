"use client"

import { Dashboard } from "@/components/dashboard"
import { GestaoEstoque } from "@/components/gestao-estoque"
import { GestaoVendas } from "@/components/gestao-vendas"
import { Relatorios } from "@/components/relatorios"
import { useNavigation } from "@/components/navigation-context"
import { GestaoPerdas } from "@/components/gestao-perdas"

export function MainContent() {
  const { activeComponent } = useNavigation()

  const renderComponent = () => {
    switch (activeComponent) {
      case "dashboard":
        return <Dashboard />
      case "estoque":
        return <GestaoEstoque />
      case "vendas":
        return <GestaoVendas />
      case "relatorios":
        return <Relatorios />
      case "perdas":
        return <GestaoPerdas />
      default:
        return <Dashboard />
    }
  }

  return <div className="flex flex-1 flex-col gap-4 p-4">{renderComponent()}</div>
}
