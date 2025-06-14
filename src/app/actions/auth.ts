"use server";

import { redirect } from "next/navigation";
import { findUserByEmail, verifyPassword } from "@/lib/users";
import { createSession, deleteSession } from "@/lib/auth";

export interface LoginState {
  error?: string;
  success?: boolean;
}

export async function login(prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email e senha são obrigatórios" };
  }

  try {
    // Ponto de falha 1: Se findUserByEmail falhar, o erro aparecerá aqui.
    const user = await findUserByEmail(email);

    if (!user) {
      return { error: "Credenciais inválidas" };
    }

    // Ponto de falha 2: Se user não tiver a propriedade 'senha', o erro aparecerá aqui.
    const isValidPassword = await verifyPassword(password, user.senha);

    if (!isValidPassword) {
      return { error: "Credenciais inválidas" };
    }

    // Ponto de falha 3: Se a criação da sessão falhar (ex: SESSION_SECRET faltando), o erro aparecerá aqui.
    await createSession(user.id, user.email, user.nome, user.cargo);

  } catch (error) {
    console.error("Erro no login:", error);
    return { error: "Erro interno do servidor" };
  }

  redirect("/dashboard");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}