"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { toast } from "sonner"


export interface Produto {
  id: string
  nome: string
  categoria: string
  quantidade: number
  preco: number // Considere se este deve ser Decimal como no backend
  fornecedor: string
  dataEntrada: string // Pode ser string (ISO) ou Date
  imagens: File[] // Para upload de novas imagens
  imagensExistentes: string[] // URLs de imagens existentes
  image?: string | null; // URL da imagem principal do produto vinda do backend
}

// Interface Pedido conforme definida no seu contexto.
// Lembre-se que será necessário mapear os dados da API para esta estrutura.
export interface Pedido {
  id: string
  cliente: string // No backend é cliente_infos (JSON com mais detalhes)
  endereco : string
  cliente_telefone: string
  cliente_email: string
  logo: string
  produtos: Array<{ // No backend é item (JSON com estrutura de QuoteItem)
    produtoId: string
    nome: string
    quantidade: number
    logotype: string
    preco: number
  }>
  total: number // Considere se este deve ser Decimal
  status: "pendente" | "processando" | "concluido" | "cancelado" // No backend o model Pedido tem status: Boolean
  dataPedido: string // No backend é data_pedido (DateTime)
}

export interface Perda {
  id: string
  produtoId: string
  produtoNome: string
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

interface EstoqueContextType {
  produtos: Produto[]
  pedidos: Pedido[]
  perdas : Perda[]
  isLoading: boolean
  error: string | null
  adicionarProduto: (produto: Omit<Produto, "id" | "imagensExistentes" | "image" >) => Promise<void>
  removerProduto: (id: string) => Promise<void>
  atualizarQuantidade: (id: string, quantidade: number) => Promise<void>
  atualizarProdutoExistente: (id: string, novaQuantidade: number) => Promise<void>

  
  criarPedido: (pedido: Omit<Pedido, "id">) => Promise<void>
  atualizarStatusPedido: (id: string, status: Pedido["status"]) => Promise<void>
  darBaixaPedido: (pedidoId: string) => Promise<void>
  refreshData: () => void

