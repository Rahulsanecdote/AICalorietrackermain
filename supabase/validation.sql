-- Validation queries for post-migration integrity checks

-- 1) Orphan checks
select count(*) as orphan_meals
from public.meals m
left join public.users u on u.id = m.user_id
where u.id is null;

select count(*) as orphan_meal_plans
from public.meal_plans mp
left join public.users u on u.id = mp.user_id
where u.id is null;

select count(*) as orphan_plan_meals
from public.meal_plan_meals mpm
left join public.meal_plans mp on mp.id = mpm.meal_plan_id
where mp.id is null;

select count(*) as orphan_plan_items
from public.meal_plan_items mpi
left join public.meal_plan_meals mpm on mpm.id = mpi.meal_plan_meal_id
where mpm.id is null;

-- 2) Duplicate plan dates (should be zero)
select user_id, plan_date, count(*) as plan_count
from public.meal_plans
group by user_id, plan_date
having count(*) > 1;

-- 3) Negative macro checks (should be zero)
select count(*) as invalid_meals
from public.meals
where calories < 0 or protein_g < 0 or carbs_g < 0 or fat_g < 0;

select count(*) as invalid_plan_items
from public.meal_plan_items
where calories < 0 or protein_g < 0 or carbs_g < 0 or fat_g < 0 or weight_grams < 0;

-- 4) Meal plan meal totals vs item rollups (should be empty)
select
  mpm.id as meal_plan_meal_id,
  mpm.total_calories,
  coalesce(sum(mpi.calories), 0) as item_calories
from public.meal_plan_meals mpm
left join public.meal_plan_items mpi on mpi.meal_plan_meal_id = mpm.id
group by mpm.id, mpm.total_calories
having abs(coalesce(sum(mpi.calories), 0) - mpm.total_calories) > 5;

-- 5) Daily meal counts by user
select user_id, meal_date, count(*) as meals_logged
from public.meals
group by user_id, meal_date
order by meal_date desc
limit 30;

-- 6) Users missing roles (should be zero)
select u.id as user_id
from public.users u
left join public.user_roles ur on ur.user_id = u.id
where ur.user_id is null;

-- 7) Role distribution snapshot
select role, count(*) as role_count
from public.user_roles
group by role;
