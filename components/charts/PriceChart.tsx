'use client'

import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'

export interface PriceDataPoint {
  timestamp: number
  yes: number
  no: number
}

export interface PriceChartProps {
  data: PriceDataPoint[]
  title?: string
}

export default function PriceChart({ data, title = 'Price History' }: PriceChartProps) {
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('24h')

  // Format data for Recharts
  const formattedData = data.map((point) => ({
    time: new Date(point.timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    YES: (point.yes * 100).toFixed(1),
    NO: (point.no * 100).toFixed(1),
  }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
          <p className="text-sm text-gray-400 mb-1">{payload[0].payload.time}</p>
          <div className="space-y-1">
            <p className="text-sm font-medium text-bullish-400">
              YES: {payload[0].value}¢
            </p>
            <p className="text-sm font-medium text-bearish-400">
              NO: {payload[1].value}¢
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <div className="flex gap-2">
            {(['24h', '7d', '30d'] as const).map((tf) => (
              <Button
                key={tf}
                variant={timeframe === tf ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setTimeframe(tf)}
              >
                {tf}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="time"
              stroke="#9CA3AF"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
            />
            <YAxis
              stroke="#9CA3AF"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              domain={[0, 100]}
              label={{
                value: 'Price (¢)',
                angle: -90,
                position: 'insideLeft',
                style: { fill: '#9CA3AF' },
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
              formatter={(value) => (
                <span style={{ color: '#9CA3AF' }}>{value}</span>
              )}
            />
            <Line
              type="monotone"
              dataKey="YES"
              stroke="#22c55e"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="NO"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
