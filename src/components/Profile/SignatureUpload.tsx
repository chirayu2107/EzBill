"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Upload, X, Check, Pen } from "lucide-react"
import Button from "../UI/Button"
import { useToast } from "../../hooks/useToast"

interface SignatureUploadProps {
  currentSignature?: string
  onSignatureChange: (signature: string | null) => void
  disabled?: boolean
}

const SignatureUpload: React.FC<SignatureUploadProps> = ({ currentSignature, onSignatureChange, disabled }) => {
  const [activeTab, setActiveTab] = useState<"upload" | "draw">("upload")
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { toast } = useToast()

  const [isDrawing, setIsDrawing] = useState(false)
  const [inkColor, setInkColor] = useState("#000000")
  const [penWidth, setPenWidth] = useState(3)

  // Sync canvas size with device pixel ratio for sharp rendering
  useEffect(() => {
    if (activeTab === "draw" && canvasRef.current) {
      const canvas = canvasRef.current
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = rect.width * dpr
      canvas.height = 160 * dpr
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.scale(dpr, dpr)
        ctx.clearRect(0, 0, rect.width, 160)
      }
    }
  }, [activeTab])

  // Canvas Drawing Pointers Handler
  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.setPointerCapture(e.pointerId)
    
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * (canvas.width / (window.devicePixelRatio || 1))
    const y = ((e.clientY - rect.top) / rect.height) * (canvas.height / (window.devicePixelRatio || 1))

    ctx.beginPath()
    ctx.moveTo(x, y)
    
    ctx.strokeStyle = inkColor
    ctx.lineWidth = penWidth
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    
    setIsDrawing(true)
  }

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * (canvas.width / (window.devicePixelRatio || 1))
    const y = ((e.clientY - rect.top) / rect.height) * (canvas.height / (window.devicePixelRatio || 1))

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    canvasRef.current?.releasePointerCapture(e.pointerId)
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    ctx.clearRect(0, 0, rect.width, 160)
  }

  const handleSaveSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Verify if canvas is empty before saving
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Simple pixel check to prevent saving empty canvas
    const buffer = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const isCanvasBlank = !buffer.data.some(channel => channel !== 0)
    
    if (isCanvasBlank) {
      toast.warning("Empty Signature", "Please draw a signature before applying")
      return
    }

    const dataUrl = canvas.toDataURL("image/png")
    onSignatureChange(dataUrl)
    toast.success("Signature Applied", "Your drawn signature is ready to use!")
  }

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Invalid File Type", "Please upload an image file (PNG, JPG, etc.)")
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File Too Large", "Please upload an image smaller than 2MB")
      return
    }

    setUploading(true)

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      if (result) {
        onSignatureChange(result)
        toast.success("Signature Uploaded", "Your signature has been uploaded successfully")
      } else {
        console.error("Failed to read file - no result")
        toast.error("Upload Failed", "Failed to read the image file")
      }
      setUploading(false)
    }

    reader.onerror = (error) => {
      console.error("FileReader error:", error)
      toast.error("Upload Failed", "Failed to read the image file")
      setUploading(false)
    }

    reader.readAsDataURL(file)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (disabled) return

    const files = e.dataTransfer.files
    handleFiles(files)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (disabled) return

    const files = e.target.files
    handleFiles(files)
  }

  const handleButtonClick = () => {
    if (disabled) return
    fileInputRef.current?.click()
  }

  const handleRemoveSignature = () => {
    onSignatureChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    toast.success("Signature Removed", "Your signature has been removed")
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">Digital Signature</label>
        {currentSignature && !disabled && (
          <Button onClick={handleRemoveSignature} variant="danger" size="sm" icon={X}>
            Remove
          </Button>
        )}
      </div>

      {currentSignature ? (
        <div className="space-y-3">
          <div className="bg-gray-50 dark:bg-white rounded-xl p-4 border-2 border-gray-200 dark:border-white/[0.04] transition-colors">
            <img
              src={currentSignature || "/placeholder.svg"}
              alt="Digital Signature"
              className="max-h-24 max-w-full object-contain mx-auto"
              style={{ filter: "contrast(1.2)" }}
              onError={(e) => {
                console.error("Error loading signature image:", e)
                toast.error("Image Error", "Failed to load signature image")
              }}
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 transition-colors">
            <Check className="w-4 h-4" />
            <span>Signature ready to use</span>
          </div>
          {!disabled && (
            <Button onClick={handleButtonClick} variant="secondary" size="sm" icon={Upload}>
              Upload/Replace Signature
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Tabs header selector */}
          <div className="flex border-b border-gray-200 dark:border-white/[0.04] mb-3">
            <button
              type="button"
              onClick={() => setActiveTab("upload")}
              className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
                activeTab === "upload"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              Upload Image
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("draw")}
              className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
                activeTab === "draw"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              Draw Signature
            </button>
          </div>

          {activeTab === "upload" ? (
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragActive
                  ? "border-blue-500 bg-blue-500/5"
                  : disabled
                    ? "border-gray-200 dark:border-white/[0.04] bg-gray-50 dark:bg-[#212124]"
                    : "border-gray-200 dark:border-white/[0.04] hover:border-blue-500 dark:hover:border-white/[0.06] bg-gray-50 dark:bg-[#1A1A1D]"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleChange}
                className="hidden"
                disabled={disabled}
              />

              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 bg-gray-100 dark:bg-gray-600 rounded-full flex items-center justify-center transition-colors">
                  {uploading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  ) : (
                    <Pen className="w-6 h-6 text-gray-400" />
                  )}
                </div>

                <div>
                  <p className="text-gray-900 dark:text-white font-medium mb-1 transition-colors">
                    {uploading ? "Uploading signature..." : "Upload your signature"}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 transition-colors">Drag and drop an image file here, or click to browse</p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs transition-colors">Supported formats: PNG, JPG, GIF • Max size: 2MB</p>
                </div>

                {!disabled && !uploading && (
                  <Button onClick={handleButtonClick} variant="primary" size="sm" icon={Upload}>
                    Choose File
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Canvas Area */}
              <div className="border border-gray-200 dark:border-white/[0.08] rounded-xl overflow-hidden bg-white p-2">
                <canvas
                  ref={canvasRef}
                  onPointerDown={startDrawing}
                  onPointerMove={draw}
                  onPointerUp={stopDrawing}
                  onPointerLeave={stopDrawing}
                  className="w-full h-40 cursor-crosshair touch-none"
                  style={{
                    backgroundImage: "radial-gradient(#e5e7eb 1px, transparent 1px)",
                    backgroundSize: "16px 16px",
                  }}
                />
              </div>

              {/* Controls Panel */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 dark:bg-[#1A1A1D] p-3 rounded-xl border border-gray-200/50 dark:border-white/[0.04]">
                {/* Color Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-gray-500 dark:text-[#71717A]">Ink:</span>
                  {[
                    { id: "#000000", label: "Black", bg: "bg-black" },
                    { id: "#1e3a8a", label: "Blue", bg: "bg-blue-900" },
                    { id: "#334155", label: "Slate", bg: "bg-slate-700" },
                  ].map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => setInkColor(color.id)}
                      className={`w-5 h-5 rounded-full ${color.bg} border transition-all ${
                        inkColor === color.id ? "ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-black scale-110" : "opacity-80"
                      }`}
                      title={color.label}
                    />
                  ))}
                </div>

                {/* Size Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-gray-500 dark:text-[#71717A]">Size:</span>
                  {[
                    { val: 2, label: "Fine" },
                    { val: 4, label: "Med" },
                    { val: 6, label: "Thick" },
                  ].map((sz) => (
                    <button
                      key={sz.val}
                      type="button"
                      onClick={() => setPenWidth(sz.val)}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all ${
                        penWidth === sz.val
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white dark:bg-[#212124] text-gray-600 dark:text-[#8B8B96] border-gray-200 dark:border-white/[0.06]"
                      }`}
                    >
                      {sz.label}
                    </button>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-auto sm:ml-0">
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="px-3 py-1.5 text-[11px] font-semibold text-gray-600 dark:text-[#8B8B96] hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  >
                    Clear
                  </button>
                  <Button
                    type="button"
                    onClick={handleSaveSignature}
                    variant="primary"
                    size="sm"
                    icon={Check}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-gray-50 dark:bg-[#212124] rounded-xl p-3 transition-colors">
        <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">💡 Signature Tips</h4>
        <ul className="text-[11px] text-gray-500 dark:text-gray-400 space-y-1 transition-colors">
          <li>• Draw your signature smoothly inside the canvas area</li>
          <li>• Select your ink color and thickness for direct styling</li>
          <li>• Canvas drawings are exported with high contrast print clarity</li>
        </ul>
      </div>
    </div>
  )
}

export default SignatureUpload
