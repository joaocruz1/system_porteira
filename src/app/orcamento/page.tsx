"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import {
  Package,
  Send,
  Phone,
  MapPin,
  Instagram,
  Plus,
  Minus,
  ShoppingCart,
  Calculator,
  Info,
  CheckCircle,
  Mail,
} from "lucide-react"
import { METALASER_CATALOG, CATEGORIES, type CatalogItem } from "@/lib/metal-catalog"
import Image from "next/image"
// Adicionar import do novo componente no topo do arquivo
import { CustomProductForm } from "@/components/custom-product-form"
import { json } from "stream/consumers"

interface CustomQuoteItem {
  id: string
  productName: string
  description: string
  category: string
  quantity: number
  logoType: "text" | "image"
  logoText?: string
  logoImage?: File
  observations?: string
  estimatedPrice: number
  isCustom: true
}

// Atualizar o tipo QuoteItem para aceitar produtos personalizados
interface QuoteItem {
  product?: CatalogItem
  custom?: CustomQuoteItem
  quantity: number
  logoType: "text" | "image"
  logoText?: string
  logoImage?: File
  observations?: string
  unitPrice: number
  setupFee: number
  totalPrice: number
}

// Atualizar a interface CustomerData para incluir endereço e remover message
interface CustomerData {
  name: string
  email: string
  phone: string
  company: string
  address: string
}

