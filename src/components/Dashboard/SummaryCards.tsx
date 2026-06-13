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
      return `${absValue}%`
    } else if (sentiment === "bad") {
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
      color: "text-purple-500",
      bgColor: "bg-purple-500/8",
      changeKey: "purchaseChange",
    },
    {
      title: "Total Revenue",
      value: formatCurrency(summary.totalRevenue),
      icon: TrendingUp,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/8",
      changeKey: "revenueChange",
    },
    {
      title: "Paid Amount",
      value: formatCurrency(summary.paidAmount),
      icon: IndianRupeeIcon,
      color: "text-green-500",
      bgColor: "bg-green-500/8",
      changeKey: "paidChange",
    },
    {
      title: "Pending Amount",
      value: formatCurrency(summary.pendingAmount),
      icon: Clock,
      color: "text-amber-500",
      bgColor: "bg-amber-500/8",
      changeKey: "pendingChange",
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  }

  const cardVariants = {
    hidden: { y: 8, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1],
      },
    },
  }

  return (
    <motion.div
      className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          variants={cardVariants}
        >
          <Card padding="md" className="h-full">
            {/* Label */}
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">{card.title}</p>

            <div className="flex items-end justify-between gap-2">
              <p className="text-gray-900 dark:text-white font-semibold text-xl md:text-2xl ez-number">
                {card.value}
              </p>
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                <card.icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </div>
            </div>

            <p className={`${
              getSentiment(card) === "good" ? "text-green-600 dark:text-green-400" : getSentiment(card) === "bad" ? "text-red-500 dark:text-red-400" : "text-gray-400"
            } text-xs mt-3 font-medium ez-number`}>
              {formatDisplayChange(card)} <span className="text-gray-400 dark:text-gray-500 font-normal font-sans text-[11px]">vs last month</span>
            </p>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
}

export default SummaryCards
