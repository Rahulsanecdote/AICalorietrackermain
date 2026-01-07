-- 0001_init.down.sql
-- Rollback core schema for users, meals, and meal plans

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

drop trigger if exists set_updated_at_users on public.users;
drop trigger if exists set_updated_at_settings on public.user_settings;
drop trigger if exists set_updated_at_meals on public.meals;
drop trigger if exists set_updated_at_meal_plans on public.meal_plans;
drop trigger if exists set_updated_at_plan_meals on public.meal_plan_meals;
drop trigger if exists set_updated_at_plan_pantry on public.meal_plan_pantry;
drop function if exists public.set_updated_at();

drop table if exists public.meal_plan_items;
drop table if exists public.meal_plan_meals;
drop table if exists public.meal_plan_pantry;
drop table if exists public.meal_plans;
drop table if exists public.meals;
drop table if exists public.user_settings;
drop table if exists public.users;

drop type if exists public.meal_plan_source;
drop type if exists public.user_goal;
drop type if exists public.activity_level;
drop type if exists public.meal_category;
