-- Safe forward-only follow-up. Do not edit the original unverified migration.
-- Search-only discovery is NEVER equivalent to verified ticket inventory.
-- All existing grants and RLS policies remain unchanged.
ALTER TABLE IF EXISTS public.stadium_tickets_predictions
  ADD COLUMN IF NOT EXISTS ticket_discovery_mode text NOT NULL DEFAULT 'search_only';

-- Existing exactly verified provider rows retain their former meaning.
UPDATE public.stadium_tickets_predictions
  SET ticket_discovery_mode = 'provider_verified'
  WHERE ticket_booking_link IS NOT NULL AND ticket_discovery_mode = 'search_only';

ALTER TABLE IF EXISTS public.stadium_tickets_predictions
  DROP CONSTRAINT IF EXISTS stadium_tickets_predictions_match_id_check;
ALTER TABLE IF EXISTS public.stadium_tickets_predictions
  ADD CONSTRAINT stadium_predictions_source_id_checked CHECK (
    match_id ~ '^seatgeek:[1-9][0-9]{0,18}$'
    OR match_id ~ '^calendar:[a-z0-9-]{2,80}:[0-9]{8}:[a-z-]{4,90}$'
  );
ALTER TABLE IF EXISTS public.stadium_tickets_predictions
  ADD CONSTRAINT stadium_predictions_ticket_mode_checked CHECK (
    (ticket_booking_link IS NULL AND ticket_discovery_mode = 'search_only')
    OR (ticket_booking_link IS NOT NULL AND ticket_discovery_mode = 'provider_verified')
  );
COMMENT ON COLUMN public.stadium_tickets_predictions.ticket_discovery_mode IS
  'search_only = external web search, no verified ticket seller; provider_verified requires exact approved event link';
