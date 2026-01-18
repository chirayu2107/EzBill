"use client"

import type React from "react"
import { motion } from "framer-motion"
import { useApp } from "../../context/AppContext"
import { formatCurrency } from "../../utils/calculations"
import { TrendingUp, IndianRupeeIcon, Clock, ShoppingBag } from "lucide-react"
import Card from "../UI/Card"

const SummaryCards: React.FC = () => {
  const { getDashboardSummary } = useApp()
  const summary = getDashboardSummary()

  const cards = [
    {
      title: "Total Purchase",
      value: formatCurrency(summary.totalPurchase),
      icon: ShoppingBag, // You'll need to import ShoppingBag
      color: "text-purple-400",
      bgColor: "bg-purple-400/10",
      change: "+2.1%",
    },
    {
      title: "Total Revenue",
      value: formatCurrency(summary.totalRevenue),
      icon: TrendingUp,
      color: "text-green-400",
      bgColor: "bg-green-400/10",
      change: "+2.4%",
    },
    {
      title: "Paid Amount",
      value: formatCurrency(summary.paidAmount),
      icon: IndianRupeeIcon,
      color: "text-emerald-400",
      bgColor: "bg-emerald-400/10",
      change: "+8.6%",
    },
    {
      title: "Pending Amount",
      value: formatCurrency(summary.pendingAmount),
      icon: Clock,
      color: "text-yellow-400",
      bgColor: "bg-yellow-400/10",
      change: "+6.0%",
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
      className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6"
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
          <Card className="relative bg-[#111827] rounded-xl p-4 md:p-6 overflow-hidden cursor-pointer hover:ring-1 hover:ring-white/10 transition">
            <p className="text-gray-400 text-xs font-medium mb-1">{card.title}</p>

            <div className="flex items-center justify-between">
              <motion.p
                className="text-white font-bold text-lg md:text-2xl"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1 + 0.2 }}
              >
                {card.value}
              </motion.p>
              <motion.div
                className={`p-2 md:p-3 rounded-xl ${card.bgColor}`}
                whileHover={{ rotate: 5 }}
              >
                <card.icon className={`w-5 h-5 md:w-6 md:h-6 ${card.color}`} />
              </motion.div>
            </div>

            <p className={`${card.color} text-xs mt-1`}>
              {card.change} <span className="text-gray-400"> vs last month</span>
            </p>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
}

export default SummaryCards
