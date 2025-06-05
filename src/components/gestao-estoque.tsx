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
import { Plus, Pencil, Trash2, Package, Search, AlertTriangle } from "lucide-react"
import { useEstoque, type Produto } from "@/components/estoque-context"
import { useAuth } from "@/components/auth-context"
import Image from "next/image"
import { ImageGallery } from "@/components/image-gallery"

export function GestaoEstoque() {
  const { permissions } = useAuth()
  const { produtos, adicionarProduto, removerProduto, atualizarQuantidade, atualizarProdutoExistente } = useEstoque()
  const [dialogAberto, setDialogAberto] = useState(false)
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null)
  const [tipoAdicao, setTipoAdicao] = useState<"novo" | "existente">("novo")
  const [produtoExistenteSelecionado, setProdutoExistenteSelecionado] = useState("")
  const [quantidadeAdicionar, setQuantidadeAdicionar] = useState(0)
  const [filtroCategoria, setFiltroCategoria] = useState("todas")
  const [busca, setBusca] = useState("")
  const [novoProduto, setNovoProduto] = useState({
    nome: "",
    categoria: "",
    quantidade: 0,
    preco: 0,
    fornecedor: "",
    dataEntrada: new Date().toISOString().split("T")[0],
    imagens: [] as File[],
    imagensExistentes: [] as string[],
  })

  const [imagemPreview, setImagemPreview] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  const produtosFiltrados = produtos.filter((produto) => {
    const matchCategoria = filtroCategoria === "todas" || produto.categoria === filtroCategoria
    const matchBusca =
      produto.nome.toLowerCase().includes(busca.toLowerCase()) ||
      produto.fornecedor.toLowerCase().includes(busca.toLowerCase())
    return matchCategoria && matchBusca
  })

  const produtosBaixoEstoque = produtos.filter((p) => p.quantidade < 20)
  const produtosSemEstoque = produtos.filter((p) => p.quantidade === 0)

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

  const categorias = ["todas", ...Array.from(new Set(produtos.map((p) => p.categoria)))]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (produtoEditando) {
      atualizarQuantidade(produtoEditando.id, novoProduto.quantidade)
    } else if (tipoAdicao === "novo") {
      adicionarProduto(novoProduto)
    } else if (tipoAdicao === "existente" && produtoExistenteSelecionado && quantidadeAdicionar > 0) {
      atualizarProdutoExistente(produtoExistenteSelecionado, quantidadeAdicionar)
    }

    setDialogAberto(false)
    setProdutoEditando(null)
    setTipoAdicao("novo")
    setProdutoExistenteSelecionado("")
    setQuantidadeAdicionar(0)
    setNovoProduto({
      nome: "",
      categoria: "",
      quantidade: 0,
      preco: 0,
      fornecedor: "",
      dataEntrada: new Date().toISOString().split("T")[0],
      imagens: [],
      imagensExistentes: [],
    })
  }

  const abrirEdicao = (produto: Produto) => {
    setProdutoEditando(produto)
    setNovoProduto({
      nome: produto.nome,
      categoria: produto.categoria,
      quantidade: produto.quantidade,
      preco: produto.preco,
      fornecedor: produto.fornecedor,
      dataEntrada: produto.dataEntrada,
      imagens: [],
      imagensExistentes:  produto.image ? [produto.image] : [],
    })
    setDialogAberto(true)
  }

  const getStatusEstoque = (quantidade: number) => {
    if (quantidade === 0) return { label: "Sem estoque", variant: "destructive" as const }
    if (quantidade < 10) return { label: "Crítico", variant: "destructive" as const }
    if (quantidade < 20) return { label: "Baixo", variant: "secondary" as const }
    if (quantidade < 50) return { label: "Médio", variant: "outline" as const }
    return { label: "Alto", variant: "default" as const }
  }

  const abrirDialogoAdicao = () => {
    setProdutoEditando(null)
    setTipoAdicao("novo")
    setProdutoExistenteSelecionado("")
    setQuantidadeAdicionar(0)
    setDialogAberto(true)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setNovoProduto((prev) => ({
      ...prev,
      imagens: [...prev.imagens, ...files].slice(0, 5), // Máximo 5 imagens
    }))
  }

  const removeImage = (index: number) => {
    setNovoProduto((prev) => ({
      ...prev,
      imagens: prev.imagens.filter((_, i) => i !== index),
    }))
  }

  const capturePhoto = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      const video = document.createElement("video")
      video.srcObject = stream
      video.play()

      const canvas = document.createElement("canvas")
      const context = canvas.getContext("2d")

      video.addEventListener("loadedmetadata", () => {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context?.drawImage(video, 0, 0)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const file = new File([blob], `foto-${Date.now()}.jpg`, { type: "image/jpeg" })
              setNovoProduto((prev) => ({
                ...prev,
                imagens: [...prev.imagens, file].slice(0, 5),
              }))
            }
          },
          "image/jpeg",
          0.8,
        )

        stream.getTracks().forEach((track) => track.stop())
      })
    } catch (error) {
      alert("Erro ao acessar a câmera. Verifique as permissões.")
    }
  }

  const previewImage = (file: File) => {
    const url = URL.createObjectURL(file)
    setImagemPreview(url)
    setPreviewOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestão de Estoque</h2>
          <p className="text-muted-foreground">Gerencie seus produtos e controle o estoque</p>
        </div>

        <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
          <DialogTrigger asChild>
            <Button onClick={abrirDialogoAdicao}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar ao Estoque
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{produtoEditando ? "Editar Produto" : "Adicionar ao Estoque"}</DialogTitle>
              <DialogDescription>
                {produtoEditando
                  ? "Atualize as informações do produto."
                  : "Escolha se deseja adicionar um produto novo ou repor estoque de um existente."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                {!produtoEditando && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Tipo</Label>
                    <div className="col-span-3 flex gap-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          value="novo"
                          checked={tipoAdicao === "novo"}
                          onChange={(e) => setTipoAdicao(e.target.value as "novo" | "existente")}
                        />
                        <span>Produto Novo</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          value="existente"
                          checked={tipoAdicao === "existente"}
                          onChange={(e) => setTipoAdicao(e.target.value as "novo" | "existente")}
                        />
                        <span>Produto Existente</span>
                      </label>
                    </div>
                  </div>
                )}

                {tipoAdicao === "existente" && !produtoEditando && (
                  <>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="produto-existente" className="text-right">
                        Produto
                      </Label>
                      <Select value={produtoExistenteSelecionado} onValueChange={setProdutoExistenteSelecionado}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Selecione um produto" />
                        </SelectTrigger>
                        <SelectContent>
                          {produtos.map((produto) => (
                            <SelectItem key={produto.id} value={produto.id}>
                              {produto.nome} - Estoque atual: {produto.quantidade}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="quantidade-adicionar" className="text-right">
                        Quantidade
                      </Label>
                      <Input
                        id="quantidade-adicionar"
                        type="number"
                        min="1"
                        value={quantidadeAdicionar}
                        onChange={(e) => setQuantidadeAdicionar(Number.parseInt(e.target.value) || 0)}
                        className="col-span-3"
                        placeholder="Quantidade a adicionar"
                        required
                      />
                    </div>
                  </>
                )}

                {(tipoAdicao === "novo" || produtoEditando) && (
                  <>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="nome" className="text-right">
                        Nome
                      </Label>
                      <Input
                        id="nome"
                        value={novoProduto.nome}
                        onChange={(e) => setNovoProduto({ ...novoProduto, nome: e.target.value })}
                        className="col-span-3"
                        required
                        disabled={!!produtoEditando}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="categoria" className="text-right">
                        Categoria
                      </Label>
                      <Select
                        value={novoProduto.categoria}
                        onValueChange={(value) => setNovoProduto({ ...novoProduto, categoria: value })}
                        disabled={!!produtoEditando}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Copos e Canecas">Copos e Canecas</SelectItem>
                          <SelectItem value="Garrafas e Squezzes">Garrafaz e Squezzes</SelectItem>
                          <SelectItem value="Chaveiros e Acessórios">Chaveiros e Acessórios</SelectItem>
                          <SelectItem value="Escritório">Escritório</SelectItem>
                          <SelectItem value="Facas e Utensílios">Facas e Utensílios</SelectItem>
                          <SelectItem value="Kits e Conjuntos">Kits e Conjuntos</SelectItem>
                          <SelectItem value="Utencilios">Utencilios</SelectItem>
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
                        value={novoProduto.quantidade}
                        onChange={(e) =>
                          setNovoProduto({ ...novoProduto, quantidade: Number.parseInt(e.target.value) || 0 })
                        }
                        className="col-span-3"
                        required
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
                        value={novoProduto.preco}
                        onChange={(e) =>
                          setNovoProduto({ ...novoProduto, preco: Number.parseFloat(e.target.value) || 0 })
                        }
                        className="col-span-3"
                        required
                        disabled={!!produtoEditando}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="fornecedor" className="text-right">
                        Fornecedor
                      </Label>
                      <Input
                        id="fornecedor"
                        value={novoProduto.fornecedor}
                        onChange={(e) => setNovoProduto({ ...novoProduto, fornecedor: e.target.value })}
                        className="col-span-3"
                        required
                        disabled={!!produtoEditando}
                      />
                    </div>

                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label className="text-right mt-2">Imagens</Label>
                      <div className="col-span-3">
                        <ImageGallery
                          images={novoProduto.imagensExistentes}
                          productName={novoProduto.nome || "Novo produto"}
                          onAddImages={(files) => {
                            setNovoProduto((prev) => ({
                              ...prev,
                              imagens: [...prev.imagens, ...files].slice(0, 5),
                            }))
                          }}
                          onRemoveImage={(index) => {
                            setNovoProduto((prev) => ({
                              ...prev,
                              imagensExistentes: prev.imagensExistentes.filter((_, i) => i !== index),
                            }))
                          }}
                          editable={true}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
              <DialogFooter>
                <Button type="submit">
                  {produtoEditando ? "Atualizar" : tipoAdicao === "novo" ? "Adicionar Produto" : "Adicionar ao Estoque"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Preview da Imagem</DialogTitle>
            </DialogHeader>
            {imagemPreview && (
              <div className="flex justify-center">
                <img
                  src={imagemPreview || "/placeholder.svg"}
                  alt="Preview"
                  className="max-w-full max-h-96 object-contain rounded"
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{produtos.length}</div>
            <p className="text-xs text-muted-foreground">
              {produtos.reduce((acc, p) => acc + p.quantidade, 0)} itens em estoque
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
              R$ {produtos.reduce((acc, p) => acc + p.quantidade * p.preco, 0).toFixed(2)}
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
              <div className="flex gap-4">
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
                <div className="w-48">
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
              <CardDescription>Lista completa de produtos cadastrados</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Imagem</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Data Entrada</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {produtosFiltrados.map((produto) => {
                    const status = getStatusEstoque(produto.quantidade)
                    return (
                      <TableRow key={produto.id}>
                        <TableCell>
                         <ImageGallery
                          images={produto.image ? [produto.image] : []} 
                          productName={produto.nome}
                          editable={false} // Importante: para modo de visualização simples
                        />
                        </TableCell>
                        <TableCell className="font-medium">{produto.nome}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{produto.categoria}</Badge>
                        </TableCell>
                        <TableCell className="font-mono">{produto.quantidade}</TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell>R$ {produto.preco.toFixed(2)}</TableCell>
                        <TableCell className="font-medium">
                          R$ {(produto.quantidade * produto.preco).toFixed(2)}
                        </TableCell>
                        <TableCell>{produto.fornecedor}</TableCell>
                        <TableCell>{new Date(produto.dataEntrada).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => abrirEdicao(produto)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => removerProduto(produto.id)}>
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {produtosBaixoEstoque.map((produto) => {
                      const status = getStatusEstoque(produto.quantidade)
                      return (
                        <TableRow key={produto.id}>
                          <TableCell className="font-medium">{produto.nome}</TableCell>
                          <TableCell>{produto.categoria}</TableCell>
                          <TableCell className="font-mono">{produto.quantidade}</TableCell>
                          <TableCell>
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </TableCell>
                          <TableCell>{produto.fornecedor}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={() => abrirEdicao(produto)}>
                              <Pencil className="h-4 w-4" />
                              Repor
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
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
                        <TableCell>R$ {produto.preco.toFixed(2)}</TableCell>
                        <TableCell>{produto.fornecedor}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="default" size="sm" onClick={() => abrirEdicao(produto)}>
                            <Plus className="h-4 w-4 mr-1" />
                            Repor Estoque
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
