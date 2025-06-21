"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { toast } from "sonner"

export interface ProductVariante {
  id: string
  cor: string
  quantidade: number
  image?: string | null
  sku?: string
}

export interface Produto {
  id: string
  nome: string
  quantidade: number
  categoria: string
  preco: string
  basePrice: number
  fornecedor: string
  data_entrada: string
  variations: ProductVariante[]
}

export interface Pedido {
  id: string
  cliente: string
  endereco: string
  cliente_telefone: string
  cliente_email: string
  logo: string
  produtos: Array<{
    produtoId: string
    variationId?: string
    nome: string
    cor?: string
    quantidade: number
    logotype: string
    preco: number
  }>
  total: number
  status: "pendente" | "processando" | "concluido" | "cancelado"
  dataPedido: string
}

export interface Perda {
  id: string
  produtoId: string
  variationId?: string
  produtoNome: string
  cor?: string
  quantidade: number
  valorUnitario: number
  valorTotal: number
  motivo: "danificado" | "perdido" | "vencido" | "defeito" | "outros"
  descricao: string
  dataPerda: string
  responsavel: string
  imagens: File[]
  imagensExistentes: string[]
  image?: string | null
}

export interface Custo {
  id: string
  categoria: "operacional" | "administrativo" | "marketing" | "financeiro" | "outros"
  subcategoria: string
  descricao: string
  valor: number
  dataVencimento: string
  dataPagamento?: string
  status: "pendente" | "pago" | "vencido"
  fornecedor?: string
  observacoes?: string
  recorrente?: boolean
  centroCusto?: string
}

interface EstoqueContextType {
  produtos: Produto[]
  pedidos: Pedido[]
  perdas: Perda[]
  custos: Custo[]
  isLoading: boolean
  error: string | null
  adicionarProduto: (produto: {
    name: string
    description?: string
    category: string
    basePrice: number
    provider: string
    variations: Array<{
      color: string
      quantity: number
      image?: File
    }>
  }) => Promise<void>
  removerProduto: (id: string) => Promise<void>
  atualizarQuantidadeVariacao: (variationId: string, quantidade: number) => Promise<void>
  adicionarVariacao: (productId: string, variation: { color: string; quantity: number; image?: File }) => Promise<void>
  removerVariacao: (variationId: string) => Promise<void>
  criarPedido: (pedido: Omit<Pedido, "id">) => Promise<void>
  atualizarStatusPedido: (id: string, status: Pedido["status"]) => Promise<void>
  darBaixaPedido: (pedidoId: string) => Promise<void>
  refreshData: () => void
  recarregarPedidos: () => Promise<void>
  adicionarPerda: (perda: Omit<Perda, "id">) => Promise<void>
  removerPerda: (id: string) => Promise<void>
  atualizarPerda: (id: string, perda: Partial<Perda>) => Promise<void>
  adicionarCusto: (custo: Omit<Custo, "id">) => Promise<void>
  removerCusto: (id: string) => Promise<void>
  atualizarCusto: (id: string, custo: Partial<Custo>) => Promise<void>
  marcarCustoPago: (id: string, dataPagamento: string) => Promise<void>
}

const EstoqueContext = createContext<EstoqueContextType | undefined>(undefined)

interface EstoqueProviderProps {
  children: ReactNode
  initialProdutos?: Produto[]
  initialPedidos?: Pedido[]
  initialPerdas?: Perda[]
  initialCustos?: Custo[]
}

