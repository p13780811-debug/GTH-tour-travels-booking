import type { Metadata } from 'next'
import research from '@/data/market-intelligence/mumbai-research.json'
import type { MumbaiResearch } from '@/lib/market-intelligence'
import MarketIntelligenceClient from './MarketIntelligenceClient'

// Static, immutable research snapshot. No Supabase queries and no live listing writes.
const dataset = research as unknown as MumbaiResearch

export const metadata: Metadata = {
  title: 'Mumbai market research (simulated) | GTH PRO',
  description: 'Explore Mumbai simulated market data and research-only price scenarios. Not actual property inventory, verified prices, or investment advice.',
  robots: { index: false, follow: false },
}

export default function MarketIntelligencePage() {
  return <MarketIntelligenceClient research={dataset} />
}
