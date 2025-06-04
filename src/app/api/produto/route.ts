// src/app/api/produto/route.ts
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
/*
async function ensureUploadDirExists() {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'produtos');
  try {
    await stat(uploadDir);
  } catch (e: any) {
    if (e.code === 'ENOENT') {
      console.log(`Criando diretório de uploads: ${uploadDir}`);
      await mkdir(uploadDir, { recursive: true });
    } else {
      console.error("Erro ao verificar/criar diretório de uploads:", e);
      throw e; 
    }
  }
  return uploadDir;
}
*/

export async function POST(request: NextRequest) {
  console.log("====== [APP ROUTER - POST /api/produto] Adicionando produto ======");
  try {
    const formData = await request.formData();

    const nome = formData.get('nome') as string | null;
    const categoria = formData.get('categoria') as string | null;
    const quantidadeStr = formData.get('quantidade') as string | null;
    const precoStr = formData.get('preco') as string | null;
    const fornecedor = formData.get('fornecedor') as string | null;
    const imageFile = formData.get('imageFile') as File | null; 
    
    console.log("[API POST /produto] Conteúdo do formData para imageFile:", imageFile ? imageFile.name : "Nenhum arquivo recebido como imageFile");

    if (!nome) {
      return NextResponse.json<ErrorResponse>({ error: 'Campo "nome" é obrigatório.' }, { status: 400 });
    }

    const quantidade = quantidadeStr ? parseInt(quantidadeStr, 10) : 0;
    const preco = precoStr ? parseFloat(precoStr) : 0.0;

    if (isNaN(quantidade)) {
        return NextResponse.json<ErrorResponse>({ error: '"quantidade" deve ser um número válido.' }, { status: 400 });
    }
    if (isNaN(preco)) {
        return NextResponse.json<ErrorResponse>({ error: '"preco" deve ser um número válido.' }, { status: 400 });
    }
    
    let imageUrlInBlob: string | null = null; // Para armazenar a URL do Blob

    if (imageFile) {
      console.log("[API POST /produto] Processando arquivo de imagem para o Vercel Blob:", imageFile.name);
      
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
        console.log(`[API POST /produto] Arquivo de imagem salvo no Vercel Blob: ${imageUrlInBlob}`);
      } catch (uploadError) {
        console.error("Erro ao fazer upload da imagem do produto para o Vercel Blob:", uploadError);
        return NextResponse.json<ErrorResponse>({ error: "Falha ao fazer upload da imagem do produto." }, { status: 500 });
      }
    } else {
      console.log("[API POST /produto] Nenhum arquivo de imagem (imageFile) foi recebido ou processado.");
    }

    const novoProdutoData: any = {
      nome,
      categoria: categoria || undefined,
      quantidade,
      preco,
      fornecedor: fornecedor || undefined,
      // data_entrada: new Date(), // Descomente se precisar definir a data de entrada aqui
      image: imageUrlInBlob, // 4. Salvar a URL do Blob no banco de dados (ou null se não houver imagem)
    };

    const novoProduto = await prisma.produto.create({
      data: novoProdutoData,
    });

    return NextResponse.json(novoProduto, { status: 201 });

  } catch (error: unknown) {
    console.error('[API POST /produto] Erro ao adicionar produto:', error);
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

export async function GET(request: NextRequest) {
  console.log("====== [APP ROUTER - GET /api/produto] Buscando produtos ======");
  try {
    const produtos = await prisma.produto.findMany({
      orderBy: [ 
        { id: "desc" },
        { nome: "asc" },
        { categoria: "asc" },
        { quantidade: "asc" },
        { preco: "asc" },
        { data_entrada: "asc" }, 
        { image: "asc" }      
      ],
    });
    return NextResponse.json(produtos, { status: 200 });
  } catch (error: unknown) {
    console.error('[API GET /produto] Erro ao buscar produtos:', error);
    let errorMessage = 'Erro desconhecido ao buscar produtos.';
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
        errorMessage = error.message; 
    } else if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json<ErrorResponse>(
      { error: 'Falha ao buscar produtos do banco de dados.', details: errorMessage },
      { status: 500 }
    );
  }
}
