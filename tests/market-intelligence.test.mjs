import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const data = JSON.parse(readFileSync(join(process.cwd(), 'src/data/market-intelligence/mumbai-research.json'), 'utf8'))

test('isolated simulated research: full 84 localities, 76 months, and 75 transit anchors', () => {
  assert.equal(data.classification, 'SYNTHETIC_MODELLED_RESEARCH_NOT_LIVE_MARKET')
  assert.equal(data.localities.length, 84)
  assert.equal(data.periods.length, 76)
  assert.equal(data.stations.length, 75)
  assert.equal(data.periods[0], '2020-01')
  assert.equal(data.periods.at(-1), '2026-04')
  assert.equal(new Set(data.localities.map(x => x.n)).size, 84)
  assert.equal(data.counts['secondary_sales.csv'] + data.counts['under_construction.csv'] + data.counts['rentals.csv'], 87000)
})

test('never publish fabricated listing IDs, RERA references, or full synthetic listing rows', () => {
  const serialized = JSON.stringify(data)
  assert.doesNotMatch(serialized, /"rera_id"|"project_id"|"date_listed"|"price_inr"|"seller_contact"/)
  for (const row of data.localities) {
    assert.deepEqual(Object.keys(row).sort(), ['h', 'n', 'p', 'r', 't'])
    assert.equal(row.h.length, data.periods.length)
    for (const period of row.h) {
      assert.equal(period.length, 3)
      assert.ok(period.every(x => Number.isFinite(x) && x > 0))
    }
    for (const profile of row.p) {
      assert.equal(profile.length, 6)
      assert.ok(['sale', 'construction', 'rent'].includes(profile[0]))
      assert.ok(Number.isInteger(profile[1]) && profile[1] >= 0 && profile[1] <= 5)
      assert.ok(profile[2] >= 5)
      assert.ok(profile[3] > 0 && profile[3] <= profile[4] && profile[4] <= profile[5])
    }
  }
})

test('transit references have bounded geography without claiming current operations', () => {
  for (const station of data.stations) {
    assert.equal(station.length, 5)
    assert.ok(typeof station[0] === 'string' && typeof station[1] === 'string')
    assert.ok(Number.isFinite(station[2]) && Math.abs(station[2]) <= 90)
    assert.ok(Number.isFinite(station[3]) && Math.abs(station[3]) <= 180)
  }
})
