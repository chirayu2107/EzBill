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

  const getSentiment = (card: any) => {
    const value = summary[card.changeKey as keyof typeof summary] as number
    if (value === 0) return "neutral"
    
    // Revenue and Paid are better when they go up
    const isPositiveMetric = card.title === "Total Revenue" || card.title === "Paid Amount"
    
    if (isPositiveMetric) {
      return value > 0 ? "good" : "bad"
    } else {
      // Pending and Purchase are better when they go down
      return value < 0 ? "good" : "bad"
    }
  }

  const formatDisplayChange = (card: any) => {
    const value = summary[card.changeKey as keyof typeof summary] as number
    const sentiment = getSentiment(card)
    const absValue = Math.abs(value).toFixed(1)
    
    if (sentiment === "good") {
      // No minus or plus sign for good news!
      return `${absValue}%`
    } else if (sentiment === "bad") {
      // Keep the sign for bad news
      const sign = value >= 0 ? "+" : "-"
      return `${sign}${absValue}%`
    }
    return `${absValue}%`
  }

  const cards = [
    {
      title: "Total Purchase",
      value: formatCurrency(summary.totalPurchase),
      icon: ShoppingBag,
      color: "text-purple-400",
      bgColor: "bg-purple-400/10",
      changeKey: "purchaseChange",
    },
    {
      title: "Total Revenue",
      value: formatCurrency(summary.totalRevenue),
      icon: TrendingUp,
      color: "text-green-400",
      bgColor: "bg-green-400/10",
      changeKey: "revenueChange",
    },
    {
      title: "Paid Amount",
      value: formatCurrency(summary.paidAmount),
      icon: IndianRupeeIcon,
      color: "text-emerald-400",
      bgColor: "bg-emerald-400/10",
      changeKey: "paidChange",
    },
    {
      title: "Pending Amount",
      value: formatCurrency(summary.pendingAmount),
      icon: Clock,
      color: "text-yellow-400",
      bgColor: "bg-yellow-400/10",
      changeKey: "pendingChange",
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
          <Card className="relative rounded-xl p-4 md:p-6 overflow-hidden cursor-pointer hover:ring-1 hover:ring-emerald-500/20 dark:hover:ring-white/5 transition-all shadow-sm hover:shadow-md">
            <p className="text-gray-600 dark:text-gray-400 text-sm font-normal mb-1 transition-colors">{card.title}</p>

            <div className="flex items-center justify-between">
              <motion.p
                className="text-gray-900 dark:text-white font-semibold text-lg md:text-2xl"
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

            <p className={`${
              getSentiment(card) === "good" ? "text-green-500" : getSentiment(card) === "bad" ? "text-red-500" : "text-gray-500"
            } text-xs mt-1 font-medium`}>
              {formatDisplayChange(card)} <span className="text-gray-600 dark:text-gray-400"> vs last month</span>
            </p>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
}

export default SummaryCards
