import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Importando sua instância configurada do Prisma Client

// Interface para padronizar respostas de erro
interface ErrorResponse {
  error: string;
  details?: string;
}

// Tipo para os props da rota, conforme sua correção que funcionou
type Props = {
    params : Promise <{id: string}>
}

export async function DELETE(
  request: NextRequest, // O objeto request pode não ser usado aqui, mas faz parte da assinatura
  props: Props
): Promise<NextResponse> {
  const params = await props.params;
  const id = params.id;


  // 1. Validação do ID
  if (!id) {
    return NextResponse.json<ErrorResponse>(
      { error: 'O ID do produto é obrigatório na URL.' },
      { status: 400 }
    );
  }

  try {
    // 2. Operação de DELETE com Prisma
    const deletedProduto = await prisma.produto.delete({
      where: {
        id: id, // 'id' deve ser o nome do campo identificador no seu modelo Produto no schema.prisma
      },
    });

    // Se chegou aqui, o produto foi deletado com sucesso.
    // O Prisma retorna o objeto deletado.
    
    // Você pode retornar o objeto deletado ou apenas uma mensagem de sucesso/status 204.
    // Retornar o objeto deletado pode ser útil para o frontend confirmar.
    return NextResponse.json(deletedProduto, { status: 200 });
    // Alternativamente, para um DELETE, um status 204 No Content também é comum:
    // return new NextResponse(null, { status: 204 });

  } catch (error: unknown) {
    let errorMessage = 'Erro desconhecido ao deletar produto do banco de dados.';
    let errorStatus = 500;

    console.error('[DB DELETE] Erro ao deletar produto:', error);

    // Tratar erros específicos do Prisma, como "Registro não encontrado"
    if (error instanceof Error && 'code' in error) {
        const prismaError = error as { code?: string; meta?: any; message: string, name?: string };
        // P2025 é o código do Prisma para "Record to delete not found"
        if (prismaError.code === 'P2025' || prismaError.name === 'PrismaClientKnownRequestError' && (prismaError.meta as any)?.cause === 'Record to delete does not exist.') {
            errorMessage = `Produto com ID "${id}" não encontrado para deleção.`;
            errorStatus = 404; // Not Found
        } else {
            errorMessage = prismaError.message; // Usa a mensagem de erro do Prisma
        }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json<ErrorResponse>(
      {
        error: 'Falha ao deletar produto.',
        details: errorMessage,
      },
      { status: errorStatus }
    );
  }

}