  adicionarPerda: (perda: Omit<Perda, "id">) => Promise<void>
  removerPerda: (id: string) => Promise<void>
  atualizarPerda: (id: string, perda: Partial<Perda>) => Promise<void>
}

const EstoqueContext = createContext<EstoqueContextType | undefined>(undefined)

interface EstoqueProviderProps {
  children: ReactNode;
  initialProdutos?: Produto[];
  initialPedidos?: Pedido[]; 
  initialPerdas?: Perda[];
}

export function EstoqueProvider({ children, initialProdutos, initialPedidos, initialPerdas }: EstoqueProviderProps) {
  const [produtos, setProdutos] = useState<Produto[]>(initialProdutos || [])
  const [pedidos, setPedidos] = useState<Pedido[]>(initialPedidos || [])
  const [perdas, setPerdas] = useState<Perda[]>(initialPerdas || [])
  const [isLoading, setIsLoading] = useState(true) // Geralmente true no início
  const [error, setError] = useState<string | null>(null)

  const API_BASE_URL = '/api';

  const fetchData = useCallback(async (isInitialContextLoad = false) => {
    setIsLoading(true);
    setError(null);
    console.log("CTX: Iniciando busca de dados (Produtos e Pedidos)...");

    try {
      // 1. Buscar ou Definir Produtos
      if (isInitialContextLoad && initialProdutos && initialProdutos.length > 0) {
        console.log("CTX: Usando initialProdutos do servidor.");
        setProdutos(initialProdutos);
      } else {
        console.log("CTX: Buscando produtos da API...");
        const responseProdutos = await fetch(`${API_BASE_URL}/produto`);
        if (!responseProdutos.ok) {
          const errorData = await responseProdutos.json().catch(() => ({}));
          throw new Error(errorData.details || errorData.error || `Erro ao buscar produtos: ${responseProdutos.statusText} (${responseProdutos.status})`);
        }
        const produtosDataAPI = await responseProdutos.json();
        if (!Array.isArray(produtosDataAPI) || !produtosDataAPI.every(item => typeof item === 'object' && item && 'id' in item)) {
          throw new Error("Dados de produtos recebidos da API não são válidos.");
        }
        setProdutos(produtosDataAPI);
        console.log("CTX: Produtos carregados da API:", produtosDataAPI.length);
      }


      if (isInitialContextLoad && initialPedidos && initialPedidos.length > 0) {
        console.log("CTX: Usando initialPedidos do servidor.");
        setPedidos(initialPedidos); 
      } else {
        console.log("CTX: Buscando pedidos da API...");
        const responsePedidos = await fetch(`${API_BASE_URL}/pedido`); 
        if (!responsePedidos.ok) {
          const errorData = await responsePedidos.json().catch(() => ({}));
          throw new Error(errorData.details || errorData.error || `Erro ao buscar pedidos: ${responsePedidos.statusText} (${responsePedidos.status})`);
        }
        const rawPedidosFromApi = await responsePedidos.json();

        if (!Array.isArray(rawPedidosFromApi)) {
          throw new Error("Dados de pedidos recebidos da API não são um array.");
        }
      
      // Buscar Perdas
      if (isInitialContextLoad && initialPerdas && initialPerdas.length > 0) {
        setPerdas(initialPerdas)
      } else {
        const responsePerdas = await fetch(`${API_BASE_URL}/perdas`)
        if (responsePerdas.ok) {
          const perdasData = await responsePerdas.json()
          setPerdas(perdasData)
        }
      }
        
        // Mapeamento dos dados da API para a interface Pedido do contexto
        const mappedPedidos: Pedido[] = rawPedidosFromApi.map((apiPedido: any) => {
          let clienteNome = "N/A";
          let clienteEndereco = "N/A";
          let clienteTelefone = "N/A";
          let clienteEmail = "N/A";


          if (apiPedido.cliente_infos) {
            clienteNome = typeof apiPedido.cliente_infos.name === 'string' ? apiPedido.cliente_infos.name : JSON.stringify(apiPedido.cliente_infos);
            clienteEndereco = typeof apiPedido.cliente_infos.address === 'string' ? apiPedido.cliente_infos.address : JSON.stringify(apiPedido.cliente_infos);
            clienteTelefone = typeof apiPedido.cliente_infos.phone === 'string' ? apiPedido.cliente_infos.phone : JSON.stringify(apiPedido.cliente_infos);
            clienteEmail = typeof apiPedido.cliente_infos.email === 'string' ? apiPedido.cliente_infos.email : JSON.stringify(apiPedido.cliente);
          }

          let produtosPedido: Pedido['produtos'] = [];
          if (Array.isArray(apiPedido.item)) {
            produtosPedido = apiPedido.item.map((orderItem: any) => ({
              produtoId: orderItem.product?.id || orderItem.custom?.id || 'N/A',
              nome: orderItem.product?.name || orderItem.custom?.productName || 'Produto Desconhecido',
              quantidade: orderItem.quantity || 0,
              LogoType : orderItem.logoType || "",
              preco: orderItem.unitPrice || 0,
            }));
          }

          let statusPedido: Pedido["status"] = "pendente";
          if (typeof apiPedido.status === 'boolean') { // No seu modelo Prisma Pedido, status é Boolean
            statusPedido = apiPedido.status ? "concluido" : "pendente"; // Exemplo de mapeamento
          } else if (typeof apiPedido.status === 'string') { // Se já vier como o enum string
             const validStatuses: Pedido["status"][] = ["pendente", "processando", "concluido", "cancelado"];
            if (validStatuses.includes(apiPedido.status)) {
                statusPedido = apiPedido.status;
            }
          }

          return {
            id: apiPedido.id,
            cliente: clienteNome,
            endereco : clienteEndereco,
            cliente_telefone: clienteTelefone,
            cliente_email: clienteEmail,
            logo : apiPedido.logo || "caminho/padrao/ou/string_vazia_se_permitido.png", // Pegue o logo da API
            produtos: produtosPedido,
            total: Number(apiPedido.total) || 0,
            status: statusPedido,
            dataPedido: apiPedido.data_pedido ? new Date(apiPedido.data_pedido).toLocaleDateString('pt-BR') : 'Data Inválida',

          };
        });
        setPedidos(mappedPedidos);
        
        console.log("CTX: Pedidos carregados e mapeados da API:", mappedPedidos.length);
      }
    } catch (err) {
      console.error("CTX: Erro durante fetchData (produtos ou pedidos):", err);
      const message = (err instanceof Error) ? err.message : "Erro desconhecido ao buscar dados.";
      setError(message);
      // Em caso de erro, reverter para os iniciais ou vazio para não quebrar a UI
      if (!(isInitialContextLoad && initialProdutos && initialProdutos.length > 0)) {
        setProdutos(initialProdutos || []);
      }
      if (!(isInitialContextLoad && initialPedidos && initialPedidos.length > 0)) {
        setPedidos(initialPedidos || []);
      }
    } finally {
      setIsLoading(false);
      console.log("CTX: Busca de dados (Produtos e Pedidos) finalizada.");
    }
  }, [API_BASE_URL, initialProdutos, initialPedidos, initialPerdas]); // Adiciona initialPedidos aqui

  useEffect(() => {
    console.log("CTX useEffect: Carregando dados iniciais (produtos e pedidos).");
    fetchData(true); // true indica que é o carregamento inicial do contexto
                    // fetchData usará initialProdutos/initialPedidos se disponíveis, senão buscará da API.
  }, [fetchData]); // fetchData agora depende de initialProdutos e initialPedidos,
                   // então o useEffect só precisa depender de fetchData.

  const refreshData = useCallback(() => {
    console.log("CTX: refreshData -> Buscando Produtos e Pedidos da API...");
    fetchData(false); // false para garantir que sempre busque da API, ignorando initial props
  }, [fetchData]);


  // ... (suas funções adicionarProduto, removerProduto, etc. permanecem aqui) ...
  // Lembre-se que elas podem precisar de ajustes se a lógica de refreshData agora afeta ambos.
  // Por exemplo, adicionarProduto atualiza localmente 'produtos' e depois chama refreshData,
  // que vai recarregar produtos E pedidos. Se for essa a intenção, está OK.

const adicionarProduto = async (produtoData: Omit<Produto, "id" | "imagensExistentes" | "image" >) => {
  setIsLoading(true);
  setError(null);
  try {
    const formData = new FormData();
    formData.append("nome", produtoData.nome);
    if (produtoData.categoria) formData.append("categoria", produtoData.categoria);
    formData.append("quantidade", produtoData.quantidade.toString());
    formData.append("preco", produtoData.preco.toString());
    if (produtoData.fornecedor) formData.append("fornecedor", produtoData.fornecedor);
    if (produtoData.imagens && produtoData.imagens.length > 0) {
      formData.append("imageFile", produtoData.imagens[0], produtoData.imagens[0].name);
    }
    
    const response = await fetch(`${API_BASE_URL}/produto`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `Erro ${response.status} ao adicionar produto: ${response.statusText}` }));
      throw new Error(errorData.error || errorData.message || `Erro ao adicionar produto: ${response.statusText}`);
    }
    // const novoProdutoAdicionado = await response.json(); // API retorna o produto criado
    // setProdutos(prev => [...prev, novoProdutoAdicionado]); // Atualiza estado local opcionalmente
    toast.success("Produto Adicionado com Sucesso!");
    refreshData(); // Recarrega produtos e pedidos
  } catch (err: unknown) {
    console.error("Erro ao adicionar produto:", err);
    const message = (err instanceof Error) ? err.message : "Erro desconhecido ao adicionar produto.";
    setError(message);
    toast.error(message);
  } finally {
    setIsLoading(false);
  }
};

