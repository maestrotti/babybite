-- BabyBite: shema, ograničenja, indeksi, RLS, funkcije. Pokrenuti PRIJE 002_seed_foods.sql.
create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.foods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  normalized_name text not null unique,
  category text not null check (category in ('Voće','Povrće','Žitarice','Meso','Riba','Mliječni proizvodi','Mahunarke','Jaja','Orašasti plodovi i sjemenke','Ostalo')),
  emoji text,
  image_url text,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index foods_category_idx on public.foods (category) where is_active;

create table public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  eaten_at timestamptz not null default now(),
  preference text check (preference in ('liked','disliked','unsure')),
  notes text check (char_length(notes) <= 500),
  portion_amount numeric check (portion_amount > 0 and portion_amount <= 5000),
  portion_unit text check (portion_unit in ('g','ml','kašika')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((portion_amount is null) = (portion_unit is null))
);
create index meals_user_eaten_idx on public.meals (user_id, eaten_at desc);

create table public.meal_items (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.meals(id) on delete cascade,
  food_id uuid not null references public.foods(id),
  created_at timestamptz not null default now(),
  unique (meal_id, food_id)
);
create index meal_items_food_idx on public.meal_items (food_id);

-- updated_at
create function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger t_profiles_upd before update on public.profiles for each row execute function public.set_updated_at();
create trigger t_foods_upd before update on public.foods for each row execute function public.set_updated_at();
create trigger t_meals_upd before update on public.meals for each row execute function public.set_updated_at();

-- profil se pravi automatski pri registraciji
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)), 60));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.foods enable row level security;
alter table public.meals enable row level security;
alter table public.meal_items enable row level security;

create policy profiles_select on public.profiles for select to authenticated using (id = auth.uid());
create policy profiles_insert on public.profiles for insert to authenticated with check (id = auth.uid());
create policy profiles_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- katalog: samo čitanje; izmjene samo kroz migracije / SQL editor (service role)
create policy foods_select on public.foods for select to authenticated using (is_active);

create policy meals_select on public.meals for select to authenticated using (user_id = auth.uid());
create policy meals_insert on public.meals for insert to authenticated with check (user_id = auth.uid());
create policy meals_update on public.meals for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy meals_delete on public.meals for delete to authenticated using (user_id = auth.uid());

create policy items_select on public.meal_items for select to authenticated
  using (exists (select 1 from public.meals m where m.id = meal_id and m.user_id = auth.uid()));
create policy items_insert on public.meal_items for insert to authenticated
  with check (exists (select 1 from public.meals m where m.id = meal_id and m.user_id = auth.uid()));
create policy items_delete on public.meal_items for delete to authenticated
  using (exists (select 1 from public.meals m where m.id = meal_id and m.user_id = auth.uid()));

revoke all on all tables in schema public from anon;

-- Atomarno kreiranje/izmjena obroka. Klijent šalje vlastiti UUID, pa dvostruki klik ne pravi duplikat.
create function public.save_meal(
  p_meal_id uuid, p_eaten_at timestamptz, p_preference text, p_notes text,
  p_portion_amount numeric, p_portion_unit text, p_food_ids uuid[]
) returns uuid language plpgsql security invoker set search_path = public as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'Niste prijavljeni'; end if;
  if coalesce(array_length(p_food_ids, 1), 0) = 0 then raise exception 'Odaberite barem jednu namirnicu'; end if;
  insert into meals (id, user_id, eaten_at, preference, notes, portion_amount, portion_unit)
  values (p_meal_id, auth.uid(), p_eaten_at, p_preference, nullif(trim(p_notes), ''), p_portion_amount, p_portion_unit)
  on conflict (id) do update set eaten_at = excluded.eaten_at, preference = excluded.preference,
    notes = excluded.notes, portion_amount = excluded.portion_amount, portion_unit = excluded.portion_unit
  where meals.user_id = auth.uid()
  returning id into v_id;
  if v_id is null then raise exception 'Obrok nije pronađen'; end if;
  delete from meal_items where meal_id = v_id;
  insert into meal_items (meal_id, food_id) select v_id, f from (select distinct unnest(p_food_ids) as f) s;
  return v_id;
end $$;
grant execute on function public.save_meal(uuid, timestamptz, text, text, numeric, text, uuid[]) to authenticated;

-- Brisanje računa: briše auth korisnika; profil i obroci se brišu kaskadno (on delete cascade).
create function public.delete_my_account() returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'Niste prijavljeni'; end if;
  delete from auth.users where id = auth.uid();
end $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
