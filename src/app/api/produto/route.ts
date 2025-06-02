import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Ajuste o caminho se sua instância do Prisma estiver em outro lugar

interface ErrorResponse {
  error: string;
  details?: string;
}

// --- FUNÇÃO GET para buscar todos os produtos ---
export async function GET(request: NextRequest) {
  console.log("====== [APP ROUTER - GET /api/produto] Buscando produtos ======");
  try {
    const produtos = await prisma.produto.findMany({
      orderBy: {
        id : 'desc',
        nome: 'asc',
        categoria: 'asc',
        quantidade: 'asc',
        preco: 'asc',
        data_entrada: 'asc',
        image: 'asc',
      },
    });
    return NextResponse.json(produtos, { status: 200 });
  } catch (error: unknown) {
    console.error('[API GET /produtos] Erro ao buscar produtos:', error);
    let errorMessage = 'Erro desconhecido ao buscar produtos.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json<ErrorResponse>(
      { error: 'Falha ao buscar produtos do banco de dados.', details: errorMessage },
      { status: 500 }
    );
  }
}