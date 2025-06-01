import { type NextRequest, NextResponse } from "next/server"
import { decrypt } from "@/lib/auth"

const protectedRoutes = ["/dashboard"]
const publicRoutes = ["/login", "/orcamento"]

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname
  const isProtectedRoute = protectedRoutes.includes(path) || path.startsWith("/dashboard")
  const isPublicRoute = publicRoutes.includes(path)

  // Allow public quote page without authentication
  if (path === "/orcamento") {
    return NextResponse.next()
  }

  const cookie = req.cookies.get("session")?.value
  const session = await decrypt(cookie)

  // Redirecionar para login se tentar acessar rota protegida sem sessão
  if (isProtectedRoute && !session?.userId) {
    return NextResponse.redirect(new URL("/login", req.nextUrl))
  }

  // Redirecionar para dashboard se já logado e tentar acessar login
  if (path === "/login" && session?.userId) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl))
  }

  // Redirecionar root para dashboard se logado, senão para login
  if (path === "/") {
    if (session?.userId) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl))
    } else {
      return NextResponse.redirect(new URL("/login", req.nextUrl))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
}
