"use client"

import type React from "react"
import { useMemo, useState, useEffect } from "react"
import { formatCurrency } from "../../utils/calculations"
import { useTheme } from "../../context/ThemeContext"

interface FinancialYearChartProps {
  data: Array<{
    month: string
    sales: number
    invoices: number
    fullDate: Date
  }>
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{
    value: number
    payload: {
      month: string
      sales: number
      invoices: number
      fullDate: string
    }
  }>
  label?: string | number
}

const FinancialYearChart: React.FC<FinancialYearChartProps> = ({ data }) => {
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

    import("recharts").then((recharts) => {
      setRechartsComponents(recharts)
    })

    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const chartData = useMemo(() => {
    return data.map((item) => ({
      month: item.month,
      sales: item.sales,
      invoices: item.invoices,
      fullDate: item.fullDate.toLocaleDateString("en-US", { year: "numeric", month: "long" }),
    }))
  }, [data])

  const CustomTooltip: React.FC<TooltipProps> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div
          className="rounded-xl p-3 text-xs border border-gray-200/60 dark:border-gray-700/60 transition-colors"
          style={{
            background: theme === "dark" ? "rgba(17,24,39,0.95)" : "rgba(255,255,255,0.97)",
            backdropFilter: "blur(12px)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)",
          }}
        >
          <p className="text-gray-900 dark:text-white font-semibold mb-1.5 text-[13px]">{label}</p>
          <p className="text-gray-500 dark:text-gray-400 mb-2 text-[11px]">{data.fullDate}</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-gray-600 dark:text-gray-300">Sales:</span>
              <span className="font-semibold text-gray-900 dark:text-white ml-auto">{formatCurrency(payload[0].value)}</span>
            </div>
            {payload[1] && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <span className="text-gray-600 dark:text-gray-300">Invoices:</span>
                <span className="font-semibold text-gray-900 dark:text-white ml-auto">{payload[1].value}</span>
              </div>
            )}
          </div>
        </div>
      )
    }
    return null
  }

  const formatYAxisTick = (value: number): string => {
    if (isMobile) {
      if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`
      return `₹${value}`
    }
    return `₹${(value / 1000).toFixed(0)}K`
  }

  const formatInvoiceYAxisTick = (value: number): string => {
    return value.toString()
  }

  const isDark = theme === "dark"
  const gridColor = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)"
  const axisColor = isDark ? "#6B7280" : "#9CA3AF"

  if (!isClient || !RechartsComponents) {
    return (
      <div className="w-full h-80 md:h-96 flex items-center justify-center" id="fy-chart">
        <div className="text-center">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-2">
            <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-gray-400 text-xs">Loading chart…</p>
        </div>
      </div>
    )
  }

  const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } = RechartsComponents

  const CustomLegend = ({ payload }: any) => {
    if (!payload) return null
    return (
      <div className="flex items-center justify-center gap-5 mt-3">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[3px]" style={{ backgroundColor: entry.color }} />
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="w-full h-80 md:h-96" id="fy-chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={
            isMobile ? { top: 10, right: 25, left: 25, bottom: 50 } : { top: 10, right: 30, left: 20, bottom: 60 }
          }
        >
          <defs>
            <linearGradient id="fySalesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
            </linearGradient>
            <linearGradient id="fyInvoiceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.85} />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.65} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="0" stroke={gridColor} vertical={false} />
          <XAxis
            dataKey="month"
            stroke={axisColor}
            fontSize={isMobile ? 10 : 11}
            tickLine={false}
            axisLine={false}
            angle={-45}
            textAnchor="end"
            height={isMobile ? 50 : 60}
            interval={isMobile ? 1 : 0}
            tick={{ fill: axisColor, fontWeight: 500 }}
          />
          <YAxis
            yAxisId="sales"
            orientation="left"
            stroke="transparent"
            fontSize={isMobile ? 10 : 11}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatYAxisTick}
            width={isMobile ? 38 : 55}
            tick={{ fill: "#10b981", fontWeight: 500 }}
          />
          <YAxis
            yAxisId="invoices"
            orientation="right"
            stroke="transparent"
            fontSize={isMobile ? 10 : 11}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatInvoiceYAxisTick}
            width={isMobile ? 25 : 40}
            tick={{ fill: "#6366f1", fontWeight: 500 }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", radius: 4 }} />
          <Legend content={<CustomLegend />} />
          <Bar
            yAxisId="sales"
            dataKey="sales"
            fill="url(#fySalesGrad)"
            name="Sales Amount"
            radius={[4, 4, 0, 0]}
            maxBarSize={isMobile ? 20 : 36}
          />
          <Bar
            yAxisId="invoices"
            dataKey="invoices"
            fill="url(#fyInvoiceGrad)"
            name="Invoice Count"
            radius={[4, 4, 0, 0]}
            maxBarSize={isMobile ? 20 : 36}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default FinancialYearChart
