"use client"

import type React from "react"
import { useEffect } from "react"
import { motion } from "framer-motion"
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react"

export interface ToastProps {
  id: string
  type: "success" | "error" | "info" | "warning"
  title: string
  message?: string
  duration?: number
  onClose: (id: string) => void
}

const Toast: React.FC<ToastProps> = ({ id, type, title, message, duration = 5000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id)
    }, duration)

    return () => clearTimeout(timer)
  }, [id, duration, onClose])

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-500" />
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case "info":
        return <Info className="w-5 h-5 text-blue-500" />
      default:
        return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  const getColors = () => {
    switch (type) {
      case "success":
        return "bg-green-500/10 border-green-500/20 text-green-400"
      case "error":
        return "bg-red-500/10 border-red-500/20 text-red-400"
      case "warning":
        return "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
      case "info":
        return "bg-blue-500/10 border-blue-500/20 text-blue-400"
      default:
        return "bg-blue-500/10 border-blue-500/20 text-blue-400"
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.3 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.5, transition: { duration: 0.2 } }}
      className={`flex items-start gap-3 p-4 rounded-lg border backdrop-blur-sm ${getColors()} min-w-[300px] max-w-[400px] shadow-lg`}
    >
      <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{title}</p>
        {message && <p className="text-xs text-gray-300 mt-1">{message}</p>}
      </div>

      <button onClick={() => onClose(id)} className="flex-shrink-0 text-gray-400 hover:text-white transition-colors">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  )
}

export default Toast
