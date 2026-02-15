alter table public.user_settings
  drop column if exists height_unit,
  drop column if exists weight_unit,
  drop column if exists goal_aggressiveness,
  drop column if exists manual_calorie_goal,
  drop column if exists calorie_goal_mode,
  drop column if exists sex_at_birth;

