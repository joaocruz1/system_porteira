// src/components/estoque-context.tsx

"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

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
  isLoading: boolean
  error: string | null
  adicionarProduto: (produto: Omit<Produto, "id">) => Promise<void>
  removerProduto: (id: string) => Promise<void>
  atualizarQuantidade: (id: string, quantidade: number) => Promise<void>
  atualizarProdutoExistente: (id: string, novaQuantidade: number) => Promise<void>
  criarPedido: (pedido: Omit<Pedido, "id">) => Promise<void>
  atualizarStatusPedido: (id: string, status: Pedido["status"]) => Promise<void>
  darBaixaPedido: (pedidoId: string) => Promise<void>
  refreshData: () => void
}

const EstoqueContext = createContext<EstoqueContextType | undefined>(undefined)

export function EstoqueProvider({ children }: { children: ReactNode }) {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)


  const API_BASE_URL_PRODUCT: string = process.env.NEXT_PUBLIC_API_PRODUCTS_URL!;

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)
    try {

      if (!API_BASE_URL_PRODUCT) {
        throw new Error("URL da API de Produtos não configurada. Verifique seu arquivo .env.local e reinicie o servidor.");
      }


      const response = await fetch(`${API_BASE_URL_PRODUCT}/produtos`); // Agora o TypeScript está satisfeito aqui

      if (!response.ok) {
        throw new Error(`Erro ao buscar dados: ${response.statusText}`);
      }

      const rawResponse = await response.json();
      console.log("Resposta bruta do n8n:", rawResponse);

      if (typeof rawResponse.output !== 'string') {
        throw new Error("Formato de resposta inesperado: 'output' não é uma string.");
      }

      let finalProdutosData: Produto[];
      try {
        finalProdutosData = JSON.parse(rawResponse.output); 
      } catch (parseError) {
        console.error("Erro ao fazer parse da string de produtos:", parseError);
        throw new Error("Formato de string de produtos inválido na resposta.");
      }
      
      if (!Array.isArray(finalProdutosData) || !finalProdutosData.every(item => typeof item === 'object' && 'id' in item)) {
        throw new Error("Dados de produtos não estão no formato de array de objetos Produto.");
      }

      setProdutos(finalProdutosData);
      console.log("Produtos carregados com sucesso:", finalProdutosData);


     
      setPedidos([]); 

    } catch (err) {
      console.error("Erro ao buscar dados:", err)
      setError((err as Error).message || "Erro desconhecido ao buscar dados.")
      setProdutos([]); // Garante que produtos seja um array vazio em caso de erro
      setPedidos([]); // Garante que pedidos seja um array vazio em caso de erro
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Apenas chame fetchData se API_PRODUCTS_URL for definida
    // A asserção '!' já indica isso para o TypeScript, mas um check explícito pode ser útil para depuração
    if (API_BASE_URL_PRODUCT) {
      fetchData();
    } else {
        setIsLoading(false);
        setError("URLs de API não definidas. Verifique .env.local");
    }
  }, [API_BASE_URL_PRODUCT]) // Dependência para re-executar se a URL mudar (improvável para .env)

  const refreshData = () => {
    fetchData()
  }

  // As funções de CUD (adicionarProduto, removerProduto, etc.) abaixo
  // ainda usam `${API_BASE_URL}/produtos` e `${API_BASE_URL}/pedidos`.
  // Você precisará atualizá-las para usar `API_PRODUCTS_URL` e `API_ORDERS_URL` (se criada)
  // e certificar-se de que seus webhooks do n8n para POST/PUT/DELETE
  // estão configurados com os caminhos corretos (ex: /produtos ou /produtos/{id}).
  // Por exemplo:
  // const adicionarProduto = async (produto: Omit<Produto, "id">) => {
  //   try {
  //     const response = await fetch(API_PRODUCTS_URL, { // Ou uma URL específica para POST
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify(produto),
  //     })
  //     // ...
  //   } catch (err) { ... }
  // }
  // Repita para todas as outras funções de CUD.


  const adicionarProduto = async (produto: Omit<Produto, "id">) => {
    try {
      const response = await fetch(`${API_BASE_URL_PRODUCT}/insert`, { 
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(produto),
      })
      if (!response.ok) {
        throw new Error(`Erro ao adicionar produto: ${response.statusText}`)
      }
      refreshData()
    } catch (err) {
      console.error("Erro ao adicionar produto:", err)
      setError((err as Error).message || "Erro desconhecido ao adicionar produto.")
    }
  }

  const removerProduto = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL_PRODUCT}/${id}`, { // Adapte para /produtos/{id}
        method: "DELETE",
      })
      if (!response.ok) {
        throw new Error(`Erro ao remover produto: ${response.statusText}`)
      }
      refreshData()
    } catch (err) {
      console.error("Erro ao remover produto:", err)
      setError((err as Error).message || "Erro desconhecido ao remover produto.")
    }
  }

  const atualizarQuantidade = async (id: string, quantidade: number) => {
    try {
      const response = await fetch(`${API_BASE_URL_PRODUCT}/produtos/${id}`, { // Adapte para /produtos/{id}
        method: "PUT",
        headers: {
          "access_token": "28230105nunu",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantidade }),
      })
      console.log(id)
      if (!response.ok) {
        throw new Error(`Erro ao atualizar quantidade: ${response.statusText}`)
      }
      refreshData()
    } catch (err) {
      console.error("Erro ao atualizar quantidade:", err)
      setError((err as Error).message || "Erro desconhecido ao atualizar quantidade.")
    }
  }

  const atualizarProdutoExistente = async (id: string, novaQuantidade: number) => {
    try {
      const produtoAtual = produtos.find(p => p.id === id);
      if (!produtoAtual) {
        throw new Error("Produto não encontrado para atualização.");
      }
      const quantidadeTotal = produtoAtual.quantidade + novaQuantidade;
      await atualizarQuantidade(id, quantidadeTotal);
    } catch (err) {
      console.error("Erro ao atualizar produto existente:", err)
      setError((err as Error).message || "Erro desconhecido ao atualizar produto existente.")
    }
  }

  const criarPedido = async (pedido: Omit<Pedido, "id">) => {
    // ATENÇÃO: Esta URL de pedido precisa ser a API_ORDERS_URL se você a definir
    // e configurar um webhook separado no n8n.
    try {
      const response = await fetch(`${API_BASE_URL_PRODUCT}/pedidos`, { // Modificar para API_ORDERS_URL
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(pedido),
      })
      if (!response.ok) {
        throw new Error(`Erro ao criar pedido: ${response.statusText}`)
      }
      refreshData()
    } catch (err) {
      console.error("Erro ao criar pedido:", err)
      setError((err as Error).message || "Erro desconhecido ao criar pedido.")
    }
  }

  const atualizarStatusPedido = async (id: string, status: Pedido["status"]) => {
    // ATENÇÃO: Esta URL de pedido precisa ser a API_ORDERS_URL se você a definir
    // e configurar um webhook separado no n8n.
    try {
      const response = await fetch(`${API_BASE_URL_PRODUCT}/pedidos/${id}`, { // Modificar para API_ORDERS_URL
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) {
        throw new Error(`Erro ao atualizar status do pedido: ${response.statusText}`)
      }
      refreshData()
    } catch (err) {
      console.error("Erro ao atualizar status do pedido:", err)
      setError((err as Error).message || "Erro desconhecido ao atualizar status do pedido.")
    }
  }

  const darBaixaPedido = async (pedidoId: string) => {
    const pedido = pedidos.find((p) => p.id === pedidoId)
    if (!pedido || pedido.status === "concluido" || pedido.status === "cancelado") {
      console.warn("Pedido não pode ser baixado ou já está concluído/cancelado.")
      return
    }

    try {
      for (const item of pedido.produtos) {
        const produtoEstoque = produtos.find((p) => p.id === item.produtoId)
        if (produtoEstoque && produtoEstoque.quantidade >= item.quantidade) {
          await atualizarQuantidade(item.produtoId, produtoEstoque.quantidade - item.quantidade)
        } else {
          console.error(`Estoque insuficiente para o produto ${item.nome}`)
          setError(`Estoque insuficiente para o produto ${item.nome}. Pedido não pode ser finalizado.`)
          return
        }
      }

      await atualizarStatusPedido(pedidoId, "concluido")

      refreshData()
    } catch (err) {
      console.error("Erro ao dar baixa no pedido:", err)
      setError((err as Error).message || "Erro desconhecido ao dar baixa no pedido.")
    }
  }

  return (
    <EstoqueContext.Provider
      value={{
        produtos,
        pedidos,
        isLoading,
        error,
        adicionarProduto,
        removerProduto,
        atualizarQuantidade,
        atualizarProdutoExistente,
        criarPedido,
        atualizarStatusPedido,
        darBaixaPedido,
        refreshData,
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