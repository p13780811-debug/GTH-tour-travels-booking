-- Retire the redundant short-lived staging table created during the pilot.
-- The original public.destinations is the only master for the worldwide directory.
-- Fail closed if any staged Place IDs or destination slugs would be lost.
do $$
begin
  if to_regclass('public.nuitee_destinations') is null then
    return;
  end if;

  if exists (select 1 from public.nuitee_destinations where nuitee_place_id is not null) then
    raise exception 'Refusing to remove staging: verified Place IDs exist';
  end if;

  if exists (
    select 1 from public.nuitee_destinations n
    left join public.destinations d on d.slug = n.slug
    where d.slug is null
  ) then
    raise exception 'Refusing to remove staging: untransferred destination slug';
  end if;

  drop table public.nuitee_destinations restrict;
end;
$$;
