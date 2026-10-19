'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { LocalityResearch, MumbaiResearch, Segment } from '@/lib/market-intelligence'
import { SEGMENT_LABEL, chartPoints, estimateSyntheticScenario, modelSeries, seriesIndex } from '@/lib/market-intelligence'
import styles from './market-intelligence.module.css'

const money = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
const decimal = (amount: number) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(amount)
const availableSegments: Segment[] = ['sale', 'construction', 'rent']

function ModelChart({ series, labels, unit }: { series: number[], labels: string[], unit: string }) {
  const points = chartPoints(series)
  return <figure className={styles.figure}>
    <svg viewBox="0 0 720 188" role="img" aria-label={`Illustrative monthly ${unit} trend from ${labels[0]} to ${labels[labels.length - 1]}. First ${decimal(series[0])}, last ${decimal(series[series.length - 1])}.`} preserveAspectRatio="xMidYMid meet">
      <line x1="18" y1="170" x2="702" y2="170" stroke="currentColor" strokeOpacity="0.22" />
      <line x1="18" y1="18" x2="18" y2="170" stroke="currentColor" strokeOpacity="0.18" />
      <polyline fill="none" stroke="#b89b59" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
    <figcaption className={styles.chartLabels}><span>{labels[0]}</span><span>{labels[Math.floor(labels.length / 2)]}</span><span>{labels[labels.length - 1]}</span></figcaption>
  </figure>
}

