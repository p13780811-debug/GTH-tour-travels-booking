drop policy if exists "Allow full access for service role" on public.properties;

revoke insert, update, delete, truncate, references, trigger
on table public.properties
from anon, authenticated;
