import { Decimal } from "@/generated/prisma/runtime/library"; // Mantenha esta
import { prisma } from "@/lib/prisma"; // Mantenha esta
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { writeFile, stat, mkdir } from "fs/promises";

// Não é mais necessário importar 'Prisma' de '@prisma/client' se era apenas para JsonNull
// import { Prisma } from '@prisma/client';
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

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const quoteItemsString = formData.get('quoteItems') as string | null;
    const customerDataString = formData.get('customerData') as string | null;
    const logoFile = formData.get('logoFile') as File | null;

    if (!quoteItemsString || !customerDataString) {
      // Você pode decidir se quer um valor padrão ou retornar erro
      // Se quoteItems e customerData são essenciais, retornar erro é mais seguro.
      return NextResponse.json({ error: "Dados do orçamento ou do cliente ausentes." }, { status: 400 });
    }

    // Parseia os dados. Se a string for null (campo não enviado), JSON.parse(null) retorna null.
    // Se a string for "" (vazia), JSON.parse("") daria erro.
    // É mais seguro verificar se a string existe antes de parsear.
    const quoteItems: QuoteItemFromFrontend[] | null = quoteItemsString ? JSON.parse(quoteItemsString) : null;
    const customerData: any | null = customerDataString ? JSON.parse(customerDataString) : null;


    console.log("DADOS DO CLIENTE (parsed):", customerData);
    console.log("ITENS DO ORÇAMENTO (parsed):", quoteItems);
    if (logoFile) {
      console.log("ARQUIVO DE LOGO RECEBIDO:", logoFile.name);
    }

    let totalCalculado = 0;
    if (quoteItems && quoteItems.length > 0) {
        totalCalculado = quoteItems.reduce((acc: number, item: QuoteItemFromFrontend) => acc + item.totalPrice, 0);
        if (isNaN(totalCalculado)) {
            console.error("Erro ao calcular o total: itens inválidos", quoteItems);
            return new Response(JSON.stringify({ error: "Dados inválidos para cálculo do total nos itens." }), { status: 400 });
        }
    } else {
        console.warn("Nenhum item no orçamento para cálculo do total. Total será 0.");
        // Se quoteItems for essencial para o pedido, talvez devesse retornar um erro aqui.
        // return new Response(JSON.stringify({ error: "Orçamento não contém itens." }), { status: 400 });
    }

    let logoPathForDb: string = "caminho/para/logo_padrao.png";

    if (logoFile) {
      console.log("[API POST /api/pedido] Processando arquivo de logo:", logoFile.name);
      const uploadDir = await ensureLogoUploadDirExists();
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const safeFilename = logoFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filename = `${uniqueSuffix}_${safeFilename}`;
      const filePath = path.join(uploadDir, filename);
      const bytes = await logoFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);
      console.log(`[API POST /api/pedido] Arquivo de logo salvo em: ${filePath}`);
      logoPathForDb = `/uploads/logos/${filename}`;
    } else {
      console.log("[API POST /api/pedido] Nenhum arquivo de logo (logoFile) foi recebido.");
    }

    const novoPedidoData = {
      data_pedido: new Date(),
      status: false,
      total: new Decimal(totalCalculado),
      logo: logoPathForDb,
      // Se quoteItems ou customerData forem null após o parse,
      // o JavaScript null será passado para o Prisma, resultando em JSON null no DB.
      // Se você preferir um array/objeto vazio em vez de JSON null:
      // item: quoteItems || [],
      // cliente_infos: customerData || {},
      item: quoteItems,
      cliente_infos: customerData,
    };

    // Para campos JSON obrigatórios, se `null` não for o valor desejado quando ausente,
    // você pode definir um padrão (ex: array vazio para `item`, objeto vazio para `cliente_infos`).
    // Se `item` ou `cliente_infos` puderem ser `null` e isso for aceitável (será JSON `null` no banco):
    if (novoPedidoData.item === undefined) { // Segurança extra, embora JSON.parse(null) dê null
        novoPedidoData.item = null;
    }
    if (novoPedidoData.cliente_infos === undefined) { // Segurança extra
        novoPedidoData.cliente_infos = null;
    }
    // Se você quer garantir que não seja `null` mas sim um array/objeto vazio:
    // if (novoPedidoData.item === null || novoPedidoData.item === undefined) {
    //     novoPedidoData.item = [];
    // }
    // if (novoPedidoData.cliente_infos === null || novoPedidoData.cliente_infos === undefined) {
    //     novoPedidoData.cliente_infos = {};
    // }

    const novoPedido = await prisma.pedido.create({
      data: novoPedidoData as any, // Use 'as any' ou defina um tipo mais preciso para novoPedidoData
                                  // que corresponda a PedidoCreateInput, tratando corretamente os campos Json.
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
    // É importante retornar uma resposta de erro para o cliente
    return NextResponse.json<ErrorResponse>(
      { error: "Falha ao buscar pedidos do banco de dados.", details: errorMessage },
      { status: 500 }
    );
  }
}