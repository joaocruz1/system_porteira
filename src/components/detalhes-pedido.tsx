"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Package, User, DollarSign, CheckCircle, XCircle, Clock, Truck, Download } from "lucide-react"
import { useEstoque } from "@/components/estoque-context"

interface DetalhesPedidoProps {
  pedidoId: string
  onVoltar: () => void
}

export function DetalhesPedido({ pedidoId, onVoltar }: DetalhesPedidoProps) {
  const { pedidos, produtos, atualizarStatusPedido, darBaixaPedido } = useEstoque()
  const pedido = pedidos.find((p) => p.id === pedidoId)

  if (!pedido) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onVoltar}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <h2 className="text-2xl font-bold">Pedido não encontrado</h2>
        </div>
      </div>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "concluido":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "cancelado":
        return <XCircle className="h-5 w-5 text-red-600" />
      case "processando":
        return <Clock className="h-5 w-5 text-blue-600" />
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "concluido":
        return "text-green-600 bg-green-50 border-green-200"
      case "cancelado":
        return "text-red-600 bg-red-50 border-red-200"
      case "processando":
        return "text-blue-600 bg-blue-50 border-blue-200"
      default:
        return "text-yellow-600 bg-yellow-50 border-yellow-200"
    }
  }

  const verificarDisponibilidadeEstoque = () => {
    return pedido.produtos.every((item) => {
      // Altere a lógica do .find() aqui
      const produtoEstoque = produtos.find((p) =>
        p.nome.toLowerCase().includes(item.nome.toLowerCase())
      );
      return produtoEstoque && produtoEstoque.quantidade >= item.quantidade;
    });
  };

  const estoqueDisponivel = verificarDisponibilidadeEstoque()

  const baixarImagem = async () => {
    if (!pedido.logo) return

    try {
      const response = await fetch(pedido.logo)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `pedido-${pedido.id}-logo.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Erro ao baixar a imagem:", error)
      alert("Erro ao baixar a imagem. Verifique se a URL está correta.")
    }
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
            <h2 className="text-2xl font-bold">Pedido #{pedido.id}</h2>
            <p className="text-muted-foreground">Detalhes completos do pedido</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon(pedido.status)}
          <Badge variant={getStatusVariant(pedido.status)} className="text-sm px-3 py-1">
            {pedido.status.toUpperCase()}
          </Badge>
        </div>
      </div>

      {pedido.logo && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">Imagem do Pedido</CardTitle>
              <Button variant="outline" size="sm" onClick={baixarImagem}>
                <Download className="mr-2 h-4 w-4" />
                Baixar Imagem
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="relative w-full max-w-md h-64 rounded-lg overflow-hidden border">
              <img
                src={pedido.logo || "/placeholder.svg"}
                alt="Logo do Pedido"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg?height=256&width=256"
                }}
              />
            </div>
          </CardContent>
        </Card>
      ) }

      {/* Status Card */}
      <Card className={`border-2 ${getStatusColor(pedido.status)}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(pedido.status)}
              <div>
                <h3 className="font-semibold">Status do Pedido</h3>
                <p className="text-sm opacity-80">
                  {pedido.status === "pendente" && "Aguardando processamento"}
                  {pedido.status === "processando" && "Pedido sendo preparado"}
                  {pedido.status === "concluido" && "Pedido finalizado e entregue"}
                  {pedido.status === "cancelado" && "Pedido foi cancelado"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-80">Criado em</p>
              <p className="font-semibold">{new Date(pedido.dataPedido).toLocaleDateString("pt-BR")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Informações do Cliente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Nome</p>
              <p className="font-semibold">{pedido.cliente}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Data do Pedido</p>
              <p className="font-semibold">{new Date(pedido.dataPedido).toLocaleDateString("pt-BR")}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Telefone</p>
              <p className="font-semibold">{pedido.cliente_telefone}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-semibold">{pedido.cliente_email}</p>
            </div>
          </CardContent>
        </Card>

        {/* Resumo Financeiro */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Resumo Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Subtotal</p>
              <p className="font-semibold">R$ {pedido.total.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Desconto</p>
              <p className="font-semibold">R$ 0,00</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-xl font-bold text-green-600">R$ {pedido.total.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Status de Entrega */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Entrega
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Tipo</p>
              <p className="font-semibold">Entrega Domicilio</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Endereço de Entrega</p>
              <p className="font-semibold">{pedido.endereco}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Previsão</p>
              <p className="font-semibold">
                {pedido.status === "concluido"
                  ? "Entregue"
                  : pedido.status === "processando"
                    ? "Em preparação"
                    : "Aguardando"}
              </p>
            </div>
            {!estoqueDisponivel && pedido.status !== "concluido" && pedido.status !== "cancelado" && (
              <div className="p-2 bg-red-50 border border-red-200 rounded">
                <p className="text-sm text-red-600 font-medium">⚠️ Estoque insuficiente</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Produtos do Pedido */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Produtos do Pedido ({pedido.produtos.length} {pedido.produtos.length === 1 ? "item" : "itens"})
          </CardTitle>
          <CardDescription>Lista detalhada dos produtos solicitados</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Preço Unit.</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Estoque Atual</TableHead>
                <TableHead>Disponibilidade</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pedido.produtos.map((item, index) => {
              const produtoEstoque = produtos.find((p) =>
                p.nome.toLowerCase().includes(item.nome.toLowerCase())
              )
              const disponivel = produtoEstoque ? produtoEstoque.quantidade >= item.quantidade : false
              const estoqueAtual = produtoEstoque?.quantidade || 0

                return (
                  <TableRow key={index}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          {produtoEstoque?.categoria || "Categoria não encontrada"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>R$ {item.preco.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {item.quantidade}x
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={estoqueAtual === 0 ? "destructive" : estoqueAtual < 10 ? "secondary" : "default"}
                        className="font-mono"
                      >
                        {estoqueAtual}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={disponivel ? "default" : "destructive"}>
                        {disponivel ? "✓ Disponível" : "✗ Insuficiente"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      R$ {(item.quantidade * item.preco).toFixed(2)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          <Separator className="my-4" />

          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Total de {pedido.produtos.reduce((acc, item) => acc + item.quantidade, 0)} itens
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total do Pedido</p>
              <p className="text-2xl font-bold">R$ {pedido.total.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      {pedido.status !== "concluido" && pedido.status !== "cancelado" && (
        <Card>
          <CardHeader>
            <CardTitle>Ações do Pedido</CardTitle>
            <CardDescription>Gerencie o status e processamento do pedido</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              {pedido.status === "pendente" && (
                <Button onClick={() => atualizarStatusPedido(pedido.id, "processando")} disabled={!estoqueDisponivel}>
                  <Clock className="mr-2 h-4 w-4" />
                  Iniciar Processamento
                </Button>
              )}

              {(pedido.status === "pendente" || pedido.status === "processando") && (
                <Button
                  onClick={() => darBaixaPedido(pedido.id)}
                  disabled={!estoqueDisponivel}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Finalizar Pedido
                </Button>
              )}

              <Button variant="destructive" onClick={() => atualizarStatusPedido(pedido.id, "cancelado")}>
                <XCircle className="mr-2 h-4 w-4" />
                Cancelar Pedido
              </Button>
            </div>

            {!estoqueDisponivel && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-semibold text-red-800 mb-2">⚠️ Atenção: Estoque Insuficiente</h4>
                <p className="text-sm text-red-700">
                  Alguns produtos não possuem estoque suficiente para atender este pedido. Verifique o estoque antes de
                  finalizar.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
