export type Segment = 'sale' | 'construction' | 'rent'
export type PriceProfile = [Segment, number, number, number, number, number]
export type LocalityResearch = {
  n: string
  r: string
  t: string
  h: [number, number, number][]
  p: PriceProfile[]
}
export type MumbaiResearch = {
  classification: 'SYNTHETIC_MODELLED_RESEARCH_NOT_LIVE_MARKET'
  source: string
  source_url: string
  source_last_date: string
  license_note: string
  provenance: string
  periods: string[]
  localities: LocalityResearch[]
  stations: [string, string, number, number, number][]
  counts: Record<string, number>
}

export const SEGMENT_LABEL: Record<Segment, string> = {
  sale: 'Secondary sales',
  construction: 'Under-construction model',
  rent: 'Monthly rental model',
}

export const seriesIndex = (segment: Segment) => segment === 'sale' ? 0 : segment === 'construction' ? 1 : 2

export function estimateSyntheticScenario(locality: LocalityResearch, segment: Segment, bedrooms: number, area: number) {
  if (!Number.isFinite(area) || area < 150 || area > 10000 || !Number.isInteger(bedrooms) || bedrooms < 1 || bedrooms > 5) return null
  const data = locality.p.find(p => p[0] === segment && p[1] === bedrooms)
    ?? locality.p.find(p => p[0] === segment && p[1] === 0)
  if (!data || data[2] < 5 || ![data[3], data[4], data[5]].every(n => Number.isFinite(n) && n > 0)) return null
  return {
    low: Math.round(area * data[3]),
    mid: Math.round(area * data[4]),
    high: Math.round(area * data[5]),
    modeledSampleSize: data[2],
    usedGeneralSegment: data[1] === 0,
    cadence: segment === 'rent' ? 'per month' : 'illustrative modeled total',
  }
}

export function modelSeries(locality: LocalityResearch, segment: Segment) {
  const index = seriesIndex(segment)
  return locality.h.map(row => Number(row[index]) || 0)
}

export function chartPoints(values: number[], width = 720, height = 188, pad = 18) {
  const valid = values.filter(n => Number.isFinite(n) && n > 0)
  if (valid.length !== values.length || values.length < 2) return ''
  const low = Math.min(...values) * 0.95
  const high = Math.max(...values) * 1.05
  const span = Math.max(1, high - low)
  return values.map((value, index) => {
    const x = pad + index * (width - 2 * pad) / (values.length - 1)
    const y = height - pad - (value - low) * (height - 2 * pad) / span
    return `${x.toFixed(2)},${y.toFixed(2)}`
  }).join(' ')
}