const removerProduto = async (id: string): Promise<void> => {
  setIsLoading(true);
  try {
    const apiUrl = `${API_BASE_URL}/produto/delete/${id}`;
    const response = await fetch(apiUrl, { method: "DELETE" });
    if (!response.ok) {
      let errorMessage = `Erro HTTP: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) { /* ignora erro de parse */ }
      throw new Error(`Erro ao remover produto: ${errorMessage}`);
    }
    toast.success("Produto Removido com Sucesso!");
    refreshData(); // Recarrega produtos e pedidos
  } catch (err: unknown) {
    console.error("Erro na função removerProduto:", err);
    const message = (err instanceof Error) ? err.message : "Erro desconhecido ao remover produto.";
    setError(message);
    toast.error(message);
  } finally {
    setIsLoading(false);
  }
};

const atualizarQuantidade = async (id: string, quantidade: number) => {
  setIsLoading(true);
  try {
    const apiUrl = `${API_BASE_URL}/produto/put/${id}`;
    const response = await fetch(apiUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantidade }),
    });
    if (!response.ok) {
      let errorMessage = `Erro HTTP: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) { /* ignora erro de parse */ }
      throw new Error(`Erro ao atualizar quantidade: ${errorMessage}`);
    }
    toast.success("Quantidade atualizada com Sucesso!");
    refreshData(); // Recarrega produtos e pedidos
  } catch (err: unknown) {
    console.error("Erro na função atualizarQuantidade:", err);
    const message = (err instanceof Error) ? err.message : "Erro desconhecido ao atualizar quantidade.";
    setError(message);
    toast.error(message);
  } finally {
    setIsLoading(false);
  }
};

