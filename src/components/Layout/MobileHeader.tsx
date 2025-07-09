"use client"

import type React from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Receipt } from "lucide-react"

const MobileHeader: React.FC = () => {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate("/")
  }

  return (
    <div className="block md:hidden mb-6">
      <motion.div
        onClick={handleClick}
        className="flex items-center justify-center gap-3 cursor-pointer"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
          <Receipt className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">EzBill</h1>
      </motion.div>
    </div>
  )
}

export default MobileHeader
