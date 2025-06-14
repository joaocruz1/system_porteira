// app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
  // 1. Verificação do método HTTP
  if (request.method !== 'POST') {
    return new NextResponse('Method Not Allowed', { status: 405 });
  }

  // 2. Verificação do token de autorização da API
  const authHeader = request.headers.get('authorization');
  const expectedToken = `Bearer ${process.env.API_SECRET_TOKEN}`;

  if (!authHeader || authHeader !== expectedToken) {
    return new NextResponse(
      JSON.stringify({ error: 'Acesso não autorizado à API.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // 3. Parse dos dados do corpo da requisição
    const body = await request.json();
    const { email, password } = body;

    // 4. Validação dos campos obrigatórios
    if (!email || !password) {
      return new NextResponse(
        JSON.stringify({ error: 'Email e senha são obrigatórios.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 5. Busca o usuário no banco de dados
    const user = await prisma.loginUser.findUnique({
      where: { email: email },
    });

    // 6. Verifica se o usuário existe
    if (!user) {
      return new NextResponse(
        JSON.stringify({ error: 'Credenciais inválidas' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 7. Valida a senha
    const isPasswordValid = await bcrypt.compare(password, user.senha);
    if (!isPasswordValid) {
      return new NextResponse(
        JSON.stringify({ error: 'Credenciais inválidas' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 8. Gera o token JWT
    const jwtPayload = {
      userId: user.id,
      email: user.email,
      name: user.nome,
      cargo : user.cargo
    };
    
    const token = jwt.sign(
      jwtPayload,
      process.env.JWT_SECRET as string,
      { expiresIn: '1d' }
    );

    // 9. Remove a senha do objeto de resposta
    const { senha: _, ...userWithoutPassword } = user;

    // 10. Retorna a resposta de sucesso
    return new NextResponse(
      JSON.stringify({
        message: 'Login bem-sucedido!',
        user: userWithoutPassword,
        token: token,
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          // Opcional: Você pode adicionar o token como cookie seguro aqui
          // 'Set-Cookie': `token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict`
        } 
      }
    );

  } catch (error) {
    console.error('Erro no login:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Ocorreu um erro interno.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}