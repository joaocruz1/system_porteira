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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Pencil, Trash2, Package, Search, AlertTriangle, Palette } from "lucide-react"
import { useEstoque, type Produto } from "@/components/estoque-context"
import { useAuth } from "@/components/auth-context"
import { DetalhesProduto } from "@/components/detalhes-produto"

export function GestaoEstoque() {
  const { permissions } = useAuth()
  const {
    produtos,
    adicionarProduto,
    removerProduto,
    atualizarQuantidadeVariacao,
    adicionarVariacao,
    removerVariacao,
  } = useEstoque()
  const [dialogAberto, setDialogAberto] = useState(false)
  const [dialogVariacaoAberto, setDialogVariacaoAberto] = useState(false)
  const [produtoSelecionadoVariacao, setProdutoSelecionadoVariacao] = useState<string | null>(null)
  const [filtroCategoria, setFiltroCategoria] = useState("todas")
  const [busca, setBusca] = useState("")

  const [novoProduto, setNovoProduto] = useState({
    name: "",
    description: "",
    category: "",
    basePrice: 0,
    provider: "",
    variations: [{ tempId: Date.now(), color: "", quantity: 0, image: undefined as File | undefined }],
  })

  const [novaVariacao, setNovaVariacao] = useState({
    color: "",
    quantity: 0,
    image: undefined as File | undefined,
  })

  const [produtoSelecionado, setProdutoSelecionado] = useState<string | null>(null)

  const getTotalQuantity = (produto: Produto) => {
    if (!produto || !Array.isArray(produto.variations)) {
      return 0
    }
    return produto.variations.reduce((total, variation) => total + (variation.quantidade || 0), 0)
  }

  const getTotalValue = (produto: Produto) => {
    // CORREÇÃO PREVENTIVA: Garante que basePrice seja um número antes de multiplicar
    const basePrice = typeof produto.preco === "number" ? produto.preco : 0
    return getTotalQuantity(produto) * basePrice
  }

  const produtosFiltrados = produtos.filter((produto) => {
    // Adicionado para segurança, caso um 'produto' inteiro seja nulo no array
    if (!produto) return false

    const matchCategoria = filtroCategoria === "todas" || produto.categoria === filtroCategoria

    // CORREÇÃO 1: Tratamento robusto para valores nulos/indefinidos em nome e fornecedor
    const matchBusca =
      (produto.nome || "").toLowerCase().includes(busca.toLowerCase()) ||
      (produto.fornecedor || "").toLowerCase().includes(busca.toLowerCase())

    return matchCategoria && matchBusca
  })

  const produtosBaixoEstoque = produtos.filter((p) => p && getTotalQuantity(p) < 20)
  const produtosSemEstoque = produtos.filter((p) => p && getTotalQuantity(p) === 0)

  if (!permissions.canManageStock) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Acesso Negado</h3>
          <p className="text-muted-foreground">Você não tem permissão para gerenciar o estoque.</p>
        </div>
      </div>
    )
  }

  // CORREÇÃO 2: Tratamento para categorias nulas/indefinidas ao criar a lista de filtros
  const categorias = ["todas", ...Array.from(new Set(produtos.map((p) => p.categoria).filter(Boolean)))]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    adicionarProduto(novoProduto)
    setDialogAberto(false)
    setNovoProduto({
      name: "",
      description: "",
      category: "",
      basePrice: 0,
      provider: "",
      variations: [{ tempId: Date.now(), color: "", quantity: 0, image: undefined }],
    })
  }

  const handleSubmitVariacao = (e: React.FormEvent) => {
    e.preventDefault()
    if (produtoSelecionadoVariacao) {
      adicionarVariacao(produtoSelecionadoVariacao, novaVariacao)
      setDialogVariacaoAberto(false)
      setNovaVariacao({ color: "", quantity: 0, image: undefined })
      setProdutoSelecionadoVariacao(null)
    }
  }

  const getStatusEstoque = (quantidade: number) => {
    if (quantidade === 0) return { label: "Sem estoque", variant: "destructive" as const }
    if (quantidade < 10) return { label: "Crítico", variant: "destructive" as const }
    if (quantidade < 20) return { label: "Baixo", variant: "secondary" as const }
    if (quantidade < 50) return { label: "Médio", variant: "outline" as const }
    return { label: "Alto", variant: "default" as const }
  }

  const adicionarNovaVariacao = () => {
    setNovoProduto((prev) => ({
      ...prev,
      variations: [...prev.variations, { tempId: Date.now(), color: "", quantity: 0, image: undefined }],
    }))
  }

  const removerVariacaoNova = (tempId: number) => {
    setNovoProduto((prev) => ({
      ...prev,
      variations: prev.variations.filter((v) => v.tempId !== tempId),
    }))
  }

  const atualizarVariacaoNova = (index: number, field: keyof typeof novaVariacao, value: any) => {
    setNovoProduto((prev) => ({
      ...prev,
      variations: prev.variations.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    }))
  }

  if (produtoSelecionado) {
    return <DetalhesProduto produtoId={produtoSelecionado} onVoltar={() => setProdutoSelecionado(null)} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestão de Estoque</h2>
          <p className="text-muted-foreground">Gerencie seus produtos e controle o estoque por variações</p>
        </div>

        <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto mx-4 sm:mx-0">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Produto</DialogTitle>
              <DialogDescription>Crie um novo produto com suas variações de cores.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={novoProduto.name}
                    onChange={(e) => setNovoProduto({ ...novoProduto, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    value={novoProduto.description}
                    onChange={(e) => setNovoProduto({ ...novoProduto, description: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={novoProduto.category}
                    onValueChange={(value) => setNovoProduto({ ...novoProduto, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Copos e Canecas">Copos e Canecas</SelectItem>
                      <SelectItem value="Garrafas e Squezzes">Garrafas e Squezzes</SelectItem>
                      <SelectItem value="Chaveiros e Acessórios">Chaveiros e Acessórios</SelectItem>
                      <SelectItem value="Escritório">Escritório</SelectItem>
                      <SelectItem value="Facas e Utensílios">Facas e Utensílios</SelectItem>
                      <SelectItem value="Kits e Conjuntos">Kits e Conjuntos</SelectItem>
                      <SelectItem value="Utensílios">Utensílios</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="basePrice">Preço Base</Label>
                  <Input
                    id="basePrice"
                    type="number"
                    step="0.01"
                    value={novoProduto.basePrice}
                    onChange={(e) =>
                      setNovoProduto({ ...novoProduto, basePrice: Number.parseFloat(e.target.value) || 0 })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="provider">Fornecedor</Label>
                  <Input
                    id="provider"
                    value={novoProduto.provider}
                    onChange={(e) => setNovoProduto({ ...novoProduto, provider: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Variações de Cores</Label>
                  <div className="space-y-3">
                    {novoProduto.variations.map((variation, index) => (
                      <div key={variation.tempId} className="border rounded-lg p-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">Variação {index + 1}</h4>
                          {novoProduto.variations.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removerVariacaoNova(variation.tempId)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor={`color-${index}`} className="text-xs">
                              Cor
                            </Label>
                            <Input
                              id={`color-${index}`}
                              value={variation.color}
                              onChange={(e) => atualizarVariacaoNova(index, "color", e.target.value)}
                              placeholder="Ex: Azul, Vermelho"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`quantity-${index}`} className="text-xs">
                              Quantidade
                            </Label>
                            <Input
                              id={`quantity-${index}`}
                              type="number"
                              value={variation.quantity}
                              onChange={(e) =>
                                atualizarVariacaoNova(index, "quantity", Number.parseInt(e.target.value) || 0)
                              }
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`image-${index}`} className="text-xs">
                            Imagem (opcional)
                          </Label>
                          <Input
                            id={`image-${index}`}
                            type="file"
                            accept="image/*"
                            onChange={(e) => atualizarVariacaoNova(index, "image", e.target.files?.[0])}
                          />
                        </div>
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={adicionarNovaVariacao} className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Variação
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Adicionar Produto</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog para adicionar variação a produto existente */}
        <Dialog open={dialogVariacaoAberto} onOpenChange={setDialogVariacaoAberto}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Adicionar Nova Variação</DialogTitle>
              <DialogDescription>Adicione uma nova cor para este produto.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitVariacao}>
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
                    onChange={(e) =>
                      setNovaVariacao({ ...novaVariacao, quantity: Number.parseInt(e.target.value) || 0 })
                    }
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
                <Button type="submit">Adicionar Variação</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{produtos.length}</div>
            <p className="text-xs text-muted-foreground">
              {produtos.reduce((acc, p) => acc + (p ? getTotalQuantity(p) : 0), 0)} itens em estoque
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sem Estoque</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{produtosSemEstoque.length}</div>
            <p className="text-xs text-muted-foreground">Produtos zerados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Baixo Estoque</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{produtosBaixoEstoque.length}</div>
            <p className="text-xs text-muted-foreground">Menos de 20 unidades</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {produtos.reduce((acc, p) => acc + (p ? getTotalValue(p) : 0), 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Valor em estoque</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="todos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="todos">Todos os Produtos</TabsTrigger>
          <TabsTrigger value="baixo-estoque">Baixo Estoque</TabsTrigger>
          <TabsTrigger value="sem-estoque">Sem Estoque</TabsTrigger>
        </TabsList>

        <TabsContent value="todos" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="busca">Buscar produto</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="busca"
                      placeholder="Nome do produto ou fornecedor..."
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="w-full sm:w-48">
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((categoria) => (
                        <SelectItem key={categoria} value={categoria}>
                          {categoria === "todas" ? "Todas as categorias" : categoria}
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
                <Package className="h-5 w-5" />
                Produtos em Estoque ({produtosFiltrados.length})
              </CardTitle>
              <CardDescription>Lista completa de produtos com suas variações</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {produtosFiltrados.map((produto) => {
                  const totalQuantity = getTotalQuantity(produto)
                  const status = getStatusEstoque(totalQuantity)

                  return (
                    <Card key={produto.id} className="p-4">
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-4 gap-4">
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold">{produto.nome}</h3>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline">{produto.categoria}</Badge>
                              <Badge variant={status.variant}>{status.label}</Badge>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                            <span>Fornecedor: {produto.fornecedor}</span>
                            <span>Preço: R$ {parseFloat(produto.preco).toFixed(2)}</span>
                            <span>Total: {totalQuantity} unidades</span>
                            <span>Valor: R$ {(getTotalValue(produto) || 0).toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setProdutoSelecionadoVariacao(produto.id)
                              setDialogVariacaoAberto(true)
                            }}
                            className="text-xs sm:text-sm"
                          >
                            <Palette className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">Nova Cor</span>
                            <span className="sm:hidden">Cor</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setProdutoSelecionado(produto.id)}
                            className="text-xs sm:text-sm"
                          >
                            <span className="hidden sm:inline">Ver Detalhes</span>
                            <span className="sm:hidden">Detalhes</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removerProduto(produto.id)}
                            className="text-xs sm:text-sm"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remover</span>
                          </Button>
                        </div>
                      </div>

                      {/* Variações */}
                      <div className="border-t pt-4">
                        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                          <Palette className="h-4 w-4" />
                          Variações ({(produto.variations || []).length})
                        </h4>
                        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                          {(produto.variations || []).map((variation) => {
                            const variationStatus = getStatusEstoque(variation.quantidade)
                            return (
                              <div key={variation.id} className="border rounded-lg p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-4 h-4 rounded-full border"
                                      // CORREÇÃO 3: Tratamento para 'variation.color' nulo
                                      style={{ backgroundColor: (variation.cor || "transparent").toLowerCase() }}
                                      title={variation.cor}
                                    />
                                    <span className="font-medium text-sm">{variation.cor || "N/A"}</span>
                                  </div>
                                  <Badge variant={variationStatus.variant} className="text-xs">
                                    {variation.quantidade}
                                  </Badge>
                                </div>
                                {variation.image && (
                                  <div className="w-full h-20 bg-gray-100 rounded overflow-hidden">
                                    <img
                                      src={variation.image || "/placeholder.svg"}
                                      alt={`${produto.nome} - ${variation.cor}`}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                                <div className="flex gap-1">
                                  <Input
                                    type="number"
                                    value={variation.quantidade}
                                    onChange={(e) =>
                                      atualizarQuantidadeVariacao(variation.id, Number.parseInt(e.target.value) || 0)
                                    }
                                    className="text-xs h-8"
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removerVariacao(variation.id)}
                                    className="h-8 px-2"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="baixo-estoque">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Produtos com Baixo Estoque
              </CardTitle>
              <CardDescription>Produtos com menos de 20 unidades que precisam de reposição</CardDescription>
            </CardHeader>
            <CardContent>
              {produtosBaixoEstoque.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Quantidade Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Fornecedor</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {produtosBaixoEstoque.map((produto) => {
                        const totalQuantity = getTotalQuantity(produto)
                        const status = getStatusEstoque(totalQuantity)
                        return (
                          <TableRow key={produto.id}>
                            <TableCell className="font-medium">{produto.nome}</TableCell>
                            <TableCell>{produto.categoria}</TableCell>
                            <TableCell className="font-mono">{totalQuantity}</TableCell>
                            <TableCell>
                              <Badge variant={status.variant}>{status.label}</Badge>
                            </TableCell>
                            <TableCell>{produto.fornecedor}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="outline" size="sm" onClick={() => setProdutoSelecionado(produto.id)}>
                                <Pencil className="h-4 w-4" />
                                Gerenciar
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold">Estoque adequado</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Todos os produtos têm estoque suficiente.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sem-estoque">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Produtos Sem Estoque
              </CardTitle>
              <CardDescription>Produtos zerados que precisam de reposição urgente</CardDescription>
            </CardHeader>
            <CardContent>
              {produtosSemEstoque.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Preço</TableHead>
                        <TableHead>Fornecedor</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {produtosSemEstoque.map((produto) => (
                        <TableRow key={produto.id}>
                          <TableCell className="font-medium">{produto.nome}</TableCell>
                          <TableCell>{produto.categoria}</TableCell>
                          <TableCell>R$ {(produto.basePrice || 0).toFixed(2)}</TableCell>
                          <TableCell>{produto.fornecedor}</TableCell>
                          <TableCell className="text-right">{/* ... */}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="mx-auto h-12 w-12 text-green-500" />
                  <h3 className="mt-2 text-sm font-semibold">Nenhum produto sem estoque</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Todos os produtos têm pelo menos 1 unidade em estoque.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
