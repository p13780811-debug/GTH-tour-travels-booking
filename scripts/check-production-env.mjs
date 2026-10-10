import { config } from 'dotenv';
config({ path: '.env.local', quiet: true });

// Report names/status only. Never print or serialize environment values.
const required = [
  'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'GEMINI_API_KEY', 'OPENAI_API_KEY', 'PEXELS_API_KEY',
  'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN',
];
const issues = required.filter(name => !process.env[name]?.trim()).map(name => `${name}: MISSING`);
if (!(process.env.AVIASALES_API_TOKEN || process.env.TRAVELPAYOUTS_TOKEN || process.env.TRAVELPAYOUTS_API_TOKEN)?.trim()) issues.push('Flight provider token: MISSING');
for (const name of ['NEXT_PUBLIC_PEXELS_API_KEY', 'NEXT_PUBLIC_OPENAI_API_KEY', 'NEXT_PUBLIC_GEMINI_API_KEY', 'NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY']) {
  if (process.env[name]?.trim()) issues.push(`${name}: REMOVE public secret and rotate with its provider`);
}
const indexing = process.env.GTH_PUBLIC_INDEXING?.trim();
if (indexing && !['true', 'false'].includes(indexing)) issues.push('GTH_PUBLIC_INDEXING: use only true or false');
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
if (publicKey.startsWith('sb_secret_')) issues.push('NEXT_PUBLIC_SUPABASE_ANON_KEY: privileged key is forbidden');
if (publicKey.split('.').length === 3) {
  try {
    const payload = JSON.parse(Buffer.from(publicKey.split('.')[1], 'base64url').toString());
    if (payload.role === 'service_role') issues.push('NEXT_PUBLIC_SUPABASE_ANON_KEY: service-role key is forbidden');
  } catch { issues.push('NEXT_PUBLIC_SUPABASE_ANON_KEY: invalid JWT format'); }
}
for (const name of ['NEXT_PUBLIC_SUPABASE_URL', 'UPSTASH_REDIS_REST_URL']) {
  if (!process.env[name]) continue;
  try {
    const url = new URL(process.env[name]);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash ||
        (name === 'UPSTASH_REDIS_REST_URL' && (!url.hostname.endsWith('.upstash.io') || url.port || url.pathname !== '/'))) throw new Error();
  } catch { issues.push(`${name}: invalid service URL`); }
}
if (issues.length) { for (const issue of issues) console.error(issue); process.exitCode = 1; }
else console.log('Required environment names/formats: PASS. Provider connectivity, database policies and release indexing still require verification.');
