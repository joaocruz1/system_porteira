// src/app/api/perdas/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { put } from '@vercel/blob'; // 1. Importar a função put do Vercel Blob

// Remover as importações relacionadas ao sistema de arquivos local, se não forem mais usadas em outras partes do arquivo.
// import path from 'path';
// import { writeFile, stat, mkdir } from 'fs/promises';

interface ErrorResponse {
  error: string;
  details?: string;
}

// 2. Remover ou comentar a função ensureUploadDirExists, pois não será mais necessária para imagens de produtos.


export async function POST(request: NextRequest) {
  console.log("====== [APP ROUTER - POST /api/perdas] Adicionando produto ======");
  try {
    const formData = await request.formData();

    const produtoId = formData.get('produtoId') as string | null;
    const quantidadeStr = formData.get('quantidade') as string | null;
    const motivo = formData.get('motivo') as string | null;
    const descricao = formData.get('descricao') as string | null;
    const imageFile = formData.get('imageFile') as File | null; 
    
    console.log("[API POST /perdas] Conteúdo do formData para imageFile:", imageFile ? imageFile.name : "Nenhum arquivo recebido como imageFile");

    if (!produtoId) {
      return NextResponse.json<ErrorResponse>({ error: 'Campo "produtoId" é obrigatório.' }, { status: 400 });
    }

    const quantidade = quantidadeStr ? parseInt(quantidadeStr, 10) : 0;

    if (isNaN(quantidade)) {
        return NextResponse.json<ErrorResponse>({ error: '"quantidade" deve ser um número válido.' }, { status: 400 });
    }
    
    let imageUrlInBlob: string | null = null; // Para armazenar a URL do Blob

    if (imageFile) {
      console.log("[API POST /perdas] Processando arquivo de imagem para o Vercel Blob:", imageFile.name);
      
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

    const novaPerdaData: any = {
      produtoId,
      motivo: motivo || undefined,
      quantidade,
      descricao: descricao || undefined,
      // data_entrada: new Date(), // Descomente se precisar definir a data de entrada aqui
      image: imageUrlInBlob, // 4. Salvar a URL do Blob no banco de dados (ou null se não houver imagem)
    };

    const novaPerda = await prisma.perdas.create({
      data: novaPerdaData,
    });

    return NextResponse.json(novaPerda, { status: 201 });

  } catch (error: unknown) {
    console.error('[API POST /perdas] Erro ao adicionar produto:', error);
    let errorMessage = 'Erro desconhecido ao adicionar produto.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json<ErrorResponse>(
      { error: 'Falha ao adicionar produto ao banco de dados.', details: errorMessage },
      { status: 500 }
    );
  }
}


//Este get está pronto para retornar apenas visualização perdas anteriores, para puxar produt
export async function GET(request: NextRequest) {
  console.log("====== [APP ROUTER - GET /api/perdas] Buscando produtos ======");
  try {
    const perdas = await prisma.perdas.findMany({
      orderBy: [ 
        { id: "desc" },
        { produtoId: "asc" },
        { quantidade: "asc" },
        { motivo: "asc" },
        { dataPerda: "asc" },
        { descricao: "asc" }, 
        { image: "asc" }      
      ],
    });
    return NextResponse.json(perdas, { status: 200 });
  } catch (error: unknown) {
    console.error('[API GET /perdas] Erro ao buscar perdas:', error);
    let errorMessage = 'Erro desconhecido ao buscar perdas.';
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