export default function PublicQuotePage() {
  const [selectedCategory, setSelectedCategory] = useState("Todos")
  const [searchTerm, setSearchTerm] = useState("")
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([])
  // Atualizar o estado inicial de customerData para incluir endereço e remover message
  const [customerData, setCustomerData] = useState<CustomerData>({
    name: "",
    email: "",
    phone: "",
    company: "",
    address: "",
  })
  const [selectedProduct, setSelectedProduct] = useState<CatalogItem | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [customQuoteOpen, setCustomQuoteOpen] = useState(false)

  const filteredProducts = METALASER_CATALOG.filter((product) => {
    const matchesCategory = selectedCategory === "Todos" || product.category === selectedCategory
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const calculateItemTotal = (product: CatalogItem, quantity: number) => {
    const setupFee = product.setupFee || 0
    const unitPrice = product.basePrice
    const totalPrice = unitPrice * quantity + setupFee
    return { unitPrice, setupFee, totalPrice }
  }

  const addToQuote = (
    product: CatalogItem,
    quantity: number,
    logoType: "text" | "image",
    logoText?: string,
    logoImage?: File,
    observations?: string,
  ) => {
    const { unitPrice, setupFee, totalPrice } = calculateItemTotal(product, quantity)

    const newItem: QuoteItem = {
      product,
      quantity,
      logoType,
      logoText,
      logoImage,
      observations,
      unitPrice,
      setupFee,
      totalPrice,
    }
    setQuoteItems([...quoteItems, newItem])
    setDialogOpen(false)
    setSelectedProduct(null)
  }

  const addCustomToQuote = (customItem: CustomQuoteItem) => {
    const setupFee = 50.0 // Taxa padrão para produtos personalizados
    const unitPrice = customItem.estimatedPrice
    const totalPrice = unitPrice * customItem.quantity + setupFee

    const newItem: QuoteItem = {
      custom: customItem,
      quantity: customItem.quantity,
      logoType: customItem.logoType,
      logoText: customItem.logoText,
      logoImage: customItem.logoImage,
      observations: customItem.observations,
      unitPrice,
      setupFee,
      totalPrice,
    }
    setQuoteItems([...quoteItems, newItem])
    setCustomQuoteOpen(false)
  }

  const removeFromQuote = (index: number) => {
    setQuoteItems(quoteItems.filter((_, i) => i !== index))
  }

  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return
    const updatedItems = [...quoteItems]
    const item = updatedItems[index]

    let unitPrice: number
    let setupFee: number

    if (item.product) {
      const calc = calculateItemTotal(item.product, newQuantity)
      unitPrice = calc.unitPrice
      setupFee = calc.setupFee
    } else if (item.custom) {
      unitPrice = item.custom.estimatedPrice
      setupFee = 50.0 // Taxa padrão para produtos personalizados
    } else {
      return
    }

    const totalPrice = unitPrice * newQuantity + setupFee

    updatedItems[index] = {
      ...item,
      quantity: newQuantity,
      unitPrice,
      setupFee,
      totalPrice,
    }
    setQuoteItems(updatedItems)
  }

  const getQuoteTotals = () => {
    const subtotal = quoteItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0)
    const setupFees = quoteItems.reduce((acc, item) => acc + item.setupFee, 0)
    const total = subtotal + setupFees

    return { subtotal, setupFees, total }
  }

const sendQuote = async () => {
  if (!customerData.name || !customerData.email || !customerData.phone || quoteItems.length === 0) {
    alert("Por favor, preencha seus dados e adicione pelo menos um item ao orçamento.");
    return;
  }

  console.log("Dados do Cliente para Envio:", customerData);
  console.log("Itens do Orçamento para Envio:", quoteItems);

  const formData = new FormData();

  // 1. Adicionar dados do cliente (como string JSON)
  formData.append('customerData', JSON.stringify(customerData));

  // 2. Preparar e adicionar itens do orçamento (como string JSON, sem os Files)
  // E extrair o primeiro arquivo de logo, se houver
  let mainLogoFile: File | undefined = undefined;

  const processedQuoteItems = quoteItems.map(item => {
    // Se você quiser armazenar informações sobre qual item tinha o logo,
    // você pode adicionar um campo como 'logoFileNamePlaceholder' no 'processedItem'.
    // Por enquanto, apenas pegamos o primeiro arquivo de logo encontrado.
    if (item.logoType === "image" && item.logoImage && !mainLogoFile) {
      mainLogoFile = item.logoImage;
    }
    // Criar um novo objeto sem a propriedade 'logoImage' para stringificação
    const { logoImage, ...itemWithoutFile } = item;
    return itemWithoutFile;
  });

  formData.append('quoteItems', JSON.stringify(processedQuoteItems));

  // 3. Adicionar o arquivo de logo principal, se existir
  if (mainLogoFile) {
    formData.append('logoFile', mainLogoFile);
  }

  // Debug: verificar o conteúdo do FormData antes de enviar
  // for (let [key, value] of formData.entries()) {
  //   console.log("FormData:", key, value);
  // }

  try {
    const response = await fetch("/api/pedido", {
      method: "POST",
      // Não defina 'Content-Type' manualmente para FormData; o browser faz isso.
      body: formData,
    });

    if (!response.ok) {
      const errorResult = await response.json().catch(() => ({ error: "Erro desconhecido", details: response.statusText }));
      alert(`Ocorreu um erro ao enviar o orçamento: ${errorResult.details || errorResult.error || response.statusText}. Por favor, tente novamente mais tarde.`);
      return;
    }
    
    // Se a resposta foi OK (2xx), então o alerta de sucesso original pode ser usado
    // O alerta "Orcamento Enviado com sucesso" que estava comentado pode ser ativado aqui.
    alert("Orçamento enviado com sucesso! Entraremos em contato em breve.");

    // Reset form
    setCustomerData({
      name: "",
      email: "",
      phone: "",
      company: "",
      address: "",
    });
    setQuoteItems([]); // Limpar itens do orçamento também
  } catch (error) {
      console.error("Falha na requisição de envio do orçamento:", error);
      alert("Falha na comunicação ao enviar o orçamento. Verifique sua conexão e tente novamente.");
  }
};


  const scrollToCustomerData = () => {
    const customerDataElement = document.getElementById("customer-data-section")
    if (customerDataElement) {
      customerDataElement.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Copos e Canecas":
        return "☕"
      case "Garrafas e Squeezes":
        return "🍼"
      case "Chaveiros e Acessórios":
        return "🔑"
      case "Escritório":
        return "✏️"
      case "Facas e Utensílios":
        return "🔪"
      case "Kits e Conjuntos":
        return "📦"
      case "Tábuas e Pranchas":
        return "🪵"
      case "Utensílios":
        return "🔧"
      default:
        return "📋"
    }
  }

  const getProductImageDimensions = (category: string) => {
    switch (category) {
      case "Copos e Canecas":
      case "Garrafas e Squeezes":
        return { width: 300, height: 400 }
      case "Facas e Utensílios":
        return { width: 400, height: 300 }
      case "Tábuas e Pranchas":
        return { width: 400, height: 300 }
      default:
        return { width: 350, height: 350 }
    }
  }

  const { subtotal, setupFees, total } = getQuoteTotals()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Image
                  src="/images/metalaser-logo.png"
                  alt="MetaLaser Logo"
                  width={60}
                  height={60}
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">METALASER</h1>
                <p className="text-gray-600 text-sm font-medium">GRAVAÇÕES A LASER DE PRECISÃO</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-blue-600" />
                <span className="font-medium">(35) 99910-5825</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-blue-600" />
                <span>contato@metalaser.com.br</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Catálogo de Produtos */}
          <div className="lg:col-span-3 space-y-6">
            {/* Filtros */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Package className="h-5 w-5 text-blue-600" />
                  Catálogo de Produtos
                </CardTitle>
                <CardDescription>Escolha os produtos que deseja personalizar com sua logo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Buscar produtos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full sm:w-64 border-gray-300 focus:border-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {getCategoryIcon(category)} {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <div className="flex items-center justify-between px-4 pb-4">
                <p className="text-sm text-gray-600">{filteredProducts.length} produtos encontrados</p>
                <Button
                  variant="outline"
                  onClick={() => setCustomQuoteOpen(true)}
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Produto Personalizado
                </Button>
              </div>
            </Card>

            {/* Grid de Produtos */}
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => {
                const imageDimensions = getProductImageDimensions(product.category)
                return (
                  <Card
                    key={product.id}
                    className="shadow-sm hover:shadow-md transition-shadow duration-200 border-gray-200"
                  >
                    <CardContent className="p-0">
                      <div className="space-y-4">
                        <div className="relative overflow-hidden rounded-t-lg bg-gray-100">
                          <Image
                            src={product.image ? `/${product.image}` : "/images/placeholder.png"}
                            alt={product.name}
                            width={imageDimensions.width}
                            height={imageDimensions.height}
                            className="w-full h-48 object-cover"
                          />
                          <div className="absolute top-3 left-3">
                            <Badge className="bg-blue-600 text-white">{getCategoryIcon(product.category)}</Badge>
                          </div>
                          <div className="absolute top-3 right-3">
                            <Badge variant="secondary" className="bg-white/90 text-gray-900 font-semibold">
                              R$ {product.basePrice.toFixed(2)}
                            </Badge>
                          </div>
                        </div>

                        <div className="p-4 space-y-3">
                          <div>
                            <h3 className="font-semibold text-gray-900 text-lg leading-tight">{product.name}</h3>
                            <Badge variant="outline" className="mt-1 text-xs border-gray-300 text-gray-600">
                              {product.category}
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            {(product.capacity || product.dimensions) && (
                              <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded border">
                                {product.capacity && (
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">Capacidade:</span>
                                    <span>{product.capacity}</span>
                                  </div>
                                )}
                                {product.dimensions && (
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">Dimensões:</span>
                                    <span>{product.dimensions}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded border">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Material:</span>
                                <span>{product.material}</span>
                              </div>
                              {product.weight && (
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">Peso:</span>
                                  <span>{product.weight}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>

                          <div className="bg-blue-50 p-3 rounded border border-blue-200">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700">Preço unitário:</span>
                              <span className="text-lg font-bold text-blue-600">R$ {product.basePrice.toFixed(2)}</span>
                            </div>
                            {product.setupFee && product.setupFee > 0 && (
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-600">Taxa de setup:</span>
                                <span className="text-sm font-medium text-gray-700">
                                  R$ {product.setupFee.toFixed(2)}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-2">
                            <div className="text-sm">
                              <span className="text-gray-500">Mínimo: </span>
                              <span className="font-medium text-gray-700">
                                {product.minimumOrder === 1 ? "1 unidade" : `${product.minimumOrder} unidades`}
                              </span>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedProduct(product)
                                setDialogOpen(true)
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Adicionar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Nenhum produto encontrado com os filtros selecionados.</p>
              </div>
            )}
          </div>

          {/* Sidebar - Orçamento */}
          <div className="space-y-6">
            {/* Resumo do Orçamento */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Calculator className="h-5 w-5 text-blue-600" />
                  Orçamento ({quoteItems.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {quoteItems.length === 0 ? (
                  <div className="text-center py-6">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-500 text-sm">Adicione produtos para ver o orçamento</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Lista de Itens */}
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {quoteItems.map((item, index) => (
                        <div key={index} className="border rounded-lg p-3 bg-gray-50">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm text-gray-900">
                                {item.product?.name || item.custom?.productName}
                              </h4>
                              {item.custom && (
                                <Badge variant="secondary" className="text-xs mt-1">
                                  Produto Personalizado
                                </Badge>
                              )}
                              <p className="text-xs text-gray-600">
                                {item.logoType === "text" ? `Texto: "${item.logoText}"` : "Logo: Imagem"}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromQuote(index)}
                              className="text-gray-400 hover:text-red-500 p-1"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                          </div>

                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(index, item.quantity - 1)}
                                disabled={item.quantity <= (item.product?.minimumOrder || 1)}
                                className="h-6 w-6 p-0"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(index, item.quantity + 1)}
                                className="h-6 w-6 p-0"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          <div className="text-xs text-gray-600 space-y-1">
                            <div className="flex justify-between">
                              <span>
                                {item.quantity}x R$ {item.unitPrice.toFixed(2)}
                              </span>
                              <span>R$ {(item.quantity * item.unitPrice).toFixed(2)}</span>
                            </div>
                            {item.setupFee > 0 && (
                              <div className="flex justify-between">
                                <span>Setup</span>
                                <span>R$ {item.setupFee.toFixed(2)}</span>
                              </div>
                            )}
                            <div className="flex justify-between font-medium text-gray-900 border-t pt-1">
                              <span>Total</span>
                              <span>R$ {item.totalPrice.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    {/* Totais */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal produtos:</span>
                        <span className="font-medium">R$ {subtotal.toFixed(2)}</span>
                      </div>
                      {setupFees > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Taxa de setup:</span>
                          <span className="font-medium">R$ {setupFees.toFixed(2)}</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between text-lg font-bold">
                        <span className="text-gray-900">Total:</span>
                        <span className="text-blue-600">R$ {total.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-3 rounded border border-blue-200">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-blue-800">
                          <p className="font-medium mb-1">Orçamento Estimativo</p>
                          <p>
                            Valores podem variar conforme complexidade da personalização. Orçamento final será enviado
                            por email.
                          </p>
                        </div>
                      </div>
                    </div>
                    {quoteItems.length > 0 && !customerData.name && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-4 md:hidden">
                        <div className="flex items-center gap-2">
                          <Info className="h-4 w-4 text-orange-600" />
                          <div className="text-sm text-orange-800">
                            <p className="font-medium">Próximo passo:</p>
                            <p>Preencha seus dados para solicitar o orçamento</p>
                          </div>
                        </div>
                        <Button
                          onClick={scrollToCustomerData}
                          variant="outline"
                          size="sm"
                          className="w-full mt-2 border-orange-300 text-orange-700 hover:bg-orange-100"
                        >
                          <Send className="h-3 w-3 mr-2" />
                          Ir para dados do cliente
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dados do Cliente */}
            {quoteItems.length > 0 && (
              <Card id="customer-data-section" className="shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-gray-900">Seus Dados</CardTitle>
                  <CardDescription>Para enviarmos o orçamento detalhado</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-gray-700 font-medium">
                      Nome Completo *
                    </Label>
                    <Input
                      id="name"
                      value={customerData.name}
                      onChange={(e) => setCustomerData({ ...customerData, name: e.target.value || "" })}
                      placeholder="Seu nome completo"
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-gray-700 font-medium">
                      Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={customerData.email}
                      onChange={(e) => setCustomerData({ ...customerData, email: e.target.value || "" })}
                      placeholder="seu@email.com"
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-gray-700 font-medium">
                      WhatsApp *
                    </Label>
                    <Input
                      id="phone"
                      value={customerData.phone}
                      onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value || "" })}
                      placeholder="(35) 99999-9999"
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company" className="text-gray-700 font-medium">
                      Empresa (opcional)
                    </Label>
                    <Input
                      id="company"
                      value={customerData.company}
                      onChange={(e) => setCustomerData({ ...customerData, company: e.target.value || "" })}
                      placeholder="Nome da empresa"
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  {/* Substituir o campo de observações pelo campo de endereço na seção "Seus Dados" */}
                  <div>
                    <Label htmlFor="address" className="text-gray-700 font-medium">
                      Endereço *
                    </Label>
                    <Textarea
                      id="address"
                      value={customerData.address}
                      onChange={(e) => setCustomerData({ ...customerData, address: e.target.value || "" })}
                      placeholder="Rua, número, bairro, cidade, estado e CEP"
                      rows={3}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <Button onClick={sendQuote} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    <Send className="mr-2 h-4 w-4" />
                    Solicitar Orçamento Detalhado
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Informações da Empresa */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-gray-900">Contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-blue-600" />
                  <span className="text-gray-700 font-medium">(35) 99910-5825</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <span className="text-gray-700">contato@metalaser.com.br</span>
                </div>
                <div className="flex items-center gap-3">
                  <Instagram className="h-4 w-4 text-blue-600" />
                  <span className="text-gray-700">@metalasergravacoes</span>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-blue-600 mt-0.5" />
                  <span className="text-gray-700">
                    Av. Joaquim Francisco de Assis, 434
                    <br />
                    Ouro Fino/MG - CEP 37570-000
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Garantias */}
            <Card className="shadow-sm bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Gravação de Alta Precisão</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Materiais de Qualidade</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Entrega Rápida</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Garantia de Qualidade</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Botão flutuante para mobile - levar aos dados do cliente */}
      {quoteItems.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 md:hidden">
          <Button
            onClick={scrollToCustomerData}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg rounded-full h-14 w-14 p-0"
            size="lg"
          >
            <div className="flex flex-col items-center">
              <Send className="h-5 w-5" />
              <span className="text-xs mt-1">Dados</span>
            </div>
          </Button>
        </div>
      )}

      {/* Dialog para Adicionar Produto */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Personalizar Produto</DialogTitle>
            <DialogDescription className="text-gray-600">
              Configure os detalhes da personalização para {selectedProduct?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && <ProductCustomizationForm product={selectedProduct} onAdd={addToQuote} />}
        </DialogContent>
      </Dialog>

      {/* Adicionar novo Dialog para produto personalizado após o Dialog existente */}
      <Dialog open={customQuoteOpen} onOpenChange={setCustomQuoteOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Solicitar Produto Personalizado</DialogTitle>
            <DialogDescription className="text-gray-600">
              Descreva o produto que você gostaria de personalizar e não está em nosso catálogo
            </DialogDescription>
          </DialogHeader>
          <CustomProductForm onAdd={addCustomToQuote} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ProductCustomizationForm({
  product,
  onAdd,
}: {
  product: CatalogItem
  onAdd: (
    product: CatalogItem,
    quantity: number,
    logoType: "text" | "image",
    logoText?: string,
    logoImage?: File,
    observations?: string,
  ) => void
}) {
  const [quantity, setQuantity] = useState(product.minimumOrder)
  const [logoType, setLogoType] = useState<"text" | "image">("text")
  const [logoText, setLogoText] = useState("")
  const [logoImage, setLogoImage] = useState<File | null>(null)
  const [observations, setObservations] = useState("")

  const handleSubmit = () => {
    if (logoType === "text" && !logoText.trim()) {
      alert("Por favor, digite o texto para gravação.")
      return
    }
    if (logoType === "image" && !logoImage) {
      alert("Por favor, selecione uma imagem para gravação.")
      return
    }

    onAdd(product, quantity, logoType, logoText || "", logoImage || undefined, observations || "")
  }

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === "") {
      setQuantity(product.minimumOrder)
    } else {
      setQuantity(Math.max(product.minimumOrder, Number.parseInt(value) || product.minimumOrder))
    }
  }

  const calculatePreview = () => {
    const setupFee = product.setupFee || 0
    const unitPrice = product.basePrice
    const totalPrice = unitPrice * quantity + setupFee
    return { unitPrice, setupFee, totalPrice }
  }

  const { unitPrice, setupFee, totalPrice } = calculatePreview()

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="quantity" className="text-gray-700 font-medium">
          Quantidade
        </Label>
        <div className="flex items-center gap-2 mt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuantity(Math.max(product.minimumOrder, quantity - 1))}
            disabled={quantity <= product.minimumOrder}
            className="h-8 w-8 p-0"
          >
            <Minus className="h-3 w-3" />
          </Button>
          <Input
            id="quantity"
            type="number"
            value={quantity.toString()}
            onChange={handleQuantityChange}
            className="w-20 text-center border-gray-300 focus:border-blue-500"
            min={product.minimumOrder}
            onBlur={() => {
              if (quantity < product.minimumOrder) {
                setQuantity(product.minimumOrder)
              }
            }}
          />
          <Button variant="outline" size="sm" onClick={() => setQuantity(quantity + 1)} className="h-8 w-8 p-0">
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        {product.minimumOrder > 1 && (
          <p className="text-xs text-gray-500 mt-1">Pedido mínimo: {product.minimumOrder} unidades</p>
        )}
      </div>

      <div>
        <Label className="text-gray-700 font-medium">Tipo de Personalização</Label>
        <div className="flex gap-4 mt-2">
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              value="text"
              checked={logoType === "text"}
              onChange={(e) => setLogoType(e.target.value as "text" | "image")}
              className="text-blue-600"
            />
            <span className="text-gray-700">Texto</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              value="image"
              checked={logoType === "image"}
              onChange={(e) => setLogoType(e.target.value as "text" | "image")}
              className="text-blue-600"
            />
            <span className="text-gray-700">Logo/Imagem</span>
          </label>
        </div>
      </div>

      {logoType === "text" ? (
        <div>
          <Label htmlFor="logoText" className="text-gray-700 font-medium">
            Texto para Gravação
          </Label>
          <Input
            id="logoText"
            value={logoText}
            onChange={(e) => setLogoText(e.target.value || "")}
            placeholder="Digite o texto que será gravado"
            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      ) : (
        <div>
          <Label htmlFor="logoImage" className="text-gray-700 font-medium">
            Arquivo da Logo
          </Label>
          <Input
            id="logoImage"
            type="file"
            accept="image/*"
            onChange={(e) => setLogoImage(e.target.files?.[0] || null)}
            className="border-gray-300 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Formatos aceitos: JPG, PNG, SVG, AI. Resolução mínima: 300 DPI</p>
        </div>
      )}

      <div>
        <Label htmlFor="observations" className="text-gray-700 font-medium">
          Observações (opcional)
        </Label>
        <Textarea
          id="observations"
          value={observations}
          onChange={(e) => setObservations(e.target.value || "")}
          placeholder="Instruções especiais, posicionamento da logo, tamanho, etc..."
          rows={3}
          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      {/* Preview do Orçamento */}
      <div className="bg-blue-50 p-4 rounded border border-blue-200">
        <h4 className="font-medium text-gray-900 mb-3">Preview do Orçamento</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">
              {quantity}x R$ {unitPrice.toFixed(2)}
            </span>
            <span className="font-medium">R$ {(quantity * unitPrice).toFixed(2)}</span>
          </div>
          {setupFee > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Taxa de setup</span>
              <span className="font-medium">R$ {setupFee.toFixed(2)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between text-base font-bold">
            <span className="text-gray-900">Total Estimado:</span>
            <span className="text-blue-600">R$ {totalPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button onClick={handleSubmit} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar ao Orçamento
        </Button>
      </DialogFooter>
    </div>
  )
}
