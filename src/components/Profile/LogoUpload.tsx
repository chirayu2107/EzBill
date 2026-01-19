"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Upload, X, Check, Image as ImageIcon } from "lucide-react"
import Button from "../UI/Button"
import { useToast } from "../../hooks/useToast"

interface LogoUploadProps {
  currentLogo?: string
  onLogoChange: (logo: string | null) => void
  disabled?: boolean
}

const LogoUpload: React.FC<LogoUploadProps> = ({ currentLogo, onLogoChange, disabled }) => {
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const processImage = (file: File) => {
    console.log("LogoUpload: Starting to process image:", file.name, file.type, file.size)
    const reader = new FileReader()
    reader.onload = (e) => {
      console.log("LogoUpload: FileReader loaded")
      const img = new Image()
      img.onload = () => {
        console.log("LogoUpload: Image object loaded, dimensions:", img.width, "x", img.height)
        const canvas = document.createElement("canvas")
        const size = Math.min(img.width, img.height)
        canvas.width = 512 // Standard logo size
        canvas.height = 512

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          console.error("LogoUpload: Could not get 2d context")
          toast.error("Processing Failed", "Could not process image")
          setUploading(false)
          return
        }

        // Draw centered and cropped
        const sourceX = (img.width - size) / 2
        const sourceY = (img.height - size) / 2
        
        console.log("LogoUpload: Drawing image to canvas, crop at:", sourceX, sourceY, "size:", size)
        
        // Clear background
        ctx.clearRect(0, 0, 512, 512)
        
        // Try drawing without background fill first to preserve transparency
        ctx.drawImage(
          img,
          sourceX,
          sourceY,
          size,
          size,
          0,
          0,
          512,
          512
        )

        try {
          const result = canvas.toDataURL("image/png")
          console.log("LogoUpload: data URL generated, length:", result.length)
          onLogoChange(result)
          toast.success("Logo Uploaded", "Your business logo has been uploaded and resized to 1:1")
        } catch (err) {
          console.error("LogoUpload: toDataURL failed:", err)
          toast.error("Upload Failed", "Could not convert image data. Ensure the image is accessible.")
        }
        setUploading(false)
      }
      img.onerror = (err) => {
        console.error("LogoUpload: Image loading error:", err)
        toast.error("Process Failed", "Invalid image file")
        setUploading(false)
      }
      img.src = e.target?.result as string
    }
    reader.onerror = (err) => {
      console.error("LogoUpload: FileReader error:", err)
      toast.error("Upload Failed", "Failed to read file")
      setUploading(false)
    }
    reader.readAsDataURL(file)
  }

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    if (!file.type.startsWith("image/")) {
      toast.error("Invalid File Type", "Please upload an image file (PNG, JPG)")
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File Too Large", "Please upload an image smaller than 2MB")
      return
    }

    setUploading(true)
    processImage(file)
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
    handleFiles(e.dataTransfer.files)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return
    handleFiles(e.target.files)
  }

  const handleRemove = () => {
    onLogoChange(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
    toast.success("Logo Removed", "Your business logo has been removed")
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">Business Logo (1:1 Aspect Ratio Recommended)</label>
        {currentLogo && !disabled && (
          <Button onClick={handleRemove} variant="danger" size="sm" icon={X}>
            Remove
          </Button>
        )}
      </div>

      {currentLogo ? (
        <div className="space-y-3">
          <div className="bg-gray-50 dark:bg-white rounded-xl p-6 border-2 border-gray-200 dark:border-gray-600 transition-colors flex items-center justify-center">
            <div className="w-32 h-32 relative bg-white rounded-lg shadow-inner overflow-hidden flex items-center justify-center border border-gray-100">
              <img
                src={currentLogo}
                alt="Business Logo"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 transition-colors">
            <Check className="w-4 h-4" />
            <span>Logo uploaded and auto-resized to 1:1</span>
          </div>
          {!disabled && (
            <Button onClick={() => fileInputRef.current?.click()} variant="secondary" size="sm" icon={Upload}>
              Replace Logo
            </Button>
          )}
        </div>
      ) : (
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            dragActive
              ? "border-emerald-500 bg-emerald-500/5"
              : disabled
                ? "border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50"
                : "border-gray-200 dark:border-gray-600 hover:border-emerald-500 dark:hover:border-gray-500 bg-gray-50 dark:bg-gray-700/30 cursor-pointer"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg"
            onChange={handleChange}
            className="hidden"
            disabled={disabled}
          />

          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 bg-gray-100 dark:bg-gray-600 rounded-full flex items-center justify-center transition-colors">
              {uploading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
              ) : (
                <ImageIcon className="w-6 h-6 text-gray-400" />
              )}
            </div>

            <div>
              <p className="text-gray-900 dark:text-white font-medium mb-1 transition-colors">
                {uploading ? "Processing logo..." : "Upload Business Logo"}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 transition-colors">Drag and drop PNG or JPG, or click to browse</p>
              <p className="text-gray-400 dark:text-gray-500 text-xs transition-colors">Max size: 2MB • Will be automatically cropped to 1:1 square</p>
            </div>

            {!disabled && !uploading && (
              <Button onClick={() => fileInputRef.current?.click()} variant="primary" size="sm" icon={Upload}>
                Choose Logo
              </Button>
            )}
            
            {disabled && !currentLogo && (
              <div className="mt-2 py-2 px-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs text-gray-500 dark:text-gray-400 font-medium inline-block">
                Click "Edit Profile" to upload
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 transition-colors">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">💡 Logo Tips</h4>
        <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1 transition-colors">
          <li>• Transparent PNG works best for dark/light modes</li>
          <li>• Avoid very small text in the logo</li>
          <li>• Only displayed on Tax Invoices, not Purchase Bills</li>
          <li>• 1:1 aspect ratio ensures the best display</li>
        </ul>
      </div>
    </div>
  )
}

export default LogoUpload
