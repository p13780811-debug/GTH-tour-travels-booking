-- Disposable fixture schema only.
ALTER TABLE public.properties ADD COLUMN country text,ADD COLUMN state text,ADD COLUMN district text,ADD COLUMN city text;
ALTER TABLE public.tenders ADD COLUMN country_code text,ADD COLUMN region text,ADD COLUMN buyer text,ADD COLUMN sector text;
