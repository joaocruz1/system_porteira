// app/api/customer/create/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  // 1. Verificação do método HTTP
  if (request.method !== 'POST') {
    return new NextResponse('Method Not Allowed', { status: 405 });
  }

  // 2. Verificação do token de autorização
  const authHeader = request.headers.get('authorization');
  const expectedToken = `Bearer ${process.env.API_SECRET_TOKEN}`;

  if (!authHeader || authHeader !== expectedToken) {
    return new NextResponse(
      JSON.stringify({ error: 'Acesso não autorizado.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // 3. Parse dos dados do corpo da requisição
    const body = await request.json();
    const { email, nome, cargo, password, ativo, ...customerData } = body;

    // 4. Validação dos campos obrigatórios
    if (!email || !nome || !cargo || !password || ativo === undefined) {
      return new NextResponse(
        JSON.stringify({ error: 'Campos obrigatórios não foram preenchidos.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 5. Criptografia da senha
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 6. Criação do payload para o Prisma
    const newUserPayload = {
      email,
      nome,
      cargo,
      password: passwordHash,
      ativo,
      status: 'ACTIVE',
      ...customerData
    };

    // 7. Criação do usuário no banco de dados
    const novoUser = await prisma.loginUser.create({
      data: newUserPayload,
    });

    // 8. Retorno da resposta de sucesso
    return new NextResponse(
      JSON.stringify({ 
        message: 'Usuário criado com sucesso!', 
        user: {
          email: novoUser.email,
          nome: novoUser.nome,
          status: novoUser.ativo
        }
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    
    // 9. Tratamento de erros
    return new NextResponse(
      JSON.stringify({ error: 'Ocorreu um erro interno ao criar o usuário.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}