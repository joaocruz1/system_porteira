// Arquivo: src/app/api/produto/delete/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';

// Interface opcional para padronizar respostas de erro
interface ErrorResponse {
  error: string;
  details?: string;
}

// Define o tipo para os props da rota
type Props = {
    params : Promise <{id: string}>
}

// URL base do seu webhook N8N (lendo do .env.local)
const N8N_WEBHOOK_URL_FROM_ENV: string | undefined = process.env.N8N_WEBHOOK_URL;

// Token de acesso para o N8N (lendo do .env.local)
const N8N_FIXED_ACCESS_TOKEN: string | undefined = process.env.N8N_SERVER_ACCESS_TOKEN;

export async function DELETE(
  request: NextRequest,
  props: Props
): Promise<NextResponse> {
  const params = await props.params;
  const id = params.id;

  // Verificações robustas para as variáveis de ambiente
  if (!N8N_WEBHOOK_URL_FROM_ENV) {
    console.error("[PROXY API] ERRO CRÍTICO: N8N_WEBHOOK_URL não está configurado nas variáveis de ambiente do servidor.");
    return NextResponse.json<ErrorResponse>(
      { error: 'Configuração interna do servidor incompleta: URL base do N8N ausente.' },
      { status: 500 }
    );
  }
  if (!N8N_FIXED_ACCESS_TOKEN) {
    console.error("[PROXY API] ERRO CRÍTICO: N8N_SERVER_ACCESS_TOKEN não está configurado nas variáveis de ambiente do servidor.");
    return NextResponse.json<ErrorResponse>(
      { error: 'Configuração interna do servidor incompleta: token de acesso ao N8N ausente.' },
      { status: 500 }
    );
  }

  if (!id) {
    return NextResponse.json<ErrorResponse>(
      { error: 'O ID do produto é obrigatório' },
      { status: 400 }
    );
  }

  // Construção da URL final para o N8N
  const n8nWebhookUrl: string = `${N8N_WEBHOOK_URL_FROM_ENV}/produto/delete/${id}`;

  try {
    const n8nResponse: Response = await fetch(n8nWebhookUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        // 'User-Agent': 'MyNextJSApp/1.0 (Node.js fetch)', // Opcional
      },
    });

    let responseBody: any = null;
    // Tenta ler o corpo apenas se não for 204 No Content
    if (n8nResponse.status !== 204) {
      try {
        const contentType = n8nResponse.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          responseBody = await n8nResponse.json();
        } else {
          responseBody = await n8nResponse.text();
        }
      } catch (parseError) {
        console.error('[PROXY API] Error parsing N8N response body:', parseError);
        if (!(responseBody && typeof responseBody === 'string')) {
            responseBody = await n8nResponse.text().catch(() => 'Corpo da resposta não pôde ser lido ou já consumido');
        }
      }
    }

    // Trata respostas de sucesso (200 OK ou 204 No Content)
    if (n8nResponse.ok) { // .ok é true para status 200-299
      if (n8nResponse.status === 204) {
        return new NextResponse(null, { status: 204 });
      }
      return NextResponse.json(responseBody, { status: n8nResponse.status });
    } else {
      // Se for 403 Forbidden ou qualquer outro erro do N8N
      console.error(`[PROXY API] N8N returned error status ${n8nResponse.status}:`, responseBody);
      return NextResponse.json(
        responseBody || { error: `N8N respondeu com status ${n8nResponse.status}`, details: `Status Text: ${n8nResponse.statusText}` },
        { status: n8nResponse.status }
      );
    }

  } catch (error: unknown) {
    console.error('[PROXY API] Erro ao fazer proxy da requisição DELETE para o N8N (bloco catch):', error);
    let errorMessage = 'Erro desconhecido ao tentar contatar o serviço N8N.';
    if (error instanceof TypeError && error.message.includes('fetch failed')) {
        errorMessage = `Erro de rede ao tentar acessar N8N: ${error.message}. Verifique a URL e conectividade do servidor.`;
    } else if (error instanceof TypeError) {
        errorMessage = `TypeError: ${error.message}. URL de input: ${(error as any).input || n8nWebhookUrl}`;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json<ErrorResponse>(
      {
        error: 'Falha ao fazer proxy da requisição para o webhook N8N',
        details: errorMessage,
      },
      { status: 502 } // Bad Gateway
    );
  }
}