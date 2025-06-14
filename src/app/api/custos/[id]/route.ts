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