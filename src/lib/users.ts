import bcrypt from "bcryptjs"

export interface User {
  message: string;
  user: {
    id: string;
    email: string;
    name: string;
    cpf: string;
    status: string;
  };
  token: string; 
}


export async function getUserByEmail(email: string, password: string): Promise<User | null> {

  try{
  const response = fetch('/api/loginUser/login', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.API_SECRET_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email,password }),
  })

  return response.data
  }catch(error){
    return null
  }
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
