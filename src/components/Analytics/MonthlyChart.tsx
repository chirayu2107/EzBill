"use client"

import type React from "react"
import { useMemo, useState, useEffect } from "react"
import { formatCurrency } from "../../utils/calculations"

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
  const [RechartsComponents, setRechartsComponents] = useState<any>(null)

  useEffect(() => {
    setIsClient(true)
    // Dynamic import to avoid SSR issues
    import("recharts").then((recharts) => {
      setRechartsComponents(recharts)
    })
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
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium mb-2">Day {label}</p>
          <p className="text-white text-sm mb-1">Date: {data.date}</p>
          <p className="text-green-400 text-sm mb-1">Sales: {formatCurrency(payload[0].value)}</p>
          <p className="text-blue-400 text-sm">Invoices: {payload[1].value}</p>
        </div>
      )
    }
    return null
  }

  const formatYAxisTick = (value: number): string => {
    return `₹${(value / 1000).toFixed(0)}K`
  }

  // Show loading state while components are loading
  if (!isClient || !RechartsComponents) {
    return (
      <div className="w-full h-96 flex items-center justify-center" id="monthly-chart">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-400">Loading chart...</p>
        </div>
      </div>
    )
  }

  const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } = RechartsComponents

  return (
    <div className="w-full h-96" id="monthly-chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="day" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis
            yAxisId="sales"
            orientation="left"
            stroke="#9CA3AF"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatYAxisTick}
          />
          <YAxis
            yAxisId="invoices"
            orientation="right"
            stroke="#9CA3AF"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ color: "#9CA3AF" }} iconType="rect" />
          <Bar yAxisId="sales" dataKey="sales" fill="#10B981" name="Sales Amount" radius={[2, 2, 0, 0]} opacity={0.8} />
          <Bar
            yAxisId="invoices"
            dataKey="invoices"
            fill="#3B82F6"
            name="Invoice Count"
            radius={[2, 2, 0, 0]}
            opacity={0.8}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default MonthlyChart
