"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Eye, Camera, Upload, X, ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"

interface ImageGalleryProps {
  images: string[]
  productName: string
  onAddImages?: (files: File[]) => void
  onRemoveImage?: (index: number) => void
  editable?: boolean
}

export function ImageGallery({ images, productName, onAddImages, onRemoveImage, editable = false }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null)
  const [galleryOpen, setGalleryOpen] = useState(false)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (onAddImages) {
      onAddImages(files)
    }
  }

  const capturePhoto = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })

      // Criar modal para preview da câmera
      const modal = document.createElement("div")
      modal.className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"

      const container = document.createElement("div")
      container.className = "bg-white p-4 rounded-lg max-w-md w-full mx-4"

      const video = document.createElement("video")
      video.srcObject = stream
      video.autoplay = true
      video.className = "w-full rounded mb-4"

      const buttonContainer = document.createElement("div")
      buttonContainer.className = "flex gap-2 justify-center"

      const captureBtn = document.createElement("button")
      captureBtn.textContent = "Capturar"
      captureBtn.className = "px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"

      const cancelBtn = document.createElement("button")
      cancelBtn.textContent = "Cancelar"
      cancelBtn.className = "px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"

      const cleanup = () => {
        stream.getTracks().forEach((track) => track.stop())
        document.body.removeChild(modal)
      }

      captureBtn.onclick = () => {
        const canvas = document.createElement("canvas")
        const context = canvas.getContext("2d")

        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context?.drawImage(video, 0, 0)

        canvas.toBlob(
          (blob) => {
            if (blob && onAddImages) {
              const file = new File([blob], `foto-${Date.now()}.jpg`, { type: "image/jpeg" })
              onAddImages([file])
            }
            cleanup()
          },
          "image/jpeg",
          0.8,
        )
      }

      cancelBtn.onclick = cleanup

      buttonContainer.appendChild(captureBtn)
      buttonContainer.appendChild(cancelBtn)
      container.appendChild(video)
      container.appendChild(buttonContainer)
      modal.appendChild(container)
      document.body.appendChild(modal)
    } catch (error) {
      alert("Erro ao acessar a câmera. Verifique as permissões.")
    }
  }

  const openGallery = (index: number) => {
    setSelectedImage(index)
    setGalleryOpen(true)
  }

  const nextImage = () => {
    if (selectedImage !== null && selectedImage < images.length - 1) {
      setSelectedImage(selectedImage + 1)
    }
  }

  const prevImage = () => {
    if (selectedImage !== null && selectedImage > 0) {
      setSelectedImage(selectedImage - 1)
    }
  }

  if (images.length === 0 && !editable) {
    return (
      <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center">
        <span className="text-xs text-gray-400">Sem foto</span>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-2">
        {/* Controles de Upload (apenas se editável) */}
        {editable && (
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload">
                <Button type="button" variant="outline" size="sm" className="w-full" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </span>
                </Button>
              </label>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={capturePhoto}>
              <Camera className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Grid de Imagens */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {images.slice(0, 4).map((image, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square bg-gray-100 rounded border overflow-hidden cursor-pointer">
                  <Image
                    src={image || "/placeholder.svg"}
                    alt={`${productName} ${index + 1}`}
                    width={100}
                    height={100}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                    onClick={() => openGallery(index)}
                  />
                </div>

                {editable && onRemoveImage && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onRemoveImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}

                {index === 3 && images.length > 4 && (
                  <div
                    className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center cursor-pointer"
                    onClick={() => openGallery(index)}
                  >
                    <span className="text-white font-semibold">+{images.length - 4}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Contador de imagens */}
        {images.length > 0 && (
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              {images.length} {images.length === 1 ? "imagem" : "imagens"}
            </Badge>
            <Button type="button" variant="ghost" size="sm" onClick={() => openGallery(0)} className="text-xs">
              <Eye className="h-3 w-3 mr-1" />
              Ver todas
            </Button>
          </div>
        )}
      </div>

      {/* Dialog da Galeria */}
      <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Galeria - {productName}</DialogTitle>
          </DialogHeader>

          {selectedImage !== null && (
            <div className="space-y-4">
              {/* Imagem Principal */}
              <div className="relative">
                <div className="flex justify-center bg-gray-100 rounded-lg p-4">
                  <Image
                    src={images[selectedImage] || "/placeholder.svg"}
                    alt={`${productName} ${selectedImage + 1}`}
                    width={600}
                    height={400}
                    className="max-w-full max-h-96 object-contain rounded"
                  />
                </div>

                {/* Controles de Navegação */}
                {images.length > 1 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute left-2 top-1/2 transform -translate-y-1/2"
                      onClick={prevImage}
                      disabled={selectedImage === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      onClick={nextImage}
                      disabled={selectedImage === images.length - 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 justify-center overflow-x-auto pb-2">
                  {images.map((image, index) => (
                    <div
                      key={index}
                      className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden cursor-pointer ${
                        index === selectedImage ? "border-blue-500" : "border-gray-200"
                      }`}
                      onClick={() => setSelectedImage(index)}
                    >
                      <Image
                        src={image || "/placeholder.svg"}
                        alt={`Thumbnail ${index + 1}`}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Contador */}
              <div className="text-center text-sm text-gray-500">
                {selectedImage + 1} de {images.length}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
