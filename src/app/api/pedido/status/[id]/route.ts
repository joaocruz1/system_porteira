// src/app/api/pedido/status/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma" // Importando sua instância configurada do Prisma Client

// Interface para padronizar respostas de erro
interface ErrorResponse {
  error: string
  details?: string
}

// Tipo para os props da rota
type RouteContext = {
  params: { id: string }
}

// --- FUNÇÃO PUT ATUALIZADA para atualizar status e dar baixa no estoque ---
export async function PUT(
  request: NextRequest, // A requisição vinda do frontend
  context: RouteContext, // Contexto para acessar os parâmetros da rota
): Promise<NextResponse> {
  const { id } = context.params

  console.log(
    "====== [APP ROUTER - PUT /api/pedido/status/[id]] Atualizando status do pedido ======",
  )
  console.log("[APP ROUTER] ID do pedido para atualizar:", id)

  if (!id) {
    return NextResponse.json<ErrorResponse>(
      { error: "O ID do pedido é obrigatório na URL." },
      { status: 400 },
    )
  }

  let requestBody
  try {
    requestBody = await request.json()
    if (
      requestBody.status === undefined ||
      typeof requestBody.status !== "string"
    ) {
      return NextResponse.json<ErrorResponse>(
        {
          error:
            'Corpo da requisição inválido: "status" é obrigatório e deve ser um texto.',
        },
        { status: 400 },
      )
    }
  } catch (e) {
    return NextResponse.json<ErrorResponse>(
      {
        error:
          "Falha ao parsear o corpo da requisição JSON. Certifique-se de enviar um JSON válido.",
      },
      { status: 400 },
    )
  }

  const { status } = requestBody

  // Se o status NÃO for "concluido", apenas atualize o status e retorne.
  if (status !== "concluido") {
    try {
      const updatedPedido = await prisma.pedido.update({
        where: { id },
        data: { status },
      })
      console.log(
        `[DB UPDATE] Status do pedido ${id} atualizado para ${status}.`,
      )
      return NextResponse.json(updatedPedido, { status: 200 })
    } catch (error) {
      // Tratamento de erro para atualização simples de status
      console.error(
        `[DB UPDATE] Erro ao atualizar status do pedido ${id}:`,
        error,
      )
      return NextResponse.json<ErrorResponse>(
        { error: "Falha ao atualizar status do pedido." },
        { status: 500 },
      )
    }
  }

  // Se o status for "concluido", execute a transação para dar baixa no estoque.
  console.log(
    `[DB TRANSACTION] Iniciando transação para concluir pedido ${id} e dar baixa no estoque.`,
  )

  try {
    const result = await prisma.$transaction(async tx => {
      // 1. Obter os itens do pedido
      const pedido = await tx.pedido.findUnique({
        where: { id },
        select: {
          item: true, // O campo no seu banco que contém os produtos do pedido
          status: true,
        },
      })

      if (!pedido) {
        throw new Error(`Pedido com ID "${id}" não encontrado.`)
      }

      // Evita dar baixa no estoque múltiplas vezes
      if (pedido.status === "concluido") {
        throw new Error(`Pedido ${id} já está concluído. A baixa no estoque já foi realizada.`)
      }
      
      const produtosDoPedido = pedido.item as any[]
      if (!produtosDoPedido || produtosDoPedido.length === 0) {
        throw new Error("Pedido não contém itens para dar baixa.")
      }

      // 2. Criar as operações de atualização de estoque para cada produto
      const stockUpdateOperations = produtosDoPedido.map(item => {
        // Encontrar o ID do produto principal, seja de um produto do catálogo ou customizado
        const produtoId = item.product?.id || item.custom?.id;

        if (!produtoId) {
          console.warn("Item de pedido sem ID de produto, será ignorado:", item);
          return null; // Ignora itens sem ID
        }

        console.log(`[DB TRANSACTION] Preparando baixa de ${item.quantity} unidade(s) do produto ${produtoId}`);
        
        return tx.produto.update({
          where: { id: produtoId },
          data: {
            quantidade: {
              decrement: item.quantity,
            },
          },
        })
      }).filter(op => op !== null); // Remove quaisquer operações nulas

      // 3. Executar todas as atualizações de estoque em paralelo
      await Promise.all(stockUpdateOperations)

      // 4. Atualizar o status do pedido para "concluido"
      const pedidoAtualizado = await tx.pedido.update({
        where: { id },
        data: { status: "concluido" },
      })
      
      console.log(`[DB TRANSACTION] Transação concluída com sucesso para o pedido ${id}.`);
      return pedidoAtualizado
    })

    return NextResponse.json(result, { status: 200 })
  } catch (error: unknown) {
    let errorMessage = "Erro desconhecido ao processar o pedido."
    let errorStatus = 500

    if (error instanceof Error) {
        errorMessage = error.message
        // Verifica erros específicos do Prisma, como estoque insuficiente (se houver constraints)
        if ('code' in error && (error as any).code === 'P2025') {
            errorMessage = `Um dos produtos do pedido não foi encontrado no estoque.`;
            errorStatus = 404;
        }
    }

    console.error(`[DB TRANSACTION] Falha na transação do pedido ${id}:`, errorMessage);

    return NextResponse.json<ErrorResponse>(
      {
        error: "Falha ao concluir o pedido e dar baixa no estoque.",
        details: errorMessage,
      },
      { status: errorStatus },
    )
  }
}