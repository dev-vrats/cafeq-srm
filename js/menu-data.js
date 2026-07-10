// ============================================================
// CaféQ — Menu Data (with images)
// ============================================================

export const MENU_CATEGORIES = [
  { id: 'coffee',    label: 'Coffee',    icon: 'local_cafe' },
  { id: 'cold',      label: 'Cold',      icon: 'ac_unit' },
  { id: 'maggi',     label: 'Maggi',     icon: 'ramen_dining' },
  { id: 'snacks',    label: 'Snacks',    icon: 'lunch_dining' },
  { id: 'beverages', label: 'Beverages', icon: 'emoji_food_beverage' },
];

export const MENU_ITEMS = [
  // ── Coffee ──
  {
    id: 'espresso',
    category: 'coffee',
    name: 'Espresso',
    description: 'Bold double shot, pure intensity',
    price: 40,
    icon: 'local_cafe',
    image: 'img/espresso.jpg',
    isPopular: false,
    isAvailable: true,
  },
  {
    id: 'cappuccino',
    category: 'coffee',
    name: 'Cappuccino',
    description: 'Creamy foam meets rich espresso',
    price: 60,
    icon: 'local_cafe',
    image: 'img/cappuccino.jpg',
    isPopular: true,
    isAvailable: true,
  },
  {
    id: 'latte',
    category: 'coffee',
    name: 'Café Latte',
    description: 'Silky steamed milk with espresso',
    price: 65,
    icon: 'local_cafe',
    image: 'img/latte.jpg',
    isPopular: true,
    isAvailable: true,
  },
  {
    id: 'americano',
    category: 'coffee',
    name: 'Americano',
    description: 'Espresso with hot water, smooth & bold',
    price: 50,
    icon: 'local_cafe',
    image: 'img/americano.jpg',
    isPopular: false,
    isAvailable: true,
  },
  {
    id: 'mocha',
    category: 'coffee',
    name: 'Mocha',
    description: 'Chocolate swirled with espresso',
    price: 70,
    icon: 'local_cafe',
    image: 'img/mocha.jpg',
    isPopular: true,
    isAvailable: true,
  },
  {
    id: 'black_coffee',
    category: 'coffee',
    name: 'Black Coffee',
    description: 'Strong, straight, no-nonsense',
    price: 35,
    icon: 'local_cafe',
    image: 'img/black_coffee.jpg',
    isPopular: false,
    isAvailable: true,
  },

  // ── Cold ──
  {
    id: 'cold_coffee',
    category: 'cold',
    name: 'Cold Coffee',
    description: 'Blended iced coffee, refreshing & sweet',
    price: 70,
    icon: 'ac_unit',
    image: 'img/cold_coffee.jpg',
    isPopular: true,
    isAvailable: true,
  },
  {
    id: 'iced_latte',
    category: 'cold',
    name: 'Iced Latte',
    description: 'Espresso over ice with cold milk',
    price: 75,
    icon: 'ac_unit',
    image: 'img/iced_latte.jpg',
    isPopular: true,
    isAvailable: true,
  },
  {
    id: 'frappe',
    category: 'cold',
    name: 'Frappe',
    description: 'Frothy frozen coffee delight',
    price: 80,
    icon: 'ac_unit',
    image: 'img/frappe.jpg',
    isPopular: false,
    isAvailable: true,
  },
  {
    id: 'cold_mocha',
    category: 'cold',
    name: 'Iced Mocha',
    description: 'Chocolate + espresso over ice',
    price: 85,
    icon: 'ac_unit',
    image: 'img/cold_mocha.jpg',
    isPopular: false,
    isAvailable: true,
  },

  // ── Maggi ──
  {
    id: 'masala_maggi',
    category: 'maggi',
    name: 'Masala Maggi',
    description: 'Classic spicy masala, straight fire',
    price: 40,
    icon: 'ramen_dining',
    image: 'img/masala_maggi.jpg',
    isPopular: true,
    isAvailable: true,
  },
  {
    id: 'cheese_maggi',
    category: 'maggi',
    name: 'Cheese Maggi',
    description: 'Loaded with melted cheese',
    price: 50,
    icon: 'ramen_dining',
    image: 'img/cheese_maggi.jpg',
    isPopular: true,
    isAvailable: true,
  },
  {
    id: 'veggie_maggi',
    category: 'maggi',
    name: 'Veggie Maggi',
    description: 'Fresh veggies, healthy-ish vibes',
    price: 45,
    icon: 'ramen_dining',
    image: 'img/veggie_maggi.jpg',
    isPopular: false,
    isAvailable: true,
  },
  {
    id: 'butter_maggi',
    category: 'maggi',
    name: 'Butter Maggi',
    description: 'Extra butter, extra happiness',
    price: 50,
    icon: 'ramen_dining',
    image: 'img/butter_maggi.jpg',
    isPopular: false,
    isAvailable: true,
  },

  // ── Snacks ──
  {
    id: 'samosa',
    category: 'snacks',
    name: 'Samosa (2 pcs)',
    description: 'Crispy golden potato delight',
    price: 20,
    icon: 'bakery_dining',
    image: 'img/samosa.jpg',
    isPopular: true,
    isAvailable: true,
  },
  {
    id: 'bread_pakora',
    category: 'snacks',
    name: 'Bread Pakora',
    description: 'Stuffed & fried golden bread',
    price: 25,
    icon: 'lunch_dining',
    image: 'img/bread_pakora.jpg',
    isPopular: true,
    isAvailable: true,
  },
  {
    id: 'veg_sandwich',
    category: 'snacks',
    name: 'Veg Sandwich',
    description: 'Fresh veggies in toasted bread',
    price: 35,
    icon: 'lunch_dining',
    image: 'img/veg_sandwich.jpg',
    isPopular: false,
    isAvailable: true,
  },
  {
    id: 'chips',
    category: 'snacks',
    name: 'Chips',
    description: 'Crispy salted potato chips',
    price: 15,
    icon: 'fastfood',
    image: 'img/chips.jpg',
    isPopular: false,
    isAvailable: true,
  },

  // ── Beverages ──
  {
    id: 'masala_chai',
    category: 'beverages',
    name: 'Masala Chai',
    description: 'Spiced Indian milk tea, soul in a cup',
    price: 20,
    icon: 'emoji_food_beverage',
    image: 'img/masala_chai.jpg',
    isPopular: true,
    isAvailable: true,
  },
  {
    id: 'green_tea',
    category: 'beverages',
    name: 'Green Tea',
    description: 'Light, healthy & refreshing',
    price: 25,
    icon: 'emoji_food_beverage',
    image: 'img/green_tea.jpg',
    isPopular: false,
    isAvailable: true,
  },
  {
    id: 'hot_chocolate',
    category: 'beverages',
    name: 'Hot Chocolate',
    description: 'Rich creamy cocoa bliss',
    price: 55,
    icon: 'coffee_maker',
    image: 'img/hot_chocolate.jpg',
    isPopular: false,
    isAvailable: true,
  },
  {
    id: 'water',
    category: 'beverages',
    name: 'Water Bottle',
    description: '500ml chilled mineral water',
    price: 20,
    icon: 'water_drop',
    image: 'img/water.jpg',
    isPopular: false,
    isAvailable: true,
  },
];

