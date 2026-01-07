-- 0003_roles.down.sql
-- Rollback RBAC roles and admin policies

drop policy if exists "Admins can manage plan pantry" on public.meal_plan_pantry;
drop policy if exists "Admins can manage plan items" on public.meal_plan_items;
drop policy if exists "Admins can manage plan meals" on public.meal_plan_meals;
drop policy if exists "Admins can manage meal plans" on public.meal_plans;
drop policy if exists "Admins can manage meals" on public.meals;
drop policy if exists "Admins can manage settings" on public.user_settings;
drop policy if exists "Admins can manage users" on public.users;

drop policy if exists "Admins can manage roles" on public.user_roles;
drop policy if exists "Users can view own roles" on public.user_roles;

drop trigger if exists on_public_user_created_role on public.users;
drop function if exists public.assign_default_role();
drop function if exists public.has_role(public.app_role);

drop table if exists public.user_roles;

do $$ begin
  drop type public.app_role;
exception
  when undefined_object then null;
end $$;
