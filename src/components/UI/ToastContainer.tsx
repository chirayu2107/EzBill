"use client"

import type React from "react"
import { AnimatePresence } from "framer-motion"
import Toast, { type ToastProps } from "./Toast"

interface ToastContainerProps {
  toasts: ToastProps[]
  onClose: (id: string) => void
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>
  )
}

export default ToastContainer
