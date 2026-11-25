# Cloudflare first-stage release runbook

This branch targets a new `gth-pro-migration` Worker only. No production domain, existing Worker, or Vercel configuration is changed.

## Verified baseline

- PR #260, revision d9dbb1e: all seven workflow runs completed successfully.
- Cloudflare API access preflight passed.
- OpenNext compilation and Wrangler dry-run passed using existing compile-only CI fixtures.
- Bundle: 26,308.47 KiB uncompressed, 4,884.58 KiB gzip. Current Cloudflare Workers size cap: 64 MiB uncompressed for Free and Paid plans. Runtime CPU and memory constraints still require testing.
- Observed Vercel project inventory: 22 production entries (26 distinct names across all scopes), not an arbitrary 74-key requirement. Repository audit includes optional/system/CI-only references.

## Private configuration prerequisite

On a trusted computer, in the existing Vercel-linked GTH repository, export readable production values to a private file outside the repository with:

```sh
vercel env pull /path/to/private/gth-production.env --environment=production
```

Recover any missing/unreadable original values directly from authorized provider dashboards or a trusted backup. Do not rotate or remove working production credentials merely for the migration. The known sensitive names are SUPABASE_SERVICE_ROLE_KEY, NUITEE_PRODUCTION_API_KEY, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, CRON_SECRET, ODDS_API_KEY and SEATGEEK_CLIENT_ID.

Store the reviewed dotenv content as the GitHub Actions repository secret `GTH_CLOUDFLARE_RUNTIME_ENV`. Never commit this file, paste its values into chat, or put private secrets in repository variables. The two existing Cloudflare repository secrets remain unchanged. The disabled legacy Pexels variable is intentionally not deployed. CI and importer-only credentials remain in their existing scope; reconcile unknown names before adding them.

The workflow requires real configured production values, not placeholder fixtures. It validates known runtime names, requires an explicit first-stage target and refuses to overwrite an existing Worker. Private values are not passed to the build child process. Preview SEO stays disabled, the rate-limit namespace is separate and ingestion is disabled. Wrangler uploads runtime variables via its secrets file option.

## Release trigger and verification

Once the private configuration is confirmed, a reviewed commit to `docs/cloudflare-stage-trigger.txt` on the migration branch triggers the push-only staging workflow. The workflow does not run on pull requests. It will not deploy without the runtime bundle and Cloudflare credentials.

Use the reported workers.dev URL for read-only smoke checks. This URL is public unless separately protected; noindex is not authentication. Do not submit real leads or trigger booking/ingestion writes as test actions. Check application access, routing, security and quota behavior, sitemap/canonical launch policy, and platform-specific rate-limit behavior before production. Do not change DNS or merge before explicit release approval.

The current application uses Vercel-specific launch and proxy trust checks. Do not spoof VERCEL=1 or trust arbitrary caller IP headers. Preserve existing fail-closed controls until the Cloudflare production hosting contract is implemented and tested.
