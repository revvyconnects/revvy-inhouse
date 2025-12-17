# Revvy In-House Tools

Internal calculators for Revvy ops and finance.

## Available tools
- Burn Rate Calculator: runway, combined costs, revenue projections.
- Cost Calculator: infra/personnel/ops costs as user and transaction volume grows.
- Revenue Calculator: revenue projections from volume and platform fee.

## Stack
- Next.js 14 / React 18
- TailwindCSS

## Getting started
Requirements: Node 18+ and npm.

```bash
npm install
npm run dev
```

Open http://localhost:3000 for the tool index:
- /burn-rate
- /cost-calculator
- /revenue-calculator

## Notes
- No external APIs or secrets required for local runs.
- Costs and growth assumptions are encoded in `src/data/costConfig.ts` and component defaults; adjust as needed.

