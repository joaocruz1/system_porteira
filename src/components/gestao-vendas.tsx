"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, ShoppingCart, CheckCircle, XCircle, Clock } from "lucide-react"
import { useEstoque } from "@/components/estoque-context"
import { DetalhesPedido } from "@/components/detalhes-pedido"

export function GestaoVendas() {
  const { produtos, pedidos, criarPedido, atualizarStatusPedido, darBaixaPedido } = useEstoque()
  const [dialogAberto, setDialogAberto] = useState(false)
  const [pedidoSelecionado, setPedidoSelecionado] = useState<string | null>(null)
  const [novoPedido, setNovoPedido] = useState({
    cliente: "",
    logo: "",
    endereco: "",
    cliente_telefone: "",
    produtos: [] as Array<{
      produtoId: string
      nome: string
      quantidade: number
      preco: number
    }>,
    total: 0,
    status: "pendente" as const,
    dataPedido: new Date().toISOString().split("T")[0],
  })
  const [produtoSelecionado, setProdutoSelecionado] = useState("")
  const [quantidadeSelecionada, setQuantidadeSelecionada] = useState(1)

  const adicionarProdutoAoPedido = () => {
    const produto = produtos.find((p) => p.id === produtoSelecionado)
    if (produto && quantidadeSelecionada > 0) {
      const produtoExistente = novoPedido.produtos.find((p) => p.produtoId === produto.id)

      if (produtoExistente) {
        const produtosAtualizados = novoPedido.produtos.map((p) =>
          p.produtoId === produto.id ? { ...p, quantidade: p.quantidade + quantidadeSelecionada } : p,
        )
        setNovoPedido({
          ...novoPedido,
          produtos: produtosAtualizados,
          total: produtosAtualizados.reduce((acc, p) => acc + p.quantidade * p.preco, 0),
        })
      } else {
        const novosProdutos = [
          ...novoPedido.produtos,
          {
            produtoId: produto.id,
            nome: produto.nome,
            quantidade: quantidadeSelecionada,
            preco: produto.preco,
          },
        ]
        setNovoPedido({
          ...novoPedido,
          produtos: novosProdutos,
          total: novosProdutos.reduce((acc, p) => acc + p.quantidade * p.preco, 0),
        })
      }

      setProdutoSelecionado("")
      setQuantidadeSelecionada(1)
    }
  }

  const removerProdutoDoPedido = (produtoId: string) => {
    const produtosFiltrados = novoPedido.produtos.filter((p) => p.produtoId !== produtoId)
    setNovoPedido({
      ...novoPedido,
      produtos: produtosFiltrados,
      total: produtosFiltrados.reduce((acc, p) => acc + p.quantidade * p.preco, 0),
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (novoPedido.cliente && novoPedido.produtos.length > 0) {
      criarPedido(novoPedido)
      setDialogAberto(false)
      setNovoPedido({
        cliente: "",
        logo: "",
        endereco: "",
        cliente_telefone: "",
        produtos: [],
        total: 0,
        status: "pendente",
        dataPedido: new Date().toISOString().split("T")[0],
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "concluido":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "cancelado":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "processando":
        return <Clock className="h-4 w-4 text-blue-600" />
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "concluido":
        return "default" as const
      case "cancelado":
        return "destructive" as const
      case "processando":
        return "secondary" as const
      default:
        return "outline" as const
    }
  }

  // Se um pedido está selecionado, mostrar os detalhes
  if (pedidoSelecionado) {
    return <DetalhesPedido pedidoId={pedidoSelecionado} onVoltar={() => setPedidoSelecionado(null)} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Vendas e Pedidos</h2>
          <p className="text-muted-foreground">Gerencie pedidos e controle as vendas</p>
        </div>

        <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Pedido
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Criar Novo Pedido</DialogTitle>
              <DialogDescription>Adicione produtos ao pedido e finalize a venda.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="cliente" className="text-right">
                    Cliente
                  </Label>
                  <Input
                    id="cliente"
                    value={novoPedido.cliente}
                    onChange={(e) => setNovoPedido({ ...novoPedido, cliente: e.target.value })}
                    className="col-span-3"
                    placeholder="Nome do cliente"
                    required
                  />
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Adicionar Produtos</h4>
                  <div className="flex gap-2 mb-3">
                    <Select value={produtoSelecionado} onValueChange={setProdutoSelecionado}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Selecione um produto" />
                      </SelectTrigger>
                      <SelectContent>
                        {produtos.map((produto) => (
                          <SelectItem key={produto.id} value={produto.id}>
                            {produto.nome} - R$ {produto.preco.toFixed(2)} ({produto.quantidade} disponível)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min="1"
                      value={quantidadeSelecionada}
                      onChange={(e) => setQuantidadeSelecionada(Number.parseInt(e.target.value) || 1)}
                      className="w-20"
                    />
                    <Button type="button" onClick={adicionarProdutoAoPedido}>
                      Adicionar
                    </Button>
                  </div>

                  {novoPedido.produtos.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="font-medium">Produtos no Pedido:</h5>
                      {novoPedido.produtos.map((produto, index) => (
                        <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                          <span>
                            {produto.nome} x {produto.quantidade}
                          </span>
                          <div className="flex items-center gap-2">
                            <span>R$ {(produto.quantidade * produto.preco).toFixed(2)}</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removerProdutoDoPedido(produto.produtoId)}
                            >
                              Remover
                            </Button>
                          </div>
                        </div>
                      ))}
                      <div className="text-right font-bold">Total: R$ {novoPedido.total.toFixed(2)}</div>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={novoPedido.produtos.length === 0}>
                  Criar Pedido
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Lista de Pedidos
          </CardTitle>
          <CardDescription>Todos os pedidos realizados</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>

                <TableHead>Cliente</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Produtos</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pedidos.map((pedido) => (
                <TableRow key={pedido.id}>
                  <TableCell>{pedido.cliente}</TableCell>
                  <TableCell>{new Date(pedido.dataPedido).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {pedido.produtos.map((p, i) => (
                        <div key={i}>
                          {p.nome} ({p.quantidade}x)
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>R$ {pedido.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(pedido.status)} className="flex items-center gap-1 w-fit">
                      {getStatusIcon(pedido.status)}
                      {pedido.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setPedidoSelecionado(pedido.id)}>
                        Ver Detalhes
                      </Button>
                      {pedido.status === "pendente" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => atualizarStatusPedido(pedido.id, "processando")}
                        >
                          Processar
                        </Button>
                      )}
                      {(pedido.status === "pendente" || pedido.status === "processando") && (
                        <Button variant="default" size="sm" onClick={() => darBaixaPedido(pedido.id)}>
                          Dar Baixa
                        </Button>
                      )}
                      {pedido.status !== "cancelado" && pedido.status !== "concluido" && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => atualizarStatusPedido(pedido.id, "cancelado")}
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
