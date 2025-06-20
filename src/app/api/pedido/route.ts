// src/app/api/pedido/route.ts
import { Decimal } from "@/generated/prisma/runtime/library";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { put } from '@vercel/blob'; // 1. Importe a função put
// Remova as importações de 'path', 'writeFile', 'stat', 'mkdir' se não forem mais usadas para outras coisas.

type ErrorResponse = {
  error: string;
  details?: string;
};

interface QuoteItemFromFrontend {
  product?: any;
  custom?: any;
  quantity: number;
  logoType: "text" | "image";
  logoText?: string;
  observations?: string;
  unitPrice: number;
  setupFee: number;
  totalPrice: number;
}


export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const quoteItemsString = formData.get('quoteItems') as string | null;
    const customerDataString = formData.get('customerData') as string | null;
    const logoFile = formData.get('logoFile') as File | null; // O arquivo original

    if (!quoteItemsString || !customerDataString) {
      return NextResponse.json({ error: "Dados do orçamento ou do cliente ausentes." }, { status: 400 });
    }

    const quoteItems: QuoteItemFromFrontend[] | null = quoteItemsString ? JSON.parse(quoteItemsString) : null;
    const customerData: any | null = customerDataString ? JSON.parse(customerDataString) : null;


    let totalCalculado = 0;
    if (quoteItems && quoteItems.length > 0) {
        totalCalculado = quoteItems.reduce((acc: number, item: QuoteItemFromFrontend) => acc + item.totalPrice, 0);
        if (isNaN(totalCalculado)) {
            console.error("Erro ao calcular o total: itens inválidos", quoteItems);
            return new Response(JSON.stringify({ error: "Dados inválidos para cálculo do total nos itens." }), { status: 400 });
        }
    } else {
        console.warn("Nenhum item no orçamento para cálculo do total. Total será 0.");
    }

    let logoUrlInBlob: string | null = null;
    let vectorizedSvgContent: string | null = null; // Para armazenar o conteúdo SVG vetorizado

    if (logoFile) {

      // --- CHAME A API DE VETORIZAÇÃO DO VECTORIZER.AI AQUI ---
      try {
        const VECTORIZER_API_URL = 'https://vectorizer.ai/api/v1/vectorize';
        const API_KEY_ID = process.env.VECTORIZER_AI_API_KEY_ID;
        const SECRET_KEY = process.env.VECTORIZER_AI_API_SECRET_KEY;

        if (!API_KEY_ID || !SECRET_KEY) {
          console.error("Variáveis de ambiente VECTORIZER_AI_API_KEY_ID ou VECTORIZER_AI_API_SECRET_KEY não configuradas.");
          return NextResponse.json({ error: "Configuração do servidor incorreta para vetorização (API Keys ausentes)." }, { status: 500 });
        }

        // Crie o cabeçalho Authorization para HTTP Basic
        // 'username:password' codificado em Base64
        const authString = Buffer.from(`${API_KEY_ID}:${SECRET_KEY}`).toString('base64');

        const vectorizerFormData = new FormData();
        // O Vectorizer.AI espera o arquivo sob o nome 'image'
        vectorizerFormData.append('image', logoFile, logoFile.name); 
        vectorizerFormData.append('mode', 'test');

        const vectorizerResponse = await fetch(VECTORIZER_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${authString}`,
            // O 'Content-Type' 'multipart/form-data' é tratado automaticamente pelo `fetch` ao usar `FormData`
          },
          body: vectorizerFormData,
        });

        if (!vectorizerResponse.ok) {
          // Tenta ler o erro como texto primeiro, depois como JSON (se a API retornar erro em JSON)
          const errorResponseText = await vectorizerResponse.text();
          let errorMessageForClient = "Erro desconhecido da API de vetorização.";
          try {
            const errorJson = JSON.parse(errorResponseText);
            errorMessageForClient = errorJson.detail || JSON.stringify(errorJson);
          } catch (e) {
            errorMessageForClient = errorResponseText;
          }
          console.error(`Erro da API Vectorizer.AI: ${vectorizerResponse.status} - ${errorMessageForClient}`);
          return NextResponse.json({ error: "Falha na vetorização do logo.", details: errorMessageForClient }, { status: vectorizerResponse.status });
        }

        // A API Vectorizer.AI retorna o SVG diretamente no corpo da resposta
        vectorizedSvgContent = await vectorizerResponse.text(); 

      } catch (vectorizationError) {
        console.error("Erro ao chamar a API de vetorização do Vectorizer.AI:", vectorizationError);
        return NextResponse.json({ error: "Falha interna ao se comunicar com o Vectorizer.AI." }, { status: 500 });
      }

      // --- FIM DA CHAMADA DA API DE VETORIZAÇÃO ---

      // 3. Salve o conteúdo SVG vetorizado no Vercel Blob
      if (vectorizedSvgContent) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // Remove a extensão original e adiciona .svg
        const safeFilename = logoFile.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9._-]/g, '_');
        const blobFilename = `logos/${uniqueSuffix}_${safeFilename}.svg`; 

        try {
          const blob = await put(blobFilename, vectorizedSvgContent, {
            access: 'public',
            contentType: 'image/svg+xml', // IMPRESCINDÍVEL para SVG
          });
          logoUrlInBlob = blob.url;
        } catch (uploadError) {
          console.error("Erro ao fazer upload do SVG vetorizado para o Vercel Blob:", uploadError);
          return NextResponse.json({ error: "Falha ao fazer upload do logo vetorizado para o Blob." }, { status: 500 });
        }
      } else {
        console.warn("[API POST /api/pedido] Nenhum conteúdo SVG vetorizado foi gerado pelo Vectorizer.AI.");
        // Opcional: Você pode optar por retornar um erro aqui se o SVG vetorizado for obrigatório
        // return NextResponse.json({ error: "Não foi possível gerar um SVG vetorizado para o logo." }, { status: 500 });
      }

    } 

    const novoPedidoData = {
      data_pedido: new Date(),
      status: "pendente",
      total: new Decimal(totalCalculado),
      logo: logoUrlInBlob, // Salva a URL do Blob (agora do SVG vetorizado)
      item: quoteItems,
      cliente_infos: customerData,
    };
    
    if (novoPedidoData.item === undefined) {
        novoPedidoData.item = null;
    }
    if (novoPedidoData.cliente_infos === undefined) {
        novoPedidoData.cliente_infos = null;
    }

    const novoPedido = await prisma.pedido.create({
      data: novoPedidoData as any, 
    });

    return NextResponse.json(novoPedido, { status: 201 });

  } catch (error: unknown) {
    console.error('[API POST /api/pedido] Erro geral ao adicionar pedido:', error);
    let errorMessage = 'Erro desconhecido ao adicionar pedido.';
    let errorDetails: any = {};
    if (error instanceof Error) {
      errorMessage = error.message;
      if (error.cause) errorDetails.cause = String(error.cause);
      if ((error as any).meta) errorDetails.meta = (error as any).meta;
    } else {
      errorDetails.unknownError = String(error);
    }
    return NextResponse.json(
        { error: 'Falha ao adicionar pedido ao banco de dados.', details: errorMessage, ...errorDetails },
        { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // ... (seu código GET existente)
  try {
    const pedidos = await prisma.pedido.findMany({
      orderBy: [
        {
          data_pedido: "desc",
        },
      ],
    });

    return NextResponse.json(pedidos, { status: 200 });

  } catch (error: unknown) {
    console.error('[API GET /api/pedido] Erro ao buscar pedidos:', error);
    let errorMessage = "Erro desconhecido ao buscar pedidos.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json<ErrorResponse>(
      { error: "Falha ao buscar pedidos do banco de dados.", details: errorMessage },
      { status: 500 }
    );
  }
}