"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Plus, DollarSign, CheckCircle, AlertCircle, Clock } from "lucide-react"
import { useEstoque, type Custo } from "@/components/estoque-context"

export function GestaoCustos() {
  const { custos, adicionarCusto, removerCusto, atualizarCusto, marcarCustoPago } = useEstoque()

  const [dialogAberto, setDialogAberto] = useState(false)
  const [custoEditando, setCustoEditando] = useState<Custo | null>(null)

  const initialNovoCusto = {
    categoria: "operacional" as const,
    subcategoria: "",
    descricao: "",
    valor: 0,
    dataVencimento: new Date().toISOString().split("T")[0],
    dataPagamento: "",
    status: "pendente" as const,
    fornecedor: "",
    observacoes: "",
  }

  const [novoCusto, setNovoCusto] = useState(initialNovoCusto)

  const categoriasCusto = [
    { value: "operacional", label: "Operacional" },
    { value: "administrativo", label: "Administrativo" },
    { value: "marketing", label: "Marketing" },
    { value: "financeiro", label: "Financeiro" },
    { value: "outros", label: "Outros" },
  ]

  const subcategoriasPorCategoria = {
    operacional: ["Aluguel", "Energia", "Internet", "Telefone", "Manutenção", "Limpeza"],
    administrativo: ["Salários", "Benefícios", "Contabilidade", "Jurídico", "Seguros"],
    marketing: ["Publicidade", "Redes Sociais", "Material Gráfico", "Eventos"],
    financeiro: ["Empréstimos", "Financiamentos", "Taxas Bancárias", "Impostos"],
    outros: ["Diversos", "Emergencial", "Investimentos"],
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (novoCusto.descricao && novoCusto.valor > 0) {
      if (custoEditando) {
        await atualizarCusto(custoEditando.id, novoCusto)
        setCustoEditando(null)
      } else {
        await adicionarCusto(novoCusto)
      }
      setDialogAberto(false)
      setNovoCusto(initialNovoCusto)
    }
  }

  const handleEdit = (custo: Custo) => {
    setNovoCusto({
      categoria: custo.categoria,
      subcategoria: custo.subcategoria,
      descricao: custo.descricao,
      valor: custo.valor,
      dataVencimento: custo.dataVencimento,
      dataPagamento: custo.dataPagamento || "",
      status: custo.status,
      fornecedor: custo.fornecedor || "",
      observacoes: custo.observacoes || "",
    })
    setCustoEditando(custo)
    setDialogAberto(true)
  }

  const handleMarcarPago = async (custoId: string) => {
    const hoje = new Date().toISOString().split("T")[0]
    await marcarCustoPago(custoId, hoje)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pago":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "vencido":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "pago":
        return "default"
      case "vencido":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getCategoriaColor = (categoria: string) => {
    switch (categoria) {
      case "operacional":
        return "bg-blue-100 text-blue-800"
      case "administrativo":
        return "bg-green-100 text-green-800"
      case "marketing":
        return "bg-purple-100 text-purple-800"
      case "financeiro":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Cálculos para os cards de resumo
  const totalCustos = custos.reduce((acc, custo) => acc + custo.valor, 0)
  const custosPendentes = custos.filter((c) => c.status === "pendente")
  const custosVencidos = custos.filter((c) => {
    const hoje = new Date()
    const vencimento = new Date(c.dataVencimento)
    return c.status === "pendente" && vencimento < hoje
  })
  const custosPagos = custos.filter((c) => c.status === "pago")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestão de Custos</h2>
          <p className="text-muted-foreground">Controle de despesas e custos da empresa</p>
        </div>

        <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Custo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{custoEditando ? "Editar Custo" : "Adicionar Novo Custo"}</DialogTitle>
              <DialogDescription>Registre uma nova despesa ou custo da empresa.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="categoria" className="text-right">
                    Categoria
                  </Label>
                  <Select
                    value={novoCusto.categoria}
                    onValueChange={(value: any) =>
                      setNovoCusto({
                        ...novoCusto,
                        categoria: value,
                        subcategoria: "", // Reset subcategoria quando categoria muda
                      })
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriasCusto.map((categoria) => (
                        <SelectItem key={categoria.value} value={categoria.value}>
                          {categoria.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="subcategoria" className="text-right">
                    Subcategoria
                  </Label>
                  <Select
                    value={novoCusto.subcategoria}
                    onValueChange={(value) => setNovoCusto({ ...novoCusto, subcategoria: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione uma subcategoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {subcategoriasPorCategoria[novoCusto.categoria]?.map((sub) => (
                        <SelectItem key={sub} value={sub}>
                          {sub}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="descricao" className="text-right">
                    Descrição
                  </Label>
                  <Input
                    id="descricao"
                    value={novoCusto.descricao}
                    onChange={(e) => setNovoCusto({ ...novoCusto, descricao: e.target.value })}
                    className="col-span-3"
                    placeholder="Descrição do custo"
                    required
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="valor" className="text-right">
                    Valor
                  </Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    min="0"
                    value={novoCusto.valor}
                    onChange={(e) => setNovoCusto({ ...novoCusto, valor: Number(e.target.value) })}
                    className="col-span-3"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="dataVencimento" className="text-right">
                    Vencimento
                  </Label>
                  <Input
                    id="dataVencimento"
                    type="date"
                    value={novoCusto.dataVencimento}
                    onChange={(e) => setNovoCusto({ ...novoCusto, dataVencimento: e.target.value })}
                    className="col-span-3"
                    required
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="fornecedor" className="text-right">
                    Fornecedor
                  </Label>
                  <Input
                    id="fornecedor"
                    value={novoCusto.fornecedor}
                    onChange={(e) => setNovoCusto({ ...novoCusto, fornecedor: e.target.value })}
                    className="col-span-3"
                    placeholder="Nome do fornecedor (opcional)"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="observacoes" className="text-right">
                    Observações
                  </Label>
                  <Textarea
                    id="observacoes"
                    value={novoCusto.observacoes}
                    onChange={(e) => setNovoCusto({ ...novoCusto, observacoes: e.target.value })}
                    className="col-span-3"
                    placeholder="Observações adicionais..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={!novoCusto.descricao || novoCusto.valor <= 0}>
                  {custoEditando ? "Atualizar" : "Adicionar"} Custo
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Custos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalCustos.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Valor total registrado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custos Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{custosPendentes.length}</div>
            <p className="text-xs text-muted-foreground">
              R$ {custosPendentes.reduce((acc, c) => acc + c.valor, 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custos Vencidos</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{custosVencidos.length}</div>
            <p className="text-xs text-muted-foreground">
              R$ {custosVencidos.reduce((acc, c) => acc + c.valor, 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custos Pagos</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{custosPagos.length}</div>
            <p className="text-xs text-muted-foreground">
              R$ {custosPagos.reduce((acc, c) => acc + c.valor, 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Lista de Custos
          </CardTitle>
          <CardDescription>Todos os custos e despesas registrados</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {custos.map((custo) => (
                <TableRow key={custo.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{custo.descricao}</div>
                      <div className="text-sm text-muted-foreground">{custo.subcategoria}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getCategoriaColor(custo.categoria)}>
                      {categoriasCusto.find((c) => c.value === custo.categoria)?.label}
                    </Badge>
                  </TableCell>
                  <TableCell>R$ {custo.valor.toFixed(2)}</TableCell>
                  <TableCell>{new Date(custo.dataVencimento).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(custo.status) as any} className="flex items-center gap-1 w-fit">
                      {getStatusIcon(custo.status)}
                      {custo.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{custo.fornecedor || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(custo)}>
                        Editar
                      </Button>
                      {custo.status === "pendente" && (
                        <Button variant="default" size="sm" onClick={() => handleMarcarPago(custo.id)}>
                          Marcar Pago
                        </Button>
                      )}
                      <Button variant="destructive" size="sm" onClick={() => removerCusto(custo.id)}>
                        Remover
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
