import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const custo = await prisma.custos.findUnique({
      where: { id },
    });

    if (!custo) {
      return NextResponse.json({ error: 'Custo não encontrado.' }, { status: 404 });
    }

    return NextResponse.json(custo);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar custo.' }, { status: 500 });
  }
}


export async function DELETE(request: Request, context: { params: { id: string } }) {
  const { id } = context.params;

  try {
    const deletedCusto = await prisma.custos.delete({
      where: { id: id }, // id é string (UUID)
    });

    return NextResponse.json(
      { message: 'Custo deletado com sucesso!', deletedCusto },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao deletar custo.' },
      { status: 500 }
    );
  }
}


export async function PUT(request: Request, context: any) {
  const { id } = await context.params;
  const body = await request.json();
  const { valor } = body;

  try {
    const updatedCusto = await prisma.custos.update({
      where: { id },
      data: { valor: Number(valor) },
    });

    return NextResponse.json(
      { message: 'Valor atualizado com sucesso!', updatedCusto },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao atualizar valor.' },
      { status: 500 }
    );
  }
}