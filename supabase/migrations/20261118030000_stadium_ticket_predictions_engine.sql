-- GTH PRO Stadium Tickets + informational match analysis. New isolated tables only.
-- No existing RLS, CSS, supplier redirect or venue guide is modified.
CREATE TABLE IF NOT EXISTS public.stadium_tickets_predictions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  match_id text NOT NULL UNIQUE CHECK (match_id ~ '^seatgeek:[1-9][0-9]{0,18}$'),
  sport_title text NOT NULL CHECK (length(sport_title) BETWEEN 3 AND 80),
  home_team text NOT NULL CHECK (length(home_team) BETWEEN 2 AND 110),
  away_team text NOT NULL CHECK (length(away_team) BETWEEN 2 AND 110),
  match_date timestamptz NOT NULL,
  stadium_name text NOT NULL CHECK (length(stadium_name) BETWEEN 2 AND 150),
  ticket_booking_link text CHECK (
    ticket_booking_link IS NULL OR (
      length(ticket_booking_link) <= 1024
      AND ticket_booking_link ~ '^https://(www\.)?seatgeek\.com/[A-Za-z0-9/_%-]+$'
    )
  ),
  live_odds_data jsonb NOT NULL DEFAULT '{"status":"unavailable"}'::jsonb
    CHECK (jsonb_typeof(live_odds_data) = 'object' AND pg_column_size(live_odds_data) <= 8192),
  ai_prediction text CHECK (ai_prediction IS NULL OR length(ai_prediction) <= 1300),
  last_updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS stadium_tickets_predictions_date_idx
  ON public.stadium_tickets_predictions (match_date, last_updated_at DESC);
ALTER TABLE public.stadium_tickets_predictions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.stadium_tickets_predictions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.stadium_tickets_predictions TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stadium_tickets_predictions TO service_role;
CREATE POLICY stadium_predictions_public_upcoming ON public.stadium_tickets_predictions
  FOR SELECT TO anon, authenticated
  USING (match_date >= now() - interval '4 hours');
REVOKE ALL ON SEQUENCE public.stadium_tickets_predictions_id_seq FROM PUBLIC, anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.stadium_tickets_predictions_id_seq TO service_role;

-- Private-to-service-only budget ledger; two independent hard-capped scopes.
CREATE TABLE IF NOT EXISTS public.stadium_prediction_api_budget (
  scope text NOT NULL CHECK (scope IN ('odds', 'gemini')),
  period text NOT NULL CHECK (period ~ '^20[0-9]{2}-[0-1][0-9](-[0-3][0-9])?$'),
  reserved_units integer NOT NULL DEFAULT 0 CHECK (reserved_units >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(scope, period)
);
ALTER TABLE public.stadium_prediction_api_budget ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.stadium_prediction_api_budget FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.stadium_prediction_api_budget TO service_role;

-- One daily execution across duplicate Cron retries and parallel server instances.
CREATE TABLE IF NOT EXISTS public.stadium_prediction_refresh_claims (
  run_day date PRIMARY KEY,
  claimed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.stadium_prediction_refresh_claims ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.stadium_prediction_refresh_claims FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.stadium_prediction_refresh_claims TO service_role;

-- Service-role-only atomic quota reservation; single SQL statement and invoker RLS.
CREATE OR REPLACE FUNCTION public.reserve_stadium_prediction_budget(
 p_scope text,p_period text,p_units integer,p_limit integer
) RETURNS boolean
LANGUAGE sql SECURITY INVOKER SET search_path = public, pg_temp
AS 'WITH claimed AS (
  INSERT INTO public.stadium_prediction_api_budget(scope, period, reserved_units, updated_at)
  SELECT p_scope, p_period, p_units, now()
  WHERE p_scope IN (''odds'',''gemini'')
    AND p_units BETWEEN 1 AND CASE WHEN p_scope=''odds'' THEN 5 ELSE 1 END
    AND p_limit BETWEEN 1 AND CASE WHEN p_scope=''odds'' THEN 300 ELSE 5 END
    AND p_period ~ ''^20[0-9]{2}-[0-1][0-9](-[0-3][0-9])?$''
    AND p_units <= p_limit
  ON CONFLICT (scope,period) DO UPDATE
  SET reserved_units = public.stadium_prediction_api_budget.reserved_units + EXCLUDED.reserved_units,
      updated_at = now()
  WHERE public.stadium_prediction_api_budget.reserved_units + EXCLUDED.reserved_units <= p_limit
  RETURNING 1
)
SELECT EXISTS (SELECT 1 FROM claimed)';
REVOKE ALL ON FUNCTION public.reserve_stadium_prediction_budget(text,text,integer,integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_stadium_prediction_budget(text,text,integer,integer) TO service_role;
