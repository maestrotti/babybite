-- Vrsta obroka (DORUČAK / RUČAK / VEČERA) + popravka emoji za malinu.
alter table public.meals add column if not exists meal_type text check (meal_type in ('dorucak','rucak','vecera'));
create index if not exists meals_user_type_idx on public.meals (user_id, meal_type);

update public.foods set emoji = '🔴' where normalized_name = 'malina';

drop function if exists public.save_meal(uuid, timestamptz, text, text, numeric, text, uuid[]);
create or replace function public.save_meal(
  p_meal_id uuid, p_eaten_at timestamptz, p_preference text, p_notes text,
  p_portion_amount numeric, p_portion_unit text, p_food_ids uuid[], p_meal_type text
) returns uuid language plpgsql security invoker set search_path = public as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'Niste prijavljeni'; end if;
  if p_meal_type is null or p_meal_type not in ('dorucak','rucak','vecera') then raise exception 'Odaberite vrstu obroka'; end if;
  if coalesce(array_length(p_food_ids, 1), 0) = 0 then raise exception 'Odaberite barem jednu namirnicu'; end if;
  insert into meals (id, user_id, eaten_at, meal_type, preference, notes, portion_amount, portion_unit)
  values (p_meal_id, auth.uid(), p_eaten_at, p_meal_type, p_preference, nullif(trim(p_notes), ''), p_portion_amount, p_portion_unit)
  on conflict (id) do update set eaten_at = excluded.eaten_at, meal_type = excluded.meal_type, preference = excluded.preference,
    notes = excluded.notes, portion_amount = excluded.portion_amount, portion_unit = excluded.portion_unit
  where meals.user_id = auth.uid()
  returning id into v_id;
  if v_id is null then raise exception 'Obrok nije pronađen'; end if;
  delete from meal_items where meal_id = v_id;
  insert into meal_items (meal_id, food_id) select v_id, f from (select distinct unnest(p_food_ids) as f) s;
  return v_id;
end $$;
grant execute on function public.save_meal(uuid, timestamptz, text, text, numeric, text, uuid[], text) to authenticated;
