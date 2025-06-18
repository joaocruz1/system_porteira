"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Package, User, DollarSign, CheckCircle, XCircle, Clock, Truck, Download, FileText, Loader2 } from "lucide-react"
import { useEstoque } from "@/components/estoque-context"
import { useRef, useState } from 'react'
import { toast } from "sonner"

interface DetalhesPedidoProps {
  pedidoId: string
  onVoltar: () => void
}

export function DetalhesPedido({ pedidoId, onVoltar }: DetalhesPedidoProps) {
  const { pedidos, produtos, atualizarStatusPedido, darBaixaPedido } = useEstoque()
  const pedido = pedidos.find((p) => p.id === pedidoId)
  const pedidoContentRef = useRef<HTMLDivElement>(null)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

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
      case "concluido": return <CheckCircle className="h-5 w-5 text-green-600" />
      case "cancelado": return <XCircle className="h-5 w-5 text-red-600" />
      case "processando": return <Clock className="h-5 w-5 text-blue-600" />
      default: return <Clock className="h-5 w-5 text-yellow-600" />
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "concluido": return "default" as const
      case "cancelado": return "destructive" as const
      case "processando": return "secondary" as const
      default: return "outline" as const
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "concluido": return "text-green-600 bg-green-50 border-green-200"
      case "cancelado": return "text-red-600 bg-red-50 border-red-200"
      case "processando": return "text-blue-600 bg-blue-50 border-blue-200"
      default: return "text-yellow-600 bg-yellow-50 border-yellow-200"
    }
  }

  const verificarDisponibilidadeEstoque = () => {
    return pedido.produtos.every((item) => {
      const produtoEstoque = produtos.find((p) => p.id === item.produtoId)
      return produtoEstoque && produtoEstoque.quantidade >= item.quantidade
    })
  }

  const estoqueDisponivel = verificarDisponibilidadeEstoque()

  const baixarPDF = async () => {
    if (!pedidoContentRef.current) {
      toast.error("Erro ao capturar conteúdo para o PDF.");
      return;
    }
    setIsGeneratingPdf(true);

    try {
      const contentNode = pedidoContentRef.current.cloneNode(true) as HTMLElement;
      contentNode.querySelectorAll('.no-print').forEach(el => el.remove());
      const htmlContent = contentNode.innerHTML;

      const response = await fetch('/api/gerar-pdf-pedido', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          htmlContent,
          pedidoId: pedido.id,
          dataPedido: pedido.dataPedido,
          clienteNome: pedido.cliente
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro desconhecido na geração do PDF.');
      }

      const pdfBlob = await response.blob();
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Pedido_${pedido.id}_Detalhes.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("PDF do pedido gerado com sucesso!");

    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocorreu um erro ao gerar o PDF.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div ref={pedidoContentRef} className="space-y-6">
      <div className="flex items-center justify-between no-print">
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
          <Button variant="ghost" size="sm" onClick={baixarPDF} disabled={isGeneratingPdf}>
            {isGeneratingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
            {isGeneratingPdf ? 'Gerando...' : 'Baixar PDF'}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <Card className={`border-2 ${getStatusColor(pedido.status)}`}>
            <CardContent className="pt-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                {getStatusIcon(pedido.status)}
                <div>
                    <h3 className="font-semibold">Status do Pedido: {pedido.status.toUpperCase()}</h3>
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
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />Cliente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Nome</p>
                        <p className="font-semibold">{pedido.cliente}</p>
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

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5" />Entrega</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Endereço de Entrega</p>
                        <p className="font-semibold">{pedido.endereco}</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" />Resumo Financeiro</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm"><span>Subtotal</span><span>R$ {pedido.total.toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm"><span>Frete</span><span>R$ 0.00</span></div>
                    <Separator className="my-2"/>
                    <div className="flex justify-between text-lg font-bold"><span >Total</span><span>R$ {pedido.total.toFixed(2)}</span></div>
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" />Produtos do Pedido</CardTitle>
            </CardHeader>
            <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Preço Unit.</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                {pedido.produtos.map((item, index) => (
                    <TableRow key={index}>
                        <TableCell><p className="font-medium">{item.nome}</p></TableCell>
                        <TableCell>R$ {item.preco.toFixed(2)}</TableCell>
                        <TableCell><Badge variant="outline">{item.quantidade}x</Badge></TableCell>
                        <TableCell className="text-right font-semibold">R$ {(item.quantidade * item.preco).toFixed(2)}</TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            </CardContent>
        </Card>

        {pedido.status !== "concluido" && pedido.status !== "cancelado" && (
            <Card className="no-print">
            <CardHeader><CardTitle>Ações do Pedido</CardTitle></CardHeader>
            <CardContent>
                <div className="flex gap-4">
                {pedido.status === "pendente" && (
                    <Button onClick={() => atualizarStatusPedido(pedido.id, "processando")} disabled={!estoqueDisponivel}>
                        <Clock className="mr-2 h-4 w-4" /> Iniciar Processamento
                    </Button>
                )}
                {(pedido.status === "pendente" || pedido.status === "processando") && (
                    <Button onClick={() => darBaixaPedido(pedido.id)} disabled={!estoqueDisponivel} className="bg-green-600 hover:bg-green-700">
                        <CheckCircle className="mr-2 h-4 w-4" /> Finalizar Pedido
                    </Button>
                )}
                <Button variant="destructive" onClick={() => atualizarStatusPedido(pedido.id, "cancelado")}>
                    <XCircle className="mr-2 h-4 w-4" /> Cancelar Pedido
                </Button>
                </div>
                {!estoqueDisponivel && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    <p className="font-medium">⚠️ Atenção: Estoque Insuficiente</p>
                    <p>Verifique o estoque dos produtos antes de continuar com o pedido.</p>
                </div>
                )}
            </CardContent>
            </Card>
        )}
      </div>
    </div>
  )
}