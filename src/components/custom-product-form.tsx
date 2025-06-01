"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DialogFooter } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Plus, Minus, AlertCircle } from "lucide-react"

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

interface CustomProductFormProps {
  onAdd: (customItem: CustomQuoteItem) => void
}

const CUSTOM_CATEGORIES = [
  "Copos e Canecas",
  "Garrafas e Squeezes",
  "Chaveiros e Acessórios",
  "Escritório",
  "Facas e Utensílios",
  "Kits e Conjuntos",
  "Tábuas e Pranchas",
  "Utensílios",
  "Decoração",
  "Brindes Corporativos",
  "Outros",
]

const PRICE_RANGES = [
  { label: "Até R$ 25,00", value: 20 },
  { label: "R$ 25,00 - R$ 50,00", value: 37.5 },
  { label: "R$ 50,00 - R$ 100,00", value: 75 },
  { label: "R$ 100,00 - R$ 200,00", value: 150 },
  { label: "R$ 200,00 - R$ 500,00", value: 350 },
  { label: "Acima de R$ 500,00", value: 750 },
  { label: "Não sei estimar", value: 100 },
]

export function CustomProductForm({ onAdd }: CustomProductFormProps) {
  const [formData, setFormData] = useState({
    productName: "",
    description: "",
    category: "",
    quantity: 1,
    logoType: "text" as "text" | "image",
    logoText: "",
    observations: "",
    estimatedPrice: 100,
    referenceImages: [] as File[],
  })
  const [logoImage, setLogoImage] = useState<File | null>(null)

  const handleSubmit = () => {
    if (!formData.productName.trim()) {
      alert("Por favor, informe o nome do produto.")
      return
    }
    if (!formData.description.trim()) {
      alert("Por favor, descreva o produto que você deseja.")
      return
    }
    if (!formData.category) {
      alert("Por favor, selecione uma categoria.")
      return
    }
    if (formData.logoType === "text" && !formData.logoText.trim()) {
      alert("Por favor, digite o texto para gravação.")
      return
    }
    if (formData.logoType === "image" && !logoImage) {
      alert("Por favor, selecione uma imagem para gravação.")
      return
    }

    const customItem: CustomQuoteItem = {
      id: `custom-${Date.now()}`,
      productName: formData.productName,
      description: formData.description,
      category: formData.category,
      quantity: formData.quantity,
      logoType: formData.logoType,
      logoText: formData.logoText || undefined,
      logoImage: logoImage || undefined,
      observations: formData.observations || undefined,
      estimatedPrice: formData.estimatedPrice,
      isCustom: true,
    }

    onAdd(customItem)
  }

  const handleReferenceImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setFormData((prev) => ({
      ...prev,
      referenceImages: [...prev.referenceImages, ...files].slice(0, 3), // Máximo 3 imagens
    }))
  }

  const removeReferenceImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      referenceImages: prev.referenceImages.filter((_, i) => i !== index),
    }))
  }

  const calculatePreview = () => {
    const setupFee = 50.0 // Taxa padrão para produtos personalizados
    const unitPrice = formData.estimatedPrice
    const totalPrice = unitPrice * formData.quantity + setupFee
    return { unitPrice, setupFee, totalPrice }
  }

  const { unitPrice, setupFee, totalPrice } = calculatePreview()

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto">
      {/* Informações do Produto */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="productName" className="text-gray-700 font-medium">
            Nome do Produto *
          </Label>
          <Input
            id="productName"
            value={formData.productName}
            onChange={(e) => setFormData((prev) => ({ ...prev, productName: e.target.value }))}
            placeholder="Ex: Copo térmico personalizado, Chaveiro especial..."
            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <Label htmlFor="category" className="text-gray-700 font-medium">
            Categoria *
          </Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
          >
            <SelectTrigger className="border-gray-300 focus:border-blue-500">
              <SelectValue placeholder="Selecione a categoria mais próxima" />
            </SelectTrigger>
            <SelectContent>
              {CUSTOM_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="description" className="text-gray-700 font-medium">
            Descrição Detalhada *
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Descreva detalhadamente o produto que você deseja: material, tamanho, cor, funcionalidades, etc. Quanto mais detalhes, melhor será nosso orçamento."
            rows={4}
            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <Label htmlFor="quantity" className="text-gray-700 font-medium">
            Quantidade Desejada
          </Label>
          <div className="flex items-center gap-2 mt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFormData((prev) => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))}
              disabled={formData.quantity <= 1}
              className="h-8 w-8 p-0"
            >
              <Minus className="h-3 w-3" />
            </Button>
            <Input
              id="quantity"
              type="number"
              value={formData.quantity.toString()}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, quantity: Math.max(1, Number.parseInt(e.target.value) || 1) }))
              }
              className="w-20 text-center border-gray-300 focus:border-blue-500"
              min={1}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFormData((prev) => ({ ...prev, quantity: prev.quantity + 1 }))}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div>
          <Label className="text-gray-700 font-medium">Faixa de Preço Esperada (por unidade)</Label>
          <Select
            value={formData.estimatedPrice.toString()}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, estimatedPrice: Number.parseFloat(value) }))}
          >
            <SelectTrigger className="border-gray-300 focus:border-blue-500">
              <SelectValue placeholder="Selecione uma faixa de preço" />
            </SelectTrigger>
            <SelectContent>
              {PRICE_RANGES.map((range) => (
                <SelectItem key={range.value} value={range.value.toString()}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 mt-1">
            Esta é apenas uma estimativa para cálculo inicial. O preço final será definido após análise técnica.
          </p>
        </div>
      </div>

      <Separator />

      {/* Imagens de Referência */}
      <div className="space-y-4">
        <div>
          <Label className="text-gray-700 font-medium">Imagens de Referência (opcional)</Label>
          <div className="mt-2">
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={handleReferenceImageChange}
              className="border-gray-300 focus:border-blue-500"
              disabled={formData.referenceImages.length >= 3}
            />
            <p className="text-xs text-gray-500 mt-1">
              Envie até 3 imagens de referência do produto que você deseja (opcional)
            </p>
          </div>

          {formData.referenceImages.length > 0 && (
            <div className="mt-3 space-y-2">
              {formData.referenceImages.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded border">
                  <span className="text-sm text-gray-700 truncate">{file.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeReferenceImage(index)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Personalização */}
      <div className="space-y-4">
        <div>
          <Label className="text-gray-700 font-medium">Tipo de Personalização *</Label>
          <div className="flex gap-4 mt-2">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                value="text"
                checked={formData.logoType === "text"}
                onChange={(e) => setFormData((prev) => ({ ...prev, logoType: e.target.value as "text" | "image" }))}
                className="text-blue-600"
              />
              <span className="text-gray-700">Texto</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                value="image"
                checked={formData.logoType === "image"}
                onChange={(e) => setFormData((prev) => ({ ...prev, logoType: e.target.value as "text" | "image" }))}
                className="text-blue-600"
              />
              <span className="text-gray-700">Logo/Imagem</span>
            </label>
          </div>
        </div>

        {formData.logoType === "text" ? (
          <div>
            <Label htmlFor="logoText" className="text-gray-700 font-medium">
              Texto para Gravação *
            </Label>
            <Input
              id="logoText"
              value={formData.logoText}
              onChange={(e) => setFormData((prev) => ({ ...prev, logoText: e.target.value }))}
              placeholder="Digite o texto que será gravado"
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        ) : (
          <div>
            <Label htmlFor="logoImage" className="text-gray-700 font-medium">
              Arquivo da Logo *
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
            Observações Especiais
          </Label>
          <Textarea
            id="observations"
            value={formData.observations}
            onChange={(e) => setFormData((prev) => ({ ...prev, observations: e.target.value }))}
            placeholder="Instruções especiais, posicionamento da logo, cores específicas, prazo de entrega, etc..."
            rows={3}
            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      <Separator />

      {/* Preview do Orçamento */}
      <div className="bg-amber-50 p-4 rounded border border-amber-200">
        <div className="flex items-start gap-2 mb-3">
          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-amber-800">Orçamento Estimativo</h4>
            <p className="text-xs text-amber-700">
              Este é um cálculo preliminar. O valor final será definido após análise técnica do produto solicitado.
            </p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">
              {formData.quantity}x R$ {unitPrice.toFixed(2)} (estimado)
            </span>
            <span className="font-medium">R$ {(formData.quantity * unitPrice).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Taxa de desenvolvimento</span>
            <span className="font-medium">R$ {setupFee.toFixed(2)}</span>
          </div>
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
          Adicionar Produto Personalizado
        </Button>
      </DialogFooter>
    </div>
  )
}
