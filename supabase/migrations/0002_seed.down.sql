-- 0002_seed.down.sql
-- Remove seed data

delete from public.meal_plan_items
where id in (
  '55555555-5555-5555-5555-555555555555',
  '66666666-6666-6666-6666-666666666666',
  '77777777-7777-7777-7777-777777777777',
  '88888888-8888-8888-8888-888888888888'
);

delete from public.meal_plan_meals
where id in (
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444'
);

delete from public.meal_plan_pantry
where meal_plan_id = '22222222-2222-2222-2222-222222222222';

delete from public.meal_plans
where id = '22222222-2222-2222-2222-222222222222';

delete from public.meals
where id in (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
);

delete from public.user_settings
where user_id = '11111111-1111-1111-1111-111111111111';

delete from public.users
where id = '11111111-1111-1111-1111-111111111111';

delete from auth.users
where id = '11111111-1111-1111-1111-111111111111';
