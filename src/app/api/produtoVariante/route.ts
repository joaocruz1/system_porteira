// src/app/api/produtoVariante/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { put } from '@vercel/blob';

interface ErrorResponse {
    error: string;
    details?: string;
}

export async function POST(request: NextRequest) {
    console.log("====== [APP ROUTER - POST /api/produtoVariante] Adicionando variação de produto ======");
    try {
        const formData = await request.formData();

        const productId = formData.get('productId') as string | null;
        const quantidadeStr = formData.get('quantidade') as string | null;
        const cor = formData.get('cor') as string | null;
        const sku = formData.get('sku') as string | null;
        const imageFile = formData.get('image') as File | null;

        // --- VALIDAÇÃO ADICIONADA AQUI ---
        if (!productId) {
            return NextResponse.json<ErrorResponse>({ error: 'Campo "productId" é obrigatório.' }, { status: 400 });
        }
        // Garante que o campo 'cor' não seja nulo ou vazio
        if (!cor || cor.trim() === '') {
            return NextResponse.json<ErrorResponse>({ error: 'Campo "cor" é obrigatório e não pode ser vazio.' }, { status: 400 });
        }
        // --- FIM DA VALIDAÇÃO ---

        const quantidade = quantidadeStr ? parseInt(quantidadeStr, 10) : 0;
        if (isNaN(quantidade)) {
            return NextResponse.json<ErrorResponse>({ error: '"quantidade" deve ser um número válido.' }, { status: 400 });
        }

        let imageUrlInBlob: string | null = null;

        if (imageFile) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const safeFilename = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const blobFilename = `produtos/${uniqueSuffix}_${safeFilename}`;
            try {
                const blob = await put(blobFilename, imageFile, { access: 'public' });
                imageUrlInBlob = blob.url;
            } catch (uploadError) {
                console.error("Erro ao fazer upload da imagem para o Vercel Blob:", uploadError);
                return NextResponse.json<ErrorResponse>({ error: "Falha ao fazer upload da imagem." }, { status: 500 });
            }
        }

        const novoProdutoVarianteData = {
            cor: cor,
            quantidade: quantidade,
            sku: sku,
            image: imageUrlInBlob,
            produto: {
                connect: {
                    id: productId,
                },
            },
        };

        const novoProdutoVariante = await prisma.produtoVariante.create({
            data: novoProdutoVarianteData,
        });

        // Após criar a variação, precisamos recalcular e atualizar a quantidade total do produto pai
        const totalVariacoes = await prisma.produtoVariante.aggregate({
            _sum: {
                quantidade: true,
            },
            where: {
                productId: productId,
            },
        });

        await prisma.produto.update({
            where: {
                id: productId,
            },
            data: {
                quantidade: totalVariacoes._sum.quantidade || 0,
            },
        });


        return NextResponse.json(novoProdutoVariante, { status: 201 });

    } catch (error: unknown) {
        console.error('[API POST /produtoVariante] Erro ao adicionar variação de produto:', error);
        let errorMessage = 'Erro desconhecido ao adicionar variação de produto.';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        return NextResponse.json<ErrorResponse>(
            { error: 'Falha ao adicionar variação de produto ao banco de dados.', details: errorMessage },
            { status: 500 }
        );
    }
}


// O restante do arquivo (GET e config) permanece o mesmo...
export async function GET(request: NextRequest) {
    console.log("====== [APP ROUTER - GET /api/produtoVariante] Buscando variação de produtos ======");
    try {
        const perdas = await prisma.produtoVariante.findMany({
            orderBy: [
                { id: "desc" },
                { productId: "asc" },
                { quantidade: "asc" },
                { cor: "asc" },
                { sku: "asc" },
                { image: "asc" },
            ],
        });
        return NextResponse.json(perdas, { status: 200 });
    } catch (error: unknown) {
        console.error('[API GET /produtoVariante] Erro ao buscar variação de produtos:', error);
        let errorMessage = 'Erro desconhecido ao buscar variação de produtos.';
        if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
            errorMessage = error.message;
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }
        return NextResponse.json<ErrorResponse>(
            { error: 'Falha ao buscar variação de produtos do banco de dados.', details: errorMessage },
            { status: 500 }
        );
    }
}


export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb',
    },
  },
};