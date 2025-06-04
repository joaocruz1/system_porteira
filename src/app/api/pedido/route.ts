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

// 2. Remova ou comente a função ensureLogoUploadDirExists, pois não será mais necessária para os logos.
/*
async function ensureLogoUploadDirExists() {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'logos');
  try {
    await stat(uploadDir);
  } catch (e: any) {
    if (e.code === 'ENOENT') {
      console.log(`Criando diretório de uploads de logos: ${uploadDir}`);
      await mkdir(uploadDir, { recursive: true });
    } else {
      console.error("Erro ao verificar/criar diretório de uploads de logos:", e);
      throw e;
    }
  }
  return uploadDir;
}
*/

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const quoteItemsString = formData.get('quoteItems') as string | null;
    const customerDataString = formData.get('customerData') as string | null;
    const logoFile = formData.get('logoFile') as File | null;

    if (!quoteItemsString || !customerDataString) {
      return NextResponse.json({ error: "Dados do orçamento ou do cliente ausentes." }, { status: 400 });
    }

    const quoteItems: QuoteItemFromFrontend[] | null = quoteItemsString ? JSON.parse(quoteItemsString) : null;
    const customerData: any | null = customerDataString ? JSON.parse(customerDataString) : null;

    console.log("DADOS DO CLIENTE (parsed):", customerData);
    console.log("ITENS DO ORÇAMENTO (parsed):", quoteItems);

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

    let logoUrlInBlob: string | null = null; // Usaremos para armazenar a URL do Blob

    if (logoFile) {
      console.log("[API POST /api/pedido] Processando arquivo de logo para o Vercel Blob:", logoFile.name);
      
      // 3. Faça o upload para o Vercel Blob
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const safeFilename = logoFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      // Adicione um prefixo de pasta se desejar, ex: 'logos/'
      const blobFilename = `logos/${uniqueSuffix}_${safeFilename}`; 

      try {
        const blob = await put(blobFilename, logoFile, {
          access: 'public', // Torna o arquivo publicamente acessível
          // Adicione 'contentType' se souber o tipo do arquivo e quiser forçá-lo
          // contentType: logoFile.type, 
        });
        logoUrlInBlob = blob.url; // Armazena a URL retornada pelo Vercel Blob
        console.log(`[API POST /api/pedido] Arquivo de logo salvo no Vercel Blob: ${logoUrlInBlob}`);
      } catch (uploadError) {
        console.error("Erro ao fazer upload do logo para o Vercel Blob:", uploadError);
        // É uma boa prática não expor detalhes do erro interno para o cliente
        return NextResponse.json({ error: "Falha ao fazer upload do logo." }, { status: 500 });
      }

    } else {
      console.log("[API POST /api/pedido] Nenhum arquivo de logo (logoFile) foi recebido.");
    }

    const novoPedidoData = {
      data_pedido: new Date(),
      status: "pendente", // Você pode querer ajustar o tipo no seu schema Prisma se precisar de mais status
      total: new Decimal(totalCalculado),
      logo: logoUrlInBlob, // 4. Salve a URL do Blob no banco de dados
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
    console.error('[API POST /api/pedido] Erro ao adicionar pedido:', error);
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