const atualizarProdutoExistente = async (id: string, novaQuantidade: number) => {
    const produtoAtual = produtos.find(p => p.id === id);
    if (!produtoAtual) {
      toast.error("Produto não encontrado para atualização.");
      return;
    }
    const quantidadeTotal = produtoAtual.quantidade + novaQuantidade; 
    await atualizarQuantidade(id, quantidadeTotal);
  };

const criarPedido = async (pedidoDataPayload: Omit<Pedido, "id">) => {
    setIsLoading(true);
    setError(null);

  const formData = new FormData();
  

  formData.append('customerData', JSON.stringify(pedidoDataPayload));
  formData.append('quoteItems', JSON.stringify(pedidoDataPayload.produtos));
  
  try {
    const response = await fetch("/api/pedido", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorResult = await response.json().catch(() => ({ error: "Erro desconhecido", details: response.statusText }));
      alert(`Ocorreu um erro ao enviar o orçamento: ${errorResult.details || errorResult.error || response.statusText}. Por favor, tente novamente mais tarde.`);
      return;
    }
    toast.success("Orçamento enviado com sucesso! Entraremos em contato em breve.");
  }catch (err: unknown) {
    console.error("Erro ao criar pedido:", err);
  } finally {
    setIsLoading(false);
  }
};


const atualizarStatusPedido = async (id: string, status: Pedido["status"]) => {
    setIsLoading(true);
    setError(null);
    try {
      // Ajuste o endpoint e o corpo da requisição se necessário para sua API
      const response = await fetch(`${API_BASE_URL}/pedido/status/${id}`, { 
        method: "PUT", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }), 
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Erro ${response.status} ao atualizar status: ${response.statusText}` }));
        throw new Error(errorData.error || errorData.message || `Erro ao atualizar status: ${response.statusText}`);
      }
      toast.success(`Status do pedido ${id} atualizado para ${status}!`);
      refreshData();
    } catch (err: unknown) {
      console.error("Erro ao atualizar status do pedido:", err);
      const message = (err instanceof Error) ? err.message : "Erro desconhecido ao atualizar status.";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const darBaixaPedido = async (id: string, status: Pedido["status"] = "concluido") => {
    setIsLoading(true);
  try {
    const apiUrl = `${API_BASE_URL}/pedido/status/${id}`;
    const response = await fetch(apiUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      let errorMessage = `Erro HTTP: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) { /* ignora erro de parse */ }
      throw new Error(`Erro ao atualizar quantidade: ${errorMessage}`);
    }
    toast.success("Pedido Atualizado com Sucesso!");
    refreshData(); // Recarrega produtos e pedidos
  } catch (err: unknown) {
    console.error("Erro na função darBaixaPedido:", err);
    const message = (err instanceof Error) ? err.message : "Erro desconhecido ao atualizar pedido.";
    setError(message);
    toast.error(message);
  } finally {
    setIsLoading(false);
  }
  };

  const adicionarPerda = async (perdaData: Omit<Perda, "id">) => {
    setIsLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append("produtoId", perdaData.produtoId)
    formData.append("quantidade", perdaData.quantidade.toString())
    formData.append("motivo", perdaData.motivo)
    formData.append("descricao", perdaData.descricao)
    formData.append("dataPerda", perdaData.dataPerda)
    formData.append("responsavel", perdaData.responsavel)
    formData.append("valorTotal", perdaData.valorTotal.toString())

    if (perdaData.imagens && perdaData.imagens.length > 0) {
      formData.append("images", perdaData.imagens[0]);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/perdas`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Erro ao registrar perda`)
      }
      const produto = produtos.find((p) => p.id === perdaData.produtoId)
      if (produto) {
        const novaQuantidade = produto.quantidade - perdaData.quantidade
        await atualizarQuantidade(perdaData.produtoId, novaQuantidade)
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

  return (
    <EstoqueContext.Provider
      value={{
        produtos,
        pedidos,
        perdas,
        isLoading,
        error,
        adicionarProduto,
        removerProduto,
        atualizarQuantidade,
        atualizarProdutoExistente,
        criarPedido,
        atualizarStatusPedido,
        darBaixaPedido,
        adicionarPerda,
        removerPerda,
        atualizarPerda,
        refreshData,
      }}
    >
      {children}
    </EstoqueContext.Provider>
  );
}

export function useEstoque() {
  const context = useContext(EstoqueContext)
  if (context === undefined) {
    throw new Error("useEstoque must be used within an EstoqueProvider")
  }
  return context
}