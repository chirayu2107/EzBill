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
        return <AlertTriangle className="w-5 h-5 text-amber-500" />
      case "info":
        return <Info className="w-5 h-5 text-blue-500" />
      default:
        return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  const getTypeLabel = () => {
    return type.toUpperCase()
  }

  const getColors = () => {
    switch (type) {
      case "success":
        return "border-green-500/20"
      case "error":
        return "border-red-500/20"
      case "warning":
        return "border-amber-500/20"
      case "info":
        return "border-blue-500/20"
      default:
        return "border-blue-500/20"
    }
  }

  const getLabelColor = () => {
    switch (type) {
      case "success":
        return "text-green-600 dark:text-green-400"
      case "error":
        return "text-red-600 dark:text-red-400"
      case "warning":
        return "text-amber-600 dark:text-amber-400"
      case "info":
        return "text-blue-600 dark:text-blue-400"
      default:
        return "text-blue-600 dark:text-blue-400"
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.8, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 280, damping: 28 }}
      className={`
        bg-white dark:bg-[#0C0C0E] relative flex items-start gap-3 p-4 rounded-xl border ${getColors()}
        min-w-[300px] max-w-[400px]
        shadow-ez dark:shadow-ez-dark
      `}
    >
      <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>

      <div className="flex-1 min-w-0">
        <span className={`text-xs font-medium text-gray-500 dark:text-gray-400 ${getLabelColor()} block mb-1`}>{getTypeLabel()}</span>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{title}</p>
        {message && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-body">{message}</p>}
      </div>

      <button onClick={() => onClose(id)} className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors p-1 rounded-md hover:bg-gray-100 dark:hover:bg-[#212124]">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  )
}

export default Toast
