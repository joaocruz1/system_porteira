import type { NextApiRequest, NextApiResponse } from 'next';

// Interface opcional para padronizar respostas (pode ser mais específica)
type ApiResponseData =
  | { message: string; [key: string]: any } // Para respostas de sucesso com JSON
  | { error: string; details?: string }      // Para respostas de erro
  | string                                   // Para respostas de texto
  | null;                                    // Para 204 No Content

// URL base do seu webhook N8N (idealmente, de uma variável de ambiente)
const N8N_WEBHOOK_BASE_URL: string =
  process.env.N8N_WEBHOOK_URL || 
  'https://joaovcruz1.app.n8n.cloud/webhook/703ee413-9b08-4e3a-85d6-a216cb247d21/703ee413-9b08-4e3a-85d6-a216cb247d21'; // Fallback apenas para exemplo

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponseData>
) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const idFromQuery = req.query.id;
  // Garantir que 'id' é uma string única
  if (typeof idFromQuery !== 'string') {
    return res.status(400).json({ error: 'O ID do produto é inválido ou não fornecido' });
  }
  const id: string = idFromQuery;


  const n8nWebhookUrl: string = `${N8N_WEBHOOK_BASE_URL}/produto/delete/${id}`;
  console.log(`[PROXY API] Proxying DELETE request to: ${n8nWebhookUrl}`);

  try {
    const n8nResponse: Response = await fetch(n8nWebhookUrl, {
      method: 'DELETE',
    });

    let responseBody: any = null;
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
        responseBody = await n8nResponse.text().catch(() => 'Corpo da resposta não pôde ser lido');
      }
    }

    // Encaminha os cabeçalhos de Content-Type do N8N, se houver e relevante
    const n8nContentType = n8nResponse.headers.get('content-type');
    if (n8nContentType) {
      res.setHeader('Content-Type', n8nContentType);
    }

    if (n8nResponse.status === 204) {
      return res.status(204).end(); // .end() para respostas sem corpo
    }
    // Se o responseBody for JSON, .json() o serializará. Se for texto, também (o que é ok).
    return res.status(n8nResponse.status).json(responseBody);

  } catch (error: unknown) {
    console.error('[PROXY API] Erro ao fazer proxy da requisição DELETE para o N8N:', error);
    let errorMessage = 'Erro desconhecido';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return res.status(502).json({
      error: 'Falha ao fazer proxy da requisição para o webhook N8N',
      details: errorMessage,
    });
  }
}