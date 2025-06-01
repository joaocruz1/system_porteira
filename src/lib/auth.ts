import "server-only"
import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

const secretKey = process.env.SESSION_SECRET 
const encodedKey = new TextEncoder().encode(secretKey)

export interface SessionPayload {
  userId: string
  email: string
  nome: string
  cargo: string
  expiresAt: Date
}

export async function encrypt(payload: SessionPayload) {
  return new SignJWT({
    ...payload,
    expiresAt: payload.expiresAt.toISOString()
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey)
}

export async function decrypt(session: string | undefined = "") {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    })
    
    // Convertendo o payload para SessionPayload
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      nome: payload.nome as string,
      cargo: payload.cargo as string,
      expiresAt: new Date(payload.expiresAt as string)
    } as SessionPayload
  } catch (error) {
    console.log("Failed to verify session")
    return null
  }
}

export async function createSession(userId: string, email: string, nome: string, cargo: string) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const session = await encrypt({ userId, email, nome, cargo, expiresAt })
  const cookieStore = cookies()

  ;(await cookieStore).set("session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  })
}

export async function deleteSession() {
  const cookieStore = cookies()
  ;(await cookieStore).delete("session")
}

export async function getSession() {
  const cookieStore = cookies()
  const session = (await cookieStore).get("session")?.value
  return await decrypt(session)
}

export async function updateSession() {
  const session = await getSession()
  if (!session) return null

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const cookieStore = cookies()

  ;(await cookieStore).set("session", await encrypt({ ...session, expiresAt }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  })
}