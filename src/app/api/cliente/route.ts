import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';

type ErrorResponse = {
    error: string;
    details?: string;
}

export async function POST(request: NextRequest) {
    try {
        // 1. Mude para request.json()
        const body = await request.json();

        // 2. Acesse os campos como propriedades do objeto 'body'
        const nome = body.name as string | null;
        const phoneString = body.phone as string | null; // Receber como string
        const address = body.address as string | null;
        const email = body.email as string | null;
        const company = body.company as string | null;

        // Converter 'phone' para número, se necessário para o Prisma
        let phone: number | null = null;
        if (phoneString) {
            const parsedPhone = parseInt(phoneString, 10);
            if (!isNaN(parsedPhone)) {
                phone = parsedPhone;
            } else {
                console.warn(`Valor de telefone inválido recebido: ${phoneString}`);
            }
        }

        const novoClienteData: any = {
            nome,
            numero: phone,
            endereco: address,
            email,
            empresa: company
        };

        // Validação (exemplo)
        if (!nome) {
            return NextResponse.json<ErrorResponse>(
                { error: 'Falha ao adicionar cliente.', details: 'O campo "nome" é obrigatório.' },
                { status: 400 }
            );
        }
        // Adicione mais validações se necessário (ex: para email, phone, address)

        const novoCliente = await prisma.cliente.create({
            data: novoClienteData
        });

        return NextResponse.json(novoCliente, { status: 201 });

    } catch (error: unknown) {
        console.error('[API POST /api/cliente] Erro ao adicionar cliente:', error);
        let errorMessage = 'Erro desconhecido ao adicionar cliente.';
        let statusCode = 500;

        // Este erro de SyntaxError é mais provável de acontecer com request.json() se o JSON estiver mal formado
        if (error instanceof SyntaxError && error.message.includes("JSON")) {
            errorMessage = "Formato de JSON inválido na requisição.";
            statusCode = 400;
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }
        
        return NextResponse.json<ErrorResponse>(
            { error: 'Falha ao adicionar cliente ao banco de dados.', details: errorMessage },
            { status: statusCode }
        );
    }
}