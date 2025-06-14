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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Plus,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Clock,
  Edit,
  Trash2,
  TrendingUp,
  Package,
  Zap,
  Users,
  Building,
  Truck,
  PieChart,
} from "lucide-react"
import { useEstoque, type Custo } from "@/components/estoque-context"

// Categorias específicas para empresa de impressão a laser
const categoriasCustos = {
  "materia-prima": {
    label: "Matéria Prima",
    icon: Package,
    color: "bg-blue-100 text-blue-800",
    subcategorias: [
      "Copos de Vidro",
      "Copos de Acrílico",
      "Copos de Metal",
      "Facas de Aço Inox",
      "Facas de Cerâmica",
      "Chaveiros de Metal",
      "Chaveiros de Acrílico",
      "Garrafas Térmicas",
      "Squeezes Plásticos",
      "Canecas de Porcelana",
      "Canecas de Metal",
      "Utensílios de Cozinha",
      "Materiais para Escritório",
      "Embalagens",
      "Etiquetas e Adesivos",
      "Outros Materiais",
    ],
  },
  "equipamentos-laser": {
    label: "Equipamentos e Laser",
    icon: Zap,
    color: "bg-purple-100 text-purple-800",
    subcategorias: [
      "Manutenção Máquina Laser",
      "Peças de Reposição Laser",
      "Lentes e Espelhos",
      "Tubos de Laser CO2",
      "Software de Gravação",
      "Calibração de Equipamentos",
      "Energia Elétrica - Laser",
      "Gases para Laser",
      "Mesa de Trabalho",
      "Sistema de Exaustão",
      "Compressor de Ar",
      "Outros Equipamentos",
    ],
  },
  "recursos-humanos": {
    label: "Recursos Humanos",
    icon: Users,
    color: "bg-green-100 text-green-800",
    subcategorias: [
      "Salários",
      "Comissões de Vendas",
      "Comissões de Produção",
      "Horas Extras",
      "13º Salário",
      "Férias",
      "FGTS",
      "INSS Patronal",
      "Vale Transporte",
      "Vale Alimentação",
      "Plano de Saúde",
      "Seguro de Vida",
      "Treinamentos",
      "Uniformes",
      "EPI - Equipamentos de Proteção",
      "Outros Benefícios",
    ],
  },
  operacional: {
    label: "Custos Operacionais",
    icon: Building,
    color: "bg-orange-100 text-orange-800",
    subcategorias: [
      "Aluguel do Galpão",
      "Energia Elétrica Geral",
      "Água e Esgoto",
      "Internet e Telefone",
      "Segurança e Monitoramento",
      "Limpeza e Conservação",
      "Seguro do Imóvel",
      "IPTU",
      "Manutenção Predial",
      "Climatização",
      "Iluminação",
      "Outros Custos Operacionais",
    ],
  },
  "marketing-vendas": {
    label: "Marketing e Vendas",
    icon: TrendingUp,
    color: "bg-pink-100 text-pink-800",
    subcategorias: [
      "Google Ads",
      "Facebook Ads",
      "Instagram Ads",
      "Material Gráfico",
      "Catálogos e Folders",
      "Site e E-commerce",
      "Fotografia de Produtos",
      "Eventos e Feiras",
      "Brindes Promocionais",
      "Comissão Representantes",
      "Marketing Digital",
      "Outros Custos de Marketing",
    ],
  },
  administrativo: {
    label: "Administrativo",
    icon: Building,
    color: "bg-gray-100 text-gray-800",
    subcategorias: [
      "Contabilidade",
      "Assessoria Jurídica",
      "Consultoria Empresarial",
      "Licenças e Alvarás",
      "Certificações",
      "Material de Escritório",
      "Software de Gestão",
      "Backup e Armazenamento",
      "Correios e Sedex",
      "Cartório",
      "Outros Custos Administrativos",
    ],
  },
  financeiro: {
    label: "Custos Financeiros",
    icon: DollarSign,
    color: "bg-red-100 text-red-800",
    subcategorias: [
      "Juros de Empréstimos",
      "Juros de Financiamentos",
      "Taxas Bancárias",
      "Cartão de Crédito",
      "Antecipação de Recebíveis",
      "IOF",
      "Multas e Juros",
      "Outros Custos Financeiros",
    ],
  },
  "logistica-transporte": {
    label: "Logística e Transporte",
    icon: Truck,
    color: "bg-yellow-100 text-yellow-800",
    subcategorias: [
      "Frete de Compras",
      "Frete de Vendas",
      "Combustível",
      "Manutenção Veículos",
      "Seguro Veículos",
      "IPVA e Licenciamento",
      "Pedágio",
      "Estacionamento",
      "Motoboy",
      "Embalagens para Envio",
      "Outros Custos de Transporte",
    ],
  },
  "impostos-taxas": {
    label: "Impostos e Taxas",
    icon: AlertCircle,
    color: "bg-indigo-100 text-indigo-800",
    subcategorias: [
      "Simples Nacional",
      "ICMS",
      "IPI",
      "PIS/COFINS",
      "ISS",
      "IRPJ",
      "CSLL",
      "Taxas Municipais",
      "Taxas Estaduais",
      "Outros Impostos",
    ],
  },
}

