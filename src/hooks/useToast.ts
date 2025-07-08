"use client"

import { useState, useCallback } from "react"
import type { ToastProps } from "../components/UI/Toast"

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const addToast = useCallback((toast: Omit<ToastProps, "id" | "onClose">) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: ToastProps = {
      ...toast,
      id,
      onClose: () => {},
    }

    setToasts((prev) => [...prev, newToast])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const toast = {
    success: (title: string, message?: string) => addToast({ type: "success", title, message }),
    error: (title: string, message?: string) => addToast({ type: "error", title, message }),
    info: (title: string, message?: string) => addToast({ type: "info", title, message }),
    warning: (title: string, message?: string) => addToast({ type: "warning", title, message }),
  }

  return { toasts, removeToast, toast }
}
