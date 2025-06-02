import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Certifique-se que está importando sua instância do Prisma corretamente

interface ErrorResponse {
  error: string;
  details?: string;
}

// --- FUNÇÃO GET para buscar todos os produtos ---
export async function GET(request: NextRequest) {
  console.log("====== [APP ROUTER - GET /api/produto] Buscando produtos ======");
  try {
    const produtos = await prisma.produto.findMany({
      orderBy: [ // <--- FORMATO DE ARRAY PARA MÚLTIPLAS ORDENAÇÕES
        // Use os nomes dos campos como definidos no seu schema.prisma
        { id: "desc" },          // 'id' é o nome do campo no modelo Prisma
        { nome: "asc" },
        { categoria: "asc" },
        { quantidade: "asc" },
        { preco: "asc" },
        { data_entrada: "asc" }, // 'data_entrada' é o nome do campo no modelo Prisma
        { image: "asc" }          // 'image' é o nome do campo no modelo Prisma
        // Adicione ou remova campos conforme sua necessidade de ordenação
        // Exemplo: para ordenar primeiro por nome e depois por data:
        // { nome: 'asc' },
        // { data_entrada: 'desc' }
      ],
    });
    return NextResponse.json(produtos, { status: 200 });
  } catch (error: unknown) {
    console.error('[API GET /produto] Erro ao buscar produtos:', error);
    let errorMessage = 'Erro desconhecido ao buscar produtos.';
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
        errorMessage = error.message; // PrismaClientValidationError já tem uma boa mensagem
    } else if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json<ErrorResponse>(
      { error: 'Falha ao buscar produtos do banco de dados.', details: errorMessage },
      { status: 500 }
    );
  }
}