// src/components/estoque-context.tsx

"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { toast } from "sonner"

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

interface EstoqueProviderProps {
  children: ReactNode;
  initialProdutos?: Produto[]; // Prop para produtos iniciais
}

export function EstoqueProvider({ children,initialProdutos }: EstoqueProviderProps) {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const API_BASE_URL_PRODUCT2 = '/api'; // <--- VERIFIQUE E AJUSTE ISTO!
  const API_BASE_URL_PRODUCT: string = process.env.NEXT_PUBLIC_API_PRODUCTS_URL!;

  const fetchData = useCallback(async (isInitialContextLoad = false) => {
    // Se estamos carregando no contexto inicial E initialProdutos foram fornecidos E não estão vazios,
    // então usamos esses dados e não buscamos novamente.
    if (isInitialContextLoad && initialProdutos && initialProdutos.length > 0) {
      console.log("CTX: Usando initialProdutos do servidor.");
      setProdutos(initialProdutos); // Garante que o estado reflita os props iniciais
      setIsLoading(false);
      return;
    }

    console.log("CTX: Buscando dados da API...");
    setIsLoading(true);
    setError(null);
    try {
      if (!API_BASE_URL_PRODUCT) {
        throw new Error("URL da API de Produtos não configurada.");
      }
      const response = await fetch(`${API_BASE_URL_PRODUCT}/produtos`);
      if (!response.ok) {
        throw new Error(`Erro ao buscar dados: ${response.statusText}`);
      }
      const rawResponse = await response.json();
      if (typeof rawResponse.output !== 'string') {
        throw new Error("Formato de resposta inesperado: 'output' não é uma string.");
      }
      let finalProdutosData: Produto[];
      try {
        finalProdutosData = JSON.parse(rawResponse.output);
      } catch (parseError) {
        throw new Error("Formato de string de produtos inválido na resposta.");
      }
      if (!Array.isArray(finalProdutosData) || !finalProdutosData.every(item => typeof item === 'object' && item && 'id' in item)) {
        throw new Error("Dados de produtos não estão no formato de array de objetos Produto.");
      }
      setProdutos(finalProdutosData);
      console.log("CTX: Produtos carregados com sucesso pela API:", finalProdutosData.length);
    } catch (err) {
      console.error("CTX: Erro ao buscar dados:", err);
      setError((err as Error).message || "Erro desconhecido ao buscar dados.");
      setProdutos(initialProdutos || []); // Volta para o inicial ou vazio em caso de erro
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE_URL_PRODUCT, initialProdutos]); // initialProdutos é uma dependência


  useEffect(() => {
    // Se não recebemos produtos iniciais do servidor, ou se eles estavam vazios,
    // então o cliente deve tentar buscar.
    if (!initialProdutos || initialProdutos.length === 0) {
      console.log("CTX useEffect: initialProdutos não fornecidos ou vazios, chamando fetchData(true).");
      fetchData(true); // true indica que é o carregamento inicial do contexto
    } else {
      // Se initialProdutos foram fornecidos, o estado já foi inicializado com eles.
      // Apenas garantimos que isLoading seja false.
      console.log("CTX useEffect: initialProdutos fornecidos, definindo isLoading para false.");
      setIsLoading(false);
    }
  }, [fetchData, initialProdutos]); // Adicionado initialProdutos como dependência

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
      }else{
        toast("Produto Adicionado com Sucesso!")
      }
      refreshData()
    } catch (err) {
      console.error("Erro ao adicionar produto:", err)
      setError((err as Error).message || "Erro desconhecido ao adicionar produto.")
    }
  }

const removerProduto = async (id: string): Promise<void> => {
  try {
    // A URL FINAL DEVE SER ALGO COMO '/api/produto/delete/SEU_ID'
    const apiUrl = `${API_BASE_URL_PRODUCT2}/produto/delete/${id}`;
    console.log(`Chamando API Next.js em: ${apiUrl}`); // Verifique este log no console

    const response = await fetch(apiUrl, { // <--- ESTA CHAMADA DEVE USAR apiUrl
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      }
    });

    // ... (resto do tratamento de response e erro) ...

    if (!response.ok) {
      let errorMessage = `Erro HTTP: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
        if (errorData.details) {
          errorMessage += ` - ${errorData.details}`;
        }
      } catch (e) {
        console.warn("Não foi possível parsear a resposta de erro como JSON.", e);
      }
      throw new Error(`Erro ao remover produto: ${errorMessage}`);
    }else{
      toast("Produto Removido com Sucesso!")
    }

    console.log('Produto removido com sucesso (via proxy Next.js)');
    refreshData();

  } catch (err: unknown) {
    console.error("Erro na função removerProduto:", err);
    if (err instanceof Error) {
      setError(err.message || "Erro desconhecido ao remover produto.");
    } else {
      setError("Ocorreu um erro desconhecido ao remover o produto.");
    }
  }
}

const atualizarQuantidade = async (id: string, quantidade: number) => {
  try {

    const apiUrl = `${API_BASE_URL_PRODUCT2}/produto/put/${id}`; 
    console.log(`[FRONTEND] Chamando API Next.js (PUT) em: ${apiUrl} com quantidade: ${quantidade}`);

    const response = await fetch(apiUrl, {
      method: "PUT", 
      headers: {
        "Content-Type": "application/json", 
      },
      body: JSON.stringify({ "quantidade": quantidade }), // Envia o corpo com a nova quantidade
    });
    if (!response.ok) {
      toast("Ocorreu um erro para atualizar a quantidade!")
      let errorMessage = `Erro HTTP: ${response.status} ${response.statusText}`
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage
        if (errorData.details) {
          errorMessage += ` - ${errorData.details}`
        }
      } catch (e) {
        // Falhou ao parsear JSON
      }
      throw new Error(`Erro ao atualizar quantidade: ${errorMessage}`)
    }else{
      toast("Quantidade atualizada com Sucesso!")
    }

    refreshData(); 
  } catch (err: unknown) { // Use unknown para o erro
    console.error("Erro na função atualizarQuantidade:", err)
    if (err instanceof Error) {
      setError(err.message || "Erro desconhecido ao atualizar quantidade.")
    } else {
      setError("Ocorreu um erro desconhecido ao atualizar a quantidade.")
    }
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