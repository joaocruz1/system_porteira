import bcrypt from "bcryptjs"

export interface User {
  id: string
  email: string
  nome: string
  cargo: "admin" | "funcionario" | "gerente"
  senha: string
  ativo: boolean
  dataCriacao: string
}

// Simulação de banco de dados de usuários
// Em produção, isso viria de um banco de dados real
const users: User[] = [
  {
    id: "1",
    email: "admin@porteirademinas.com",
    nome: "Administrador",
    cargo: "admin",
    senha: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
    ativo: true,
    dataCriacao: "2024-01-01",
  },
  {
    id: "2",
    email: "gerente@porteirademinas.com",
    nome: "João Silva",
    cargo: "gerente",
    senha: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
    ativo: true,
    dataCriacao: "2024-01-01",
  },
  {
    id: "3",
    email: "funcionario@porteirademinas.com",
    nome: "Maria Santos",
    cargo: "funcionario",
    senha: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
    ativo: true,
    dataCriacao: "2024-01-01",
  },
]

export async function getUserByEmail(email: string): Promise<User | null> {
  return users.find((user) => user.email === email && user.ativo) || null
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
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
  }

  return permissions[cargo as keyof typeof permissions] || permissions.funcionario
}
