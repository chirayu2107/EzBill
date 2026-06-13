"use client"

import type React from "react"
import type { LucideIcon } from "lucide-react"

interface ButtonProps {
  variant?: "primary" | "secondary" | "accent" | "success" | "danger"
  size?: "sm" | "md" | "lg"
  icon?: LucideIcon
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  type?: "button" | "submit" | "reset"
  className?: string
}

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  icon: Icon,
  children,
  onClick,
  disabled = false,
  type = "button",
  className = "",
}) => {
  const baseClasses =
    "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 relative overflow-hidden"

  const variantClasses = {
    // Primary: Dark near-black with white text (Naina style)
    primary: "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-black dark:hover:bg-gray-100 focus:ring-gray-500 shadow-sm hover:shadow-md",
    // Accent: Brand gradient with glow
    accent: "bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-500/20 focus:ring-emerald-500 hover:scale-[1.02] active:scale-[0.98]",
    // Secondary: Transparent with border
    secondary: "bg-transparent border border-gray-200 dark:border-white/[0.04] text-gray-700 dark:text-[#8B8B96] hover:bg-gray-50 dark:hover:bg-[#212124] hover:border-gray-300 dark:hover:border-white/[0.06] focus:ring-gray-500",
    // Success
    success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 shadow-sm",
    // Danger: With subtle glow
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm hover:shadow-red-500/20",
  }

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  }

  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  )
}

export default Button
