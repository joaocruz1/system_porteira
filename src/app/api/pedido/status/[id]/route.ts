// src/app/api/pedido/status/[id]/route.ts

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface ErrorResponse {
  error: string
  details?: string
}

type RouteContext = {
  params: { id: string }
}

// --- FUNÇÃO PUT CORRIGIDA ---
export async function PUT(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { id } = context.params

  console.log("====== [API] Atualizando status do pedido:", id, "======")

  if (!id) {
    return NextResponse.json<ErrorResponse>({ error: "O ID do pedido é obrigatório." }, { status: 400 })
  }

  let requestBody
  try {
    requestBody = await request.json()
    if (!requestBody.status || typeof requestBody.status !== "string") {
      return NextResponse.json<ErrorResponse>({ error: 'O corpo da requisição precisa conter um "status" válido.' }, { status: 400 })
    }
  } catch (e) {
    return NextResponse.json<ErrorResponse>({ error: "Falha ao ler o corpo da requisição." }, { status: 400 })
  }

  const { status } = requestBody

  // Se o status NÃO for "concluido", apenas atualize o status e retorne.
  if (status !== "concluido") {
    try {
      const updatedPedido = await prisma.pedido.update({
        where: { id },
        data: { status },
      })
      console.log(`[DB] Status do pedido ${id} atualizado para ${status}.`)
      return NextResponse.json(updatedPedido, { status: 200 })
    } catch (error) {
      console.error(`[DB] Erro ao atualizar status do pedido ${id}:`, error)
      return NextResponse.json<ErrorResponse>({ error: "Falha ao atualizar status do pedido." }, { status: 500 })
    }
  }

  // Se o status for "concluido", execute a transação para dar baixa no estoque.
  console.log(`[DB] Iniciando transação para concluir pedido ${id} e dar baixa no estoque.`)

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Obter os itens do pedido e verificar se já foi concluído
      const pedido = await tx.pedido.findUnique({
        where: { id },
        select: { item: true, status: true },
      })

      if (!pedido) {
        throw new Error(`Pedido com ID "${id}" não encontrado.`)
      }
      
      // Previne que a baixa seja executada múltiplas vezes
      if (pedido.status === "concluido") {
        console.warn(`[DB] Pedido ${id} já está concluído. Nenhuma ação de estoque será executada.`);
        // Retorna o pedido existente sem alterar o estoque
        return await tx.pedido.findUnique({ where: { id }});
      }

      const produtosDoPedido = pedido.item as any[]
      if (!produtosDoPedido || produtosDoPedido.length === 0) {
        throw new Error("Pedido não contém itens para dar baixa no estoque.")
      }

      // 2. Criar uma lista de todas as operações de banco de dados
      const stockUpdateOperations = [];

      for (const item of produtosDoPedido) {
          // Pula itens que não têm os IDs necessários (ex: customizados)
          if (!item.product?.id || !item.variationId) {
              console.warn("Item de pedido sem 'product.id' ou 'variationId', ignorado na baixa de estoque:", item);
              continue;
          }

          const produtoId = item.product.id;
          const variationId = item.variationId;
          const quantidadeBaixa = item.quantity;

          // Operação 1: Decrementar a quantidade da VARIAÇÃO específica (O CORRETO)
          stockUpdateOperations.push(
            tx.produtoVariante.update({
              where: { id: variationId },
              data: {
                quantidade: {
                  decrement: quantidadeBaixa,
                },
              },
            })
          );

          // Operação 2: Decrementar também o total do PRODUTO PAI para manter a UI consistente
          stockUpdateOperations.push(
            tx.produto.update({
              where: { id: produtoId },
              data: {
                quantidade: {
                  decrement: quantidadeBaixa,
                },
              },
            })
          );
      }
      
      // 3. Executa todas as atualizações de estoque em paralelo
      await Promise.all(stockUpdateOperations);

      // 4. Atualiza o status do pedido principal para "concluido"
      const pedidoAtualizado = await tx.pedido.update({
        where: { id },
        data: { status: "concluido" },
      })

      console.log(`[DB] Transação para o pedido ${id} concluída com sucesso.`)
      return pedidoAtualizado
    })

    return NextResponse.json(result, { status: 200 })
  } catch (error: unknown) {
    let errorMessage = "Erro desconhecido ao processar o pedido."
    let errorStatus = 500

    if (error instanceof Error) {
        errorMessage = error.message
        if ((error as any).code === 'P2025') { // Erro do Prisma para "registro não encontrado"
            errorMessage = `Um dos produtos ou variações do pedido não foi encontrado no estoque. A transação foi revertida.`;
            errorStatus = 404;
        }
    }

    console.error(`[DB] Falha na transação do pedido ${id}:`, errorMessage);

    return NextResponse.json<ErrorResponse>(
      {
        error: "Falha ao concluir o pedido e dar baixa no estoque.",
        details: errorMessage,
      },
      { status: errorStatus },
    )
  }
}