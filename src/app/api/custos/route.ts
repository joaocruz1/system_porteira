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
    console.log("====== [APP ROUTER - POST /api/custos] Adicionando gostos ======");
    try {
        const formData = await request.formData();

        const descricao = formData.get('descricao') as string | null;
        const valorStr = formData.get('valor') as string | null;
        const dataCustoStr = formData.get('dataCusto') as string | null;
        const categoria = formData.get('categoria') as string | null;
        const observacoes = formData.get('observacoes') as string | null;

        const dataCustoISO = dataCustoStr ? new Date(dataCustoStr) : undefined;
        
        if (!descricao) {
            return NextResponse.json<ErrorResponse>({ error: 'Campo "descricao" é obrigatório.' }, { status: 400 });
        }

        const valor = valorStr ? parseFloat(valorStr) : 0;

        if (isNaN(valor)) {
            return NextResponse.json<ErrorResponse>({ error: '"valor" deve ser um número válido.' }, { status: 400 });
        }

        const novaPerdaData: any = {
            descricao,
            valor,
            dataCusto: dataCustoISO || undefined,
            categoria: categoria || undefined,
            observacoes: observacoes || undefined,
        };

        const novoCusto = await prisma.custos.create({
            data: novaPerdaData,
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
    console.log("====== [APP ROUTER - GET /api/custos] Buscando registos de custos ======");
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