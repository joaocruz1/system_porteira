"use server"

import { redirect } from "next/navigation"
import { getUserByEmail, verifyPassword } from "@/lib/users"
import { createSession, deleteSession } from "@/lib/auth"

export interface LoginState {
  error?: string
  success?: boolean
}

export async function login(prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Email e senha são obrigatórios" }
  }

  try {
    const user = await getUserByEmail(email)

    if (!user) {
      return { error: "Credenciais inválidas" }
    }

    const isValidPassword = await verifyPassword(password, user.senha)

    if (!isValidPassword) {
      return { error: "Credenciais inválidas" }
    }

    await createSession(user.id, user.email, user.nome, user.cargo)
  } catch (error) {
    console.error("Erro no login:", error)
    return { error: "Erro interno do servidor" }
  }

  redirect("/dashboard")
}

export async function logout() {
  await deleteSession()
  redirect("/login")
}