export default function MarketIntelligenceClient({ research }: { research: MumbaiResearch }) {
  const [region, setRegion] = useState('All regions')
  const regions = useMemo(() => ['All regions', ...Array.from(new Set(research.localities.map(x => x.r))).sort()], [research.localities])
  const filteredLocalities = useMemo(() => research.localities.filter(x => region === 'All regions' || x.r === region), [research.localities, region])
  const [selectedName, setSelectedName] = useState('Bandra West')
  const locality: LocalityResearch = filteredLocalities.find(x => x.n === selectedName) ?? filteredLocalities[0] ?? research.localities[0]
  const [segment, setSegment] = useState<Segment>('sale')
  const [bedrooms, setBedrooms] = useState('2')
  const [carpetArea, setCarpetArea] = useState('650')
  const [stationQuery, setStationQuery] = useState('')
  const [stationLine, setStationLine] = useState('All lines')
  const computed = estimateSyntheticScenario(locality, segment, Number(bedrooms), Number(carpetArea))
  const timeSeries = modelSeries(locality, segment)
  const rateIndex = seriesIndex(segment)
  const stationLines = ['All lines', ...Array.from(new Set(research.stations.map(x => x[1]))).sort()]
  const matchingStations = research.stations.filter(station =>
    station[0].toLowerCase().includes(stationQuery.trim().toLowerCase()) && (stationLine === 'All lines' || station[1] === stationLine)
  )
  const comparison = filteredLocalities.map(item => ({
    name: item.n,
    rate: item.h.at(-1)?.[rateIndex] ?? 0,
    region: item.r,
  })).sort((a, b) => b.rate - a.rate).slice(0, 8)
  const rateUnit = segment === 'rent' ? 'modeled INR/sqft/month' : 'modeled INR/carpet sqft'

  return <main className={`gth-container ${styles.page}`}>
    <div className={styles.breadcrumbs}><Link href="/real-estate">Real Estate</Link><span aria-hidden="true">/</span><span>Market research</span></div>
    <header className={styles.hero}>
      <p className={styles.eyebrow}>GTH PRO • Research sandbox</p>
      <h1>Mumbai market intelligence</h1>
      <p>Explore historical <strong>simulated</strong> price patterns, model-generated price bands, and station-reference data. This workspace is separate from actual property listings and MahaRERA registry projects.</p>
      <div className={styles.flags} aria-label="Research dataset coverage"><span>84 localities</span><span>76 modeled months</span><span>87,000 synthetic training rows</span><span>75 station references</span></div>
      <p className={styles.warning} role="note"><strong>Simulation — not live inventory.</strong> The source generates individual apartment characteristics and prices mathematically. These estimates are not seller asking prices, independent valuations, predictions of future prices, or investment advice. Station information needs current-source verification.</p>
    </header>

    <section className={styles.surface} aria-labelledby="scenario-heading">
      <div className={styles.sectionIntro}><div><p className={styles.eyebrow}>Development-only pricing model</p><h2 id="scenario-heading">Modeled property scenario</h2></div><p>2025–Apr 2026 generated sample • INR</p></div>
      <div className={styles.fields}>
        <label>Region <select value={region} onChange={event => { setRegion(event.target.value); setSelectedName('') }}>{regions.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
        <label>Locality <select value={locality.n} onChange={event => setSelectedName(event.target.value)}>{filteredLocalities.map(item => <option key={item.n} value={item.n}>{item.n}</option>)}</select></label>
        <label>Modeled segment <select value={segment} onChange={event => setSegment(event.target.value as Segment)}>{availableSegments.map(value => <option key={value} value={value}>{SEGMENT_LABEL[value]}</option>)}</select></label>
        <label>Bedrooms <select value={bedrooms} onChange={event => setBedrooms(event.target.value)}>{[1,2,3,4,5].map(n => <option key={n} value={n}>{n} BHK</option>)}</select></label>
        <label>Carpet area (sqft) <input type="number" min="150" max="10000" step="10" inputMode="decimal" value={carpetArea} onChange={event => setCarpetArea(event.target.value)} /></label>
      </div>
      {computed ? <div className={styles.estimate} aria-live="polite"><div><span>Illustrative modeled midpoint {segment === 'rent' ? '(monthly)' : '(total)'}</span><strong>{money(computed.mid)}</strong><small>Generated range: {money(computed.low)} – {money(computed.high)} {segment === 'rent' ? 'per month' : ''}</small></div><p>Based on {computed.modeledSampleSize.toLocaleString('en-IN')} <strong>synthetic</strong> 2025–2026 records{computed.usedGeneralSegment ? ', with a general-segment fallback' : ` for ${bedrooms} BHK`}. Range is the model-data 25th–75th percentile, <strong>not</strong> a statistical confidence interval or verified market price.</p></div> : <p className={styles.warning} role="status">Enter an area between 150 and 10,000 sqft and valid bedrooms to see an illustrative simulation.</p>}
    </section>

    <section className={styles.surface} aria-labelledby="trend-heading">
      <div className={styles.sectionIntro}><div><p className={styles.eyebrow}>Stylized monthly model • Jan 2020 – Apr 2026</p><h2 id="trend-heading">Historical model trend: {locality.n}</h2></div><p>{rateUnit}</p></div>
      <div className={styles.statRow}><div><span>2020 model starting point</span><strong>{money(timeSeries[0])}</strong></div><div><span>Apr 2026 model endpoint</span><strong>{money(timeSeries.at(-1) ?? 0)}</strong></div><div><span>Change within simulation</span><strong>{timeSeries[0] > 0 ? `${decimal(((timeSeries.at(-1) ?? 0) / timeSeries[0] - 1) * 100)}%` : 'N/A'}</strong></div></div>
      <ModelChart series={timeSeries} labels={research.periods} unit={rateUnit} />
      <p className={styles.small}>The curve is derived from a stylized data generator; it does not document actual transactions or provide a real historic market index. Last source period: April 2026.</p>
    </section>

    <div className={styles.twoColumns}>
      <section className={styles.surface} aria-labelledby="comparison-heading">
        <p className={styles.eyebrow}>Scenario comparisons</p><h2 id="comparison-heading">Highest modeled rates in selection</h2>
        <p className={styles.small}>Selected region and {SEGMENT_LABEL[segment].toLowerCase()}, April 2026 model data. This is <strong>not</strong> a real property ranking.</p>
        <div className={styles.rates}>{comparison.map((item, i) => <div key={item.name} className={styles.rateRow}><span><small>{i + 1}.</small> {item.name}</span><strong>{money(item.rate)}</strong></div>)}</div>
      </section>
      <section className={styles.surface} aria-labelledby="transit-heading">
        <p className={styles.eyebrow}>Geographic references • unverified</p><h2 id="transit-heading">Metro & rail station lookup</h2>
        <p className={styles.small}>Source-supplied station names, lines and coordinates. Station operations, routing, access and travel times are <strong>not</strong> independently verified.</p>
        <div className={styles.stationFilters}><label>Station name <input type="search" value={stationQuery} onChange={event => setStationQuery(event.target.value.slice(0, 80))} placeholder="Search a station" /></label><label>Line <select value={stationLine} onChange={event => setStationLine(event.target.value)}>{stationLines.map(line => <option key={line}>{line}</option>)}</select></label></div>
        <p className={styles.small} role="status">{matchingStations.length} matching station references</p>
        <div className={styles.stationList}>{matchingStations.slice(0, 10).map(station => <div key={`${station[0]}-${station[1]}`}><strong>{station[0]}</strong><span>{station[1]}</span></div>)}</div>
        {matchingStations.length > 10 && <p className={styles.small}>Showing the first 10 references; refine the search for more.</p>}
      </section>
    </div>

    <aside className={styles.source} aria-label="Data provenance">
      <h2>Methodology & provenance</h2>
      <p>Source: <a href={research.source_url} target="_blank" rel="noopener noreferrer">Mumbai Real Estate: Sales, Under-Construction & Rentals (2020–2026), Sergey Nefedov / Kaggle v1</a>. This dashboard uses aggregated modeled datasets, not individual listing rows, not developer contact details, and not purported live listings.</p>
      <p>The dataset metadata labels its license Apache 2.0 while its narrative labels it CC0; this conflict should be resolved before third-party redistribution. Source attribution is retained here. Geographic/metro anchors and stylized price series must be checked against independent authoritative sources before real-world claims.</p>
      <Link className={styles.action} href="/real-estate">Explore actual listings & registry projects separately →</Link>
    </aside>
  </main>
}
