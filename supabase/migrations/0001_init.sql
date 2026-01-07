-- 0001_init.sql
-- Core schema for users, meals, and meal plans

create extension if not exists "pgcrypto";
create extension if not exists "citext";

do $$ begin
  create type public.meal_category as enum ('breakfast', 'lunch', 'dinner', 'snack');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.activity_level as enum (
    'sedentary',
    'lightly_active',
    'moderately_active',
    'very_active',
    'extra_active'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.user_goal as enum ('lose', 'maintain', 'gain');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.meal_plan_source as enum ('generic', 'pantry_based');
exception
  when duplicate_object then null;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email citext unique not null,
  display_name text,
  locale text default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  user_id uuid primary key references public.users(id) on delete cascade,
  daily_calorie_goal integer not null default 2000 check (daily_calorie_goal between 500 and 10000),
  protein_goal_g integer not null default 150 check (protein_goal_g between 0 and 500),
  carbs_goal_g integer not null default 250 check (carbs_goal_g between 0 and 1000),
  fat_goal_g integer not null default 65 check (fat_goal_g between 0 and 500),
  age integer check (age between 0 and 150),
  weight_kg numeric(6, 2) check (weight_kg between 0 and 500),
  height_cm numeric(6, 2) check (height_cm between 0 and 300),
  activity_level public.activity_level,
  goal public.user_goal,
  dietary_preferences text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  logged_at timestamptz not null default now(),
  meal_date date generated always as (logged_at::date) stored,
  category public.meal_category not null,
  description text not null,
  food_name text not null,
  serving_size text not null,
  calories integer not null check (calories >= 0),
  protein_g numeric(7, 2) not null check (protein_g >= 0),
  carbs_g numeric(7, 2) not null check (carbs_g >= 0),
  fat_g numeric(7, 2) not null check (fat_g >= 0),
  recipe_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  plan_date date not null,
  target_calories integer not null check (target_calories >= 0),
  summary text,
  total_protein_g numeric(7, 2) not null default 0 check (total_protein_g >= 0),
  total_carbs_g numeric(7, 2) not null default 0 check (total_carbs_g >= 0),
  total_fat_g numeric(7, 2) not null default 0 check (total_fat_g >= 0),
  macro_ratio_protein numeric(5, 2) not null default 0 check (macro_ratio_protein between 0 and 100),
  macro_ratio_carbs numeric(5, 2) not null default 0 check (macro_ratio_carbs between 0 and 100),
  macro_ratio_fat numeric(5, 2) not null default 0 check (macro_ratio_fat between 0 and 100),
  accuracy_variance integer,
  source_type public.meal_plan_source not null default 'generic',
  regeneration_count integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, plan_date)
);

create table if not exists public.meal_plan_meals (
  id uuid primary key default gen_random_uuid(),
  meal_plan_id uuid not null references public.meal_plans(id) on delete cascade,
  meal_type public.meal_category not null,
  time_estimate text,
  total_calories integer not null default 0 check (total_calories >= 0),
  total_protein_g numeric(7, 2) not null default 0 check (total_protein_g >= 0),
  total_carbs_g numeric(7, 2) not null default 0 check (total_carbs_g >= 0),
  total_fat_g numeric(7, 2) not null default 0 check (total_fat_g >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (meal_plan_id, meal_type)
);

create table if not exists public.meal_plan_items (
  id uuid primary key default gen_random_uuid(),
  meal_plan_meal_id uuid not null references public.meal_plan_meals(id) on delete cascade,
  name text not null,
  weight_grams numeric(8, 2) not null check (weight_grams >= 0),
  calories integer not null check (calories >= 0),
  protein_g numeric(7, 2) not null check (protein_g >= 0),
  carbs_g numeric(7, 2) not null check (carbs_g >= 0),
  fat_g numeric(7, 2) not null check (fat_g >= 0),
  fiber_g numeric(7, 2) check (fiber_g >= 0),
  emoji text,
  is_from_pantry boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.meal_plan_pantry (
  meal_plan_id uuid primary key references public.meal_plans(id) on delete cascade,
  breakfast text,
  lunch text,
  dinner text,
  snacks text,
  updated_at timestamptz not null default now()
);

create index if not exists idx_meals_user_date on public.meals (user_id, meal_date);
create index if not exists idx_meals_user_logged_at on public.meals (user_id, logged_at desc);
create index if not exists idx_meals_user_category on public.meals (user_id, category);

create index if not exists idx_meal_plans_user_date on public.meal_plans (user_id, plan_date);
create index if not exists idx_meal_plan_meals_plan on public.meal_plan_meals (meal_plan_id);
create index if not exists idx_meal_plan_items_meal on public.meal_plan_items (meal_plan_meal_id);

drop trigger if exists set_updated_at_users on public.users;
create trigger set_updated_at_users
  before update on public.users
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_settings on public.user_settings;
create trigger set_updated_at_settings
  before update on public.user_settings
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_meals on public.meals;
create trigger set_updated_at_meals
  before update on public.meals
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_meal_plans on public.meal_plans;
create trigger set_updated_at_meal_plans
  before update on public.meal_plans
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_plan_meals on public.meal_plan_meals;
create trigger set_updated_at_plan_meals
  before update on public.meal_plan_meals
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_plan_pantry on public.meal_plan_pantry;
create trigger set_updated_at_plan_pantry
  before update on public.meal_plan_pantry
  for each row execute function public.set_updated_at();

alter table public.users enable row level security;
alter table public.user_settings enable row level security;
alter table public.meals enable row level security;
alter table public.meal_plans enable row level security;
alter table public.meal_plan_meals enable row level security;
alter table public.meal_plan_items enable row level security;
alter table public.meal_plan_pantry enable row level security;

create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can insert own profile"
  on public.users for insert
  with check (auth.uid() = id);

create policy "Users can manage own settings"
  on public.user_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage own meals"
  on public.meals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage own meal plans"
  on public.meal_plans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage own plan meals"
  on public.meal_plan_meals for all
  using (
    exists (
      select 1 from public.meal_plans mp
      where mp.id = meal_plan_id
        and mp.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.meal_plans mp
      where mp.id = meal_plan_id
        and mp.user_id = auth.uid()
    )
  );

create policy "Users can manage own plan items"
  on public.meal_plan_items for all
  using (
    exists (
      select 1
      from public.meal_plan_meals mpm
      join public.meal_plans mp on mp.id = mpm.meal_plan_id
      where mpm.id = meal_plan_meal_id
        and mp.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.meal_plan_meals mpm
      join public.meal_plans mp on mp.id = mpm.meal_plan_id
      where mpm.id = meal_plan_meal_id
        and mp.user_id = auth.uid()
    )
  );

create policy "Users can manage own plan pantry"
  on public.meal_plan_pantry for all
  using (
    exists (
      select 1 from public.meal_plans mp
      where mp.id = meal_plan_id
        and mp.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.meal_plans mp
      where mp.id = meal_plan_id
        and mp.user_id = auth.uid()
    )
  );
