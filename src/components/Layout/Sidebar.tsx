"use client"

import type React from "react"
import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "../../context/AuthContext"
import { LayoutDashboard, FileText, Plus, Receipt, User, LogOut, BarChart3, Menu, X } from "lucide-react"
import Button from "../UI/Button"

const Sidebar: React.FC = () => {
  const location = useLocation()
  const { user, logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const menuItems = [
    { path: "/", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/invoices", icon: FileText, label: "Invoices" },
    { path: "/create-invoice", icon: Plus, label: "Create Invoice" },
    { path: "/analytics", icon: BarChart3, label: "Analytics" },
    { path: "/profile", icon: User, label: "Profile" },
  ]

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  const sidebarVariants = {
    open: {
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
    closed: {
      x: "-100%",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
  }

  const overlayVariants = {
    open: {
      opacity: 1,
      transition: { duration: 0.2 },
    },
    closed: {
      opacity: 0,
      transition: { duration: 0.2 },
    },
  }

  const menuItemVariants = {
    open: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
    closed: {
      opacity: 0,
      x: -20,
    },
  }

  return (
    <>
      {/* Mobile Top Navigation Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center justify-between p-4">
          <motion.button
            onClick={toggleMobileMenu}
            className="p-2 text-white rounded-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </motion.button>
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">EzBill</h1>
          </motion.div>
          <div className="w-10 h-10"></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 bg-gray-800 border-r border-gray-700 flex-col">
        <div className="p-6 flex-1">
          <motion.div
            className="flex items-center gap-3 mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">EzBill</h1>
          </motion.div>

          <nav className="space-y-2">
            {menuItems.map((item, index) => {
              const isActive = location.pathname === item.path
              return (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                >
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive ? "bg-emerald-600 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                </motion.div>
              )
            })}
          </nav>
        </div>

        <motion.div
          className="p-6 border-t border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          <div className="mb-4 flex items-center gap-4">
            
            <div>
              <p className="text-gray-400 text-sm">Signed in as</p>
              <p className="text-white font-medium break-all">{user?.fullName}</p>
            </div>
          </div>
          <Button onClick={logout} variant="secondary" icon={LogOut} className="w-full">
            Sign Out
          </Button>
        </motion.div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            variants={overlayVariants}
            initial="closed"
            animate="open"
            exit="closed"
            onClick={closeMobileMenu}
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="md:hidden fixed left-0 top-0 h-full w-80 bg-gray-800 border-r border-gray-700 flex flex-col z-50"
            variants={sidebarVariants}
            initial="closed"
            animate="open"
            exit="closed"
          >
            <div className="p-6 flex-1">
              <motion.div className="flex items-center gap-3 mb-8 mt-16" variants={menuItemVariants}>
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white">EzBill</h1>
              </motion.div>

              <nav className="space-y-2">
                {menuItems.map((item, index) => {
                  const isActive = location.pathname === item.path
                  return (
                    <motion.div key={item.path} variants={menuItemVariants} transition={{ delay: index * 0.1 }}>
                      <Link
                        to={item.path}
                        onClick={closeMobileMenu}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                          isActive ? "bg-emerald-600 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        {item.label}
                      </Link>
                    </motion.div>
                  )
                })}
              </nav>
            </div>

            <motion.div
              className="p-6 border-t border-gray-700"
              variants={menuItemVariants}
              transition={{ delay: 0.5 }}
            >
              <div className="mb-4">
                <p className="text-gray-400 text-sm">Signed in as</p>
                <p className="text-white font-medium">{user?.fullName}</p>
              </div>
              <Button onClick={logout} variant="secondary" icon={LogOut} className="w-full">
                Sign Out
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Sidebar
