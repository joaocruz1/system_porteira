import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Importando sua instância configurada do Prisma Client

// Interface para padronizar respostas de erro
interface ErrorResponse {
  error: string;
  details?: string;
}

// Tipo para os props da rota, conforme sua correção que funcionou para o DELETE
type RouteContext = {
    params : Promise <{id: string}> // Ou apenas { params: { id: string } } se não precisar do await props.params
}

// --- FUNÇÃO PUT para atualizar a quantidade de um produto ---
export async function PUT(
  request: NextRequest, // A requisição vinda do frontend
  context: RouteContext // Contexto para acessar os parâmetros da rota
): Promise<NextResponse> {
  const routeParams = await context.params; // Resolvendo a Promise se necessário
  const id = routeParams.id;

  console.log("====== [APP ROUTER - PUT /api/custos/[id]] Atualizando custos no DB ======");
  console.log("[APP ROUTER] ID do custo para atualizar:", id);

  if (!id) {
    return NextResponse.json<ErrorResponse>(
      { error: 'O ID do custo é obrigatório na URL.' },
      { status: 400 }
    );
  }

  let requestBody;
  try {
    requestBody = await request.json(); 
    if (requestBody.status === undefined || typeof requestBody.valor !== 'number') {
      return NextResponse.json<ErrorResponse>(
        { error: 'Corpo da requisição inválido: "valor" é obrigatória e deve ser um float.' },
        { status: 400 }
      );
    }
  } catch (e) {
    console.error('[API PUT /custos/put/[id]] Erro ao parsear corpo da requisição JSON:', e);
    return NextResponse.json<ErrorResponse>(
      { error: 'Falha ao parsear o corpo da requisição JSON. Certifique-se de enviar um JSON válido.' },
      { status: 400 }
    );
  }

  const { valor } = requestBody; // Extrai o valor do corpo da requisição

  try {
    // Operação de UPDATE com Prisma
    const updatedCustos = await prisma.custos.update({
      where: {
        id: id, // 'id' deve ser o nome do campo identificador no seu modelo Produto
      },
      data: {
        valor: valor, 
      },
    });

    console.log("[DB UPDATE] Custo atualizado com sucesso no banco de dados:", updatedCustos);
    return NextResponse.json(updatedCustos, { status: 200 });

  } catch (error: unknown) {
    let errorMessage = 'Erro desconhecido ao atualizar produto no banco de dados.';
    let errorStatus = 500;

    console.error('[DB UPDATE] Erro ao atualizar custo:', error);

    if (error instanceof Error && 'code' in error) {
      const prismaError = error as { code?: string; meta?: any; message: string, name?: string };
      // P2025 é o código do Prisma para "Record to update not found"
      if (prismaError.code === 'P2025') {
        errorMessage = `Produto com ID "${id}" não encontrado para atualização.`;
        errorStatus = 404; // Not Found
        console.warn(`[DB UPDATE] Tentativa de atualizar custo não existente. ID: ${id}`);
      } else {
        errorMessage = prismaError.message;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json<ErrorResponse>(
      {
        error: 'Falha ao atualizar custo no banco de dados.',
        details: errorMessage,
      },
      { status: errorStatus }
    );
  }
}

// Se você tiver outras funções HTTP (GET, DELETE, POST para criar na coleção) para /api/produtos/[id]
// elas podem coexistir neste mesmo arquivo.
// Por exemplo, se o DELETE que criamos antes fosse para /api/produtos/[id] em vez de /api/produto/delete/[id],
// ele estaria aqui também.
// Para manter consistência com a rota do DELETE que usa /produto/delete/[id],
// esta rota PUT está em /api/produtos/[id].

// Se você também tiver uma função GET para um produto específico por ID, ela iria aqui:
// export async function GET(request: NextRequest, context: RouteContext) { /* ... lógica ... */ }