// ── Combos ──
export const COMBOS = [
  {
    id: 'combo_1',
    name: 'Morning Kickstart',
    description: 'Espresso + Masala Maggi — the daily college ritual',
    icon: 'bolt',
    items: ['espresso', 'masala_maggi'],
    comboPrice: 70,
    originalPrice: 80,
    tag: 'SAVE ₹10',
  },
  {
    id: 'combo_2',
    name: 'Chill & Crunch',
    description: 'Iced Latte + Samosa — perfect between-class combo',
    icon: 'ac_unit',
    items: ['iced_latte', 'samosa'],
    comboPrice: 85,
    originalPrice: 95,
    tag: 'SAVE ₹10',
  },
  {
    id: 'combo_3',
    name: 'Study Fuel',
    description: 'Cappuccino + Cheese Maggi — late night sessions sorted',
    icon: 'menu_book',
    items: ['cappuccino', 'cheese_maggi'],
    comboPrice: 100,
    originalPrice: 110,
    tag: 'SAVE ₹10',
  },
  {
    id: 'combo_4',
    name: 'Tea & Snack',
    description: 'Masala Chai + Bread Pakora — monsoon vibes',
    icon: 'rainy',
    items: ['masala_chai', 'bread_pakora'],
    comboPrice: 38,
    originalPrice: 45,
    tag: 'SAVE ₹7',
  },
];

// ── Time Slots (generated dynamically around current time) ──
export function generateTimeSlots() {
  const slots = [];
  const now   = new Date();
  const start = new Date(now);
  // Round up to next 10-min mark
  start.setMinutes(Math.ceil(start.getMinutes() / 10) * 10, 0, 0);

  for (let i = 0; i < 12; i++) {
    const slotStart = new Date(start.getTime() + i * 10 * 60 * 1000);
    const slotEnd   = new Date(slotStart.getTime() + 10 * 60 * 1000);
    const fmt = d => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    slots.push({
      id:        `slot_${slotStart.getTime()}`,
      label:     `${fmt(slotStart)} – ${fmt(slotEnd)}`,
      startTime: slotStart.toISOString(),
      endTime:   slotEnd.toISOString(),
    });
  }
  return slots;
}

export const TIME_SLOTS = generateTimeSlots();

// ── Helpers ──
export const getItemById       = id   => MENU_ITEMS.find(i => i.id === id);
export const getItemsByCategory = cat => MENU_ITEMS.filter(i => i.category === cat && i.isAvailable);
