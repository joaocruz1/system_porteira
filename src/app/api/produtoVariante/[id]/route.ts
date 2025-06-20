import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


export async function DELETE(request: Request, context: { params: { id: string } }) {
  const { id } = await context.params;

  try {
    // Verifica se a variante existe antes de deletar
    const varianteExistente = await prisma.produtoVariante.findUnique({ where: { id } });
    if (!varianteExistente) {
      return NextResponse.json(
        { error: 'Variante de produto não encontrada.' },
        { status: 404 }
      );
    }

    const deletedVariante = await prisma.produtoVariante.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'Variante de produto deletada com sucesso!', deletedVariante },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao deletar variante de produto.', details: error.message },
      { status: 500 }
    );
  }
}


export async function PUT(request: Request, context: { params: { id: string } }) {
  const { id } = await context.params;
  let body;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Corpo da requisição inválido.' },
      { status: 400 }
    );
  }

  const { quantidade } = body;

  if (quantidade === undefined || isNaN(Number(quantidade))) {
    return NextResponse.json(
      { error: 'Campo "quantidade" é obrigatório e deve ser um número.' },
      { status: 400 }
    );
  }

  try {
    // Verifica se a variante existe antes de atualizar
    const varianteExistente = await prisma.produtoVariante.findUnique({ where: { id } });
    if (!varianteExistente) {
      return NextResponse.json(
        { error: 'Variante de produto não encontrada.' },
        { status: 404 }
      );
    }

    const updatedVariante = await prisma.produtoVariante.update({
      where: { id },
      data: { quantidade: Number(quantidade) },
    });

    return NextResponse.json(
      { message: 'Quantidade atualizada com sucesso!', updatedVariante },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao atualizar quantidade.', details: error.message },
      { status: 500 }
    );
  }
}