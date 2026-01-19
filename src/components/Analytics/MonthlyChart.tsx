"use client"

import type React from "react"
import { useMemo, useState, useEffect } from "react"
import { formatCurrency } from "../../utils/calculations"
import { useTheme } from "../../context/ThemeContext"

interface MonthlyChartProps {
  data: Array<{
    date: string
    day: number
    sales: number
    invoices: number
    formattedDate: string
  }>
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{
    value: number
    payload: {
      day: number
      sales: number
      invoices: number
      date: string
    }
  }>
  label?: string | number
}

const MonthlyChart: React.FC<MonthlyChartProps> = ({ data }) => {
  const [isClient, setIsClient] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [RechartsComponents, setRechartsComponents] = useState<any>(null)
  const { theme } = useTheme()

  useEffect(() => {
    setIsClient(true)
    setIsMobile(window.innerWidth < 768)

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    window.addEventListener("resize", handleResize)

    // Dynamic import to avoid SSR issues
    import("recharts").then((recharts) => {
      setRechartsComponents(recharts)
    })

    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const chartData = useMemo(() => {
    return data.map((item) => ({
      day: item.day,
      sales: item.sales,
      invoices: item.invoices,
      date: item.formattedDate,
    }))
  }, [data])

  const CustomTooltip: React.FC<TooltipProps> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-2 md:p-3 shadow-lg text-xs md:text-sm transition-colors">
          <p className="text-gray-900 dark:text-white font-medium mb-1 md:mb-2">Day {label}</p>
          <p className="text-gray-600 dark:text-gray-300 mb-1">Date: {data.date}</p>
          <p className="text-green-600 dark:text-green-400 mb-1">Sales: {formatCurrency(payload[0].value)}</p>
          <p className="text-blue-600 dark:text-blue-400">Invoices: {payload[1].value}</p>
        </div>
      )
    }
    return null
  }

  const formatYAxisTick = (value: number): string => {
    if (isMobile) {
      if (value >= 1000) {
        return `₹${(value / 1000).toFixed(0)}K`
      }
      return `₹${value}`
    }
    return `₹${(value / 1000).toFixed(0)}K`
  }

  const formatInvoiceYAxisTick = (value: number): string => {
    return value.toString()
  }

  // Show loading state while components are loading
  if (!isClient || !RechartsComponents) {
    return (
      <div className="w-full h-80 md:h-96 flex items-center justify-center" id="monthly-chart">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-400">Loading chart...</p>
        </div>
      </div>
    )
  }

  const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } = RechartsComponents

  return (
    <div className="w-full h-80 md:h-96" id="monthly-chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={isMobile ? { top: 20, right: 25, left: 25, bottom: 30 } : { top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#374151" : "#E5E7EB"} />
          <XAxis
            dataKey="day"
            stroke={theme === "dark" ? "#9CA3AF" : "#6B7280"}
            fontSize={isMobile ? 11 : 12}
            tickLine={false}
            axisLine={false}
            interval={isMobile ? 2 : 0} // Show every 3rd day on mobile (0, 3, 6, 9, etc.)
            tick={{ fill: theme === "dark" ? "#9CA3AF" : "#6B7280" }}
          />
          <YAxis
            yAxisId="sales"
            orientation="left"
            stroke="#10B981"
            fontSize={isMobile ? 10 : 12}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatYAxisTick}
            width={isMobile ? 35 : 60}
            tick={{ fill: "#10B981" }}
          />
          <YAxis
            yAxisId="invoices"
            orientation="right"
            stroke="#3B82F6"
            fontSize={isMobile ? 10 : 12}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatInvoiceYAxisTick}
            width={isMobile ? 25 : 60}
            tick={{ fill: "#3B82F6" }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{
              color: theme === "dark" ? "#9CA3AF" : "#6B7280",
              fontSize: isMobile ? "11px" : "12px",
              paddingTop: "10px",
            }}
            iconType="rect"
            iconSize={isMobile ? 10 : 14}
          />
          <Bar
            yAxisId="sales"
            dataKey="sales"
            fill="#10B981"
            name="Sales Amount"
            radius={[2, 2, 0, 0]}
            opacity={0.9}
            maxBarSize={isMobile ? 18 : 40}
          />
          <Bar
            yAxisId="invoices"
            dataKey="invoices"
            fill="#3B82F6"
            name="Invoice Count"
            radius={[2, 2, 0, 0]}
            opacity={0.9}
            maxBarSize={isMobile ? 18 : 40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default MonthlyChart
