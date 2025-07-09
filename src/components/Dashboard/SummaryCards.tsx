"use client"

import type React from "react"
import { motion } from "framer-motion"
import { useApp } from "../../context/AppContext"
import { formatCurrency } from "../../utils/calculations"
import { TrendingUp, DollarSign, Clock, AlertCircle } from "lucide-react"
import Card from "../UI/Card"

const SummaryCards: React.FC = () => {
  const { getDashboardSummary } = useApp()
  const summary = getDashboardSummary()

  const cards = [
    {
      title: "Total Revenue",
      value: formatCurrency(summary.totalRevenue),
      icon: TrendingUp,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      gradient: "from-emerald-500 to-green-600",
    },
    {
      title: "Paid Amount",
      value: formatCurrency(summary.paidAmount),
      icon: DollarSign,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      gradient: "from-green-500 to-emerald-600",
    },
    {
      title: "Pending Amount",
      value: formatCurrency(summary.pendingAmount),
      icon: Clock,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      gradient: "from-yellow-500 to-orange-500",
    },
    {
      title: "Overdue Amount",
      value: formatCurrency(summary.overdueAmount),
      icon: AlertCircle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      gradient: "from-red-500 to-pink-600",
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const cardVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    },
  }

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          variants={cardVariants}
          whileHover={{
            scale: 1.02,
            y: -5,
            transition: { duration: 0.2 },
          }}
          whileTap={{ scale: 0.98 }}
        >
          <Card className="hover:bg-gray-750 transition-all duration-300 cursor-pointer relative overflow-hidden">
            {/* Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-5`}></div>

            <div className="relative z-10 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-gray-400 text-xs md:text-sm font-medium mb-1 truncate">{card.title}</p>
                <motion.p
                  className="text-lg md:text-2xl font-bold text-white truncate"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                >
                  {card.value}
                </motion.p>
              </div>
              <motion.div
                className={`p-2 md:p-3 rounded-xl ${card.bgColor} relative flex-shrink-0`}
                whileHover={{ rotate: 5 }}
                transition={{ duration: 0.2 }}
              >
                <card.icon className={`w-5 h-5 md:w-6 md:h-6 ${card.color}`} />

                {/* Pulse effect - Reduced on mobile */}
                <motion.div
                  className={`absolute inset-0 rounded-xl ${card.bgColor} hidden md:block`}
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                />
              </motion.div>
            </div>

            {/* Hover effect overlay */}
            <motion.div
              className="absolute inset-0 bg-white/5 opacity-0"
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            />
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
}

export default SummaryCards
