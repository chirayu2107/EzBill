"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "../../context/AuthContext"
import { useTheme } from "../../context/ThemeContext"
import {
  Gauge, Receipt, ShoppingCart, FilePlus2, BookMarked,
  PieChart, TrendingUp, User, LogOut, Menu, X, Sun, Moon,
} from "lucide-react"

const COLLAPSED_W = 72
const EXPANDED_W = 260

const Sidebar: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(true)

  /* ── Accent: read from localStorage on mount so the attribute is set early ── */
  useEffect(() => {
    const saved = localStorage.getItem("ezbill-accent")
    if (saved && saved !== "blue") {
      document.documentElement.setAttribute("data-theme-accent", saved)
    }
  }, [])

  /* ── Hold-and-slide state ── */
  const [isDragging, setIsDragging] = useState(false)
  const [dragIndex, setDragIndex] = useState(-1)
  const navBarRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([])

  const menuItems = [
    { path: "/dashboard", icon: Gauge, label: "Dashboard" },
    { path: "/dashboard/invoices", icon: Receipt, label: "Invoices" },
    { path: "/dashboard/purchase-bills", icon: ShoppingCart, label: "Purchase Bills" },
    { path: "/dashboard/create-invoice", icon: FilePlus2, label: "Create Invoice" },
    { path: "/dashboard/ledgers", icon: BookMarked, label: "Ledgers" },
    { path: "/dashboard/gst-reports", icon: PieChart, label: "GST Reports" },
    { path: "/dashboard/analytics", icon: TrendingUp, label: "Analytics" },
  ]

  const mobileNavItems = [
    { path: "/dashboard", icon: Gauge, label: "Home" },
    { path: "/dashboard/invoices", icon: Receipt, label: "Invoices" },
    { path: "/dashboard/create-invoice", icon: FilePlus2, label: "Create" },
    { path: "/dashboard/analytics", icon: TrendingUp, label: "Analytics" },
    { path: "/dashboard/profile", icon: User, label: "Profile" },
  ]

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen)
  const closeMobileMenu = () => setIsMobileMenuOpen(false)
  const toggleCollapse = () => setIsCollapsed((p) => !p)

  /* ── Get closest nav item index from pointer X position ── */
  const getClosestIndex = useCallback((clientX: number): number => {
    let closest = 0
    let minDist = Infinity
    itemRefs.current.forEach((el, i) => {
      if (!el) return
      const rect = el.getBoundingClientRect()
      const center = rect.left + rect.width / 2
      const dist = Math.abs(clientX - center)
      if (dist < minDist) {
        minDist = dist
        closest = i
      }
    })
    return closest
  }, [])

  const sidebarVariants = {
    open: { x: 0, transition: { type: "spring", stiffness: 280, damping: 28 } },
    closed: { x: "-100%", transition: { type: "spring", stiffness: 280, damping: 28 } },
  }
  const overlayVariants = {
    open: { opacity: 1, transition: { duration: 0.2 } },
    closed: { opacity: 0, transition: { duration: 0.2 } },
  }
  const menuItemVariants = {
    open: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 280, damping: 28 } },
    closed: { opacity: 0, x: -20 },
  }

  /* ── Initials helper ── */
  const initial = user?.fullName?.charAt(0)?.toUpperCase() || "?"

  return (
    <>
      {/* ═══ MOBILE TOP BAR ═══ */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/70 backdrop-blur-xl border-b border-gray-200/60 dark:border-white/[0.04]">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={toggleMobileMenu}
            className="p-2 text-gray-500 dark:text-[#8B8B96] rounded-lg hover:bg-gray-50 dark:hover:bg-[#212124] transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src="/EzBill.png?v=3" alt="EzBill" className="w-7 h-7 shrink-0" />
            <h1 className="text-base font-semibold text-gray-900 dark:text-white">EzBill</h1>
          </a>
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-500 dark:text-[#8B8B96] rounded-lg hover:bg-gray-50 dark:hover:bg-[#212124] transition-colors"
          >
            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ═══ MOBILE BOTTOM NAV ═══ */}
      <div className="lg:hidden ez-mobile-nav" ref={navBarRef}>
        <div
          className="flex items-center justify-around relative"
          onPointerDown={(e) => {
            // Start tracking — set dragging after a brief hold
            const bar = navBarRef.current
            if (!bar) return
            ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
            const idx = getClosestIndex(e.clientX)
            setDragIndex(idx)
            setIsDragging(true)
          }}
          onPointerMove={(e) => {
            if (!isDragging) return
            const idx = getClosestIndex(e.clientX)
            if (idx !== dragIndex) setDragIndex(idx)
          }}
          onPointerUp={() => {
            if (isDragging && dragIndex >= 0 && dragIndex < mobileNavItems.length) {
              navigate(mobileNavItems[dragIndex].path)
            }
            setIsDragging(false)
            setDragIndex(-1)
          }}
          onPointerCancel={() => {
            setIsDragging(false)
            setDragIndex(-1)
          }}
          style={{ touchAction: "none" }}
        >
          {mobileNavItems.map((item, index) => {
            const isActive = isDragging ? dragIndex === index : location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                ref={(el) => { itemRefs.current[index] = el }}
                className="relative flex flex-col items-center py-1 px-3"
                onClick={(e) => {
                  if (isDragging) e.preventDefault()
                }}
              >
                {/* Liquid glass indicator — iOS 26 style */}
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-pill"
                    className="absolute -inset-x-1 -top-1 -bottom-1 rounded-[16px]"
                    style={theme === "dark" ? {
                      background: "rgba(var(--color-accent), 0.12)",
                      backdropFilter: "blur(20px) saturate(150%)",
                      WebkitBackdropFilter: "blur(20px) saturate(150%)",
                      border: "0.5px solid rgba(var(--color-accent), 0.25)",
                      boxShadow: "0 1px 8px rgba(var(--color-accent), 0.1), inset 0 1px 0 rgba(255,255,255,0.05)",
                    } : {
                      background: "rgba(255,255,255,0.50)",
                      backdropFilter: "blur(20px) saturate(180%)",
                      WebkitBackdropFilter: "blur(20px) saturate(180%)",
                      border: "0.5px solid rgba(255,255,255,0.70)",
                      boxShadow: "0 1px 8px rgba(0,0,0,0.06), 0 0.5px 2px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)",
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <item.icon
                  className={`relative z-10 w-[22px] h-[22px] transition-colors duration-150 ${
                    isActive
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-400 dark:text-gray-400"
                  }`}
                  strokeWidth={isActive ? 2.2 : 1.6}
                />
                {isActive && (
                  <motion.span
                    initial={{ opacity: 0, y: -2 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className="relative z-10 text-[10px] font-semibold text-blue-600 dark:text-blue-400 leading-tight mt-0.5"
                  >
                    {item.label}
                  </motion.span>
                )}
              </Link>
            )
          })}
        </div>
      </div>

      {/* ═══ DESKTOP SIDEBAR ═══ */}
      <motion.div
        className="hidden lg:flex flex-col shrink-0 overflow-hidden cursor-pointer
                   bg-white/85 dark:bg-black/75 backdrop-blur-xl border-r border-gray-100/80 dark:border-white/[0.04]"
        animate={{ width: isCollapsed ? COLLAPSED_W : EXPANDED_W }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        onClick={(e: React.MouseEvent) => {
          // Only toggle when clicking empty space, not on interactive elements
          const target = e.target as HTMLElement
          if (target.closest("a, button, input, img")) return
          toggleCollapse()
        }}
      >
        {/* ── Top: Logo + Nav ── */}
        <div className="flex-1 flex flex-col pt-5 pb-3 overflow-hidden">
          {/* Logo — blue grid mark + wordmark */}
          <a href="/" className={`flex items-center shrink-0 mb-5 hover:opacity-90 transition-opacity ${isCollapsed ? "justify-center px-0" : "gap-2.5 px-5"}`}>
            <img src="/EzBill.png?v=3" alt="EzBill" className="w-[34px] h-[34px] shrink-0" />
            {!isCollapsed && (
              <motion.span
                initial={false}
                animate={{ opacity: 1, x: 0 }}
                className="text-[15px] font-bold tracking-tight text-gray-900 dark:text-white whitespace-nowrap"
              >
                EzBill
              </motion.span>
            )}
          </a>

          {/* Divider */}
          <div className={`h-px bg-gray-100 dark:bg-[#212124] shrink-0 ${isCollapsed ? "mx-3" : "mx-5"} mb-3`} />

          {/* Navigation */}
          <nav className={`flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden ${isCollapsed ? "px-2" : "px-3"}`}>
            {menuItems.map((item, index) => {
              const isActive = location.pathname === item.path
              const Icon = item.icon
              return (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.025, duration: 0.2 }}
                >
                  <Link
                    to={item.path}
                    className={`group relative flex items-center rounded-xl transition-all duration-200 ${
                      isCollapsed ? "justify-center h-10 w-full" : "gap-3 px-3 h-10"
                    } ${
                      isActive
                        ? "bg-blue-600/10 dark:bg-blue-500/[0.12] text-blue-700 dark:text-blue-400 font-semibold"
                        : "text-gray-500 dark:text-[#8B8B96] hover:bg-gray-50 dark:hover:bg-white/[0.04] hover:text-gray-900 dark:hover:text-[#ECECEF] font-medium"
                    }`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    {/* Active pill highlight — no bar, full bg */}
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute inset-0 rounded-xl"
                        style={{
                          background: "rgba(var(--color-accent), 0.08)",
                          border: "1px solid rgba(var(--color-accent), 0.15)",
                        }}
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    )}

                    <Icon
                      className={`relative z-10 w-[18px] h-[18px] shrink-0 transition-colors ${
                        isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-[#55555E] group-hover:text-gray-600 dark:group-hover:text-[#9E9EA7]"
                      }`}
                      strokeWidth={isActive ? 2 : 1.6}
                    />

                    {!isCollapsed && (
                      <span className="relative z-10 text-[13px] whitespace-nowrap truncate">
                        {item.label}
                      </span>
                    )}

                    {/* Tooltip — collapsed only */}
                    {isCollapsed && (
                      <span className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-gray-900 dark:bg-[#18181b] text-white text-[11px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 shadow-xl">
                        {item.label}
                        <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900 dark:border-r-[#18181b]" />
                      </span>
                    )}
                  </Link>
                </motion.div>
              )
            })}
          </nav>
        </div>

        {/* ── Bottom: User ── */}
        <div className={`shrink-0 border-t border-gray-100 dark:border-white/[0.04] ${isCollapsed ? "px-2" : "px-3"} py-3 space-y-2`}>


          {/* User — links to profile */}
          <Link
            to="/dashboard/profile"
            className={`group relative flex items-center rounded-xl transition-all duration-200 ${isCollapsed ? "justify-center h-10" : "gap-2.5 px-2 py-2"} ${
              location.pathname === "/dashboard/profile"
                ? "bg-blue-50 dark:bg-blue-500/10"
                : "hover:bg-gray-50 dark:hover:bg-[#212124]"
            }`}
            title={isCollapsed ? "Profile" : undefined}
          >
            {location.pathname === "/dashboard/profile" && (
              <motion.div
                layoutId="sidebar-active"
                className="absolute inset-0 rounded-xl"
                style={{
                  background: "rgba(var(--color-accent), 0.08)",
                  border: "1px solid rgba(var(--color-accent), 0.15)",
                }}
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs shrink-0"
              style={{ background: "linear-gradient(135deg, rgb(var(--color-accent-light)), rgb(var(--color-accent)))" }}
            >
              {initial}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className={`text-[13px] font-medium truncate leading-tight ${
                  location.pathname === "/dashboard/profile" ? "text-blue-700 dark:text-blue-400" : "text-gray-900 dark:text-white"
                }`}>
                  {user?.fullName}
                </p>
                <p className="text-[11px] text-gray-400 dark:text-[#55555E] truncate leading-tight">
                  {user?.email}
                </p>
              </div>
            )}

            {/* Tooltip — collapsed */}
            {isCollapsed && (
              <span className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-gray-900 dark:bg-[#28282C] text-white text-[11px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 shadow-xl">
                Profile
                <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900 dark:border-r-[#2B2B2F]" />
              </span>
            )}
          </Link>

          {/* Sign out */}
          <button
            onClick={logout}
            className={`group flex items-center rounded-xl h-9 w-full
                       border border-gray-200 dark:border-white/[0.04]
                       text-gray-500 dark:text-[#8B8B96]
                       hover:bg-red-500/[0.06] dark:hover:bg-red-500/8 hover:text-red-600 dark:hover:text-red-400
                       hover:border-red-300/40 dark:hover:border-red-500/25
                       transition-all duration-200 text-[12px] font-medium
                       ${isCollapsed ? "justify-center" : "gap-2 px-3"}`}
            title={isCollapsed ? "Sign Out" : undefined}
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </motion.div>

      {/* ═══ MOBILE SIDEBAR OVERLAY ═══ */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            variants={overlayVariants}
            initial="closed"
            animate="open"
            exit="closed"
            onClick={closeMobileMenu}
          />
        )}
      </AnimatePresence>

      {/* ═══ MOBILE SIDEBAR PANEL ═══ */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="lg:hidden fixed left-0 top-0 h-full w-72 bg-white/90 dark:bg-black/85 backdrop-blur-2xl border-r border-gray-100/80 dark:border-white/[0.04] flex flex-col z-50"
            variants={sidebarVariants}
            initial="closed"
            animate="open"
            exit="closed"
          >
            <div className="p-6 flex-1 overflow-y-auto">
              <a href="/" className="flex items-center gap-2.5 mb-6 mt-14 hover:opacity-80 transition-opacity">
                <img src="/EzBill.png?v=3" alt="EzBill" className="w-8 h-8 shrink-0" />
                <h1 className="text-base font-semibold text-gray-900 dark:text-white">EzBill</h1>
              </a>

              <nav className="space-y-1">
                {menuItems.map((item, index) => {
                  const isActive = location.pathname === item.path
                  return (
                    <motion.div key={item.path} variants={menuItemVariants} transition={{ delay: index * 0.05 }}>
                      <Link
                        to={item.path}
                        onClick={closeMobileMenu}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm ${
                          isActive
                            ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-semibold"
                            : "text-gray-600 dark:text-[#8B8B96] hover:bg-gray-50 dark:hover:bg-[#212124]"
                        }`}
                      >
                        <item.icon
                          className={`w-5 h-5 ${
                            isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-[#55555E]"
                          }`}
                          strokeWidth={isActive ? 2 : 1.8}
                        />
                        {item.label}
                      </Link>
                    </motion.div>
                  )
                })}
              </nav>
            </div>

            <motion.div
              className="p-5 border-t border-gray-100 dark:border-white/[0.04] space-y-3"
              variants={menuItemVariants}
              transition={{ delay: 0.4 }}
            >

              <div className="mb-3 flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm shrink-0"
                  style={{ background: "linear-gradient(135deg, rgb(var(--color-accent-light)), rgb(var(--color-accent)))" }}
                >
                  {initial}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Signed in as</p>
                  <p className="text-gray-900 dark:text-white font-medium truncate text-sm">{user?.fullName}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/[0.04] text-gray-600 dark:text-[#8B8B96] hover:bg-red-50 dark:hover:bg-red-500/8 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-500/25 transition-all text-xs font-medium"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Sidebar
