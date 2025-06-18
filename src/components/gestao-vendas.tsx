// src/components/gestao-vendas.tsx
"use client";

import type React from "react";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, ShoppingCart, CheckCircle, XCircle, Clock } from "lucide-react";
import { useEstoque, Pedido, Produto } from "@/components/estoque-context";
import { DetalhesPedido } from "@/components/detalhes-pedido";
import { toast } from "sonner"; // Importando toast para notificações

// Interface para os itens do pedido, alinhada com a página pública
interface NovoPedidoProduto {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number; // Preço base do produto
  setupFee: number; // Taxa de setup do produto
  totalPrice: number; // (quantidade * unitPrice) + setupFee
  logotype: "text" | "image";
  logoText?: string;
  observations?: string;
}

export function GestaoVendas() {
  const {
    produtos: produtosDoEstoque,
    pedidos,
    atualizarStatusPedido,
    darBaixaPedido,
  } = useEstoque();

  const [dialogAberto, setDialogAberto] = useState(false);
  const [pedidoSelecionado, setPedidoSelecionado] = useState<string | null>(null);

  // Estado inicial alinhado com a estrutura da PublicQuotePage
  const initialNovoPedidoState = {
    cliente: "",
    cliente_email: "",
    cliente_telefone: "",
    empresa: "", // Adicionado
    endereco: "",
    cep: "", // Adicionado
    logoFile: null as File | null, // Alterado para File
    produtos: [] as NovoPedidoProduto[],
    total: 0,
    status: "pendente" as const,
    dataPedido: new Date().toISOString().split("T")[0],
  };

  const [novoPedido, setNovoPedido] = useState(initialNovoPedidoState);
  const [produtoSelecionadoId, setProdutoSelecionadoId] = useState("");
  const [quantidadeSelecionada, setQuantidadeSelecionada] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calcularTotalItem = (
    unitPrice: number,
    quantidade: number,
    setupFee: number
  ): number => {
    return unitPrice * quantidade + setupFee;
  };

  const calcularTotalPedido = (produtosNoPedido: NovoPedidoProduto[]): number => {
    // O total é a soma dos totais de cada item (que já inclui a taxa de setup)
    return produtosNoPedido.reduce((acc, p) => acc + p.totalPrice, 0);
  };

  const adicionarProdutoAoPedido = () => {
    const produtoBase = produtosDoEstoque.find((p) => p.id === produtoSelecionadoId);
    if (produtoBase && quantidadeSelecionada > 0) {
      if (quantidadeSelecionada > produtoBase.quantidade) {
        toast.error(`Quantidade indisponível! Só há ${produtoBase.quantidade} em estoque.`);
        return;
      }
      
      const setupFeeParaEsteItem = (produtoBase as any).setupFee || 0; // Assumindo que o produto do estoque pode ter uma setupFee

      const produtoExistenteIndex = novoPedido.produtos.findIndex(
        (p) => p.id === produtoBase.id
      );

      let produtosAtualizados: NovoPedidoProduto[];

      if (produtoExistenteIndex > -1) {
        produtosAtualizados = novoPedido.produtos.map((p, index) => {
          if (index === produtoExistenteIndex) {
            const novaQuantidade = p.quantity + quantidadeSelecionada;
            return {
              ...p,
              quantity: novaQuantidade,
              totalPrice: calcularTotalItem(p.unitPrice, novaQuantidade, p.setupFee),
            };
          }
          return p;
        });
      } else {
        const novoItem: NovoPedidoProduto = {
          id: produtoBase.id,
          name: produtoBase.nome,
          quantity: quantidadeSelecionada,
          unitPrice: produtoBase.preco,
          setupFee: setupFeeParaEsteItem,
          totalPrice: calcularTotalItem(
            produtoBase.preco,
            quantidadeSelecionada,
            setupFeeParaEsteItem
          ),
          logotype: "text", // Padrão, já que não há UI para isso no admin
        };
        produtosAtualizados = [...novoPedido.produtos, novoItem];
      }

      setNovoPedido((prev) => ({
        ...prev,
        produtos: produtosAtualizados,
        total: calcularTotalPedido(produtosAtualizados),
      }));

      setProdutoSelecionadoId("");
      setQuantidadeSelecionada(1);
    }
  };

  const removerProdutoDoPedido = (produtoId: string) => {
    const produtosFiltrados = novoPedido.produtos.filter((p) => p.id !== produtoId);
    setNovoPedido((prev) => ({
      ...prev,
      produtos: produtosFiltrados,
      total: calcularTotalPedido(produtosFiltrados),
    }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNovoPedido({ ...novoPedido, logoFile: e.target.files?.[0] || null });
  };

  // --- FUNÇÃO DE SUBMISSÃO ATUALIZADA ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoPedido.cliente || !novoPedido.cliente_email || !novoPedido.cliente_telefone || !novoPedido.cep || novoPedido.produtos.length === 0) {
      toast.error("Preencha todos os dados do cliente e adicione produtos ao pedido.");
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();

    // 1. Montar o objeto customerData
    const customerData = {
      name: novoPedido.cliente,
      email: novoPedido.cliente_email,
      phone: novoPedido.cliente_telefone,
      company: novoPedido.empresa,
      address: novoPedido.endereco,
      cep: novoPedido.cep,
    };
    formData.append('customerData', JSON.stringify(customerData));

    // 2. Montar o array quoteItems (no formato da página pública)
    const processedQuoteItems = novoPedido.produtos.map(item => ({
      // Simula a estrutura do 'product' da página pública
      product: {
        id: item.id,
        name: item.name,
        basePrice: item.unitPrice,
        setupFee: item.setupFee,
      },
      quantity: item.quantity,
      logoType: item.logotype,
      logoText: item.logoText || `Gravação em ${item.name}`, // Texto padrão
      observations: item.observations || "",
      unitPrice: item.unitPrice,
      setupFee: item.setupFee,
      totalPrice: item.totalPrice,
    }));
    formData.append('quoteItems', JSON.stringify(processedQuoteItems));

    // 3. Adicionar o arquivo da logo, se houver
    if (novoPedido.logoFile) {
      formData.append('logoFile', novoPedido.logoFile);
    }

    try {
      // 4. Enviar a requisição para a mesma API da página pública
      const response = await fetch("/api/pedido", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.error || "Erro ao criar pedido.");
      }

      toast.success("Pedido criado com sucesso!");
      
      // 5. Resetar o formulário e fechar o dialog
      setDialogAberto(false);
      setNovoPedido(initialNovoPedidoState);
    } catch (error) {
      console.error("Falha ao criar o pedido:", error);
      toast.error((error as Error).message || "Não foi possível criar o pedido. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };


  const getStatusVariant = (status: string) => {
    switch (status) {
      case "concluido": return "default" as const;
      case "cancelado": return "destructive" as const;
      case "processando": return "secondary" as const;
      default: return "outline" as const;
    }
  };

  function getStatusIcon(status: string): React.ReactNode {
    const iconProps = { className: "h-4 w-4" };
    switch (status) {
      case "concluido": return <CheckCircle {...iconProps} />;
      case "cancelado": return <XCircle {...iconProps} />;
      case "processando": return <Clock {...iconProps} />;
      case "pendente": return <Clock {...iconProps} />;
      default: return null;
    }
  }

  if (pedidoSelecionado) {
    return (
      <DetalhesPedido
        pedidoId={pedidoSelecionado}
        onVoltar={() => setPedidoSelecionado(null)}
      />
    );
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
                {/* --- CAMPOS DO CLIENTE ATUALIZADOS --- */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="cliente" className="text-right">Cliente</Label>
                  <Input id="cliente" value={novoPedido.cliente} onChange={(e) => setNovoPedido({ ...novoPedido, cliente: e.target.value })} className="col-span-3" placeholder="Nome do cliente" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="cliente_email" className="text-right">Email</Label>
                  <Input id="cliente_email" type="email" value={novoPedido.cliente_email} onChange={(e) => setNovoPedido({ ...novoPedido, cliente_email: e.target.value })} className="col-span-3" placeholder="email@example.com" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="cliente_telefone" className="text-right">Telefone</Label>
                  <Input id="cliente_telefone" value={novoPedido.cliente_telefone} onChange={(e) => setNovoPedido({ ...novoPedido, cliente_telefone: e.target.value })} className="col-span-3" placeholder="(XX) XXXXX-XXXX" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="empresa" className="text-right">Empresa</Label>
                  <Input id="empresa" value={novoPedido.empresa} onChange={(e) => setNovoPedido({ ...novoPedido, empresa: e.target.value })} className="col-span-3" placeholder="Nome da empresa (opcional)" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="cep" className="text-right">CEP</Label>
                  <Input id="cep" value={novoPedido.cep} onChange={(e) => setNovoPedido({ ...novoPedido, cep: e.target.value })} className="col-span-3" placeholder="00000-000" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="endereco" className="text-right">Endereço</Label>
                  <Input id="endereco" value={novoPedido.endereco} onChange={(e) => setNovoPedido({ ...novoPedido, endereco: e.target.value })} className="col-span-3" placeholder="Endereço completo" required />
                </div>
                {/* --- CAMPO DE UPLOAD DE LOGO ATUALIZADO --- */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="logoFile" className="text-right">Logo</Label>
                  <Input id="logoFile" type="file" onChange={handleLogoChange} className="col-span-3" />
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Adicionar Produtos</h4>
                  <div className="flex gap-2 mb-3">
                    <Select value={produtoSelecionadoId} onValueChange={setProdutoSelecionadoId}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Selecione um produto" />
                      </SelectTrigger>
                      <SelectContent>
                        {produtosDoEstoque.map((produto) => (
                          <SelectItem key={produto.id} value={produto.id}>
                            {produto.nome} - R$ {produto.preco.toFixed(2)} ({produto.quantidade} disp.)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input type="number" min="1" value={quantidadeSelecionada} onChange={(e) => setQuantidadeSelecionada(Number.parseInt(e.target.value) || 1)} className="w-20" />
                    <Button type="button" onClick={adicionarProdutoAoPedido}>
                      Adicionar
                    </Button>
                  </div>

                  {novoPedido.produtos.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="font-medium">Produtos no Pedido:</h5>
                      {novoPedido.produtos.map((produto) => (
                        <div key={produto.id} className="flex items-center justify-between bg-muted p-2 rounded">
                          <div>
                            <p>{produto.name} x {produto.quantity}</p>
                            <p className="text-xs text-muted-foreground">
                              Unit: R$ {produto.unitPrice.toFixed(2)} + Setup: R$ {produto.setupFee.toFixed(2)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>R$ {produto.totalPrice.toFixed(2)}</span>
                            <Button type="button" variant="outline" size="sm" onClick={() => removerProdutoDoPedido(produto.id)}>
                              Remover
                            </Button>
                          </div>
                        </div>
                      ))}
                      <div className="text-right font-bold">
                        Total Geral: R$ {novoPedido.total.toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting || novoPedido.produtos.length === 0}>
                  {isSubmitting ? "Criando..." : "Criar Pedido"}
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
                  <TableCell>
                    {new Date(pedido.dataPedido).toLocaleDateString("pt-BR")}
                  </TableCell>
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
                        <Button variant="outline" size="sm" onClick={() => atualizarStatusPedido(pedido.id, "processando")}>
                          Processar
                        </Button>
                      )}
                      {(pedido.status === "pendente" || pedido.status === "processando") && (
                        <Button variant="default" size="sm" onClick={() => darBaixaPedido(pedido.id)}>
                          Dar Baixa
                        </Button>
                      )}
                      {pedido.status !== "cancelado" && pedido.status !== "concluido" && (
                          <Button variant="destructive" size="sm" onClick={() => atualizarStatusPedido(pedido.id, "cancelado")}>
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
  );
}