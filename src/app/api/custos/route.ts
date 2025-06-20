// src/app/api/perdas/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { put } from '@vercel/blob'; // 1. Importar a função put do Vercel Blob

// import { writeFile, stat, mkdir } from 'fs/promises';

interface ErrorResponse {
    error: string;
    details?: string;
}

// 2. Remover ou comentar a função ensureUploadDirExists, pois não será mais necessária para imagens de produtos.


export async function POST(request: NextRequest) {
  
  try {
    const formData = await request.formData();

    const descricao = formData.get('descricao') as string | null;
    const valorStr = formData.get('valor') as string | null;
    const dataVencimentoStr = formData.get('dataVencimento') as string | null;
    const dataPagamentoStr = formData.get('dataPagamento') as string | null;
    const categoria = formData.get('categoria') as string | null;
    const subcategoria = formData.get('subcategoria') as string | null;
    const status = formData.get('status') as string | null;
    const fornecedor = formData.get('fornecedor') as string | null;
    const observacoes = formData.get('observacoes') as string | null;
    const recorrenteStr = formData.get('recorrente') as string | null;
    const centroCusto = formData.get('centroCusto') as string | null;

    if (!descricao || !valorStr || !dataVencimentoStr || !categoria || !subcategoria || !status) {
        return NextResponse.json<ErrorResponse>(
          { error: 'Campos obrigatórios estão faltando. Verifique: descricao, valor, dataVencimento, categoria, subcategoria, status.' },
          { status: 400 }
        );
    }
    
    const valor = parseFloat(valorStr);
    if (isNaN(valor)) {
        return NextResponse.json<ErrorResponse>({ error: '"valor" deve ser um número válido.' }, { status: 400 });
    }

    const dataVencimento = new Date(dataVencimentoStr);
    
    const dataPagamento = dataPagamentoStr ? new Date(dataPagamentoStr) : undefined;

    const recorrente = recorrenteStr === 'true';

    const custoData = {
        descricao,
        valor,
        dataVencimento,
        dataPagamento,
        categoria,
        subcategoria,
        status,
        recorrente,
        // CORREÇÃO: Fornecer uma string vazia como padrão se o campo for nulo, para corresponder ao tipo esperado 'string'.
        fornecedor: fornecedor || '',
        observacoes: observacoes || '',
        centroCusto: centroCusto || '',
    };

    const novoCusto = await prisma.custos.create({
      data: custoData,
    });
    
    return NextResponse.json(novoCusto, { status: 201 });

  } catch (error: unknown) {
    console.error('[API POST /custos] Erro ao adicionar custo:', error);
    let errorMessage = 'Erro desconhecido ao adicionar custo.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json<ErrorResponse>(
      { error: 'Falha ao adicionar custo ao banco de dados.', details: errorMessage },
      { status: 500 }
    );
  }
}


//Este get está pronto para retornar apenas visualização dos custos anteriores
export async function GET(request: NextRequest) {
    try {
        const custos = await prisma.custos.findMany({
            orderBy: [
                { id: "desc" },
                { categoria: "asc" },
                { subcategoria: "asc" },
                { descricao: "asc" },
                { valor: "asc" },
                { dataVencimento: "asc" },
                { dataPagamento: "asc" },
                { status: "asc" },
                { fornecedor: "asc" },
                { observacoes: "asc" },
                {recorrente : "asc"},
                {centroCusto : "asc"}
            ],
        });
        return NextResponse.json(custos, { status: 200 });
    } catch (error: unknown) {
        console.error('[API GET /custos] Erro ao buscar custos:', error);
        let errorMessage = 'Erro desconhecido ao buscar custos.';
        if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
            errorMessage = error.message;
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }
        return NextResponse.json<ErrorResponse>(
            { error: 'Falha ao buscar perdas do banco de dados.', details: errorMessage },
            { status: 500 }
        );
    }
}