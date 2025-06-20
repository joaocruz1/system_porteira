"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ArrowLeft, Package, DollarSign, Edit, History, TrendingUp, Palette, Plus, Trash2 } from "lucide-react"
import { useEstoque, type ProductVariante } from "@/components/estoque-context"
import { useState } from "react"

interface DetalhesProdutoProps {
  produtoId: string
  onVoltar: () => void
}

export function DetalhesProduto({ produtoId, onVoltar }: DetalhesProdutoProps) {
  const { produtos, pedidos, atualizarQuantidadeVariacao, removerProduto, adicionarVariacao, removerVariacao } =
    useEstoque()
  const [editandoVariacao, setEditandoVariacao] = useState<string | null>(null)
  const [novaQuantidade, setNovaQuantidade] = useState(0)
  const [dialogNovaVariacao, setDialogNovaVariacao] = useState(false)
  const [novaVariacao, setNovaVariacao] = useState({
    color: "",
    quantity: 0,
    image: undefined as File | undefined,
  })

  const produto = produtos.find((p) => p.id === produtoId)

  if (!produto) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onVoltar}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <h2 className="text-2xl font-bold">Produto não encontrado</h2>
        </div>
      </div>
    )
  }

  // Calcular estatísticas do produto
  const pedidosComProduto = pedidos.filter((pedido) => pedido.produtos.some((p) => p.produtoId === produto.id))

  const totalVendido = pedidosComProduto.reduce((acc, pedido) => {
    const produtoNoPedido = pedido.produtos.find((p) => p.produtoId === produto.id)
    return acc + (produtoNoPedido?.quantidade || 0)
  }, 0)

  const receitaTotal = pedidosComProduto.reduce((acc, pedido) => {
    const produtoNoPedido = pedido.produtos.find((p) => p.produtoId === produto.id)
    return acc + (produtoNoPedido?.quantidade || 0) * (produtoNoPedido?.preco || produto.basePrice)
  }, 0)

  const totalQuantity = produto.variations.reduce((total, variation) => total + variation.quantity, 0)
  const totalValue = totalQuantity * produto.basePrice

  const getStatusEstoque = (quantidade: number) => {
    if (quantidade === 0) return { label: "Sem estoque", variant: "destructive" as const, color: "text-red-600" }
    if (quantidade < 10) return { label: "Crítico", variant: "destructive" as const, color: "text-red-600" }
    if (quantidade < 20) return { label: "Baixo", variant: "secondary" as const, color: "text-yellow-600" }
    if (quantidade < 50) return { label: "Médio", variant: "outline" as const, color: "text-blue-600" }
    return { label: "Alto", variant: "default" as const, color: "text-green-600" }
  }

  const status = getStatusEstoque(totalQuantity)

  const handleAtualizarQuantidadeVariacao = (variationId: string) => {
    if (novaQuantidade >= 0) {
      atualizarQuantidadeVariacao(variationId, novaQuantidade)
      setEditandoVariacao(null)
    }
  }

  const iniciarEdicaoQuantidade = (variation: ProductVariante) => {
    setNovaQuantidade(variation.quantity)
    setEditandoVariacao(variation.id)
  }

  const handleAdicionarVariacao = () => {
    adicionarVariacao(produto.id, novaVariacao)
    setDialogNovaVariacao(false)
    setNovaVariacao({ color: "", quantity: 0, image: undefined })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onVoltar}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{produto.nome}</h2>
            <p className="text-muted-foreground">Detalhes completos do produto com variações</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={status.variant} className="text-sm px-3 py-1">
            {status.label}
          </Badge>
          <Button variant="outline" onClick={() => setDialogNovaVariacao(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Variação
          </Button>
        </div>
      </div>

      {/* Cards de Informações Principais */}
      <div className="grid gap-6 md:grid-cols-4">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Informações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Categoria</p>
              <Badge variant="outline">{produto.categoria}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fornecedor</p>
              <p className="font-semibold">{produto.fornecedor}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Data de Criação</p>
              <p className="font-semibold">{new Date(produto.data_entrada).toLocaleDateString("pt-BR")}</p>
            </div>
          </CardContent>
        </Card>

        {/* Estoque Total */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Estoque Total
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Quantidade Total</p>
              <p className={`text-2xl font-bold ${status.color}`}>{totalQuantity}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Variações</p>
              <p className="font-semibold">{produto.variations.length} cores</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Preço */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Preço
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Preço Base</p>
              <p className="text-2xl font-bold text-green-600">R$ {produto.basePrice.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valor Total em Estoque</p>
              <p className="font-semibold">R$ {totalValue.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas de Vendas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Vendas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Vendido</p>
              <p className="text-2xl font-bold">{totalVendido}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Receita Total</p>
              <p className="font-semibold text-green-600">R$ {receitaTotal.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pedidos</p>
              <p className="font-semibold">{pedidosComProduto.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Variações do Produto */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Variações de Cores ({produto.variations.length})
          </CardTitle>
          <CardDescription>Gerencie o estoque de cada cor individualmente</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {produto.variations.map((variation) => {
              const variationStatus = getStatusEstoque(variation.quantity)
              return (
                <Card key={variation.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full border-2"
                          style={{ backgroundColor: variation.color.toLowerCase() }}
                          title={variation.color}
                        />
                        <span className="font-medium">{variation.color}</span>
                      </div>
                      <Badge variant={variationStatus.variant} className="text-xs">
                        {variationStatus.label}
                      </Badge>
                    </div>

                    {variation.image && (
                      <div className="w-full h-32 bg-gray-100 rounded overflow-hidden">
                        <img
                          src={variation.image || "/placeholder.svg"}
                          alt={`${produto.nome} - ${variation.color}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Quantidade</span>
                        {variation.sku && (
                          <span className="text-xs text-muted-foreground font-mono">SKU: {variation.sku}</span>
                        )}
                      </div>

                      {editandoVariacao === variation.id ? (
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            value={novaQuantidade}
                            onChange={(e) => setNovaQuantidade(Number(e.target.value))}
                            className="flex-1"
                          />
                          <Button size="sm" onClick={() => handleAtualizarQuantidadeVariacao(variation.id)}>
                            ✓
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditandoVariacao(null)}>
                            ✕
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className={`text-xl font-bold ${variationStatus.color}`}>{variation.quantity}</span>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => iniciarEdicaoQuantidade(variation)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => removerVariacao(variation.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Pedidos */}
      {pedidosComProduto.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Pedidos ({pedidosComProduto.length})
            </CardTitle>
            <CardDescription>Pedidos que incluem este produto</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Cor</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Preço Unit.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pedidosComProduto.map((pedido) => {
                  const produtoNoPedido = pedido.produtos.find((p) => p.produtoId === produto.id)
                  if (!produtoNoPedido) return null

                  return (
                    <TableRow key={pedido.id}>
                      <TableCell className="font-mono">#{pedido.id}</TableCell>
                      <TableCell>{pedido.cliente}</TableCell>
                      <TableCell>{new Date(pedido.dataPedido).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>
                        {produtoNoPedido.cor ? (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-full border"
                              style={{ backgroundColor: produtoNoPedido.cor.toLowerCase() }}
                            />
                            {produtoNoPedido.cor}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {produtoNoPedido.quantidade}x
                        </Badge>
                      </TableCell>
                      <TableCell>R$ {produtoNoPedido.preco.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            pedido.status === "concluido"
                              ? "default"
                              : pedido.status === "cancelado"
                                ? "destructive"
                                : pedido.status === "processando"
                                  ? "secondary"
                                  : "outline"
                          }
                        >
                          {pedido.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        R$ {(produtoNoPedido.quantidade * produtoNoPedido.preco).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>Operações comuns para este produto</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button onClick={() => setDialogNovaVariacao(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Variação
            </Button>
            <Button variant="destructive" onClick={() => removerProduto(produto.id)}>
              <Package className="mr-2 h-4 w-4" />
              Remover Produto
            </Button>
          </div>

          {totalQuantity < 20 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Atenção: Estoque Baixo</h4>
              <p className="text-sm text-yellow-700">
                Este produto está com estoque baixo. Considere fazer uma reposição junto ao fornecedor{" "}
                <strong>{produto.fornecedor}</strong>.
              </p>
            </div>
          )}

          {totalQuantity === 0 && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-semibold text-red-800 mb-2">🚨 Produto Sem Estoque</h4>
              <p className="text-sm text-red-700">
                Este produto está sem estoque e não pode ser vendido. Faça a reposição urgentemente.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para Nova Variação */}
      <Dialog open={dialogNovaVariacao} onOpenChange={setDialogNovaVariacao}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Adicionar Nova Variação</DialogTitle>
            <DialogDescription>Adicione uma nova cor para {produto.nome}.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="nova-cor">Cor</Label>
              <Input
                id="nova-cor"
                value={novaVariacao.color}
                onChange={(e) => setNovaVariacao({ ...novaVariacao, color: e.target.value })}
                placeholder="Ex: Verde, Amarelo"
                required
              />
            </div>
            <div>
              <Label htmlFor="nova-quantidade">Quantidade</Label>
              <Input
                id="nova-quantidade"
                type="number"
                value={novaVariacao.quantity}
                onChange={(e) => setNovaVariacao({ ...novaVariacao, quantity: Number.parseInt(e.target.value) || 0 })}
                required
              />
            </div>
            <div>
              <Label htmlFor="nova-imagem">Imagem (opcional)</Label>
              <Input
                id="nova-imagem"
                type="file"
                accept="image/*"
                onChange={(e) => setNovaVariacao({ ...novaVariacao, image: e.target.files?.[0] })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAdicionarVariacao}>Adicionar Variação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
