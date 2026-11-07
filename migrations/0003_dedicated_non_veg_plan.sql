update subscription_plans
set
  name = 'Dedicated Non-Veg',
  description = '12 weekly meals for one with five 35–45 g non-veg pieces per meal. Monthly estimate: ₹4,999 base + (52 meals × ₹200 non-veg allocation) = ₹15,399.',
  price_paise = 1539900,
  perks = 'Five 35–45 g non-veg pieces per meal, skip-a-day, calorie card, free delivery under 6 km'
where slug = 'home-table';
