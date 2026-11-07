update subscription_plans
set
  description = 'Choose lunch and dinner: 10 vegetarian mini meals per week. Monthly price uses the average month (52 weeks ÷ 12).',
  meals_per_week = 10,
  price_paise = 325000
where slug = 'veg-lunch-dinner-mini';

update subscription_plans
set
  description = 'Choose lunch and dinner: 10 vegetarian full meals per week. Monthly price uses the average month (52 weeks ÷ 12).',
  meals_per_week = 10,
  price_paise = 411667
where slug = 'veg-lunch-dinner-full';

update subscription_plans
set
  description = 'Choose lunch and dinner: 10 non-vegetarian mini meals per week. Monthly price uses the average month (52 weeks ÷ 12).',
  meals_per_week = 10,
  price_paise = 498333
where slug = 'non-veg-lunch-dinner-mini';

update subscription_plans
set
  description = 'Choose lunch and dinner: 10 non-vegetarian full meals per week. Monthly price uses the average month (52 weeks ÷ 12).',
  meals_per_week = 10,
  price_paise = 585000
where slug = 'non-veg-lunch-dinner-full';
