-- 0003_roles.sql
-- RBAC roles and admin policies

do $$ begin
  create type public.app_role as enum ('user', 'admin');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.user_roles (
  user_id uuid not null references public.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create or replace function public.has_role(role_to_check public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = role_to_check
  );
$$;

create or replace function public.assign_default_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_roles (user_id, role)
  values (new.id, 'user')
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_public_user_created_role on public.users;
create trigger on_public_user_created_role
  after insert on public.users
  for each row execute function public.assign_default_role();

insert into public.user_roles (user_id, role)
select id, 'user'
from public.users
on conflict do nothing;

alter table public.user_roles enable row level security;

create policy "Users can view own roles"
  on public.user_roles for select
  using (auth.uid() = user_id);

create policy "Admins can manage roles"
  on public.user_roles for all
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

create policy "Admins can manage users"
  on public.users for all
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

create policy "Admins can manage settings"
  on public.user_settings for all
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

create policy "Admins can manage meals"
  on public.meals for all
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

create policy "Admins can manage meal plans"
  on public.meal_plans for all
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

create policy "Admins can manage plan meals"
  on public.meal_plan_meals for all
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

create policy "Admins can manage plan items"
  on public.meal_plan_items for all
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

create policy "Admins can manage plan pantry"
  on public.meal_plan_pantry for all
  using (public.has_role('admin'))
  with check (public.has_role('admin'));
