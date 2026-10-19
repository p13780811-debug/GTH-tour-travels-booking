#!/usr/bin/env python3
"""Build isolated, synthetic market-research aggregates from an authorized local ZIP.

Never writes to a database, network service or live property inventory.
Usage: python scripts/build-mumbai-market-research.py --zip /private/archive.zip
"""
import argparse
import csv
import hashlib
import io
import json
import math
import statistics
import zipfile
from collections import defaultdict
from pathlib import Path

FILES = {
    'locality_prices_monthly.csv', 'metro_stations.csv',
    'rentals.csv', 'secondary_sales.csv', 'under_construction.csv',
}
MAX_ZIP_BYTES = 32 * 1024 * 1024
MAX_TOTAL_INFLATED = 45 * 1024 * 1024
MAX_MEMBERS = 15
SEGMENTS = [
    ('secondary_sales.csv', 'sale', 'price_per_sqft_carpet_inr'),
    ('under_construction.csv', 'construction', 'price_per_sqft_carpet_inr'),
    ('rentals.csv', 'rent', 'rent_per_sqft_carpet_inr'),
]


def rows(archive, filename):
    with archive.open(filename) as stream:
        source = io.TextIOWrapper(stream, encoding='utf-8-sig', newline='')
        yield from csv.DictReader(source)


def whole(value):
    try:
        number = float(value)
        return int(number) if math.isfinite(number) else 0
    except (ValueError, TypeError):
        return 0


def percentiles(samples):
    values = sorted(samples)
    return [values[round((len(values) - 1) * q)] for q in (.25, .5, .75)]


def build(archive_path):
    archive_path = Path(archive_path).resolve(strict=True)
    if archive_path.is_symlink() or not archive_path.is_file() or archive_path.stat().st_size > MAX_ZIP_BYTES:
        raise ValueError('ZIP input must be a bounded, regular file')
    with zipfile.ZipFile(archive_path) as archive:
        members = archive.infolist()
        if len(members) > MAX_MEMBERS or sum(x.file_size for x in members) > MAX_TOTAL_INFLATED:
            raise ValueError('ZIP contents exceed limits')
        names = {member.filename for member in members}
        if names != FILES or any(member.is_dir() or '/' in member.filename or '\\' in member.filename for member in members):
            raise ValueError('Unexpected ZIP members; use a reviewed 5-file research snapshot')
        local_meta = {}
        monthly = defaultdict(dict)
        periods = set()
        for record in rows(archive, 'locality_prices_monthly.csv'):
            key = record['locality'].strip()
            period = record['year_month']
            if not (period[:4] in {str(x) for x in range(2020, 2027)} and len(period) == 7):
                raise ValueError('Unexpected monthly period')
            local_meta[key] = (record['region'], record['tier'])
            periods.add(period)
            if period in monthly[key]:
                raise ValueError('Duplicate locality-month')
            monthly[key][period] = [
                whole(record['secondary_price_per_sqft_carpet_inr']),
                whole(record['underconstruction_price_per_sqft_carpet_inr']),
                round(float(record['rental_per_sqft_monthly_inr']), 1),
            ]
        prices = defaultdict(list)
        counts = {}
        for filename, kind, column in SEGMENTS:
            count = 0
            for row in rows(archive, filename):
                count += 1
                if row['date_listed'] < '2025-01-01':
                    continue
                locality = row['locality']
                bhk = whole(row['bedrooms'])
                area = whole(row['carpet_area_sqft'])
                rate = float(row[column])
                if locality in local_meta and 1 <= bhk <= 5 and area > 0 and math.isfinite(rate) and rate > 0:
                    prices[(locality, kind, bhk)].append(rate)
            counts[filename] = count
        stations = []
        for row in rows(archive, 'metro_stations.csv'):
            stations.append([row['station_name'], row['line'], float(row['lat']), float(row['lon']), whole(row['year_opened'])])
        periods = sorted(periods)
        locals_out = []
        for name in sorted(local_meta):
            region, tier = local_meta[name]
            history = [monthly[name][period] for period in periods]
            if any(any(not math.isfinite(value) or value <= 0 for value in record) for record in history):
                raise ValueError('Invalid modeled rate values')
            profiles = []
            for segment in ('sale', 'construction', 'rent'):
                pooled = []
                for bhk in range(1, 6):
                    values = prices[(name, segment, bhk)]
                    if len(values) >= 5:
                        profiles.append([segment, bhk, len(values), *percentiles(values)])
                    pooled.extend(values)
                if len(pooled) >= 5:
                    profiles.append([segment, 0, len(pooled), *percentiles(pooled)])
            locals_out.append({'n': name, 'r': region, 't': tier, 'h': history, 'p': profiles})
    if (len(locals_out), len(periods), len(stations)) != (84, 76, 75) or sum(counts.values()) != 87000:
        raise ValueError('Unexpected dataset shape or input version')
    return {
        'classification': 'SYNTHETIC_MODELLED_RESEARCH_NOT_LIVE_MARKET',
        'source': 'Mumbai Real Estate Sales and Rentals 2020-2026 / Sergey Nefedov / Kaggle v1',
        'source_url': 'https://www.kaggle.com/datasets/sergionefedov/mumbai-real-estate-sales-and-rentals-2020-2026/versions/1',
        'source_last_date': '2026-04',
        'license_note': 'Metadata states Apache-2.0, narrative says CC0; follow applicable terms and provide source attribution.',
        'provenance': 'Modelled values; historical geography and macro reference points; NOT verified property listings.',
        'periods': periods,
        'localities': locals_out,
        'stations': stations,
        'counts': counts,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--zip', required=True, dest='archive')
    parser.add_argument('--output', default='src/data/market-intelligence/mumbai-research.json')
    args = parser.parse_args()
    source = Path(args.archive)
    if not source.exists():
        parser.error('Local research ZIP is missing')
    data = build(source)
    destination = Path(args.output)
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    print(json.dumps({'sha256': hashlib.sha256(source.read_bytes()).hexdigest(), 'localities': len(data['localities']), 'periods': len(data['periods']), 'stations': len(data['stations']), 'output': str(destination)}, indent=2))


if __name__ == '__main__':
    main()
