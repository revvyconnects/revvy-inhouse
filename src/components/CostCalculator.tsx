'use client'

import React, { useState, useMemo } from 'react'
import { costConfigs, calculateMonthlyCost, calculateTotalCost } from '@/data/costConfig'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Download, DollarSign, Users, Settings, ArrowLeft, FileText } from 'lucide-react'
import Link from 'next/link'

interface MonthData {
  month: number
  users: number
  transactions: number
  costs: {
    infrastructure: number
    personnel: number
    security: number
    operations: number
    total: number
  }
  breakdown: Array<{
    id: string
    name: string
    cost: number
    category: string
  }>
}

export default function CostCalculator() {
  const [numMonths, setNumMonths] = useState(9)
  const [startingUsers, setStartingUsers] = useState(5) // Early pilot partners (Tagger, NIL son, others)
  const [userGrowthRate, setUserGrowthRate] = useState(25) // % per month (with funding: group chat referrals + paid media + trust networks)
  const [includeStripeFees, setIncludeStripeFees] = useState(true)
  const [startingTransactions, setStartingTransactions] = useState(625) // $ per month GMV (5 brands × $1,500/year ÷ 12 = $125/month per brand)
  const [transactionGrowthRate, setTransactionGrowthRate] = useState(12.5) // % per month (middle of 10-15% range)
  const [developerFeeOverride, setDeveloperFeeOverride] = useState<number | null>(null)
  const [customCosts, setCustomCosts] = useState<Record<string, number>>({})

  // Calculate monthly projections
  const monthlyData: MonthData[] = useMemo(() => {
    const data: MonthData[] = []
    let securityAuditApplied = false // Track if security audit has been applied
    
    for (let month = 1; month <= numMonths; month++) {
      const users = Math.round(startingUsers * Math.pow(1 + userGrowthRate / 100, month - 1))
      
      // Calculate users for previous month (to detect threshold crossing)
      const prevUsers = month > 1 
        ? Math.round(startingUsers * Math.pow(1 + userGrowthRate / 100, month - 2))
        : 0
      
      const transactions = Math.round(startingTransactions * Math.pow(1 + transactionGrowthRate / 100, month - 1))
      
      // Only use transactions for Stripe fees if enabled, otherwise use 0
      const transactionsForCalc = includeStripeFees ? transactions : 0
      
      let costs = calculateTotalCost(month, users, transactionsForCalc)
      
      // Handle security audit as one-time cost (only when crossing 100 users threshold)
      const securityAuditConfig = costConfigs.find(c => c.id === 'security-audit')
      if (securityAuditConfig) {
        // First, remove any security audit cost that was calculated by default
        const defaultAuditCost = calculateMonthlyCost(securityAuditConfig, month, users, transactionsForCalc)
        costs.security -= defaultAuditCost
        costs.total -= defaultAuditCost
        
        // Then, only apply it if we're crossing the 100 user threshold for the first time
        if (!securityAuditApplied && prevUsers < 100 && users >= 100) {
          // Apply security audit cost this month (first time crossing threshold)
          const auditCost = customCosts['security-audit'] ?? securityAuditConfig.baseCost
          costs.security += auditCost
          costs.total += auditCost
          securityAuditApplied = true
        }
      }
      
      // Apply developer fee override if set
      if (developerFeeOverride !== null) {
        const developerConfig = costConfigs.find(c => c.id === 'developer')!
        const baseDeveloperCost = calculateMonthlyCost(developerConfig, month, users, transactionsForCalc)
        costs.personnel = costs.personnel - baseDeveloperCost + developerFeeOverride
        costs.total = costs.total - baseDeveloperCost + developerFeeOverride
      }
      
      const breakdown = costConfigs.map(config => {
        // Skip Stripe fees if not including transaction-based costs
        if (config.id === 'stripe-fees' && !includeStripeFees) {
          return {
            id: config.id,
            name: config.name,
            cost: 0,
            category: config.category,
          }
        }
        
        let cost = customCosts[config.id] ?? calculateMonthlyCost(config, month, users, transactionsForCalc)
        
        // Handle security audit as one-time cost (only when crossing 100 users threshold)
        if (config.id === 'security-audit') {
          if (!securityAuditApplied && prevUsers < 100 && users >= 100) {
            // This is the first month where we cross the threshold - apply the cost
            cost = customCosts['security-audit'] ?? config.baseCost
          } else {
            // Either already applied or not at threshold yet - don't show it
            cost = 0
          }
        }
        
        if (config.id === 'developer' && developerFeeOverride !== null) {
          cost = developerFeeOverride
        }
        return {
          id: config.id,
          name: config.name,
          cost,
          category: config.category,
        }
      })

      data.push({
        month,
        users,
        transactions,
        costs,
        breakdown,
      })
    }
    
    return data
  }, [numMonths, startingUsers, userGrowthRate, startingTransactions, transactionGrowthRate, customCosts, developerFeeOverride, includeStripeFees])

  // Calculate totals
  const totals = useMemo(() => {
    return monthlyData.reduce((acc, month) => ({
      infrastructure: acc.infrastructure + month.costs.infrastructure,
      personnel: acc.personnel + month.costs.personnel,
      security: acc.security + month.costs.security,
      operations: acc.operations + month.costs.operations,
      total: acc.total + month.costs.total,
    }), { infrastructure: 0, personnel: 0, security: 0, operations: 0, total: 0 })
  }, [monthlyData])

  // Chart data
  const chartData = monthlyData.map(m => ({
    month: `Month ${m.month}`,
    infrastructure: m.costs.infrastructure,
    personnel: m.costs.personnel,
    security: m.costs.security,
    operations: m.costs.operations,
    total: m.costs.total,
  }))

  const pieData = [
    { name: 'Infrastructure', value: totals.infrastructure, color: '#3b82f6' },
    { name: 'Personnel', value: totals.personnel, color: '#10b981' },
    { name: 'Security', value: totals.security, color: '#f59e0b' },
    { name: 'Operations', value: totals.operations, color: '#8b5cf6' },
  ]

  const handleCostOverride = (costId: string, value: number) => {
    setCustomCosts(prev => ({
      ...prev,
      [costId]: value,
    }))
  }

  const exportToCSV = () => {
    const headers = [
      'Month',
      'Users',
      ...(includeStripeFees ? ['GMV ($)'] : []),
      'Infrastructure ($)',
      'Personnel ($)',
      'Security ($)',
      'Operations ($)',
      'Total ($)'
    ]
    
    const rows = monthlyData.map(month => [
      month.month.toString(),
      month.users.toString(),
      ...(includeStripeFees ? [month.transactions.toFixed(2)] : []),
      month.costs.infrastructure.toFixed(2),
      month.costs.personnel.toFixed(2),
      month.costs.security.toFixed(2),
      month.costs.operations.toFixed(2),
      month.costs.total.toFixed(2),
    ])
    
    rows.push([
      'Total',
      '',
      ...(includeStripeFees ? [''] : []),
      totals.infrastructure.toFixed(2),
      totals.personnel.toFixed(2),
      totals.security.toFixed(2),
      totals.operations.toFixed(2),
      totals.total.toFixed(2),
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `revvy-cost-calculator-${Date.now()}.csv`
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Revvy Cost Calculator</h1>
          <p className="text-gray-600">Project costs as your app scales with user and transaction growth</p>
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

            <div className="flex items-center">
              <input
                type="checkbox"
                id="includeStripeFees"
                checked={includeStripeFees}
                onChange={(e) => setIncludeStripeFees(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="includeStripeFees" className="ml-2 text-sm font-medium text-gray-700">
                Include Stripe fees (transaction-based)
              </label>
            </div>

            {includeStripeFees && (
              <>
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
                  <p className="text-xs text-gray-500 mt-1">For Stripe fee calculation (0.5% of GMV)</p>
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
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Developer Fee ($/month, optional)
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={developerFeeOverride ?? ''}
                onChange={(e) => setDeveloperFeeOverride(e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="Auto (formula-based)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty to use formula (scales by month)</p>
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
        <div className={`grid gap-6 mb-8 ${includeStripeFees ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Total Costs</span>
              <DollarSign className="w-5 h-5 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900">
              ${totals.total.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              ${(totals.total / numMonths).toFixed(0)}/month avg
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

          {includeStripeFees && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">End GMV</span>
                <DollarSign className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-3xl font-bold text-gray-900">
                ${(monthlyData[monthlyData.length - 1]?.transactions || 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {transactionGrowthRate}% growth/month
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Avg Monthly Cost</span>
              <DollarSign className="w-5 h-5 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900">
              ${(totals.total / numMonths).toLocaleString()}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              per month
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Costs Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Monthly Costs by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={3} name="Total Costs" />
                <Line type="monotone" dataKey="infrastructure" stroke="#3b82f6" strokeWidth={2} name="Infrastructure" />
                <Line type="monotone" dataKey="personnel" stroke="#10b981" strokeWidth={2} name="Personnel" />
                <Line type="monotone" dataKey="security" stroke="#f59e0b" strokeWidth={2} name="Security" />
                <Line type="monotone" dataKey="operations" stroke="#8b5cf6" strokeWidth={2} name="Operations" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Cost Breakdown Pie Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Total Cost Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Breakdown Table */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Monthly Cost Breakdown</h3>
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
                  {includeStripeFees && (
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">GMV</th>
                  )}
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Infrastructure</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Personnel</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Security</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Operations</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Total</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((month) => (
                  <tr key={month.month} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{month.month}</td>
                    <td className="py-3 px-4 text-right">{month.users.toLocaleString()}</td>
                    {includeStripeFees && (
                      <td className="py-3 px-4 text-right">${month.transactions.toLocaleString()}</td>
                    )}
                    <td className="py-3 px-4 text-right">${month.costs.infrastructure.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right">${month.costs.personnel.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right">${month.costs.security.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right">${month.costs.operations.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-semibold">${month.costs.total.toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                  <td className="py-3 px-4">Total</td>
                  <td className="py-3 px-4 text-right">-</td>
                  {includeStripeFees && (
                    <td className="py-3 px-4 text-right">-</td>
                  )}
                  <td className="py-3 px-4 text-right">${totals.infrastructure.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right">${totals.personnel.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right">${totals.security.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right">${totals.operations.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-lg">${totals.total.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Cost Details */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Monthly Cost Details</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Cost Item</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                  {monthlyData.map((month) => (
                    <th key={month.month} className="text-right py-3 px-4 font-semibold text-gray-700">
                      Month {month.month}
                    </th>
                  ))}
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Total</th>
                </tr>
              </thead>
              <tbody>
                {costConfigs.map((config) => {
                  const monthlyCosts = monthlyData.map(month => {
                    if (customCosts[config.id] !== undefined) {
                      return customCosts[config.id]
                    }
                    if (config.id === 'developer' && developerFeeOverride !== null) {
                      return developerFeeOverride
                    }
                    return calculateMonthlyCost(config, month.month, month.users, month.transactions)
                  })
                  const totalCost = monthlyCosts.reduce((sum, cost) => sum + cost, 0)
                  
                  return (
                    <tr key={config.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{config.name}</div>
                        <div className="text-xs text-gray-500">{config.description}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 capitalize">
                          {config.category}
                        </span>
                      </td>
                      {monthlyCosts.map((cost, index) => (
                        <td key={index} className="py-3 px-4 text-right">
                          <input
                            type="number"
                            value={cost.toFixed(2)}
                            onChange={(e) => {
                              const newValue = parseFloat(e.target.value) || 0
                              if (config.id === 'developer' && developerFeeOverride !== null) {
                                setDeveloperFeeOverride(null)
                              }
                              handleCostOverride(config.id, newValue)
                            }}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-right text-sm"
                            step="0.01"
                          />
                        </td>
                      ))}
                      <td className="py-3 px-4 text-right font-semibold">
                        ${totalCost.toFixed(2)}
                      </td>
                    </tr>
                  )
                })}
                <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                  <td className="py-3 px-4" colSpan={2}>Total</td>
                  {monthlyData.map((month) => (
                    <td key={month.month} className="py-3 px-4 text-right">
                      ${month.costs.total.toFixed(2)}
                    </td>
                  ))}
                  <td className="py-3 px-4 text-right text-lg">
                    ${totals.total.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