export function GestaoCustosMetalLaser() {
  const { custos, adicionarCusto, removerCusto, atualizarCusto, marcarCustoPago } = useEstoque()

  const [dialogAberto, setDialogAberto] = useState(false)
  const [custoEditando, setCustoEditando] = useState<Custo | null>(null)
  const [filtroCategoria, setFiltroCategoria] = useState("todas")
  const [filtroStatus, setFiltroStatus] = useState("todos")
  const [filtroPeriodo, setFiltroPeriodo] = useState("mes-atual")

  const initialNovoCusto = {
    categoria: "materia-prima" as keyof typeof categoriasCustos,
    subcategoria: "",
    descricao: "",
    valor: 0,
    dataVencimento: new Date().toISOString().split("T")[0],
    dataPagamento: "",
    status: "pendente" as const,
    fornecedor: "",
    observacoes: "",
    recorrente: false,
    centroCusto: "",
  }

  const [novoCusto, setNovoCusto] = useState(initialNovoCusto)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (novoCusto.descricao && novoCusto.valor > 0) {
      const custoData = {
        ...novoCusto,
        categoria: novoCusto.categoria as any, // Conversão para o tipo esperado
      }

      if (custoEditando) {
        await atualizarCusto(custoEditando.id, custoData)
        setCustoEditando(null)
      } else {
        await adicionarCusto(custoData)
      }
      setDialogAberto(false)
      setNovoCusto(initialNovoCusto)
    }
  }

  const handleEdit = (custo: Custo) => {
    setNovoCusto({
      categoria: custo.categoria as keyof typeof categoriasCustos,
      subcategoria: custo.subcategoria,
      descricao: custo.descricao,
      valor: custo.valor,
      dataVencimento: custo.dataVencimento,
      dataPagamento: custo.dataPagamento || "",
      status: custo.status,
      fornecedor: custo.fornecedor || "",
      observacoes: custo.observacoes || "",
      recorrente: false,
      centroCusto: "",
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

  // Filtros aplicados
  const custosFiltrados = custos.filter((custo) => {
    const matchCategoria = filtroCategoria === "todas" || custo.categoria === filtroCategoria
    const matchStatus = filtroStatus === "todos" || custo.status === filtroStatus

    let matchPeriodo = true
    if (filtroPeriodo !== "todos") {
      const hoje = new Date()
      const dataCusto = new Date(custo.dataVencimento)

      switch (filtroPeriodo) {
        case "mes-atual":
          matchPeriodo = dataCusto.getMonth() === hoje.getMonth() && dataCusto.getFullYear() === hoje.getFullYear()
          break
        case "mes-anterior":
          const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1)
          matchPeriodo =
            dataCusto.getMonth() === mesAnterior.getMonth() && dataCusto.getFullYear() === mesAnterior.getFullYear()
          break
        case "trimestre":
          const inicioTrimestre = new Date(hoje.getFullYear(), Math.floor(hoje.getMonth() / 3) * 3)
          matchPeriodo = dataCusto >= inicioTrimestre
          break
      }
    }

    return matchCategoria && matchStatus && matchPeriodo
  })

  // Cálculos para os cards de resumo
  const totalCustos = custosFiltrados.reduce((acc, custo) => acc + custo.valor, 0)
  const custosPendentes = custosFiltrados.filter((c) => c.status === "pendente")
  const custosVencidos = custosFiltrados.filter((c) => {
    const hoje = new Date()
    const vencimento = new Date(c.dataVencimento)
    return c.status === "pendente" && vencimento < hoje
  })
  const custosPagos = custosFiltrados.filter((c) => c.status === "pago")

  // Análise por categoria
  const custosPorCategoria = Object.entries(categoriasCustos)
    .map(([key, categoria]) => {
      const custosCategoria = custosFiltrados.filter((c) => c.categoria === key)
      const total = custosCategoria.reduce((acc, c) => acc + c.valor, 0)
      return {
        categoria: key,
        label: categoria.label,
        icon: categoria.icon,
        color: categoria.color,
        total,
        quantidade: custosCategoria.length,
      }
    })
    .sort((a, b) => b.total - a.total)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestão de Custos - Metal Laser</h2>
          <p className="text-muted-foreground">Controle completo de custos da empresa de impressão a laser</p>
        </div>

        <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Custo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{custoEditando ? "Editar Custo" : "Adicionar Novo Custo"}</DialogTitle>
              <DialogDescription>Registre uma nova despesa ou custo da Metal Laser.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="categoria" className="text-right">
                    Categoria
                  </Label>
                  <Select
                    value={novoCusto.categoria}
                    onValueChange={(value: keyof typeof categoriasCustos) =>
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
                      {Object.entries(categoriasCustos).map(([key, categoria]) => {
                        const IconComponent = categoria.icon
                        return (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4" />
                              {categoria.label}
                            </div>
                          </SelectItem>
                        )
                      })}
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
                      {categoriasCustos[novoCusto.categoria]?.subcategorias.map((sub) => (
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
                    placeholder="Descrição detalhada do custo"
                    required
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="valor" className="text-right">
                    Valor (R$)
                  </Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    min="0"
                    value={novoCusto.valor}
                    onChange={(e) => setNovoCusto({ ...novoCusto, valor: Number(e.target.value) })}
                    className="col-span-3"
                    placeholder="0,00"
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
                    placeholder="Nome do fornecedor ou prestador"
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
                    placeholder="Informações adicionais..."
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

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Categoria</Label>
              <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as categorias</SelectItem>
                  {Object.entries(categoriasCustos).map(([key, categoria]) => (
                    <SelectItem key={key} value={key}>
                      {categoria.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="vencido">Vencido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Período</Label>
              <Select value={filtroPeriodo} onValueChange={setFiltroPeriodo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os períodos</SelectItem>
                  <SelectItem value="mes-atual">Mês atual</SelectItem>
                  <SelectItem value="mes-anterior">Mês anterior</SelectItem>
                  <SelectItem value="trimestre">Trimestre atual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setFiltroCategoria("todas")
                  setFiltroStatus("todos")
                  setFiltroPeriodo("mes-atual")
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="resumo" className="space-y-4">
        <TabsList>
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="categorias">Por Categoria</TabsTrigger>
          <TabsTrigger value="lista">Lista Completa</TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="space-y-4">
          {/* Cards de Resumo */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Custos</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ {totalCustos.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">{custosFiltrados.length} registros</p>
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
        </TabsContent>

        <TabsContent value="categorias" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Custos por Categoria
              </CardTitle>
              <CardDescription>Análise detalhada dos custos por categoria</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {custosPorCategoria.map((item) => {
                  const IconComponent = item.icon
                  const percentual = totalCustos > 0 ? (item.total / totalCustos) * 100 : 0

                  return (
                    <div key={item.categoria} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <IconComponent className="h-5 w-5" />
                        <div>
                          <div className="font-medium">{item.label}</div>
                          <div className="text-sm text-muted-foreground">{item.quantidade} custos</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">R$ {item.total.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">{percentual.toFixed(1)}%</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lista">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Lista de Custos ({custosFiltrados.length})
              </CardTitle>
              <CardDescription>Todos os custos registrados com filtros aplicados</CardDescription>
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
                  {custosFiltrados.map((custo) => {
                    const categoria = categoriasCustos[custo.categoria as keyof typeof categoriasCustos]
                    return (
                      <TableRow key={custo.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{custo.descricao}</div>
                            <div className="text-sm text-muted-foreground">{custo.subcategoria}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={categoria?.color || "bg-gray-100 text-gray-800"}>
                            {categoria?.label || custo.categoria}
                          </Badge>
                        </TableCell>
                        <TableCell>R$ {custo.valor.toFixed(2)}</TableCell>
                        <TableCell>{new Date(custo.dataVencimento).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell>
                          <Badge
                            variant={getStatusVariant(custo.status) as any}
                            className="flex items-center gap-1 w-fit"
                          >
                            {getStatusIcon(custo.status)}
                            {custo.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{custo.fornecedor || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(custo)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            {custo.status === "pendente" && (
                              <Button variant="default" size="sm" onClick={() => handleMarcarPago(custo.id)}>
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="destructive" size="sm" onClick={() => removerCusto(custo.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
