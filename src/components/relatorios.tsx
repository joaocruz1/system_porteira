"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, TrendingDown, DollarSign, Download, Landmark, ShieldAlert, Loader2 } from "lucide-react"
import { useEstoque, type Pedido, type Perda, type Custo, type Produto } from "@/components/estoque-context"
import { useState, useRef } from "react"
import { useAuth } from "@/components/auth-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

// Interface para o resultado do agrupamento de vendas por produto
interface VendaProduto {
  produtoId: string;
  nome: string;
  quantidade: number;
  receita: number;
}

export function Relatorios() {
  const { permissions } = useAuth()
  const { produtos, pedidos, perdas, custos } = useEstoque()
  const [periodo, setPeriodo] = useState("este-mes")
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const relatorioRef = useRef<HTMLDivElement>(null);

  if (!permissions.canViewReports) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Acesso Negado</h3>
          <p className="text-muted-foreground">Você não tem permissão para visualizar relatórios.</p>
        </div>
      </div>
    )
  }

  function filterByPeriod<T extends { [key: string]: any }>(items: T[], dateField: keyof T): T[] {
    if (periodo === 'todos') return items;
    
    const now = new Date();
    let startDate: Date;

    switch (periodo) {
      case 'este-mes': startDate = new Date(now.getFullYear(), now.getMonth(), 1); break;
      case 'ultimos-30-dias': startDate = new Date(); startDate.setDate(now.getDate() - 30); break;
      case 'este-ano': startDate = new Date(now.getFullYear(), 0, 1); break;
      default: return items;
    }

    return items.filter((item: T) => {
      const itemDateValue = item[dateField];
      if (typeof itemDateValue !== 'string') return false;
      const itemDate = new Date(itemDateValue);
      return itemDate >= startDate;
    });
  };

  const pedidosFiltrados = filterByPeriod<Pedido>(pedidos, 'dataPedido');
  const perdasFiltradas = filterByPeriod<Perda>(perdas, 'dataPerda');
  const custosFiltrados = filterByPeriod<Custo>(custos, 'dataVencimento');
  
  const pedidosConcluidosFiltrados = pedidosFiltrados.filter((p: Pedido) => p.status === "concluido");
  
  const receitaBruta = pedidosConcluidosFiltrados.reduce((acc, p) => acc + Number(p.total), 0);
  const totalCustos = custosFiltrados.reduce((acc, c) => acc + Number(c.valor), 0);
  const totalPerdas = perdasFiltradas.reduce((acc, p) => acc + Number(p.valorTotal || 0), 0);
  
  const lucroLiquido = receitaBruta - totalCustos - totalPerdas;
  const margemLucro = receitaBruta > 0 ? (lucroLiquido / receitaBruta) * 100 : 0;
  
  const produtosMaisVendidos: VendaProduto[] = pedidosConcluidosFiltrados
    .flatMap((p: Pedido) => p.produtos)
    .reduce((acc: VendaProduto[], produto: Pedido['produtos'][0]) => {
        const existing = acc.find((p) => p.produtoId === produto.produtoId);
        if (existing) {
          existing.quantidade += produto.quantidade;
          existing.receita += produto.quantidade * produto.preco;
        } else {
          acc.push({
            produtoId: produto.produtoId,
            nome: produto.nome,
            quantidade: produto.quantidade,
            receita: produto.quantidade * produto.preco,
          });
        }
        return acc;
      }, [])
    .sort((a: VendaProduto, b: VendaProduto) => b.receita - a.receita)
    .slice(0, 10);
  
  const produtosBaixoEstoque = produtos.filter((p: Produto) => p.quantidade < 20).sort((a: Produto, b: Produto) => a.quantidade - b.quantidade);

  const custosPorCategoria = custosFiltrados.reduce((acc, custo: Custo) => {
    const categoria = custo.categoria || 'Outros';
    acc[categoria] = (acc[categoria] || 0) + Number(custo.valor);
    return acc;
  }, {} as Record<string, number>);

  const perdasPorMotivo = perdasFiltradas.reduce((acc, perda: Perda) => {
    const motivo = perda.motivo || 'outros';
    acc[motivo] = (acc[motivo] || 0) + Number(perda.valorTotal || 0);
    return acc;
  }, {} as Record<string, number>);

  const exportarRelatorio = async () => {
    if (!relatorioRef.current) {
      toast.error("Erro ao capturar conteúdo para o PDF.");
      return;
    }
    setIsGeneratingPdf(true);

    try {
      const contentNode = relatorioRef.current.cloneNode(true) as HTMLElement;
      contentNode.querySelectorAll('.no-print').forEach(el => el.remove());
      const htmlContent = contentNode.innerHTML;

      // Mapeia o valor do período para um texto legível
      const periodLabels: { [key: string]: string } = {
        'este-mes': 'Este Mês',
        'ultimos-30-dias': 'Últimos 30 dias',
        'este-ano': 'Este Ano',
        'todos': 'Todo o Período'
      };
      const periodoLabel = periodLabels[periodo];

      const response = await fetch('/api/gerar-pdf-relatorio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Envia o conteúdo HTML e também o texto do período
        body: JSON.stringify({ htmlContent, periodo: periodoLabel }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao gerar o PDF no servidor.');
      }

      const pdfBlob = await response.blob();
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Relatorio_Porteira_de_Minas_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("PDF gerado com sucesso!");

    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocorreu um erro desconhecido.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div ref={relatorioRef} className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Relatórios</h2>
          <p className="text-muted-foreground">Análises detalhadas do seu negócio</p>
        </div>
        <div className="flex items-center gap-4">
            <div>
                <Label htmlFor="periodo" className="text-sm font-medium">Período</Label>
                <Select value={periodo} onValueChange={setPeriodo}>
                    <SelectTrigger id="periodo" className="w-[180px]">
                        <SelectValue placeholder="Selecione o período" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="este-mes">Este Mês</SelectItem>
                        <SelectItem value="ultimos-30-dias">Últimos 30 dias</SelectItem>
                        <SelectItem value="este-ano">Este Ano</SelectItem>
                        <SelectItem value="todos">Todo o período</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Button variant="outline" onClick={exportarRelatorio} className="self-end" disabled={isGeneratingPdf}>
                {isGeneratingPdf ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Download className="mr-2 h-4 w-4" />
                )}
                {isGeneratingPdf ? 'Gerando...' : 'Exportar'}
            </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Bruta</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">R$ {receitaBruta.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{pedidosConcluidosFiltrados.length} vendas no período</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custos Totais</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">R$ {totalCustos.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{custosFiltrados.length} custos registrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Perdas Totais</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">R$ {totalPerdas.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{perdasFiltradas.length} perdas registradas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${lucroLiquido >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              R$ {lucroLiquido.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Margem de {margemLucro.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="financeiro" className="space-y-4">
        <TabsList className="no-print">
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="vendas">Vendas</TabsTrigger>
          <TabsTrigger value="estoque">Estoque</TabsTrigger>
        </TabsList>

        <TabsContent value="financeiro" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>DRE Simplificado</CardTitle>
                        <CardDescription>Resultado do período selecionado</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center p-3 border-b">
                            <span className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-green-500"/> Receita Bruta</span>
                            <span className="font-semibold text-green-600">+ R$ {receitaBruta.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 border-b">
                            <span className="flex items-center gap-2"><TrendingDown className="h-4 w-4 text-orange-500"/> Custos Totais</span>
                            <span className="font-semibold text-orange-600">- R$ {totalCustos.toFixed(2)}</span>
                        </div>
                         <div className="flex justify-between items-center p-3 border-b">
                            <span className="flex items-center gap-2"><TrendingDown className="h-4 w-4 text-red-500"/> Perdas Totais</span>
                            <span className="font-semibold text-red-600">- R$ {totalPerdas.toFixed(2)}</span>
                        </div>
                        <div className={`flex justify-between items-center p-4 rounded-lg ${lucroLiquido >= 0 ? 'bg-blue-50' : 'bg-red-50'}`}>
                            <span className="font-bold text-lg">Lucro Líquido</span>
                            <span className={`font-bold text-lg ${lucroLiquido >= 0 ? 'text-blue-700' : 'text-red-700'}`}>= R$ {lucroLiquido.toFixed(2)}</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                     <CardHeader>
                        <CardTitle>Análise de Custos e Perdas</CardTitle>
                        <CardDescription>Distribuição dos principais gastos e prejuízos</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-2">
                        <div>
                            <h4 className="font-medium mb-2">Custos por Categoria</h4>
                            <div className="space-y-2">
                                {Object.entries(custosPorCategoria).sort(([, a]: [string, number], [, b]: [string, number]) => b - a).map(([categoria, valor]: [string, number]) => (
                                    <div key={categoria} className="flex justify-between text-sm">
                                        <span>{categoria.charAt(0).toUpperCase() + categoria.slice(1)}</span>
                                        <span className="font-mono">R$ {valor.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                         <div>
                            <h4 className="font-medium mb-2">Perdas por Motivo</h4>
                             <div className="space-y-2">
                                {Object.entries(perdasPorMotivo).sort(([, a]: [string, number], [, b]: [string, number]) => b - a).map(([motivo, valor]: [string, number]) => (
                                    <div key={motivo} className="flex justify-between text-sm">
                                        <span>{motivo.charAt(0).toUpperCase() + motivo.slice(1)}</span>
                                        <span className="font-mono">R$ {valor.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>

        <TabsContent value="vendas" className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Top 10 Produtos Mais Vendidos</CardTitle>
                    <CardDescription>Ranking por receita gerada no período selecionado.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Qtd. Vendida</TableHead>
                        <TableHead className="text-right">Receita Gerada</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {produtosMaisVendidos.map((produto: VendaProduto, index: number) => (
                        <TableRow key={produto.produtoId}>
                            <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline">{index + 1}º</Badge>
                                {produto.nome}
                            </div>
                            </TableCell>
                            <TableCell>{produto.quantidade}</TableCell>
                            <TableCell className="text-right">R$ {produto.receita.toFixed(2)}</TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="estoque" className="space-y-4">
          <Card>
            <CardHeader>
                <CardTitle>Produtos com Baixo Estoque</CardTitle>
                <CardDescription>Produtos que precisam de reposição (menos de 20 unidades).</CardDescription>
            </CardHeader>
            <CardContent>
                {produtosBaixoEstoque.length > 0 ? (
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Estoque Atual</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {produtosBaixoEstoque.map((produto: Produto) => (
                        <TableRow key={produto.id}>
                        <TableCell className="font-medium">{produto.nome}</TableCell>
                        <TableCell>{produto.categoria}</TableCell>
                        <TableCell>{produto.quantidade}</TableCell>
                        <TableCell>
                            <Badge variant={produto.quantidade === 0 ? "destructive" : "secondary"}>
                            {produto.quantidade === 0 ? "Sem estoque" : "Baixo"}
                            </Badge>
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                ) : (
                <p className="text-muted-foreground text-center py-8">Nenhum produto com baixo estoque.</p>
                )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}