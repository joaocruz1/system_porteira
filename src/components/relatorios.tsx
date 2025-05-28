"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, TrendingUp, TrendingDown, Package, ShoppingCart, DollarSign, Download } from "lucide-react"
import { useEstoque } from "@/components/estoque-context"
import { useState } from "react"

export function Relatorios() {
  const { produtos, pedidos } = useEstoque()
  const [periodoSelecionado, setPeriodoSelecionado] = useState("mes")

  // Cálculos para relatórios
  const totalProdutos = produtos.length
  const totalItensEstoque = produtos.reduce((acc, p) => acc + p.quantidade, 0)
  const valorTotalEstoque = produtos.reduce((acc, p) => acc + p.quantidade * p.preco, 0)

  const pedidosConcluidos = pedidos.filter((p) => p.status === "concluido")
  const vendasTotais = pedidosConcluidos.reduce((acc, p) => acc + p.total, 0)
  const ticketMedio = pedidosConcluidos.length > 0 ? vendasTotais / pedidosConcluidos.length : 0

  const produtosMaisVendidos = pedidosConcluidos
    .flatMap((p) => p.produtos)
    .reduce(
      (acc, produto) => {
        const existing = acc.find((p) => p.produtoId === produto.produtoId)
        if (existing) {
          existing.quantidade += produto.quantidade
          existing.receita += produto.quantidade * produto.preco
        } else {
          acc.push({
            produtoId: produto.produtoId,
            nome: produto.nome,
            quantidade: produto.quantidade,
            receita: produto.quantidade * produto.preco,
          })
        }
        return acc
      },
      [] as Array<{ produtoId: string; nome: string; quantidade: number; receita: number }>,
    )
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 10)

  const produtosBaixoEstoque = produtos.filter((p) => p.quantidade < 20).sort((a, b) => a.quantidade - b.quantidade)

  const movimentacaoEstoque = pedidosConcluidos
    .flatMap((p) =>
      p.produtos.map((prod) => ({
        data: p.dataPedido,
        produto: prod.nome,
        tipo: "saida" as const,
        quantidade: prod.quantidade,
        valor: prod.quantidade * prod.preco,
      })),
    )
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    .slice(0, 20)

  const vendasPorCategoria = pedidosConcluidos
    .flatMap((p) => p.produtos)
    .reduce(
      (acc, produto) => {
        const produtoCompleto = produtos.find((pr) => pr.id === produto.produtoId)
        if (produtoCompleto) {
          const categoria = produtoCompleto.categoria
          if (acc[categoria]) {
            acc[categoria].quantidade += produto.quantidade
            acc[categoria].receita += produto.quantidade * produto.preco
          } else {
            acc[categoria] = {
              quantidade: produto.quantidade,
              receita: produto.quantidade * produto.preco,
            }
          }
        }
        return acc
      },
      {} as Record<string, { quantidade: number; receita: number }>,
    )

  const exportarRelatorio = (tipo: string) => {
    // Simulação de exportação
    alert(`Exportando relatório de ${tipo}...`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Relatórios</h2>
          <p className="text-muted-foreground">Análises detalhadas do seu negócio</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportarRelatorio("geral")}>
            <Download className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {vendasTotais.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +12% em relação ao mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {ticketMedio.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +5% em relação ao mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos Vendidos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{produtosMaisVendidos.reduce((acc, p) => acc + p.quantidade, 0)}</div>
            <p className="text-xs text-muted-foreground">{pedidosConcluidos.length} pedidos concluídos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor em Estoque</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {valorTotalEstoque.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {totalItensEstoque} itens em {totalProdutos} produtos
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="vendas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="vendas">Vendas</TabsTrigger>
          <TabsTrigger value="estoque">Estoque</TabsTrigger>
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
          <TabsTrigger value="movimentacao">Movimentação</TabsTrigger>
        </TabsList>

        <TabsContent value="vendas" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Produtos Mais Vendidos</CardTitle>
                <CardDescription>Top 10 produtos por quantidade vendida</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Qtd Vendida</TableHead>
                      <TableHead>Receita</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {produtosMaisVendidos.map((produto, index) => (
                      <TableRow key={produto.produtoId}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{index + 1}º</Badge>
                            {produto.nome}
                          </div>
                        </TableCell>
                        <TableCell>{produto.quantidade}</TableCell>
                        <TableCell>R$ {produto.receita.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vendas por Categoria</CardTitle>
                <CardDescription>Performance de vendas por categoria</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(vendasPorCategoria).map(([categoria, dados]) => (
                    <div key={categoria} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{categoria}</p>
                        <p className="text-sm text-muted-foreground">{dados.quantidade} itens vendidos</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">R$ {dados.receita.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">
                          {((dados.receita / vendasTotais) * 100).toFixed(1)}% do total
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="estoque" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Produtos com Baixo Estoque</CardTitle>
                <CardDescription>Produtos que precisam de reposição (menos de 20 unidades)</CardDescription>
              </CardHeader>
              <CardContent>
                {produtosBaixoEstoque.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {produtosBaixoEstoque.map((produto) => (
                        <TableRow key={produto.id}>
                          <TableCell className="font-medium">{produto.nome}</TableCell>
                          <TableCell>{produto.categoria}</TableCell>
                          <TableCell>{produto.quantidade}</TableCell>
                          <TableCell>
                            <Badge variant={produto.quantidade === 0 ? "destructive" : "secondary"}>
                              {produto.quantidade === 0 ? "Sem estoque" : "Baixo"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Todos os produtos têm estoque adequado</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumo do Estoque</CardTitle>
                <CardDescription>Visão geral do estoque atual</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span>Total de Produtos</span>
                    <span className="font-bold">{totalProdutos}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span>Total de Itens</span>
                    <span className="font-bold">{totalItensEstoque}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span>Valor Total</span>
                    <span className="font-bold">R$ {valorTotalEstoque.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span>Produtos Baixo Estoque</span>
                    <Badge variant={produtosBaixoEstoque.length > 0 ? "destructive" : "default"}>
                      {produtosBaixoEstoque.length}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="produtos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Produtos</CardTitle>
              <CardDescription>Informações detalhadas sobre todos os produtos</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Vendas</TableHead>
                    <TableHead>Receita</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {produtos.map((produto) => {
                    const vendas = produtosMaisVendidos.find((p) => p.produtoId === produto.id)
                    return (
                      <TableRow key={produto.id}>
                        <TableCell className="font-medium">{produto.nome}</TableCell>
                        <TableCell>{produto.categoria}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              produto.quantidade < 10
                                ? "destructive"
                                : produto.quantidade < 20
                                  ? "secondary"
                                  : "default"
                            }
                          >
                            {produto.quantidade}
                          </Badge>
                        </TableCell>
                        <TableCell>R$ {produto.preco.toFixed(2)}</TableCell>
                        <TableCell>R$ {(produto.quantidade * produto.preco).toFixed(2)}</TableCell>
                        <TableCell>{vendas?.quantidade || 0}</TableCell>
                        <TableCell>R$ {vendas?.receita.toFixed(2) || "0.00"}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movimentacao" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Movimentação de Estoque</CardTitle>
              <CardDescription>Histórico das últimas movimentações</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movimentacaoEstoque.map((mov, index) => (
                    <TableRow key={index}>
                      <TableCell>{new Date(mov.data).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="font-medium">{mov.produto}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          <TrendingDown className="mr-1 h-3 w-3" />
                          Saída
                        </Badge>
                      </TableCell>
                      <TableCell>{mov.quantidade}</TableCell>
                      <TableCell>R$ {mov.valor.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}