export function EstoqueProvider({
  children,
  initialProdutos,
  initialPedidos,
  initialPerdas,
  initialCustos,
}: EstoqueProviderProps) {
  const [produtos, setProdutos] = useState<Produto[]>(initialProdutos || [])
  const [pedidos, setPedidos] = useState<Pedido[]>(initialPedidos || [])
  const [perdas, setPerdas] = useState<Perda[]>(initialPerdas || [])
  const [custos, setCustos] = useState<Custo[]>(initialCustos || [])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const API_BASE_URL = "/api"

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [produtosResponse, pedidosResponse, perdasResponse, custosResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/produto`),
        fetch(`${API_BASE_URL}/pedido`),
        fetch(`${API_BASE_URL}/perdas`),
        fetch(`${API_BASE_URL}/custos`),
      ])

      if (!produtosResponse.ok) throw new Error("Falha ao buscar produtos")
      if (!pedidosResponse.ok) throw new Error("Falha ao buscar pedidos")
      if (!perdasResponse.ok) throw new Error("Falha ao buscar perdas")
      if (!custosResponse.ok) throw new Error("Falha ao buscar custos")

      const produtosData = await produtosResponse.json()
      const perdasData = await perdasResponse.json()
      const custosData = await custosResponse.json()
      console.log(produtosData)
      const rawPedidosFromApi = await pedidosResponse.json()
      if (!Array.isArray(rawPedidosFromApi)) throw new Error("Resposta de pedidos não é um array.")

      const mappedPedidos: Pedido[] = rawPedidosFromApi.map((apiPedido: any) => {
        let clienteNome = "N/A"
        let clienteEndereco = "N/A"
        let clienteTelefone = "N/A"
        let clienteEmail = "N/A"

        if (apiPedido.cliente_infos && typeof apiPedido.cliente_infos === "object") {
          clienteNome = apiPedido.cliente_infos.name || "Nome não informado"
          clienteEndereco = apiPedido.cliente_infos.address || "Endereço não informado"
          clienteTelefone = apiPedido.cliente_infos.phone || "Telefone não informado"
          clienteEmail = apiPedido.cliente_infos.email || "Email não informado"
        }

        let produtosPedido: Pedido["produtos"] = []
        if (Array.isArray(apiPedido.item)) {
          produtosPedido = apiPedido.item.map((orderItem: any) => ({
            produtoId: orderItem.product?.id || orderItem.custom?.id || "N/A",
            variationId: orderItem.variationId,
            nome: orderItem.product?.name || orderItem.custom?.productName || "Produto Desconhecido",
            cor: orderItem.color,
            quantidade: orderItem.quantity || 0,
            logotype: orderItem.logoType || "text",
            preco: orderItem.unitPrice || 0,
          }))
        }

        let statusPedido: Pedido["status"] = "pendente"
        const validStatuses: Pedido["status"][] = ["pendente", "processando", "concluido", "cancelado"]
        if (typeof apiPedido.status === "string" && validStatuses.includes(apiPedido.status)) {
          statusPedido = apiPedido.status
        }

        return {
          id: apiPedido.id,
          cliente: clienteNome,
          endereco: clienteEndereco,
          cliente_telefone: clienteTelefone,
          cliente_email: clienteEmail,
          logo: apiPedido.logo || "",
          produtos: produtosPedido,
          total: Number(apiPedido.total) || 0,
          status: statusPedido,
          dataPedido: apiPedido.data_pedido ? new Date(apiPedido.data_pedido).toISOString() : new Date().toISOString(),
        }
      })

      setProdutos(produtosData)
      setPedidos(mappedPedidos)
      setPerdas(perdasData)
      setCustos(custosData)

      console.log("CTX: Dados carregados com sucesso:", {
        produtos: produtosData.length,
        pedidos: mappedPedidos.length,
        perdas: perdasData.length,
        custos: custosData.length,
      })
    } catch (err) {
      console.error("CTX Error ao carregar dados:", err)
      setError(err instanceof Error ? err.message : "Erro desconhecido ao carregar dados")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    console.log("CTX useEffect: Carregando dados iniciais.")
    fetchData()
  }, [fetchData])

  const refreshData = useCallback(() => {
    console.log("CTX: refreshData -> Buscando todos os dados da API...")
    fetchData()
  }, [fetchData])

  const recarregarPedidos = useCallback(async () => {
    try {
      console.log("CTX: Recarregando apenas pedidos...")
      const pedidosResponse = await fetch(`${API_BASE_URL}/pedido`)

      if (!pedidosResponse.ok) throw new Error("Falha ao buscar pedidos")

      const rawPedidosFromApi = await pedidosResponse.json()
      if (!Array.isArray(rawPedidosFromApi)) throw new Error("Resposta de pedidos não é um array.")

      const mappedPedidos: Pedido[] = rawPedidosFromApi.map((apiPedido: any) => {
        let clienteNome = "N/A"
        let clienteEndereco = "N/A"
        let clienteTelefone = "N/A"
        let clienteEmail = "N/A"

        if (apiPedido.cliente_infos && typeof apiPedido.cliente_infos === "object") {
          clienteNome = apiPedido.cliente_infos.name || "Nome não informado"
          clienteEndereco = apiPedido.cliente_infos.address || "Endereço não informado"
          clienteTelefone = apiPedido.cliente_infos.phone || "Telefone não informado"
          clienteEmail = apiPedido.cliente_infos.email || "Email não informado"
        }

        let produtosPedido: Pedido["produtos"] = []
        if (Array.isArray(apiPedido.item)) {
          produtosPedido = apiPedido.item.map((orderItem: any) => ({
            produtoId: orderItem.product?.id || orderItem.custom?.id || "N/A",
            variationId: orderItem.variationId,
            nome: orderItem.product?.name || orderItem.custom?.productName || "Produto Desconhecido",
            cor: orderItem.color,
            quantidade: orderItem.quantity || 0,
            logotype: orderItem.logoType || "text",
            preco: orderItem.unitPrice || 0,
          }))
        }

        let statusPedido: Pedido["status"] = "pendente"
        const validStatuses: Pedido["status"][] = ["pendente", "processando", "concluido", "cancelado"]
        if (typeof apiPedido.status === "string" && validStatuses.includes(apiPedido.status)) {
          statusPedido = apiPedido.status
        }

        return {
          id: apiPedido.id,
          cliente: clienteNome,
          endereco: clienteEndereco,
          cliente_telefone: clienteTelefone,
          cliente_email: clienteEmail,
          logo: apiPedido.logo || "",
          produtos: produtosPedido,
          total: Number(apiPedido.total) || 0,
          status: statusPedido,
          dataPedido: apiPedido.data_pedido ? new Date(apiPedido.data_pedido).toISOString() : new Date().toISOString(),
        }
      })

      setPedidos(mappedPedidos)
      console.log("CTX: Pedidos recarregados com sucesso:", mappedPedidos.length)
    } catch (err) {
      console.error("CTX Error ao recarregar pedidos:", err)
      setError(err instanceof Error ? err.message : "Erro desconhecido ao recarregar pedidos")
    }
  }, [])

  const adicionarProduto = async (produtoData: {
    name: string
    description?: string
    category: string
    basePrice: number
    provider: string
    variations: Array<{
      color: string
      quantity: number
      image?: File
    }>
  }) => {
    setIsLoading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append("name", produtoData.name)
      if (produtoData.description) formData.append("description", produtoData.description)
      formData.append("category", produtoData.category)
      formData.append("basePrice", produtoData.basePrice.toString())
      formData.append("provider", produtoData.provider)
      formData.append(
        "variations",
        JSON.stringify(
          produtoData.variations.map((v) => ({
            color: v.color,
            quantity: v.quantity,
          })),
        ),
      )

      // Adicionar imagens das variações
      produtoData.variations.forEach((variation, index) => {
        if (variation.image) {
          formData.append(`variation_image_${index}`, variation.image)
        }
      })

      const response = await fetch(`${API_BASE_URL}/produto`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: `Erro ${response.status} ao adicionar produto: ${response.statusText}` }))
        throw new Error(errorData.error || errorData.message || `Erro ao adicionar produto: ${response.statusText}`)
      }
      toast.success("Produto Adicionado com Sucesso!")
      refreshData()
    } catch (err: unknown) {
      console.error("Erro ao adicionar produto:", err)
      const message = err instanceof Error ? err.message : "Erro desconhecido ao adicionar produto."
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const removerProduto = async (id: string): Promise<void> => {
    setIsLoading(true)
    try {
      const apiUrl = `${API_BASE_URL}/produto/delete/${id}`
      const response = await fetch(apiUrl, { method: "DELETE" })
      if (!response.ok) {
        let errorMessage = `Erro HTTP: ${response.status} ${response.statusText}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch (e) {
          /* ignora erro de parse */
        }
        throw new Error(`Erro ao remover produto: ${errorMessage}`)
      }
      toast.success("Produto Removido com Sucesso!")
      refreshData()
    } catch (err: unknown) {
      console.error("Erro na função removerProduto:", err)
      const message = err instanceof Error ? err.message : "Erro desconhecido ao remover produto."
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const atualizarQuantidadeVariacao = async (variationId: string, quantidade: number) => {
    setIsLoading(true)
    try {
      const apiUrl = `${API_BASE_URL}/produtoVariante/${variationId}`
      const response = await fetch(apiUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantidade: quantidade }),
      })
      if (!response.ok) {
        let errorMessage = `Erro HTTP: ${response.status} ${response.statusText}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch (e) {
          /* ignora erro de parse */
        }
        throw new Error(`Erro ao atualizar quantidade: ${errorMessage}`)
      }
      toast.success("Quantidade atualizada com Sucesso!")
      refreshData()
    } catch (err: unknown) {
      console.error("Erro na função atualizarQuantidadeVariacao:", err)
      const message = err instanceof Error ? err.message : "Erro desconhecido ao atualizar quantidade."
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const adicionarVariacao = async (productId: string, variation: { color: string; quantity: number; image?: File }) => {
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append("productId", productId)
      formData.append("cor", variation.color)
      formData.append("quantidade", variation.quantity.toString())
      if (variation.image) {
        formData.append("image", variation.image)
      }

      const response = await fetch(`${API_BASE_URL}/produtoVariante`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Erro ao adicionar variação")
      }

      toast.success("Variação adicionada com sucesso!")
      refreshData()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao adicionar variação."
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const removerVariacao = async (variationId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/produtoVariante/${variationId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Erro ao remover variação")
      }

      toast.success("Variação removida com sucesso!")
      refreshData()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao remover variação."
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const criarPedido = async (pedidoDataPayload: Omit<Pedido, "id">) => {
    setIsLoading(true)
    setError(null)

    const formData = new FormData()

    formData.append("customerData", JSON.stringify(pedidoDataPayload))
    formData.append("quoteItems", JSON.stringify(pedidoDataPayload.produtos))

    try {
      const response = await fetch("/api/pedido", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorResult = await response
          .json()
          .catch(() => ({ error: "Erro desconhecido", details: response.statusText }))
        alert(
          `Ocorreu um erro ao enviar o orçamento: ${errorResult.details || errorResult.error || response.statusText}. Por favor, tente novamente mais tarde.`,
        )
        return
      }
      toast.success("Orçamento enviado com sucesso! Entraremos em contato em breve.")
    } catch (err: unknown) {
      console.error("Erro ao criar pedido:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const atualizarStatusPedido = async (id: string, status: Pedido["status"]) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/pedido/status/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: `Erro ${response.status} ao atualizar status: ${response.statusText}` }))
        throw new Error(errorData.error || errorData.message || `Erro ao atualizar status: ${response.statusText}`)
      }
      toast.success(`Status do pedido ${id} atualizado para ${status}!`)
      refreshData()
    } catch (err: unknown) {
      console.error("Erro ao atualizar status do pedido:", err)
      const message = err instanceof Error ? err.message : "Erro desconhecido ao atualizar status."
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const darBaixaPedido = async (id: string, status: Pedido["status"] = "concluido") => {
    setIsLoading(true)
    try {
      const apiUrl = `${API_BASE_URL}/pedido/status/${id}`
      const response = await fetch(apiUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) {
        let errorMessage = `Erro HTTP: ${response.status} ${response.statusText}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch (e) {
          /* ignora erro de parse */
        }
        throw new Error(`Erro ao atualizar quantidade: ${errorMessage}`)
      }
      toast.success("Pedido Atualizado com Sucesso!")
      refreshData()
    } catch (err: unknown) {
      console.error("Erro na função darBaixaPedido:", err)
      const message = err instanceof Error ? err.message : "Erro desconhecido ao atualizar pedido."
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const adicionarPerda = async (perdaData: Omit<Perda, "id">) => {
    setIsLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append("produtoId", perdaData.produtoId)
    if (perdaData.variationId) formData.append("variationId", perdaData.variationId)
    formData.append("quantidade", perdaData.quantidade.toString())
    formData.append("motivo", perdaData.motivo)
    formData.append("descricao", perdaData.descricao)
    formData.append("dataPerda", perdaData.dataPerda)
    formData.append("responsavel", perdaData.responsavel)
    formData.append("valorTotal", perdaData.valorTotal.toString())

    if (perdaData.imagens && perdaData.imagens.length > 0) {
      formData.append("images", perdaData.imagens[0])
    }

    try {
      const response = await fetch(`${API_BASE_URL}/perdas`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Erro ao registrar perda`)
      }

      // Atualizar quantidade da variação se especificada
      if (perdaData.variationId) {
        const produto = produtos.find((p) => p.id === perdaData.produtoId)
        const variation = produto?.variations.find((v) => v.id === perdaData.variationId)
        if (variation) {
          const novaQuantidade = variation.quantidade - perdaData.quantidade
          await atualizarQuantidadeVariacao(perdaData.variationId, novaQuantidade)
        }
      }

      toast.success("Perda registrada com sucesso!")
      refreshData()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao registrar perda."
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const removerPerda = async (id: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/perdas/${id}`, { method: "DELETE" })
      if (!response.ok) {
        throw new Error(`Erro ao remover perda`)
      }
      toast.success("Perda removida com sucesso!")
      refreshData()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao remover perda."
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const atualizarPerda = async (id: string, perdaData: Partial<Perda>) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/perdas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(perdaData),
      })
      if (!response.ok) {
        throw new Error(`Erro ao atualizar perda`)
      }
      toast.success("Perda atualizada com sucesso!")
      refreshData()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao atualizar perda."
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const adicionarCusto = async (custoData: Omit<Custo, "id">) => {
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()

      Object.entries(custoData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, String(value))
        }
      })

      const response = await fetch(`${API_BASE_URL}/custos`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Erro ao adicionar custo`)
      }

      toast.success("Custo adicionado com sucesso!")
      refreshData()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido ao adicionar custo."
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const removerCusto = async (id: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/custos/${id}`, { method: "DELETE" })
      if (!response.ok) {
        throw new Error(`Erro ao remover custo`)
      }
      toast.success("Custo removido com sucesso!")
      refreshData()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao remover custo."
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const atualizarCusto = async (id: string, custoData: Partial<Custo>) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/custos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(custoData),
      })
      if (!response.ok) {
        throw new Error(`Erro ao atualizar custo`)
      }
      toast.success("Custo atualizado com sucesso!")
      refreshData()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao atualizar custo."
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const marcarCustoPago = async (id: string, dataPagamento: string) => {
    await atualizarCusto(id, {
      status: "pago",
      dataPagamento,
    })
  }

  return (
    <EstoqueContext.Provider
      value={{
        produtos,
        pedidos,
        perdas,
        custos,
        isLoading,
        error,
        adicionarProduto,
        removerProduto,
        atualizarQuantidadeVariacao,
        adicionarVariacao,
        removerVariacao,
        criarPedido,
        atualizarStatusPedido,
        darBaixaPedido,
        adicionarPerda,
        removerPerda,
        atualizarPerda,
        adicionarCusto,
        removerCusto,
        atualizarCusto,
        marcarCustoPago,
        refreshData,
        recarregarPedidos,
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
