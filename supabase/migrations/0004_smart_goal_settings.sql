alter table public.user_settings
  add column if not exists sex_at_birth text
    check (sex_at_birth in ('male', 'female', 'unspecified')),
  add column if not exists calorie_goal_mode text
    check (calorie_goal_mode in ('auto', 'manual')),
  add column if not exists manual_calorie_goal integer
    check (manual_calorie_goal between 500 and 10000),
  add column if not exists goal_aggressiveness text
    check (goal_aggressiveness in ('mild', 'standard', 'aggressive', 'lean')),
  add column if not exists weight_unit text
    check (weight_unit in ('kg', 'lb')),
  add column if not exists height_unit text
    check (height_unit in ('cm', 'ft_in'));

