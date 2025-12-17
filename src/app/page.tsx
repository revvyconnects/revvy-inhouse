import Link from 'next/link'
import { Calculator, ArrowRight, DollarSign, TrendingUp, BarChart3 } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        <div className="bg-white rounded-xl shadow-lg p-12 text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calculator className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Revvy In-House Tools</h1>
          <p className="text-gray-600 mb-8">
            Internal tools and utilities for Revvy operations
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {/* Burn Rate Calculator */}
          <Link
            href="/burn-rate"
            className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow group"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Burn Rate Calculator</h2>
            <p className="text-sm text-gray-600 mb-4">
              Combined costs and revenue projections with runway analysis
            </p>
            <div className="flex items-center text-primary-600 font-medium">
              Open Tool
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Cost Calculator */}
          <Link
            href="/cost-calculator"
            className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow group"
          >
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-red-200 transition-colors">
              <DollarSign className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Cost Calculator</h2>
            <p className="text-sm text-gray-600 mb-4">
              Project costs as your app scales with user and transaction growth
            </p>
            <div className="flex items-center text-primary-600 font-medium">
              Open Tool
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Revenue Calculator */}
          <Link
            href="/revenue-calculator"
            className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow group"
          >
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Revenue Calculator</h2>
            <p className="text-sm text-gray-600 mb-4">
              Project revenue based on transaction volume and platform fee
            </p>
            <div className="flex items-center text-primary-600 font-medium">
              Open Tool
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

