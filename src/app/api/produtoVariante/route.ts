// src/app/api/produtoVariante/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { put } from '@vercel/blob'; // 1. Importar a função put do Vercel Blob

interface ErrorResponse {
    error: string;
    details?: string;
}

// 2. Remover ou comentar a função ensureUploadDirExists, pois não será mais necessária para imagens de produtos.


export async function POST(request: NextRequest) {
    console.log("====== [APP ROUTER - POST /api/produtoVariante] Adicionando variação de produto ======");
    try {
        const formData = await request.formData();

        const productId = formData.get('productId') as string | null;
        const quantidadeStr = formData.get('quantidade') as string | null;
        const cor = formData.get('cor') as string | null;
        const sku = formData.get('sku') as string | null;
        const imageFile = formData.get('image') as File | null;

        console.log("[API POST /produtoVariante] Conteúdo do formData para imageFile:", imageFile ? imageFile.name : "Nenhum arquivo recebido como imageFile");

        if (!productId) {
            return NextResponse.json<ErrorResponse>({ error: 'Campo "productId" é obrigatório.' }, { status: 400 });
        }

        const quantidade = quantidadeStr ? parseInt(quantidadeStr, 10) : 0;

        if (isNaN(quantidade)) {
            return NextResponse.json<ErrorResponse>({ error: '"quantidade" deve ser um número válido.' }, { status: 400 });
        }

        let imageUrlInBlob: string | null = null; // Para armazenar a URL do Blob

        if (imageFile) {
            console.log("[API POST /produtoVariante] Processando arquivo de imagem para o Vercel Blob:", imageFile.name);

            // 3. Fazer o upload para o Vercel Blob
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const safeFilename = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            // Adicionar um prefixo de pasta específico para produtos, ex: 'produtos/'
            const blobFilename = `produtos/${uniqueSuffix}_${safeFilename}`;

            try {
                const blob = await put(blobFilename, imageFile, {
                    access: 'public', // Torna o arquivo publicamente acessível
                    // contentType: imageFile.type, // Opcional, o Vercel Blob geralmente infere isso
                });
                imageUrlInBlob = blob.url; // Armazena a URL retornada pelo Vercel Blob
                console.log(`[API POST /perdas] Arquivo de imagem salvo no Vercel Blob: ${imageUrlInBlob}`);
            } catch (uploadError) {
                console.error("Erro ao fazer upload da imagem do produto para o Vercel Blob:", uploadError);
                return NextResponse.json<ErrorResponse>({ error: "Falha ao fazer upload da imagem do produto." }, { status: 500 });
            }
        } else {
            console.log("[API POST /perdas] Nenhum arquivo de imagem (imageFile) foi recebido ou processado.");
        }

        const novoProdutoVarianteData: any = {
            productId,
            cor,
            quantidade,
            sku,
            image: imageUrlInBlob,
        };

        const novoProdutoVariante = await prisma.produtoVariante.create({
            data: novoProdutoVarianteData,
        });

        return NextResponse.json(novoProdutoVariante, { status: 201 });

    } catch (error: unknown) {
        console.error('[API POST /produtoVariante] Erro ao adicionar produto:', error);
        let errorMessage = 'Erro desconhecido ao adicionar viriação de produto.';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        return NextResponse.json<ErrorResponse>(
            { error: 'Falha ao adicionar variação de produto ao banco de dados.', details: errorMessage },
            { status: 500 }
        );
    }
}


//Este get está pronto para retornar apenas visualização variação de produtos anteriores, para puxar produt
export async function GET(request: NextRequest) {
    console.log("====== [APP ROUTER - GET /api/produtoVariante] Buscando vaciação de produtos ======");
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