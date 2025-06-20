// src/app/api/produto/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { put } from '@vercel/blob';

interface ErrorResponse {
  error: string;
  details?: string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // 1. Extrair dados do formulário
    const name = formData.get('name') as string | null;
    const category = formData.get('category') as string | null;
    const basePriceStr = formData.get('basePrice') as string | null;
    const provider = formData.get('provider') as string | null;
    const variationsStr = formData.get('variations') as string | null;

    // 2. Validação básica
    if (!name || !basePriceStr || !variationsStr) {
      return NextResponse.json<ErrorResponse>({ error: 'Campos obrigatórios (nome, preço base, variações) não foram preenchidos.' }, { status: 400 });
    }

    const basePrice = parseFloat(basePriceStr);
    if (isNaN(basePrice)) {
      return NextResponse.json<ErrorResponse>({ error: '"basePrice" deve ser um número válido.' }, { status: 400 });
    }

    const variations: Array<{ color: string; quantity: number }> = JSON.parse(variationsStr);
    if (!Array.isArray(variations) || variations.length === 0) {
      return NextResponse.json<ErrorResponse>({ error: 'Pelo menos uma variação é necessária.' }, { status: 400 });
    }
    
    // 3. Calcular a quantidade total para o produto principal
    const totalQuantity = variations.reduce((acc, v) => acc + (v.quantity || 0), 0);

    // 4. Usar uma transação para garantir a integridade dos dados
    const novoProdutoComVariacoes = await prisma.$transaction(async (tx) => {
      // 4.1. Criar o produto principal
      const produtoPrincipal = await tx.produto.create({
        data: {
          nome: name,
          categoria: category,
          preco: basePrice, // O campo 'preco' no DB recebe o 'basePrice'
          quantidade: totalQuantity, // A quantidade total é a soma das variações
          fornecedor: provider,
          data_entrada: new Date(),
          image: null, // A imagem principal do produto pode ser a da primeira variação ou nula
        },
      });

      // 4.2. Iterar e criar cada variação
      const variacoesCriadas = [];
      for (let i = 0; i < variations.length; i++) {
        const variationData = variations[i];
        const imageFile = formData.get(`variation_image_${i}`) as File | null;
        let imageUrlInBlob: string | null = null;

        // Fazer upload da imagem da variação, se existir
        if (imageFile) {
          const blobFilename = `produtos/${produtoPrincipal.id}-${i}_${imageFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
          const blob = await put(blobFilename, imageFile, { access: 'public' });
          imageUrlInBlob = blob.url;

          // Se for a primeira imagem, atualiza a imagem principal do produto
          if (i === 0) {
            await tx.produto.update({
              where: { id: produtoPrincipal.id },
              data: { image: imageUrlInBlob },
            });
          }
        }

        // Criar o registro da variação no banco
        const novaVariacao = await tx.produtoVariante.create({
          data: {
            productId: produtoPrincipal.id, // Link com o produto principal
            cor: variationData.color,
            quantidade: variationData.quantity,
            image: imageUrlInBlob,
          },
        });
        variacoesCriadas.push(novaVariacao);
      }
      
      // Retornar o produto completo com suas variações
      return { ...produtoPrincipal, variacoes: variacoesCriadas };
    });

    return NextResponse.json(novoProdutoComVariacoes, { status: 201 });

  } catch (error: unknown) {
    console.error('[API POST /produto] Erro ao adicionar produto e variações:', error);
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
  try {
    const produtosDoBanco = await prisma.produto.findMany({
      include: {
        variacoes: true, // Mantemos a busca com o nome correto do schema
      },
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

    // ✨ SOLUÇÃO: Mapeia o resultado para a estrutura esperada pelo frontend
    const produtosParaFrontend = produtosDoBanco.map(produto => {
      const { variacoes, ...restoDoProduto } = produto;
      return {
        ...restoDoProduto,
        variations: variacoes || [] // Renomeia 'variacoes' para 'variations' e garante que seja um array
      };
    });

    return NextResponse.json(produtosParaFrontend, { status: 200 });
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