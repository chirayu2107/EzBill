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
    prevSales: number
    prevInvoices: number
    formattedDate: string
  }>
  metric?: "sales" | "invoices"
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{
    value: number
    dataKey: string
    payload: {
      day: number
      sales: number
      invoices: number
      prevSales: number
      prevInvoices: number
      date: string
    }
  }>
  label?: string | number
}

const MonthlyChart: React.FC<MonthlyChartProps> = ({ data, metric = "sales" }) => {
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
      prevSales: item.prevSales,
      prevInvoices: item.prevInvoices,
      date: item.formattedDate,
    }))
  }, [data])

  const isSales = metric === "sales"
  const isDark = theme === "dark"
  const getAccentHex = () => {
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim()
    if (!raw) return '#2563eb'
    const [r, g, b] = raw.split(',').map(s => parseInt(s.trim()))
    return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`
  }
  const currentColor = isSales ? "#8b5cf6" : getAccentHex()
  const prevColor = isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)"
  const currentGradId = `current-${metric}-grad`
  const gridColor = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)"
  const axisColor = isDark ? "#6B7280" : "#9CA3AF"

  const CustomTooltip: React.FC<TooltipProps> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      // payload[0] is typically the first area declared, payload[1] is the second.
      // Let's identify the current and previous values based on their dataKey.
      const currentKey = isSales ? "sales" : "invoices"
      const prevKey = isSales ? "prevSales" : "prevInvoices"

      const currentItem = payload.find(p => p.dataKey === currentKey)
      const prevItem = payload.find(p => p.dataKey === prevKey)

      const currentVal = currentItem ? currentItem.value : 0
      const prevVal = prevItem ? prevItem.value : 0
      const change = prevVal > 0 ? ((currentVal - prevVal) / prevVal) * 100 : 0
      const dateText = currentItem?.payload.date || ""

      return (
        <div
          className="rounded-xl p-3 text-xs border border-gray-200/60 dark:border-white/[0.04] transition-colors"
          style={{
            background: isDark ? "rgba(17,24,39,0.95)" : "rgba(255,255,255,0.97)",
            backdropFilter: "blur(12px)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)",
          }}
        >
          <p className="text-gray-900 dark:text-white font-semibold mb-1 text-[13px]">Day {label}</p>
          <p className="text-gray-400 dark:text-gray-500 mb-2 text-[10px]">{dateText}</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentColor }} />
              <span className="text-gray-600 dark:text-gray-400">Current:</span>
              <span className="font-semibold text-gray-900 dark:text-white ml-auto">
                {isSales ? formatCurrency(currentVal) : currentVal}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full border border-dashed" style={{ borderColor: prevColor }} />
              <span className="text-gray-650 dark:text-gray-450">Previous:</span>
              <span className="font-semibold text-gray-900 dark:text-white ml-auto">
                {isSales ? formatCurrency(prevVal) : prevVal}
              </span>
            </div>
            {prevVal > 0 && (
              <div className="border-t border-gray-100 dark:border-white/[0.04] pt-1.5 mt-1.5 flex items-center gap-2">
                <span className="text-gray-500 dark:text-gray-500">Change:</span>
                <span className={`font-bold ml-auto ${change >= 0 ? "text-blue-600" : "text-rose-600"}`}>
                  {change >= 0 ? "+" : ""}{change.toFixed(1)}%
                </span>
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

  // Show loading state while components are loading
  if (!isClient || !RechartsComponents) {
    return (
      <div className="w-full h-80 md:h-96 flex items-center justify-center" id="monthly-chart">
        <div className="text-center">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto mb-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-gray-400 text-xs">Loading chart…</p>
        </div>
      </div>
    )
  }

  const { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = RechartsComponents

  return (
    <div className="w-full h-80 md:h-96 animate-fade-in" id="monthly-chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={isMobile ? { top: 10, right: 10, left: 5, bottom: 10 } : { top: 15, right: 20, left: 10, bottom: 5 }}
        >
          <defs>
            <linearGradient id={currentGradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={currentColor} stopOpacity={0.15} />
              <stop offset="100%" stopColor={currentColor} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis
            dataKey="day"
            stroke={axisColor}
            fontSize={isMobile ? 10 : 11}
            tickLine={false}
            axisLine={false}
            interval={isMobile ? 2 : 0}
            tick={{ fill: axisColor, fontWeight: 500 }}
            dy={6}
          />
          <YAxis
            stroke={axisColor}
            fontSize={isMobile ? 10 : 11}
            tickLine={false}
            axisLine={false}
            tickFormatter={isSales ? formatYAxisTick : formatInvoiceYAxisTick}
            width={isMobile ? 38 : 55}
            tick={{ fill: axisColor, fontWeight: 500 }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: currentColor, strokeWidth: 1.2, strokeDasharray: "4 4" }} />
          
          {/* Previous Period Area (Dotted/dashed outline with no fill) */}
          <Area
            type="monotone"
            dataKey={isSales ? "prevSales" : "prevInvoices"}
            stroke={prevColor}
            strokeWidth={1.5}
            strokeDasharray="4 4"
            fill="transparent"
            name={isSales ? "Previous Period Sales" : "Previous Period Invoices"}
            activeDot={false}
          />
          
          {/* Current Period Area (Solid line + gradient fill) */}
          <Area
            type="monotone"
            dataKey={isSales ? "sales" : "invoices"}
            stroke={currentColor}
            strokeWidth={2}
            fill={`url(#${currentGradId})`}
            name={isSales ? "Current Period Sales" : "Current Period Invoices"}
            activeDot={{ r: 4.5, strokeWidth: 1.5, stroke: "#fff", fill: currentColor }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default MonthlyChart
