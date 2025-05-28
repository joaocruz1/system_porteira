"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, ShoppingCart, TrendingUp } from "lucide-react"
import { useEstoque } from "@/components/estoque-context"
import { Badge } from "@/components/ui/badge"

export function Dashboard() {
  const { produtos, pedidos } = useEstoque()

  const totalProdutos = produtos.length
  const totalItensEstoque = produtos.reduce((acc, p) => acc + p.quantidade, 0)
  const valorTotalEstoque = produtos.reduce((acc, p) => acc + p.quantidade * p.preco, 0)
  const produtosBaixoEstoque = produtos.filter((p) => p.quantidade < 20).length

  const pedidosPendentes = pedidos.filter((p) => p.status === "pendente").length
  const pedidosProcessando = pedidos.filter((p) => p.status === "processando").length
  const vendasMes = pedidos.filter((p) => p.status === "concluido").reduce((acc, p) => acc + p.total, 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Visão geral do seu estoque e vendas</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProdutos}</div>
            <p className="text-xs text-muted-foreground">{totalItensEstoque} itens em estoque</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor do Estoque</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {valorTotalEstoque.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Valor total em produtos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Pendentes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pedidosPendentes}</div>
            <p className="text-xs text-muted-foreground">{pedidosProcessando} em processamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas do Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {vendasMes.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Vendas concluídas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Produtos com Baixo Estoque</CardTitle>
            <CardDescription>Produtos com menos de 20 unidades</CardDescription>
          </CardHeader>
          <CardContent>
            {produtosBaixoEstoque > 0 ? (
              <div className="space-y-2">
                {produtos
                  .filter((p) => p.quantidade < 20)
                  .map((produto) => (
                    <div key={produto.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{produto.nome}</p>
                        <p className="text-sm text-muted-foreground">{produto.categoria}</p>
                      </div>
                      <Badge variant="destructive">{produto.quantidade} unidades</Badge>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Todos os produtos têm estoque adequado</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pedidos Recentes</CardTitle>
            <CardDescription>Últimos pedidos realizados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pedidos.slice(0, 5).map((pedido) => (
                <div key={pedido.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{pedido.cliente}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(pedido.dataPedido).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">R$ {pedido.total.toFixed(2)}</p>
                    <Badge
                      variant={
                        pedido.status === "concluido"
                          ? "default"
                          : pedido.status === "processando"
                            ? "secondary"
                            : pedido.status === "pendente"
                              ? "outline"
                              : "destructive"
                      }
                    >
                      {pedido.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
