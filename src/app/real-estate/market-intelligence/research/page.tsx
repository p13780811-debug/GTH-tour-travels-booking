import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import research from '@/data/market-intelligence/mumbai-research.json'
import type { MumbaiResearch } from '@/lib/market-intelligence'
import MarketIntelligenceClient from '../MarketIntelligenceClient'

// Static, immutable research snapshot. No Supabase queries and no live listing writes.
const dataset = research as unknown as MumbaiResearch

export const metadata: Metadata = {
  title: 'Mumbai market research (simulated) | GTH PRO',
  description: 'Explore Mumbai simulated market data and research-only price scenarios. Not actual property inventory, verified prices, or investment advice.',
  robots: { index: false, follow: false },
}

export default function MarketIntelligencePage() {
  // Publication remains opt-in until the source's conflicting license notices
  // have been independently resolved. Existing property discovery is unaffected.
  if (process.env.GTH_MARKET_RESEARCH_ENABLED !== 'true') notFound()
  return <MarketIntelligenceClient research={dataset} />
}
