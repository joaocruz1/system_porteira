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
import { useEstoque, Pedido, Produto } from "@/components/estoque-context"; // Importe Pedido e Produto
import { DetalhesPedido } from "@/components/detalhes-pedido";

// Interface para os itens dentro do estado novoPedido
interface NovoPedidoProduto {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number; // Preço unitário do produto base
  totalPrice: number; // quantidade * unitPrice (+ setupFeeItem se houver)
  logotype?: string; // Adicionado para consistência com o que a API pode esperar por item
  // logoText?: string; // Se precisar de texto específico por item
}

// Interface para o payload que será enviado para criarPedido
// Isso ajuda a garantir que todos os campos obrigatórios de Omit<Pedido, "id"> sejam incluídos
interface PedidoPayload extends Omit<Pedido, "id" | "produtos"> {
  product: Array<{ // Esta é a estrutura que a API (via contexto) espera para os itens
    Id: string;
    nome: string;
    quantidade: number;
    preco: number; // Mapeado de unitPrice
    logotype: string;
    // logoText?: string; // Se for enviar
  }>;
}


export function GestaoVendas() {
  const {
    produtos: produtosDoEstoque, // Renomeado para evitar conflito com novoPedido.produtos
    pedidos,
    criarPedido,
    atualizarStatusPedido,
    darBaixaPedido,
  } = useEstoque();

  const [dialogAberto, setDialogAberto] = useState(false);
  const [pedidoSelecionado, setPedidoSelecionado] = useState<string | null>(
    null
  );

  const initialNovoPedidoState = {
    cliente: "",
    logo: "",
    endereco: "",
    cliente_telefone: "",
    cliente_email: "",
    produtos: [] as NovoPedidoProduto[], // Usando a interface interna
    total: 0,
    status: "pendente" as const,
    dataPedido: new Date().toISOString().split("T")[0],
    // logotype: "text", // Se houver um logotype geral para o pedido. Ajuste a interface Pedido no contexto se necessário.
  };

  const [novoPedido, setNovoPedido] = useState(initialNovoPedidoState);
  const [produtoSelecionadoId, setProdutoSelecionadoId] = useState("");
  const [quantidadeSelecionada, setQuantidadeSelecionada] = useState(1);

  const calcularTotalItem = (
    unitPrice: number,
    quantidade: number,
    setupFeeItem: number = 0 // Se você tiver taxa de setup por item
  ): number => {
    return unitPrice * quantidade + setupFeeItem;
  };

  const calcularTotalPedido = (
    produtosNoPedido: NovoPedidoProduto[]
  ): number => {
    return produtosNoPedido.reduce((acc, p) => acc + p.totalPrice, 0);
    // Se houver uma taxa de setup GERAL para o pedido, adicione aqui:
    // + (novoPedido.algumaTaxaDeSetupGeral || 0);
  };

  const adicionarProdutoAoPedido = () => {
    const produtoBase = produtosDoEstoque.find(p => p.id === produtoSelecionadoId);
    if (produtoBase && quantidadeSelecionada > 0) {
      if (quantidadeSelecionada > produtoBase.quantidade) {
        alert(`Quantidade indisponível! Só há ${produtoBase.quantidade} em estoque.`);
        return;
      }
      const { preco: unitPriceDoProdutoBase } = produtoBase;
      const setupFeeParaEsteItem = 0; // Defina se houver taxa de setup por item

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
              quantidade: novaQuantidade, // "quantidade" é o nome correto na interface NovoPedidoProduto
              totalPrice: calcularTotalItem(
                p.unitPrice,
                novaQuantidade,
                (p as any).setupFeeItem || setupFeeParaEsteItem // Mantém setup fee do item se existir
              ),
            };
          }
          return p;
        });
      } else {
        const novoItem: NovoPedidoProduto = {
          id: produtoBase.id,
          name: produtoBase.nome,
          quantity: quantidadeSelecionada,
          unitPrice: unitPriceDoProdutoBase,
          totalPrice: calcularTotalItem(
            unitPriceDoProdutoBase,
            quantidadeSelecionada,
            setupFeeParaEsteItem
          ),
          logotype: "text", // Defina um padrão ou pegue de algum lugar
          // setupFeeItem: setupFeeParaEsteItem, // Se rastrear por item
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
    const produtosFiltrados = novoPedido.produtos.filter(
      (p) => p.id !== produtoId
    );
    setNovoPedido((prev) => ({
      ...prev,
      produtos: produtosFiltrados,
      total: calcularTotalPedido(produtosFiltrados),
    }));
  };

 const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (novoPedido.cliente && novoPedido.produtos.length > 0) {
      // Mapear os produtos do estado novoPedido (NovoPedidoProduto)
      // para a estrutura esperada pela interface Pedido['produtos'] do contexto
      const produtosParaAPIContexto = novoPedido.produtos.map((item) => ({
        produtoId: item.id,
        nome: item.name,
        quantidade: item.quantity,
        preco: item.unitPrice, // Mapeando unitPrice para preco
        logotype: item.logotype || "text", // Pega o logotype do item ou usa padrão
        // logoText: item.logoText || "", // Se você tiver logoText no NovoPedidoProduto
      }));

      // Este é o objeto que será enviado para criarPedido,
      // que por sua vez construirá o FormData
      const pedidoParaContexto: Omit<Pedido, "id"> = {
        cliente: novoPedido.cliente,
        logo: novoPedido.logo, // URL da imagem principal do pedido
        endereco: novoPedido.endereco,
        cliente_telefone: novoPedido.cliente_telefone,
        cliente_email: novoPedido.cliente_email,
        produtos: produtosParaAPIContexto, // Array de produtos formatado
        total: novoPedido.total, // Total geral já calculado
        status: novoPedido.status,
        dataPedido: novoPedido.dataPedido,
        // logotype: novoPedido.logotype, // Se a interface Pedido no contexto tiver logotype no nível raiz
      };

      criarPedido(pedidoParaContexto);
      setDialogAberto(false);
      setNovoPedido(initialNovoPedidoState);
    }
  };


  const getStatusVariant = (status: string) => {
    switch (status) {
      case "concluido":
        return "default" as const;
      case "cancelado":
        return "destructive" as const;
      case "processando":
        return "secondary" as const;
      default:
        return "outline" as const;
    }
  };

  if (pedidoSelecionado) {
    return (
      <DetalhesPedido
        pedidoId={pedidoSelecionado}
        onVoltar={() => setPedidoSelecionado(null)}
      />
    );
  }

  // --- FUNÇÃO CORRIGIDA ---
  function getStatusIcon(status: string): React.ReactNode {
    const iconProps = { className: "h-4 w-4" };
    switch (status) {
      case "concluido":
        return <CheckCircle {...iconProps} />;
      case "cancelado":
        return <XCircle {...iconProps} />;
      case "processando":
        return <Clock {...iconProps} />;
      case "pendente":
        return <Clock {...iconProps} />; // Usando o mesmo ícone para pendente
      default:
        return null; // Não retorna ícone para status desconhecido
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Vendas e Pedidos
          </h2>
          <p className="text-muted-foreground">
            Gerencie pedidos e controle as vendas
          </p>
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
              <DialogDescription>
                Adicione produtos ao pedido e finalize a venda.
              </DialogDescription>
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
                    onChange={(e) =>
                      setNovoPedido({ ...novoPedido, cliente: e.target.value })
                    }
                    className="col-span-3"
                    placeholder="Nome do cliente"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="endereco" className="text-right">
                    Endereço
                  </Label>
                  <Input
                    id="endereco"
                    value={novoPedido.endereco}
                    onChange={(e) =>
                      setNovoPedido({ ...novoPedido, endereco: e.target.value })
                    }
                    className="col-span-3"
                    placeholder="Endereço do cliente"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="cliente_telefone" className="text-right">
                    Telefone
                  </Label>
                  <Input
                    id="cliente_telefone"
                    value={novoPedido.cliente_telefone}
                    onChange={(e) =>
                      setNovoPedido({ ...novoPedido, cliente_telefone: e.target.value })
                    }
                    className="col-span-3"
                    placeholder="(XX) XXXXX-XXXX"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="cliente_email" className="text-right">
                    Email Cliente
                  </Label>
                  <Input
                    id="cliente_email"
                    type="email"
                    value={novoPedido.cliente_email}
                    onChange={(e) =>
                      setNovoPedido({
                        ...novoPedido,
                        cliente_email: e.target.value,
                      })
                    }
                    className="col-span-3"
                    placeholder="email@example.com"
                    required
                  />
                </div>
                {/* Campo para URL do Logo (opcional) */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="logoUrl" className="text-right">
                    URL da Logo
                  </Label>
                  <Input
                    id="logoUrl"
                    value={novoPedido.logo}
                    onChange={(e) =>
                      setNovoPedido({ ...novoPedido, logo: e.target.value })
                    }
                    className="col-span-3"
                    placeholder="https://exemplo.com/logo.png (opcional)"
                  />
                </div>


                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Adicionar Produtos</h4>
                  <div className="flex gap-2 mb-3">
                    <Select
                      value={produtoSelecionadoId}
                      onValueChange={setProdutoSelecionadoId}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Selecione um produto" />
                      </SelectTrigger>
                      <SelectContent>
                        {produtosDoEstoque.map((produto) => (
                          <SelectItem key={produto.id} value={produto.id}>
                            {produto.nome} - R${" "}
                            {produto.preco.toFixed(2)} ({produto.quantidade}{" "}
                            disponível)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min="1"
                      value={quantidadeSelecionada}
                      onChange={(e) =>
                        setQuantidadeSelecionada(
                          Number.parseInt(e.target.value) || 1
                        )
                      }
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
                        <div
                          key={index}
                          className="flex items-center justify-between bg-muted p-2 rounded"
                        >
                          <div>
                            <p>{produto.name} x {produto.quantity}</p>
                            <p className="text-xs text-muted-foreground">
                              Unit: R$ {produto.unitPrice.toFixed(2)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>R$ {produto.totalPrice.toFixed(2)}</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                removerProdutoDoPedido(produto.id)
                              }
                            >
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
                <Button
                  type="submit"
                  disabled={novoPedido.produtos.length === 0}
                >
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
                    <Badge
                      variant={getStatusVariant(pedido.status)}
                      className="flex items-center gap-1 w-fit"
                    >
                      {getStatusIcon(pedido.status)}
                      {pedido.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPedidoSelecionado(pedido.id)}
                      >
                        Ver Detalhes
                      </Button>
                      {pedido.status === "pendente" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            atualizarStatusPedido(pedido.id, "processando")
                          }
                        >
                          Processar
                        </Button>
                      )}
                      {(pedido.status === "pendente" ||
                        pedido.status === "processando") && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => darBaixaPedido(pedido.id)}
                          >
                            Dar Baixa
                          </Button>
                        )}
                      {pedido.status !== "cancelado" &&
                        pedido.status !== "concluido" && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              atualizarStatusPedido(pedido.id, "cancelado")
                            }
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
  );
}