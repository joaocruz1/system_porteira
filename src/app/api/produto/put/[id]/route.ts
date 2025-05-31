// Arquivo: src/app/api/produtos/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';

// Interface opcional para padronizar respostas de erro
interface ErrorResponse {
  error: string;
  details?: string;
}

// Define o tipo para os props da rota, conforme sua correção que funcionou para o DELETE
type Props = {
    params : Promise <{id: string}>
}

// Leitura das variáveis de ambiente
const N8N_WEBHOOK_URL_FROM_ENV: string | undefined = process.env.N8N_WEBHOOK_URL;
const N8N_FIXED_ACCESS_TOKEN: string | undefined = process.env.N8N_SERVER_ACCESS_TOKEN;

// --- FUNÇÃO PUT PARA ATUALIZAR PRODUTO ---
export async function PUT(
  request: NextRequest, // Requisição vinda do frontend
  props: Props
): Promise<NextResponse> {
  const params = await props.params;
  const id = params.id;

  console.log("====== [APP ROUTER - PUT /api/produtos/[id]] Função PUT INICIADA ======");
  console.log("[APP ROUTER] ID do produto para atualizar:", id);

  // Verificações robustas para as variáveis de ambiente
  if (!N8N_WEBHOOK_URL_FROM_ENV) {
    console.error("[PROXY API - PUT] ERRO CRÍTICO: N8N_WEBHOOK_URL não configurado.");
    return NextResponse.json<ErrorResponse>(
      { error: 'Configuração interna do servidor incompleta: URL base do N8N ausente.' },
      { status: 500 }
    );
  }
  if (!N8N_FIXED_ACCESS_TOKEN) {
    console.error("[PROXY API - PUT] ERRO CRÍTICO: N8N_SERVER_ACCESS_TOKEN não configurado.");
    return NextResponse.json<ErrorResponse>(
      { error: 'Configuração interna do servidor incompleta: token de acesso ao N8N ausente.' },
      { status: 500 }
    );
  }
  if (!id) {
    return NextResponse.json<ErrorResponse>(
      { error: 'O ID do produto é obrigatório na URL.' },
      { status: 400 }
    );
  }

  // Parse do corpo da requisição JSON vinda do frontend
  let requestBodyFromFrontend;
  try {
    requestBodyFromFrontend = await request.json(); // Espera algo como { "quantidade": number }
    if (typeof requestBodyFromFrontend.quantidade !== 'number') {
      return NextResponse.json<ErrorResponse>(
        { error: 'Corpo da requisição inválido: "quantidade" é obrigatória e deve ser um número.' },
        { status: 400 }
      );
    }
  } catch (e) {
    console.error('[PROXY API - PUT] Erro ao parsear corpo da requisição JSON:', e);
    return NextResponse.json<ErrorResponse>(
      { error: 'Falha ao parsear o corpo da requisição JSON.' },
      { status: 400 }
    );
  }

  // Construção da URL final para o N8N (assumindo o endpoint /produtos/[id] para PUT)
  const n8nUpdateUrl: string = `${N8N_WEBHOOK_URL_FROM_ENV}/produto/put/${id}`;
  console.log(`[PROXY API - PUT] Proxying PUT request to N8N: ${n8nUpdateUrl} com corpo:`, requestBodyFromFrontend);

  try {
    const n8nResponse: Response = await fetch(n8nUpdateUrl, {
      method: 'PUT', // Ou 'PATCH', dependendo de como seu N8N está configurado
      headers: {
        'Content-Type': 'application/json',    // Informa ao N8N que estamos enviando JSON
        'Accept': 'application/json',          // Informa ao N8N que esperamos JSON de volta
      },
      body: JSON.stringify(requestBodyFromFrontend), // Envia o corpo { "quantidade": quantidade }
    });

    let responseBodyFromN8N: any = null;
    if (n8nResponse.status !== 204) { // 204 No Content não tem corpo
      try {
        const contentType = n8nResponse.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          responseBodyFromN8N = await n8nResponse.json();
        } else {
          responseBodyFromN8N = await n8nResponse.text();
        }
      } catch (parseError) {
        console.error('[PROXY API - PUT] Error parsing N8N response body:', parseError);
        if (!(responseBodyFromN8N && typeof responseBodyFromN8N === 'string')) {
            responseBodyFromN8N = await n8nResponse.text().catch(() => 'Corpo da resposta N8N não pôde ser lido');
        }
      }
    }

    console.log(`[PROXY API - PUT] N8N Response Status: ${n8nResponse.status}`);

    if (n8nResponse.ok) { // Status 200-299
      if (n8nResponse.status === 204) {
        return new NextResponse(null, { status: 204 });
      }
      return NextResponse.json(responseBodyFromN8N, { status: n8nResponse.status });
    } else {
      console.error(`[PROXY API - PUT] N8N returned error status ${N8N_WEBHOOK_URL_FROM_ENV}:`, responseBodyFromN8N);
      return NextResponse.json(
        responseBodyFromN8N || { error: `N8N respondeu com status ${n8nResponse.status}`, details: `Status Text: ${n8nResponse.statusText}` },
        { status: n8nResponse.status }
      );
    }

  } catch (error: unknown) {
    console.error('[PROXY API - PUT] Erro ao fazer proxy da requisição PUT para N8N:', error);
    let errorMessage = 'Erro desconhecido ao tentar contatar o serviço N8N.';
     if (error instanceof TypeError && error.message.includes('fetch failed')) {
        errorMessage = `Erro de rede ao tentar acessar N8N: ${error.message}. Verifique a URL e conectividade do servidor.`;
    } else if (error instanceof TypeError) {
        errorMessage = `TypeError: ${error.message}. URL de input: ${(error as any).input || n8nUpdateUrl}`;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json<ErrorResponse>(
      {
        error: 'Falha ao fazer proxy da requisição PUT para o webhook N8N',
        details: errorMessage,
      },
      { status: 502 } // Bad Gateway
    );
  }
}
