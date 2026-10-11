# MahaRERA authorized CSV import

Use only an official or otherwise authorized export. Do not automate around portal session, cookie, CAPTCHA, or transient form-state behavior.

## Safety model

- Dry-run is the default and performs no database write.
- Only mapped public listing fields are accepted.
- PAN, email, bank/account, IFSC, Aadhaar, password/token/secret columns are detected and discarded.
- Rows that look like portal navigation are rejected.
- Existing RERA IDs are preserved with `ON CONFLICT DO NOTHING`.
- Imported records remain `verified=false`.
- The official MahaRERA search URL and exact RERA number are stored as provenance.
- Commit mode requires the offline-ingestion environment gate plus an explicitly approved Supabase project reference.

## Dry run

```bash
python src/app/real-estate/services/rera_csv_import.py ./maharera_mumbai_export.csv \
  --expected-city Mumbai
```

## Intentional commit

Set server-only ingestion credentials outside source control, enable the offline gate only for the import session, and pass the exact approved project ref:

```bash
python src/app/real-estate/services/rera_csv_import.py ./maharera_mumbai_export.csv \
  --expected-city Mumbai \
  --batch-size 50 \
  --commit \
  --expected-project-ref <approved-project-ref>
```

Do not use the legacy browser/session collector for production ingestion when an authorized export is available.
