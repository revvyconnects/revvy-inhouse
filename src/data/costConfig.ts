// Preconfigured cost data for Revvy burn rate calculator

export interface CostConfig {
  id: string
  name: string
  category: 'infrastructure' | 'personnel' | 'security' | 'operations'
  baseCost: number
  scalingType: 'fixed' | 'perUser' | 'perTransaction' | 'tiered'
  scalingConfig?: {
    tiers?: Array<{
      threshold: number // user count or transaction volume
      cost: number
      label: string
    }>
    perUnit?: number // cost per user or per transaction
    formula?: (users: number, transactions?: number, month?: number) => number
  }
  description: string
  notes?: string
}

export const costConfigs: CostConfig[] = [
  // Infrastructure
  {
    id: 'vercel-pro',
    name: 'Vercel Pro',
    category: 'infrastructure',
    baseCost: 40, // $20/seat/month × 2 seats
    scalingType: 'tiered',
    scalingConfig: {
      tiers: [
        { threshold: 0, cost: 40, label: 'Base (2 seats, 1TB bandwidth included)' },
      ],
      formula: (users: number, transactions?: number) => {
        // Vercel charges per team member (seat), not per app user
        // Pro Plan: $20 per seat/month
        const VERCEL_SEATS = 2
        const VERCEL_COST_PER_SEAT = 20
        const baseCost = VERCEL_SEATS * VERCEL_COST_PER_SEAT
        
        // Pro Plan includes: 1TB bandwidth, 10M edge requests, 40 hours CPU time
        // Bandwidth overage: $0.15 per GB over 1TB
        // To estimate bandwidth, we need to approximate from GMV
        // Average transaction might generate ~100KB-1MB of bandwidth (API calls, assets, etc.)
        // Using conservative estimate: assume $1 GMV ≈ 1KB bandwidth (very rough approximation)
        // Better approach: estimate ~500KB per transaction on average
        // For 1000 transactions/month at $1,500 avg = $1.5M GMV, estimate ~500MB bandwidth
        // This is well under 1TB, so no overage for typical usage
        
        // If we want to be more accurate, we'd need transaction count, not GMV
        // For now, assume bandwidth stays under 1TB for most scenarios
        // If bandwidth exceeds 1TB: overage = (bandwidthGB - 1000) * 0.15
        const BANDWIDTH_LIMIT_GB = 1000
        const BANDWIDTH_OVERAGE_PER_GB = 0.15
        
        // Rough estimate: assume each $1000 GMV generates ~1GB bandwidth
        // This is a very rough approximation - actual depends on transaction count and API patterns
        const estimatedBandwidthGB = (transactions || 0) / 1000
        
        if (estimatedBandwidthGB <= BANDWIDTH_LIMIT_GB) {
          return baseCost
        }
        
        const overageGB = estimatedBandwidthGB - BANDWIDTH_LIMIT_GB
        const bandwidthOverage = overageGB * BANDWIDTH_OVERAGE_PER_GB
        
        return baseCost + bandwidthOverage
      }
    },
    description: 'Hosting, custom domains, production infrastructure. Pro Plan includes 1TB bandwidth, 10M edge requests, 40 hours CPU time.',
  },
  {
    id: 'mongodb',
    name: 'MongoDB Atlas',
    category: 'infrastructure',
    baseCost: 0,
    scalingType: 'tiered',
    scalingConfig: {
      tiers: [
        { threshold: 0, cost: 0, label: 'M0 (Free) - Development' },
        { threshold: 100, cost: 60, label: 'M10 - Production Start' },
        { threshold: 500, cost: 140, label: 'M20 - Growth Stage' },
        { threshold: 1000, cost: 260, label: 'M30 - Scaling Stage' },
        { threshold: 2000, cost: 520, label: 'M40 - High Traffic' },
      ],
      formula: (users: number) => {
        // Realistic tier-based pricing (all-in costs per tier)
        if (users < 100) return 0 // M0
        if (users < 500) return 60 // M10 all-in
        if (users < 1000) return 140 // M20 all-in
        if (users < 2000) return 260 // M30 all-in
        return 520 // M40 all-in
      }
    },
    description: 'Database hosting and scaling',
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare Pro',
    category: 'infrastructure',
    baseCost: 0,
    scalingType: 'tiered',
    scalingConfig: {
      tiers: [
        { threshold: 0, cost: 0, label: 'Free tier' },
        { threshold: 300, cost: 20, label: 'Pro plan' },
      ],
      formula: (users: number) => users >= 300 ? 20 : 0
    },
    description: 'CDN, DDoS protection, security',
  },
  
  // Personnel
  {
    id: 'developer',
    name: 'Developer (Part-time)',
    category: 'personnel',
    baseCost: 500,
    scalingType: 'tiered',
    scalingConfig: {
      tiers: [
        { threshold: 0, cost: 500, label: 'Limited time rate (Months 1-2)' },
        { threshold: 3, cost: 3000, label: 'Market rate (Month 3+)' },
      ],
      formula: (users: number, transactions?: number, month?: number) => {
        if (!month) month = 1
        if (month <= 2) return 500 // Limited time rate (Months 1-2)
        return 3000 // Market rate starting Month 3
      }
    },
    description: 'Monthly full-stack development and maintenance (adjustable)',
    notes: 'Monthly cost that scales by time period. Can be overridden in Cost Details.',
  },
  
  // Security
  {
    id: 'sentry',
    name: 'Sentry (Error Monitoring)',
    category: 'security',
    baseCost: 0,
    scalingType: 'tiered',
    scalingConfig: {
      tiers: [
        { threshold: 0, cost: 0, label: 'Free (5K errors/month)' },
        { threshold: 300, cost: 26, label: 'Team plan (50K errors/month)' },
      ],
      formula: (users: number) => users >= 300 ? 26 : 0
    },
    description: 'Error tracking and performance monitoring',
  },
  {
    id: 'security-audit',
    name: 'Security Audit',
    category: 'security',
    baseCost: 3000,
    scalingType: 'tiered',
    scalingConfig: {
      tiers: [
        { threshold: 0, cost: 0, label: 'Not needed yet' },
        { threshold: 100, cost: 3000, label: 'Light security review (auto-triggered at 100 users)' },
      ],
      formula: (users: number, transactions?: number, month?: number) => {
        // Component handles one-time logic - this formula should return 0
        // The component will add the cost when crossing the threshold
        return 0
      }
    },
    description: 'One-time security audit triggered automatically at 100 users',
    notes: 'One-time cost (light security review: $2K-$4K, defaulting to $3K). Automatically triggers when user count first reaches 100. Adjustable in Cost Details. Full pen test ($10K-$18K) may be needed later when processing real payouts, partner requests it, or closing enterprise clients.',
  },
  
  // Operations
  {
    id: 'stripe-fees',
    name: 'Stripe Fees (Marketplace)',
    category: 'operations',
    baseCost: 0,
    scalingType: 'perTransaction',
    scalingConfig: {
      formula: (users: number, transactions?: number) => {
        // Note: transactions parameter represents GMV (Gross Merchandise Volume) in dollars
        // Approximate blended Stripe Connect fees as 0.5% of GMV
        const gmv = transactions || 0
        const stripePctOfGMV = 0.005 // 0.5% of GMV as a blended approximation
        return gmv * stripePctOfGMV
      }
    },
    description: 'Approximate blended Stripe Connect fees as % of GMV',
  },
  {
    id: 'sendgrid',
    name: 'SendGrid (Email Service)',
    category: 'operations',
    baseCost: 0,
    scalingType: 'tiered',
    scalingConfig: {
      tiers: [
        { threshold: 0, cost: 0, label: 'Free (~3K emails/month)' },
        { threshold: 834, cost: 20, label: 'Essentials (40K emails/month)' }, // 834 * 3.6 ≈ 3,002
      ],
      formula: (users: number) => {
        // Estimate: ~3.6 emails per user per month
        const FREE_EMAILS_PER_MONTH = 3000
        const emailVolume = users * 3.6
        return emailVolume > FREE_EMAILS_PER_MONTH ? 20 : 0
      }
    },
    description: 'Transactional emails (password reset, payouts, notifications)',
  },
  {
    id: 'legal',
    name: 'Legal (Terms & Privacy)',
    category: 'operations',
    baseCost: 0,
    scalingType: 'fixed',
    description: 'One-time legal document creation (adjustable)',
    notes: 'One-time cost, typically charged with security audit (Month 6). Default: $0. Can be overridden in Cost Details. Typical range: $2K-$3K.',
  },
  {
    id: 'accounting',
    name: 'Accounting & Bookkeeping',
    category: 'operations',
    baseCost: 0,
    scalingType: 'tiered',
    scalingConfig: {
      tiers: [
        { threshold: 0, cost: 0, label: 'No accounting service' },
        { threshold: 300, cost: 230, label: 'QuickBooks + Bookkeeper' },
      ],
      formula: (users: number) => users >= 300 ? 230 : 0
    },
    description: 'Accounting software and bookkeeping services',
  },
  {
    id: 'customer-support',
    name: 'Customer Support Tool',
    category: 'operations',
    baseCost: 0,
    scalingType: 'tiered',
    scalingConfig: {
      tiers: [
        { threshold: 0, cost: 0, label: 'No tool needed' },
        { threshold: 300, cost: 74, label: 'Intercom Starter' },
      ],
      formula: (users: number) => users >= 300 ? 74 : 0
    },
    description: 'Customer support platform (Intercom)',
  },
  {
    id: 'backup',
    name: 'Backup Services',
    category: 'operations',
    baseCost: 0,
    scalingType: 'tiered',
    scalingConfig: {
      tiers: [
        { threshold: 0, cost: 0, label: 'Included in MongoDB' },
        { threshold: 500, cost: 10, label: 'Additional backup' },
      ],
      formula: (users: number) => users >= 500 ? 10 : 0
    },
    description: 'Additional backup services',
  },
  {
    id: 'domain',
    name: 'Domain Registration',
    category: 'operations',
    baseCost: 1.25, // $15/year = $1.25/month
    scalingType: 'fixed',
    description: 'Domain registration (app.revvy.com, api.revvy.com)',
  },
]

