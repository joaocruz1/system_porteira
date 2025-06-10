"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge, type BadgeProps } from "@/components/ui/badge"
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
import { Plus, AlertTriangle, Trash2, Edit } from "lucide-react"
import { useEstoque, type Perda } from "@/components/estoque-context"

// Definir um tipo para o formulário para reutilização e clareza
type NovaPerdaForm = Omit<Perda, "id">

export function GestaoPerdas() {
  const { produtos, perdas, adicionarPerda, removerPerda, atualizarPerda } = useEstoque()

  const [dialogAberto, setDialogAberto] = useState(false)
  const [perdaEditando, setPerdaEditando] = useState<Perda | null>(null)

  const initialNovaPerda: NovaPerdaForm = {
    produtoId: "",
    produtoNome: "",
    quantidade: 1,
    valorUnitario: 0,
    valorTotal: 0,
    motivo: "danificado",
    descricao: "",
    dataPerda: new Date().toISOString().split("T")[0],
    responsavel: "",
  }

  const [novaPerda, setNovaPerda] = useState<NovaPerdaForm>(initialNovaPerda)

  const motivosPerda = [
    { value: "danificado", label: "Danificado" },
    { value: "perdido", label: "Perdido" },
    { value: "vencido", label: "Vencido" },
    { value: "defeito", label: "Defeito de Fabricação" },
    { value: "outros", label: "Outros" },
  ]

  const handleProdutoChange = (produtoId: string) => {
    const produto = produtos.find((p) => p.id === produtoId)
    if (produto) {
      setNovaPerda((prev) => ({
        ...prev,
        produtoId: produto.id,
        produtoNome: produto.nome,
        valorUnitario: produto.preco,
        valorTotal: produto.preco * prev.quantidade,
      }))
    }
  }

  const handleQuantidadeChange = (quantidade: number) => {
    setNovaPerda((prev) => ({
      ...prev,
      quantidade,
      valorTotal: prev.valorUnitario * quantidade,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (novaPerda.produtoId && novaPerda.quantidade > 0) {
      if (perdaEditando) {
        await atualizarPerda(perdaEditando.id, novaPerda)
        setPerdaEditando(null)
      } else {
        await adicionarPerda(novaPerda)
      }
      setDialogAberto(false)
      setNovaPerda(initialNovaPerda)
    }
  }

  const handleEdit = (perda: Perda) => {
    setNovaPerda({
      produtoId: perda.produtoId,
      produtoNome: perda.produtoNome,
      quantidade: perda.quantidade,
      valorUnitario: perda.valorUnitario,
      valorTotal: perda.valorTotal,
      motivo: perda.motivo,
      descricao: perda.descricao,
      dataPerda: perda.dataPerda,
      responsavel: perda.responsavel,
    })
    setPerdaEditando(perda)
    setDialogAberto(true)
  }

  const getMotivoColor = (motivo: Perda["motivo"]): BadgeProps["variant"] => {
    switch (motivo) {
      case "danificado":
        return "destructive"
      case "perdido":
        return "secondary"
      case "vencido":
        return "outline"
      case "defeito":
        return "default"
      case "outros":
        return "default"
      default:
        return "outline"
    }
  }

  // --- CORREÇÃO 1 APLICADA AQUI ---
  const totalPerdas = perdas.reduce((acc, perda) => acc + (perda.valorTotal || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestão de Perdas</h2>
          <p className="text-muted-foreground">Controle de itens danificados, perdidos e outros prejuízos</p>
        </div>

        <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Registrar Perda
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{perdaEditando ? "Editar Perda" : "Registrar Nova Perda"}</DialogTitle>
              <DialogDescription>Registre itens danificados, perdidos ou com defeito.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="produto" className="text-right">
                    Produto
                  </Label>
                  <Select value={novaPerda.produtoId} onValueChange={handleProdutoChange}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {produtos.map((produto) => (
                        <SelectItem key={produto.id} value={produto.id}>
                          {produto.nome} - R$ {(produto.preco || 0).toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="quantidade" className="text-right">
                    Quantidade
                  </Label>
                  <Input
                    id="quantidade"
                    type="number"
                    min="1"
                    value={novaPerda.quantidade}
                    onChange={(e) => handleQuantidadeChange(Number(e.target.value))}
                    className="col-span-3"
                    required
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="motivo" className="text-right">
                    Motivo
                  </Label>
                  <Select
                    value={novaPerda.motivo}
                    onValueChange={(value: Perda["motivo"]) => setNovaPerda({ ...novaPerda, motivo: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {motivosPerda.map((motivo) => (
                        <SelectItem key={motivo.value} value={motivo.value}>
                          {motivo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="dataPerda" className="text-right">
                    Data da Perda
                  </Label>
                  <Input
                    id="dataPerda"
                    type="date"
                    value={novaPerda.dataPerda}
                    onChange={(e) => setNovaPerda({ ...novaPerda, dataPerda: e.target.value })}
                    className="col-span-3"
                    required
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="responsavel" className="text-right">
                    Responsável
                  </Label>
                  <Input
                    id="responsavel"
                    value={novaPerda.responsavel}
                    onChange={(e) => setNovaPerda({ ...novaPerda, responsavel: e.target.value })}
                    className="col-span-3"
                    placeholder="Nome do responsável"
                    required
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="descricao" className="text-right">
                    Descrição
                  </Label>
                  <Textarea
                    id="descricao"
                    value={novaPerda.descricao}
                    onChange={(e) => setNovaPerda({ ...novaPerda, descricao: e.target.value })}
                    className="col-span-3"
                    placeholder="Descreva o que aconteceu..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Valor Total</Label>
                  <div className="col-span-3 text-lg font-semibold">R$ {(novaPerda.valorTotal || 0).toFixed(2)}</div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={!novaPerda.produtoId}>
                  {perdaEditando ? "Atualizar" : "Registrar"} Perda
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Perdas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{perdas.length}</div>
            <p className="text-xs text-muted-foreground">Itens registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total das Perdas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalPerdas.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Prejuízo acumulado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Perdas Este Mês</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                perdas.filter((p) => {
                  const dataPerda = new Date(p.dataPerda)
                  const agora = new Date()
                  return dataPerda.getMonth() === agora.getMonth() && dataPerda.getFullYear() === agora.getFullYear()
                }).length
              }
            </div>
            <p className="text-xs text-muted-foreground">Registros recentes</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Histórico de Perdas
          </CardTitle>
          <CardDescription>Todos os itens perdidos ou danificados</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {perdas.map((perda) => (
                <TableRow key={perda.id}>
                  <TableCell>{new Date(perda.dataPerda).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>{perda.produtoNome}</TableCell>
                  <TableCell>{perda.quantidade}</TableCell>
                  <TableCell>
                    <Badge variant={getMotivoColor(perda.motivo)}>
                      {motivosPerda.find((m) => m.value === perda.motivo)?.label}
                    </Badge>
                  </TableCell>
                  <TableCell>{perda.responsavel}</TableCell>
                  {/* --- CORREÇÃO 2 APLICADA AQUI --- */}
                  <TableCell>R$ {(perda.valorTotal || 0).toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(perda)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => removerPerda(perda.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
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