update subscription_plans
set is_active = false;

insert into subscription_plans (
  slug, name, description, meals_per_week, price_paise, per_meal_price_paise,
  calories_per_day, serves, perks, is_active
)
values
  (
    'veg-solo-lunch-mini',
    'Solo Lunch Grove',
    'Vegetarian mini meals for lunch, five meals per week. Monthly price uses the average month (52 weeks ÷ 12).',
    5, 162500, 7500, 720, 1, 'Vegetarian mini meal · 5 meals per week', true
  ),
  (
    'veg-solo-lunch-full',
    'Solo Lunch Grove',
    'Vegetarian full meals for lunch, five meals per week. Monthly price uses the average month (52 weeks ÷ 12).',
    5, 205833, 9500, 1450, 1, 'Vegetarian full meal · 5 meals per week', true
  ),
  (
    'veg-solo-dinner-mini',
    'Solo Dinner Grove',
    'Vegetarian mini meals for dinner, five meals per week. Monthly price uses the average month (52 weeks ÷ 12).',
    5, 162500, 7500, 720, 1, 'Vegetarian mini meal · 5 meals per week', true
  ),
  (
    'veg-solo-dinner-full',
    'Solo Dinner Grove',
    'Vegetarian full meals for dinner, five meals per week. Monthly price uses the average month (52 weeks ÷ 12).',
    5, 205833, 9500, 1450, 1, 'Vegetarian full meal · 5 meals per week', true
  ),
  (
    'veg-lunch-dinner-mini',
    'Lunch & Dinner',
    'Choose lunch or dinner for each of five vegetarian mini meals per week. Monthly price uses the average month (52 weeks ÷ 12).',
    5, 162500, 7500, 720, 1, 'Vegetarian mini meal · 5 meals per week', true
  ),
  (
    'veg-lunch-dinner-full',
    'Lunch & Dinner',
    'Choose lunch or dinner for each of five vegetarian full meals per week. Monthly price uses the average month (52 weeks ÷ 12).',
    5, 205833, 9500, 1450, 1, 'Vegetarian full meal · 5 meals per week', true
  ),
  (
    'non-veg-solo-lunch-mini',
    'Solo Lunch Grove',
    'Non-vegetarian mini meals for lunch, five meals per week. Monthly price uses the average month (52 weeks ÷ 12).',
    5, 249167, 11500, 720, 1, 'Non-veg mini meal · 5 meals per week', true
  ),
  (
    'non-veg-solo-lunch-full',
    'Solo Lunch Grove',
    'Non-vegetarian full meals for lunch, five meals per week. Monthly price uses the average month (52 weeks ÷ 12).',
    5, 292500, 13500, 1450, 1, 'Non-veg full meal · 5 meals per week', true
  ),
  (
    'non-veg-solo-dinner-mini',
    'Solo Dinner Grove',
    'Non-vegetarian mini meals for dinner, five meals per week. Monthly price uses the average month (52 weeks ÷ 12).',
    5, 249167, 11500, 720, 1, 'Non-veg mini meal · 5 meals per week', true
  ),
  (
    'non-veg-solo-dinner-full',
    'Solo Dinner Grove',
    'Non-vegetarian full meals for dinner, five meals per week. Monthly price uses the average month (52 weeks ÷ 12).',
    5, 292500, 13500, 1450, 1, 'Non-veg full meal · 5 meals per week', true
  ),
  (
    'non-veg-lunch-dinner-mini',
    'Lunch & Dinner',
    'Choose lunch or dinner for each of five non-vegetarian mini meals per week. Monthly price uses the average month (52 weeks ÷ 12).',
    5, 249167, 11500, 720, 1, 'Non-veg mini meal · 5 meals per week', true
  ),
  (
    'non-veg-lunch-dinner-full',
    'Lunch & Dinner',
    'Choose lunch or dinner for each of five non-vegetarian full meals per week. Monthly price uses the average month (52 weeks ÷ 12).',
    5, 292500, 13500, 1450, 1, 'Non-veg full meal · 5 meals per week', true
  )
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  meals_per_week = excluded.meals_per_week,
  price_paise = excluded.price_paise,
  per_meal_price_paise = excluded.per_meal_price_paise,
  calories_per_day = excluded.calories_per_day,
  serves = excluded.serves,
  perks = excluded.perks,
  is_active = excluded.is_active;
