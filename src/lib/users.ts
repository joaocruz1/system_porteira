import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Busca o usuário DIRETAMENTE no banco de dados.
export async function findUserByEmail(email: string) {
  try {
    const user = await prisma.loginUser.findUnique({
      where: { email },
    });
    // A função retorna o objeto do usuário completo (incluindo a senha) ou null.
    return user;
  } catch (error) {
    console.error("Erro ao buscar usuário no banco de dados:", error);
    return null;
  }
}

// Compara a senha do formulário com a senha criptografada do banco.
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  // Se hashedPassword for nulo ou indefinido, a comparação falhará.
  if (!hashedPassword) {
    return false;
  }
  return bcrypt.compare(password, hashedPassword);
}

// Funções restantes (não são o problema, mas fazem parte do arquivo)
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function getUserPermissions(cargo: string) {
  const permissions = {
    admin: {
      canViewDashboard: true,
      canManageStock: true,
      canManageSales: true,
      canViewReports: true,
      canCreateQuotes: true,
      canManageUsers: true,
    },
    gerente: {
      canViewDashboard: true,
      canManageStock: true,
      canManageSales: true,
      canViewReports: true,
      canCreateQuotes: true,
      canManageUsers: false,
    },
    funcionario: {
      canViewDashboard: true,
      canManageStock: false,
      canManageSales: true,
      canViewReports: false,
      canCreateQuotes: true,
      canManageUsers: false,
    },
  };

  return permissions[cargo as keyof typeof permissions] || permissions.funcionario;
}