# Revvy In-House Tools

Internal tools and utilities for Revvy operations.

## Tools

### Burn Rate Calculator

Interactive tool to project Revvy's burn rate based on:
- User growth projections
- Transaction volume scaling
- Preconfigured cost structures
- Adjustable parameters

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the burn rate calculator.

## Features

- **Adjustable Parameters:**
  - Number of months to project
  - Starting user count
  - User growth rate (% per month)
  - Starting transaction volume
  - Transaction growth rate (% per month)

- **Preconfigured Costs:**
  - Vercel Pro (infrastructure)
  - MongoDB Atlas (scaling tiers)
  - Developer costs (personnel)
  - Security tools (Sentry, Cloudflare, audits)
  - Operations (Stripe fees, email, legal, accounting)

- **Reports:**
  - Monthly breakdown tables
  - Cost trend charts
  - Category breakdown pie charts
  - Export to JSON

## Cost Categories

All costs are preconfigured based on the comprehensive burn rate analysis:
- Infrastructure: Vercel, MongoDB, Cloudflare
- Personnel: Developer costs
- Security: Sentry, security audits
- Operations: Stripe fees, email, legal, accounting, support

