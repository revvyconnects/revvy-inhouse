'use client'

import React, { useState, useMemo } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { Download, TrendingUp, DollarSign, Users, Settings, ArrowLeft, FileText } from 'lucide-react'
import Link from 'next/link'

interface MonthData {
  month: number
  users: number
  transactions: number // GMV
  monthlyRevenue: number // 5% platform fee
  cumulativeRevenue: number
}

export default function RevenueCalculator() {
  const [numMonths, setNumMonths] = useState(9)
  const [startingUsers, setStartingUsers] = useState(5) // Early pilot partners (Tagger, NIL son, others)
  const [userGrowthRate, setUserGrowthRate] = useState(25) // % per month (with funding: group chat referrals + paid media + trust networks)
  const [startingTransactions, setStartingTransactions] = useState(625) // $ per month GMV (5 brands × $1,500/year ÷ 12 = $125/month per brand)
  const [transactionGrowthRate, setTransactionGrowthRate] = useState(12.5) // % per month (middle of 10-15% range)
  const [platformFeePercent, setPlatformFeePercent] = useState(5) // % platform fee

  // Calculate monthly revenue projections
  const monthlyData: MonthData[] = useMemo(() => {
    const data: MonthData[] = []
    let cumulativeRevenue = 0
    
    for (let month = 1; month <= numMonths; month++) {
      const users = Math.round(startingUsers * Math.pow(1 + userGrowthRate / 100, month - 1))
      const transactions = Math.round(startingTransactions * Math.pow(1 + transactionGrowthRate / 100, month - 1))
      
      // Calculate revenue (platform fee % of GMV)
      const monthlyRevenue = transactions * (platformFeePercent / 100)
      cumulativeRevenue += monthlyRevenue
      
      data.push({
        month,
        users,
        transactions,
        monthlyRevenue,
        cumulativeRevenue,
      })
    }
    
    return data
  }, [numMonths, startingUsers, userGrowthRate, startingTransactions, transactionGrowthRate, platformFeePercent])

  // Calculate totals
  const totals = useMemo(() => {
    return monthlyData.reduce((acc, month) => ({
      totalGMV: acc.totalGMV + month.transactions,
      totalRevenue: acc.totalRevenue + month.monthlyRevenue,
    }), { totalGMV: 0, totalRevenue: 0 })
  }, [monthlyData])

  // Chart data
  const chartData = monthlyData.map(m => ({
    month: `Month ${m.month}`,
    'GMV': m.transactions,
    'Monthly Revenue': m.monthlyRevenue,
    'Cumulative Revenue': m.cumulativeRevenue,
  }))

  const exportToCSV = () => {
    const headers = [
      'Month',
      'Users',
      'GMV ($)',
      'Monthly Revenue ($)',
      'Cumulative Revenue ($)'
    ]
    
    const rows = monthlyData.map(month => [
      month.month.toString(),
      month.users.toString(),
      month.transactions.toFixed(2),
      month.monthlyRevenue.toFixed(2),
      month.cumulativeRevenue.toFixed(2),
    ])
    
    rows.push([
      'Total',
      '',
      totals.totalGMV.toFixed(2),
      totals.totalRevenue.toFixed(2),
      totals.totalRevenue.toFixed(2),
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `revvy-revenue-calculator-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Tools
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Revvy Revenue Calculator</h1>
          <p className="text-gray-600">Project revenue based on transaction volume and platform fee</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Settings className="w-5 h-5 text-primary-600" />
            <h2 className="text-2xl font-semibold text-gray-900">Projection Parameters</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Months
              </label>
              <input
                type="number"
                min="1"
                max="24"
                value={numMonths}
                onChange={(e) => setNumMonths(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Starting Users
              </label>
              <input
                type="number"
                min="0"
                value={startingUsers}
                onChange={(e) => setStartingUsers(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User Growth Rate (%/month)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={userGrowthRate}
                onChange={(e) => setUserGrowthRate(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Starting GMV ($/month)
              </label>
              <input
                type="number"
                min="0"
                value={startingTransactions}
                onChange={(e) => setStartingTransactions(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Gross Merchandise Volume</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GMV Growth Rate (%/month)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={transactionGrowthRate}
                onChange={(e) => setTransactionGrowthRate(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Platform Fee (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={platformFeePercent}
                onChange={(e) => setPlatformFeePercent(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Revvy's platform fee percentage</p>
            </div>

            <div className="flex items-end">
              <button
                onClick={exportToCSV}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export to CSV
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Total Revenue</span>
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-green-600">
              ${totals.totalRevenue.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              ${(totals.totalRevenue / numMonths).toFixed(0)}/month avg
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Total GMV</span>
              <TrendingUp className="w-5 h-5 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900">
              ${totals.totalGMV.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              ${(totals.totalGMV / numMonths).toLocaleString()}/month avg
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">End Users</span>
              <Users className="w-5 h-5 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {monthlyData[monthlyData.length - 1]?.users.toLocaleString() || 0}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {userGrowthRate}% growth/month
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">End GMV</span>
              <TrendingUp className="w-5 h-5 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900">
              ${(monthlyData[monthlyData.length - 1]?.transactions || 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {transactionGrowthRate}% growth/month
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Growth Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Revenue Growth</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="Monthly Revenue" 
                  stroke="#10b981" 
                  fill="#10b981" 
                  fillOpacity={0.6}
                  name="Monthly Revenue"
                />
                <Area 
                  type="monotone" 
                  dataKey="Cumulative Revenue" 
                  stroke="#059669" 
                  fill="#059669" 
                  fillOpacity={0.3}
                  name="Cumulative Revenue"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* GMV vs Revenue Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">GMV vs Revenue</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                <Legend />
                <Bar 
                  dataKey="GMV" 
                  fill="#6366f1" 
                  name="GMV (Gross Merchandise Volume)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="Monthly Revenue" 
                  fill="#10b981" 
                  name={`Revenue (${platformFeePercent}% platform fee)`}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Breakdown Table */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Monthly Revenue Breakdown</h3>
            <button
              onClick={exportToCSV}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
            >
              <FileText className="w-4 h-4" />
              Export to CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Month</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Users</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">GMV ($)</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Monthly Revenue ($)</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Cumulative Revenue ($)</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((month) => (
                  <tr key={month.month} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{month.month}</td>
                    <td className="py-3 px-4 text-right">{month.users.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">${month.transactions.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-semibold text-green-600">${month.monthlyRevenue.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-semibold text-green-700">${month.cumulativeRevenue.toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                  <td className="py-3 px-4">Total</td>
                  <td className="py-3 px-4 text-right">-</td>
                  <td className="py-3 px-4 text-right">${totals.totalGMV.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-green-600">${totals.totalRevenue.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-lg text-green-700">${totals.totalRevenue.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

