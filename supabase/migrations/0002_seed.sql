-- 0002_seed.sql
-- Minimal seed data for testing

do $$
begin
  if not exists (select 1 from auth.users where id = '11111111-1111-1111-1111-111111111111') then
    insert into auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role
    ) values (
      '11111111-1111-1111-1111-111111111111',
      'test.user@nutriai.local',
      crypt('test-password', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      'authenticated',
      'authenticated'
    );
  end if;
end $$;

insert into public.user_settings (
  user_id,
  daily_calorie_goal,
  protein_goal_g,
  carbs_goal_g,
  fat_goal_g,
  activity_level,
  goal,
  dietary_preferences
) values (
  '11111111-1111-1111-1111-111111111111',
  2000,
  150,
  250,
  65,
  'moderately_active',
  'maintain',
  array['high-protein']
) on conflict (user_id) do nothing;

insert into public.meals (
  id,
  user_id,
  logged_at,
  category,
  description,
  food_name,
  serving_size,
  calories,
  protein_g,
  carbs_g,
  fat_g
) values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    now() - interval '1 day',
    'breakfast',
    'Greek yogurt with berries',
    'Greek yogurt',
    '1 bowl',
    320,
    25,
    35,
    8
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '11111111-1111-1111-1111-111111111111',
    now() - interval '1 day',
    'lunch',
    'Grilled chicken salad',
    'Chicken salad',
    '1 plate',
    450,
    40,
    20,
    18
  );

insert into public.meal_plans (
  id,
  user_id,
  plan_date,
  target_calories,
  summary,
  total_protein_g,
  total_carbs_g,
  total_fat_g,
  macro_ratio_protein,
  macro_ratio_carbs,
  macro_ratio_fat,
  accuracy_variance,
  source_type,
  regeneration_count
) values (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  current_date,
  2000,
  'Balanced day with high-protein meals.',
  150,
  230,
  65,
  30,
  46,
  24,
  30,
  'generic',
  1
);

insert into public.meal_plan_meals (
  id,
  meal_plan_id,
  meal_type,
  time_estimate,
  total_calories,
  total_protein_g,
  total_carbs_g,
  total_fat_g
) values
  (
    '33333333-3333-3333-3333-333333333333',
    '22222222-2222-2222-2222-222222222222',
    'breakfast',
    '7:30 AM',
    450,
    35,
    50,
    10
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    '22222222-2222-2222-2222-222222222222',
    'lunch',
    '12:30 PM',
    650,
    55,
    60,
    18
  );

insert into public.meal_plan_items (
  id,
  meal_plan_meal_id,
  name,
  weight_grams,
  calories,
  protein_g,
  carbs_g,
  fat_g,
  fiber_g,
  emoji,
  is_from_pantry
) values
  (
    '55555555-5555-5555-5555-555555555555',
    '33333333-3333-3333-3333-333333333333',
    'Oatmeal',
    180,
    280,
    10,
    50,
    6,
    6,
    null,
    false
  ),
  (
    '66666666-6666-6666-6666-666666666666',
    '33333333-3333-3333-3333-333333333333',
    'Egg whites',
    120,
    170,
    25,
    0,
    2,
    0,
    null,
    false
  ),
  (
    '77777777-7777-7777-7777-777777777777',
    '44444444-4444-4444-4444-444444444444',
    'Grilled chicken',
    170,
    300,
    45,
    0,
    7,
    0,
    null,
    false
  ),
  (
    '88888888-8888-8888-8888-888888888888',
    '44444444-4444-4444-4444-444444444444',
    'Quinoa salad',
    200,
    350,
    10,
    60,
    11,
    8,
    null,
    false
  );

insert into public.meal_plan_pantry (
  meal_plan_id,
  breakfast,
  lunch,
  dinner,
  snacks
) values (
  '22222222-2222-2222-2222-222222222222',
  'oats, eggs, berries',
  'chicken, quinoa, greens',
  'salmon, rice, broccoli',
  'nuts, yogurt'
);
