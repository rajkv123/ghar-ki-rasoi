alter table subscription_plans
  alter column meals_per_week type numeric(3, 1)
  using meals_per_week::numeric(3, 1);

alter table subscription_plans
  add column per_meal_price_paise integer not null default 0;

update subscription_plans
set
  name = 'Dedicated Non-Veg (Light Meal)',
  description = 'Four-person light meal on alternate days, with chicken curry and egg curry alternating. About 15 family meals per month at ₹130 per meal.',
  meals_per_week = 3.5,
  price_paise = 195000,
  per_meal_price_paise = 13000,
  serves = 4,
  perks = 'Alternate-day chicken curry or egg curry, four-person family serving'
where slug = 'family-grove';

update subscription_plans
set
  name = 'Dedicated Non-Veg (Full Meal)',
  description = '12 full meals per week for one, with five 35–45 g non-veg pieces per meal. About 52 meals per month at ₹170 per meal.',
  meals_per_week = 12,
  price_paise = 884000,
  per_meal_price_paise = 17000,
  serves = 1,
  perks = 'Five 35–45 g non-veg pieces per meal, skip-a-day, calorie card, free delivery under 6 km'
where slug = 'home-table';
