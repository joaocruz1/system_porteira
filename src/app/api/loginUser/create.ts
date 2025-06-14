// pages/api/customer/create.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';


// Importe aqui o seu cliente de banco de dados (ex: Prisma, Mongoose, etc.)
// import { prisma } from '/lib/db'; 

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 1. Garante que o método da requisição seja POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }


  const authHeader = req.headers.authorization;

  const expectedToken = `Bearer ${process.env.API_SECRET_TOKEN}`;

  if (!authHeader || authHeader !== expectedToken) {
    return res.status(401).json({ error: 'Acesso não autorizado.' });
  }
  
  // --- FIM DA VALIDAÇÃO ---

  try {
    const { email, nome, cargo, password, ativo, ...customerData } = req.body;

    // 2. Validação básica dos dados recebidos
    if ( !email || !nome || !cargo || !password || !ativo ) {
      return res.status(400).json({ error: 'Campos obrigatórios (email, password) não foram preenchidos.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
  
        // password: passwordHash, // NUNCA salve a senha original

    const newUserPayloadPrisma = {
      id :"22eb0fa0-c2e6-4275-b0be-2ac4952a4024",
      email,
      nome,
      password: passwordHash, // NUNCA salve a senha original
      status : "ACTIVE"
    };
    const novoUser = await prisma.loginUser.create({
      data: newUserPayloadPrisma as any,
      });
      
    return res.status(201).json({ message: 'Usuário criado com sucesso!', novoUser});

  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return res.status(500).json({ error: 'Ocorreu um erro interno ao criar o usuário.' });
  }
}