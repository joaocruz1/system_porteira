import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma'; // Importando seu client do Prisma
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 1. Garante que o método seja POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // 2. Validação do Token da API (opcional para login, mas mantém consistência)
  const authHeader = req.headers.authorization;
  const expectedToken = `Bearer ${process.env.API_SECRET_TOKEN}`;

  if (!authHeader || authHeader !== expectedToken) {
    return res.status(401).json({ error: 'Acesso não autorizado à API.' });
  }

  // --- LÓGICA DE LOGIN ---
  try {
    const { email, password } = req.body;

    // 3. Valida se email e senha foram enviados
    if (!email || !password) {
      return res.status(400).json({ error: 'email e senha são obrigatórios.' });
    }

    // 4. Busca o usuário no banco de dados pelo email
    const user = await prisma.loginUser.findUnique({
      where: { email: email },
    });

    // 5. Se o usuário não existe, retorna erro. Use uma mensagem genérica por segurança.
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // 6. Compara a senha enviada com o hash salvo no banco
    const isPasswordValid = await bcrypt.compare(password, user.password);

    // 7. Se a senha for inválida, retorna o mesmo erro genérico
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // 8. Se o login for bem-sucedido, gere um Token JWT
    const jwtPayload = {
      userId: user.id,
      email: user.email,
      name: user.nome,
    };
    
    const token = jwt.sign(
      jwtPayload,
      process.env.JWT_SECRET as string, // Segredo para assinar o token
      { expiresIn: '1d' } // Token expira em 1 dia
    );

    // Remove a senha do objeto de usuário antes de enviar a resposta
    const { password: _, ...userWithoutPassword } = user;

    // 9. Retorna os dados do usuário e o token
    return res.status(200).json({
      message: 'Login bem-sucedido!',
      user: userWithoutPassword,
      token: token,
    });

  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ error: 'Ocorreu um erro interno.' });
  }
}