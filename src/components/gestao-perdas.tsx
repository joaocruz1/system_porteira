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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, AlertTriangle, Trash2, Edit, Search, Package } from "lucide-react"
import { useEstoque, type Perda } from "@/components/estoque-context"
import { ImageGallery } from "@/components/image-gallery"

type NovaPerdaForm = Omit<Perda, "id"> & {
  imagens: File[]
  imagensExistentes: string[]
}

export function GestaoPerdas() {
  const { produtos, perdas, adicionarPerda, removerPerda, atualizarPerda } = useEstoque()

  const [dialogAberto, setDialogAberto] = useState(false)
  const [perdaEditando, setPerdaEditando] = useState<Perda | null>(null)
  const [busca, setBusca] = useState("")
  const [filtroMotivo, setFiltroMotivo] = useState("todos")
  // --- NOVO ESTADO --- Adicionado para controlar o estoque máximo permitido
  const [maxQuantidade, setMaxQuantidade] = useState<number | null>(null)

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
    imagens: [] as File[],
    imagensExistentes: [] as string[],
  }

  const [novaPerda, setNovaPerda] = useState<NovaPerdaForm>(initialNovaPerda)

  const motivosPerda = [
    { value: "danificado", label: "Danificado" },
    { value: "perdido", label: "Perdido" },
    { value: "vencido", label: "Vencido" },
    { value: "defeito", label: "Defeito de Fabricação" },
    { value: "outros", label: "Outros" },
  ]

  const motivosFiltro = [{ value: "todos", label: "Todos os motivos" }, ...motivosPerda]

  const perdasFiltradas = perdas.filter((perda) => {
    const produto = produtos.find((p) => p.id === perda.produtoId)
    const matchMotivo = filtroMotivo === "todos" || perda.motivo === filtroMotivo
    const matchBusca =
      (perda.produtoNome ?? "").toLowerCase().includes(busca.toLowerCase()) ||
      (perda.responsavel ?? "").toLowerCase().includes(busca.toLowerCase()) ||
      (produto?.nome ?? "").toLowerCase().includes(busca.toLowerCase())

    return matchMotivo && matchBusca
  })

  // --- LÓGICA ATUALIZADA ---
  const handleProdutoChange = (produtoId: string) => {
    const produto = produtos.find((p) => p.id === produtoId)
    if (produto) {
      // Define a quantidade máxima como o estoque atual do produto
      setMaxQuantidade(produto.quantidade)
      // Garante que a quantidade da perda não seja maior que o estoque
      const quantidadeValida = Math.min(1, produto.quantidade)

      setNovaPerda((prev) => ({
        ...prev,
        produtoId: produto.id,
        produtoNome: produto.nome,
        valorUnitario: produto.preco,
        quantidade: quantidadeValida,
        valorTotal: produto.preco * quantidadeValida,
      }))
    }
  }

  const handleQuantidadeChange = (quantidade: number) => {
    // Garante que a quantidade não seja negativa
    const qtd = Math.max(0, quantidade)

    // Valida contra o estoque máximo, se definido
    const quantidadeValida = maxQuantidade !== null ? Math.min(qtd, maxQuantidade) : qtd

    setNovaPerda((prev) => ({
      ...prev,
      quantidade: quantidadeValida,
      valorTotal: prev.valorUnitario * quantidadeValida,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Validação final antes de submeter
    const produto = produtos.find((p) => p.id === novaPerda.produtoId)
    if (!produto || novaPerda.quantidade > (produto.quantidade + (perdaEditando?.quantidade ?? 0))) {
        alert("A quantidade da perda não pode ser maior que o estoque disponível.")
        return
    }

    if (novaPerda.produtoId && novaPerda.quantidade > 0) {
      if (perdaEditando) {
        await atualizarPerda(perdaEditando.id, novaPerda)
      } else {
        await adicionarPerda(novaPerda)
      }
      setDialogAberto(false)
    }
  }
  
  // Limpa o estado ao fechar o diálogo
  const handleDialogStateChange = (open: boolean) => {
    if (!open) {
        setPerdaEditando(null)
        setNovaPerda(initialNovaPerda)
        setMaxQuantidade(null)
    }
    setDialogAberto(open)
  }

  // --- LÓGICA ATUALIZADA ---
  const handleEdit = (perda: Perda) => {
    const produto = produtos.find((p) => p.id === perda.produtoId)
    
    // Ao editar, o estoque máximo é o estoque atual MAIS o valor da perda que está sendo editada
    const maximoParaEdicao = (produto?.quantidade ?? 0) + perda.quantidade
    setMaxQuantidade(maximoParaEdicao)

    setNovaPerda({
      produtoId: perda.produtoId,
      produtoNome: produto?.nome ?? "Produto não encontrado",
      quantidade: perda.quantidade,
      valorUnitario: perda.valorUnitario,
      valorTotal: perda.valorTotal,
      motivo: perda.motivo,
      descricao: perda.descricao,
      dataPerda: new Date(perda.dataPerda).toISOString().split("T")[0],
      responsavel: perda.responsavel,
      imagens: [],
      imagensExistentes: perda.image ? [perda.image] : [],
    })
    setPerdaEditando(perda)
    setDialogAberto(true)
  }

  // --- LÓGICA ATUALIZADA ---
  const abrirDialogoNovaPerda = () => {
    setPerdaEditando(null)
    setNovaPerda(initialNovaPerda)
    setMaxQuantidade(null) // Limpa o máximo ao abrir para um novo registro
    setDialogAberto(true)
  }

  const getMotivoColor = (motivo: Perda["motivo"]): BadgeProps["variant"] => {
    switch (motivo) {
      case "danificado":
      case "vencido":
        return "destructive"
      case "perdido":
        return "secondary"
      case "defeito":
      case "outros":
      default:
        return "outline"
    }
  }

  const totalPerdasValor = perdas.reduce((acc, perda) => acc + Number(perda.valorTotal || 0), 0)

  const perdasEsteMes = perdas.filter((p) => {
    const dataPerda = new Date(p.dataPerda)
    const agora = new Date()
    return dataPerda.getMonth() === agora.getMonth() && dataPerda.getFullYear() === agora.getFullYear()
  }).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestão de Perdas</h2>
          <p className="text-muted-foreground">Controle de itens danificados, perdidos e outros prejuízos</p>
        </div>

        <Dialog open={dialogAberto} onOpenChange={handleDialogStateChange}>
          <DialogTrigger asChild>
            <Button onClick={abrirDialogoNovaPerda}>
              <Plus className="mr-2 h-4 w-4" />
              Registrar Perda
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{perdaEditando ? "Editar Registro de Perda" : "Registrar Nova Perda"}</DialogTitle>
              <DialogDescription>
                {perdaEditando ? "Atualize as informações sobre esta perda." : "Registre itens danificados, perdidos ou com defeito."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="produto" className="text-right">
                    Produto
                  </Label>
                  <Select value={novaPerda.produtoId} onValueChange={handleProdutoChange} disabled={!!perdaEditando}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {produtos.map((produto) => (
                        <SelectItem key={produto.id} value={produto.id} disabled={produto.quantidade <= 0}>
                           {produto.nome} - Estoque: {produto.quantidade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* --- CAMPO DE QUANTIDADE ATUALIZADO --- */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="quantidade" className="text-right">
                    Quantidade
                  </Label>
                  <Input
                    id="quantidade"
                    type="number"
                    min="1"
                    max={maxQuantidade ?? undefined} // Define o máximo nativo do input
                    value={novaPerda.quantidade}
                    onChange={(e) => handleQuantidadeChange(Number(e.target.value))}
                    className="col-span-3"
                    required
                    disabled={!novaPerda.produtoId} // Desabilitado até selecionar um produto
                  />
                </div>
                 {/* Mensagem de feedback do estoque disponível */}
                 {novaPerda.produtoId && maxQuantidade !== null && (
                    <div className="grid grid-cols-4 items-center gap-4 -mt-2">
                        <div className="col-start-2 col-span-3">
                            <p className="text-xs text-muted-foreground">
                                Estoque disponível para perda: {maxQuantidade}
                            </p>
                        </div>
                    </div>
                 )}


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

                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="descricao" className="text-right pt-2">
                    Descrição
                  </Label>
                  <Textarea
                    id="descricao"
                    value={novaPerda.descricao}
                    onChange={(e) => setNovaPerda({ ...novaPerda, descricao: e.target.value })}
                    className="col-span-3"
                    placeholder="Descreva o que aconteceu..."
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right mt-2">Imagens</Label>
                  <div className="col-span-3">
                    <ImageGallery
                      images={novaPerda.imagensExistentes}
                      productName={`Perda - ${novaPerda.produtoNome || "Produto"}`}
                      onAddImages={(files) => {
                        setNovaPerda((prev) => ({
                          ...prev,
                          imagens: [...prev.imagens, ...files].slice(0, 5),
                        }))
                      }}
                      onRemoveImage={(index) => {
                        setNovaPerda((prev) => ({
                          ...prev,
                          imagensExistentes: prev.imagensExistentes.filter((_, i) => i !== index),
                        }))
                      }}
                      editable={true}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Adicione fotos que comprovem a perda (máximo 5 imagens)
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Valor do Prejuízo</Label>
                  <div className="col-span-3 text-lg font-semibold">
                    R$ {Number(novaPerda.valorTotal || 0).toFixed(2)}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={!novaPerda.produtoId || novaPerda.quantidade <= 0 || (maxQuantidade !== null && novaPerda.quantidade > maxQuantidade)}>
                  {perdaEditando ? "Atualizar Perda" : "Registrar Perda"}
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
            <CardTitle className="text-sm font-medium">Total de Registros</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{perdas.length}</div>
            <p className="text-xs text-muted-foreground">Registros de perdas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prejuízo Total</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">R$ {totalPerdasValor.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Valor acumulado em perdas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Perdas Este Mês</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{perdasEsteMes}</div>
            <p className="text-xs text-muted-foreground">Registros no mês corrente</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="historico" className="space-y-4">
        <TabsList>
          <TabsTrigger value="historico">Histórico de Perdas</TabsTrigger>
        </TabsList>
        <TabsContent value="historico" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="busca">Buscar perda</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="busca"
                      placeholder="Nome do produto ou responsável..."
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="w-48">
                  <Label htmlFor="motivo-filtro">Motivo</Label>
                  <Select value={filtroMotivo} onValueChange={setFiltroMotivo}>
                    <SelectTrigger id="motivo-filtro">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {motivosFiltro.map((motivo) => (
                        <SelectItem key={motivo.value} value={motivo.value}>
                          {motivo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Registros de Perdas ({perdasFiltradas.length})
              </CardTitle>
              <CardDescription>Lista de todos os itens perdidos ou danificados</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Imagens</TableHead>
                    <TableHead>Qtd.</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {perdasFiltradas.length > 0 ? (
                    perdasFiltradas.map((perda) => {
                      const produtoNome = produtos.find((p) => p.id === perda.produtoId)?.nome ?? "Não encontrado"
                      return (
                        <TableRow key={perda.id}>
                          <TableCell>{new Date(perda.dataPerda).toLocaleDateString("pt-BR", {timeZone: 'UTC'})}</TableCell>
                          <TableCell className="font-medium">{produtoNome}</TableCell>
                          <TableCell>
                            <ImageGallery
                              images={perda.image ? [perda.image] : []}
                              productName={produtoNome}
                              editable={false}
                            />
                          </TableCell>
                          <TableCell className="font-mono text-center">{perda.quantidade}</TableCell>
                          <TableCell>
                            <Badge variant={getMotivoColor(perda.motivo)}>
                              {motivosPerda.find((m) => m.value === perda.motivo)?.label}
                            </Badge>
                          </TableCell>
                          <TableCell>{perda.responsavel}</TableCell>
                          <TableCell>R$ {Number(perda.valorTotal || 0).toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="icon" onClick={() => handleEdit(perda)}>
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Editar</span>
                              </Button>
                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => removerPerda(perda.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Remover</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-2 text-sm font-semibold">Nenhum registro encontrado</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Tente ajustar os filtros ou adicione uma nova perda.
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}