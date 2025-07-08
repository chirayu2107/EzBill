"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Upload, X, Check, Pen } from "lucide-react"
import Button from "../UI/Button"
import { useToast } from "../../hooks/useToast"

interface SignatureUploadProps {
  currentSignature?: string
  onSignatureChange: (signature: string | null) => void
  disabled?: boolean
}

const SignatureUpload: React.FC<SignatureUploadProps> = ({ currentSignature, onSignatureChange, disabled }) => {
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    console.log("Processing file:", file.name, file.type, file.size)

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
    console.log("Starting file upload...")

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      if (result) {
        console.log("File read successfully, base64 length:", result.length)
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
    console.log("Files dropped:", files.length)
    handleFiles(files)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (disabled) return

    const files = e.target.files
    console.log("Files selected:", files?.length)
    handleFiles(files)
  }

  const handleButtonClick = () => {
    if (disabled) return
    console.log("Opening file picker...")
    fileInputRef.current?.click()
  }

  const handleRemoveSignature = () => {
    console.log("Removing signature...")
    onSignatureChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    toast.success("Signature Removed", "Your signature has been removed")
  }

  console.log("SignatureUpload render - currentSignature exists:", !!currentSignature)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-300">Digital Signature</label>
        {currentSignature && !disabled && (
          <Button onClick={handleRemoveSignature} variant="danger" size="sm" icon={X}>
            Remove
          </Button>
        )}
      </div>

      {currentSignature ? (
        <div className="space-y-3">
          <div className="bg-white rounded-lg p-4 border-2 border-gray-600">
            <img
              src={currentSignature || "/placeholder.svg"}
              alt="Digital Signature"
              className="max-h-24 max-w-full object-contain mx-auto"
              style={{ filter: "contrast(1.2)" }}
              onError={(e) => {
                console.error("Error loading signature image:", e)
                toast.error("Image Error", "Failed to load signature image")
              }}
              onLoad={() => {
                console.log("Signature image loaded successfully")
              }}
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-green-400">
            <Check className="w-4 h-4" />
            <span>Signature uploaded and ready to use</span>
          </div>
          {!disabled && (
            <Button onClick={handleButtonClick} variant="secondary" size="sm" icon={Upload}>
              Replace Signature
            </Button>
          )}
        </div>
      ) : (
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? "border-emerald-500 bg-emerald-500/5"
              : disabled
                ? "border-gray-600 bg-gray-700/50"
                : "border-gray-600 hover:border-gray-500 bg-gray-700/30"
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
            <div className="mx-auto w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
              {uploading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
              ) : (
                <Pen className="w-6 h-6 text-gray-400" />
              )}
            </div>

            <div>
              <p className="text-white font-medium mb-1">
                {uploading ? "Uploading signature..." : "Upload your signature"}
              </p>
              <p className="text-gray-400 text-sm mb-4">Drag and drop an image file here, or click to browse</p>
              <p className="text-gray-500 text-xs">Supported formats: PNG, JPG, GIF • Max size: 2MB</p>
            </div>

            {!disabled && !uploading && (
              <Button onClick={handleButtonClick} variant="primary" size="sm" icon={Upload}>
                Choose File
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="bg-gray-700 rounded-lg p-3">
        <h4 className="text-sm font-medium text-gray-300 mb-2">💡 Signature Tips</h4>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• Use a white background for best results</li>
          <li>• Sign with a dark pen or marker</li>
          <li>• Keep the signature centered in the image</li>
          <li>• Higher resolution images work better</li>
        </ul>
      </div>
    </div>
  )
}

export default SignatureUpload
