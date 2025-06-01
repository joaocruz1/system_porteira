"use client"

import { useActionState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Package, Eye, EyeOff, AlertCircle } from "lucide-react"
import { login } from "@/app/actions/auth"
import { useState } from "react"

export function LoginForm() {
  const [state, action, isPending] = useActionState(login, { error: "", success: false })
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-4">
            <Package className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-700">Porteira de Minas</CardTitle>
          <CardDescription>Sistema de Controle de Estoque</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            {state.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="seu@email.com" required disabled={isPending} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Sua senha"
                  required
                  disabled={isPending}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isPending}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Usuários de Teste:</h4>
            <div className="space-y-1 text-xs text-gray-600">
              <p>
                <strong>Admin:</strong> admin@porteirademinas.com
              </p>
              <p>
                <strong>Gerente:</strong> gerente@porteirademinas.com
              </p>
              <p>
                <strong>Funcionário:</strong> funcionario@porteirademinas.com
              </p>
              <p>
                <strong>Senha:</strong> password (para todos)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
