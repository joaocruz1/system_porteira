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
import { ArrowLeft, Package, DollarSign, Edit, Camera, History, TrendingUp } from "lucide-react"
import { useEstoque, type Produto } from "@/components/estoque-context"
import { ImageGallery } from "@/components/image-gallery"
import { useState } from "react"

interface DetalhesProdutoProps {
  produtoId: string
  onVoltar: () => void
}

export function DetalhesProduto({ produtoId, onVoltar }: DetalhesProdutoProps) {
  const { produtos, pedidos, atualizarQuantidade, removerProduto } = useEstoque()
  const [editandoQuantidade, setEditandoQuantidade] = useState(false)
  const [novaQuantidade, setNovaQuantidade] = useState(0)
  const [dialogEdicaoAberto, setDialogEdicaoAberto] = useState(false)
  const [produtoEditado, setProdutoEditado] = useState<Partial<Produto>>({})

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
    return acc + (produtoNoPedido?.quantidade || 0) * (produtoNoPedido?.preco || produto.preco)
  }, 0)

  const getStatusEstoque = (quantidade: number) => {
    if (quantidade === 0) return { label: "Sem estoque", variant: "destructive" as const, color: "text-red-600" }
    if (quantidade < 10) return { label: "Crítico", variant: "destructive" as const, color: "text-red-600" }
    if (quantidade < 20) return { label: "Baixo", variant: "secondary" as const, color: "text-yellow-600" }
    if (quantidade < 50) return { label: "Médio", variant: "outline" as const, color: "text-blue-600" }
    return { label: "Alto", variant: "default" as const, color: "text-green-600" }
  }

  const status = getStatusEstoque(produto.quantidade)

  const handleAtualizarQuantidade = () => {
    if (novaQuantidade >= 0) {
      atualizarQuantidade(produto.id, novaQuantidade)
      setEditandoQuantidade(false)
    }
  }

  const iniciarEdicaoQuantidade = () => {
    setNovaQuantidade(produto.quantidade)
    setEditandoQuantidade(true)
  }

  const abrirDialogoEdicao = () => {
    setProdutoEditado({
      nome: produto.nome,
      categoria: produto.categoria,
      preco: produto.preco,
      fornecedor: produto.fornecedor,
    })
    setDialogEdicaoAberto(true)
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
            <p className="text-muted-foreground">Detalhes completos do produto</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={status.variant} className="text-sm px-3 py-1">
            {status.label}
          </Badge>
          <Button variant="outline" onClick={abrirDialogoEdicao}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </div>
      </div>

      {/* Galeria de Imagens */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Imagens do Produto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ImageGallery images={produto.image ? [produto.image] : []} productName={produto.nome} editable={false} />
          {(!produto.image || produto.image.length === 0) && (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <Camera className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">Nenhuma imagem</h3>
              <p className="mt-1 text-sm text-muted-foreground">Este produto ainda não possui imagens cadastradas.</p>
            </div>
          )}
        </CardContent>
      </Card>

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
              <p className="text-sm text-muted-foreground">Data de Entrada</p>
              <p className="font-semibold">{new Date(produto.data_entrada).toLocaleDateString("pt-BR")}</p>
            </div>
          </CardContent>
        </Card>

        {/* Estoque */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Estoque
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Quantidade Atual</p>
              {editandoQuantidade ? (
                <div className="flex gap-2 mt-2">
                  <Input
                    type="number"
                    value={novaQuantidade}
                    onChange={(e) => setNovaQuantidade(Number(e.target.value))}
                    className="w-20"
                  />
                  <Button size="sm" onClick={handleAtualizarQuantidade}>
                    ✓
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditandoQuantidade(false)}>
                    ✕
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className={`text-2xl font-bold ${status.color}`}>{produto.quantidade}</p>
                  <Button size="sm" variant="outline" onClick={iniciarEdicaoQuantidade}>
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
              )}
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
              <p className="text-sm text-muted-foreground">Preço Unitário</p>
              <p className="text-2xl font-bold text-green-600">R$ {produto.preco.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valor Total em Estoque</p>
              <p className="font-semibold">R$ {(produto.quantidade * produto.preco).toFixed(2)}</p>
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
            <Button onClick={iniciarEdicaoQuantidade}>
              <Edit className="mr-2 h-4 w-4" />
              Ajustar Estoque
            </Button>
            <Button variant="outline" onClick={abrirDialogoEdicao}>
              <Edit className="mr-2 h-4 w-4" />
              Editar Produto
            </Button>
            <Button variant="destructive" onClick={() => removerProduto(produto.id)}>
              <Package className="mr-2 h-4 w-4" />
              Remover Produto
            </Button>
          </div>

          {produto.quantidade < 20 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Atenção: Estoque Baixo</h4>
              <p className="text-sm text-yellow-700">
                Este produto está com estoque baixo. Considere fazer uma reposição junto ao fornecedor{" "}
                <strong>{produto.fornecedor}</strong>.
              </p>
            </div>
          )}

          {produto.quantidade === 0 && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-semibold text-red-800 mb-2">🚨 Produto Sem Estoque</h4>
              <p className="text-sm text-red-700">
                Este produto está sem estoque e não pode ser vendido. Faça a reposição urgentemente.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Edição */}
      <Dialog open={dialogEdicaoAberto} onOpenChange={setDialogEdicaoAberto}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
            <DialogDescription>Atualize as informações básicas do produto.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nome" className="text-right">
                Nome
              </Label>
              <Input
                id="nome"
                value={produtoEditado.nome || ""}
                onChange={(e) => setProdutoEditado({ ...produtoEditado, nome: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="categoria" className="text-right">
                Categoria
              </Label>
              <Input
                id="categoria"
                value={produtoEditado.categoria || ""}
                onChange={(e) => setProdutoEditado({ ...produtoEditado, categoria: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="preco" className="text-right">
                Preço
              </Label>
              <Input
                id="preco"
                type="number"
                step="0.01"
                value={produtoEditado.preco || ""}
                onChange={(e) => setProdutoEditado({ ...produtoEditado, preco: Number.parseFloat(e.target.value) })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fornecedor" className="text-right">
                Fornecedor
              </Label>
              <Input
                id="fornecedor"
                value={produtoEditado.fornecedor || ""}
                onChange={(e) => setProdutoEditado({ ...produtoEditado, fornecedor: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={() => setDialogEdicaoAberto(false)}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