// Helper function to calculate cost for a given month
export function calculateMonthlyCost(
  costConfig: CostConfig,
  month: number,
  users: number,
  transactions: number = 0
): number {
  const { baseCost, scalingType, scalingConfig } = costConfig

  if (scalingType === 'fixed') {
    // One-time costs only apply in specific months
    if (costConfig.id === 'legal' && month !== 6) return 0 // Legal fee charged with security audit (Month 6)
    return baseCost
  }

  if (scalingType === 'tiered' && scalingConfig?.formula) {
    return scalingConfig.formula(users, transactions || 0, month)
  }

  if (scalingType === 'tiered' && scalingConfig?.tiers) {
    // Find the appropriate tier based on users
    let selectedTier = scalingConfig.tiers[0]
    for (let i = scalingConfig.tiers.length - 1; i >= 0; i--) {
      if (users >= scalingConfig.tiers[i].threshold) {
        selectedTier = scalingConfig.tiers[i]
        break
      }
    }
    return selectedTier.cost
  }

  if (scalingType === 'perTransaction' && scalingConfig?.formula) {
    return scalingConfig.formula(users, transactions)
  }

  if (scalingType === 'perUser' && scalingConfig?.perUnit) {
    return baseCost + (users * scalingConfig.perUnit)
  }

  return baseCost
}

// Calculate total cost for all categories
export function calculateTotalCost(
  month: number,
  users: number,
  transactions: number = 0
): {
  infrastructure: number
  personnel: number
  security: number
  operations: number
  total: number
} {
  const costs = {
    infrastructure: 0,
    personnel: 0,
    security: 0,
    operations: 0,
    total: 0,
  }

  costConfigs.forEach((config) => {
    const cost = calculateMonthlyCost(config, month, users, transactions)
    costs[config.category] += cost
    costs.total += cost
  })

  return costs
}

