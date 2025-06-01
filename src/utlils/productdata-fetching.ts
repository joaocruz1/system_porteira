// Pode ser em um arquivo utils/data-fetching.ts ou diretamente na sua página do servidor
import { type Produto } from '@/components/estoque-context'; // Certifique-se que o tipo é acessível

export async function fetchProdutosNoServidor(): Promise<Produto[]> {
  const API_BASE_URL_PRODUCT = process.env.NEXT_PUBLIC_API_PRODUCTS_URL;

  if (!API_BASE_URL_PRODUCT) {
    console.error("SRV: URL da API de Produtos não configurada.");
    // Em produção, você pode querer lançar um erro ou retornar um estado de erro específico
    return [];
  }

  try {
    // Usar { cache: 'no-store' } para dados dinâmicos que devem ser sempre os mais recentes
    // Ou { next: { revalidate: 60 } } para revalidação baseada em tempo
    const response = await fetch(`${API_BASE_URL_PRODUCT}/produtos`, { cache: 'no-store' });

    if (!response.ok) {
      console.error(`SRV: Erro ao buscar dados: ${response.status} ${response.statusText}`);
      return [];
    }

    const rawResponse = await response.json();

    if (typeof rawResponse.output !== 'string') {
      console.error("SRV: Formato de resposta inesperado: 'output' não é uma string.");
      return [];
    }

    let finalProdutosData: Produto[];
    try {
      finalProdutosData = JSON.parse(rawResponse.output);
    } catch (parseError) {
      console.error("SRV: Erro ao fazer parse da string de produtos:", parseError);
      return [];
    }

    if (!Array.isArray(finalProdutosData) || !finalProdutosData.every(item => typeof item === 'object' && item && 'id' in item)) {
      console.error("SRV: Dados de produtos não estão no formato de array de objetos Produto válidos.");
      return [];
    }
    console.log("SRV: Produtos carregados com sucesso no servidor:", finalProdutosData.length);
    return finalProdutosData;
  } catch (err) {
    console.error("SRV: Erro crítico ao buscar produtos:", err);
    return [];
  }
}