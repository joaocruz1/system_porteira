"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export interface Produto {
  id: string
  nome: string
  categoria: string
  quantidade: number
  preco: number
  fornecedor: string
  dataEntrada: string
}

export interface Pedido {
  id: string
  cliente: string
  produtos: Array<{
    produtoId: string
    nome: string
    quantidade: number
    preco: number
  }>
  total: number
  status: "pendente" | "processando" | "concluido" | "cancelado"
  dataPedido: string
}

interface EstoqueContextType {
  produtos: Produto[]
  pedidos: Pedido[]
  adicionarProduto: (produto: Omit<Produto, "id">) => void
  removerProduto: (id: string) => void
  atualizarQuantidade: (id: string, quantidade: number) => void
  atualizarProdutoExistente: (id: string, novaQuantidade: number) => void
  criarPedido: (pedido: Omit<Pedido, "id">) => void
  atualizarStatusPedido: (id: string, status: Pedido["status"]) => void
  darBaixaPedido: (pedidoId: string) => void
}

const EstoqueContext = createContext<EstoqueContextType | undefined>(undefined)

export function EstoqueProvider({ children }: { children: ReactNode }) {
  const [produtos, setProdutos] = useState<Produto[]>([
    {
      id: "1",
      nome: "Café Premium 500g",
      categoria: "Bebidas",
      quantidade: 150,
      preco: 25.9,
      fornecedor: "Fazenda São João",
      dataEntrada: "2024-01-15",
    },
    {
      id: "2",
      nome: "Açúcar Cristal 1kg",
      categoria: "Alimentos",
      quantidade: 80,
      preco: 4.5,
      fornecedor: "Usina Central",
      dataEntrada: "2024-01-10",
    },
    {
      id: "3",
      nome: "Leite Integral 1L",
      categoria: "Laticínios",
      quantidade: 45,
      preco: 5.2,
      fornecedor: "Laticínios Minas",
      dataEntrada: "2024-01-20",
    },
  ])

  const [pedidos, setPedidos] = useState<Pedido[]>([
    {
      id: "1",
      cliente: "João Silva",
      produtos: [{ produtoId: "1", nome: "Café Premium 500g", quantidade: 2, preco: 25.9 }],
      total: 51.8,
      status: "pendente",
      dataPedido: "2024-01-25",
    },
    {
      id: "2",
      cliente: "Maria Santos",
      produtos: [
        { produtoId: "2", nome: "Açúcar Cristal 1kg", quantidade: 3, preco: 4.5 },
        { produtoId: "3", nome: "Leite Integral 1L", quantidade: 2, preco: 5.2 },
      ],
      total: 23.9,
      status: "processando",
      dataPedido: "2024-01-24",
    },
  ])

  const adicionarProduto = (produto: Omit<Produto, "id">) => {
    const novoProduto: Produto = {
      ...produto,
      id: Date.now().toString(),
    }
    setProdutos((prev) => [...prev, novoProduto])
  }

  const removerProduto = (id: string) => {
    setProdutos((prev) => prev.filter((p) => p.id !== id))
  }

  const atualizarQuantidade = (id: string, quantidade: number) => {
    setProdutos((prev) => prev.map((p) => (p.id === id ? { ...p, quantidade } : p)))
  }

  const atualizarProdutoExistente = (id: string, novaQuantidade: number) => {
    setProdutos((prev) => prev.map((p) => (p.id === id ? { ...p, quantidade: p.quantidade + novaQuantidade } : p)))
  }

  const criarPedido = (pedido: Omit<Pedido, "id">) => {
    const novoPedido: Pedido = {
      ...pedido,
      id: Date.now().toString(),
    }
    setPedidos((prev) => [...prev, novoPedido])
  }

  const atualizarStatusPedido = (id: string, status: Pedido["status"]) => {
    setPedidos((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)))
  }

  const darBaixaPedido = (pedidoId: string) => {
    const pedido = pedidos.find((p) => p.id === pedidoId)
    if (pedido && pedido.status !== "concluido") {
      // Dar baixa no estoque
      pedido.produtos.forEach((item) => {
        setProdutos((prev) =>
          prev.map((p) =>
            p.id === item.produtoId ? { ...p, quantidade: Math.max(0, p.quantidade - item.quantidade) } : p,
          ),
        )
      })

      // Atualizar status do pedido
      atualizarStatusPedido(pedidoId, "concluido")
    }
  }

  return (
    <EstoqueContext.Provider
      value={{
        produtos,
        pedidos,
        adicionarProduto,
        removerProduto,
        atualizarQuantidade,
        atualizarProdutoExistente,
        criarPedido,
        atualizarStatusPedido,
        darBaixaPedido,
      }}
    >
      {children}
    </EstoqueContext.Provider>
  )
}

export function useEstoque() {
  const context = useContext(EstoqueContext)
  if (context === undefined) {
    throw new Error("useEstoque must be used within an EstoqueProvider")
  }
  return context
}
