// ============================================================
// CaféQ — Gemini AI Combo Suggestions
// ============================================================
import { MENU_ITEMS, COMBOS } from './menu-data.js';

// ── Context generation based on time/day ──
function getContext() {
  const hour = new Date().getHours();
  const day  = new Date().toLocaleDateString('en-IN', { weekday: 'long' });
  const month = new Date().getMonth(); // 0-indexed

  let timeOfDay = hour < 11 ? 'morning'
    : hour < 14 ? 'lunch break'
    : hour < 17 ? 'afternoon'
    : 'evening';

  let weather = (month >= 3 && month <= 6) ? 'hot summer'
    : (month >= 6 && month <= 8) ? 'rainy monsoon'
    : 'pleasant winter';

  let dayContext = ['Saturday','Sunday'].includes(day) ? 'weekend (no classes)'
    : day === 'Monday' ? 'Monday (start of the week, need energy)'
    : 'regular college day';

  return { timeOfDay, weather, dayContext, hour };
}

// ── Fallback suggestions (no API key needed) ──
function getFallbackSuggestions() {
  const { hour, weather } = getContext();
  const suggestions = [];

  if (weather === 'hot summer' || hour > 12) {
    suggestions.push({
      combo: 'Iced Latte + Samosa',
      reason: 'Perfect summer combo — cool down with an Iced Latte while snacking on crispy Samosa',
      icon: 'ac_unit',
      tag: 'Summer Vibes',
      price: 90,
    });
  }

  if (hour >= 8 && hour < 12) {
    suggestions.push({
      combo: 'Cappuccino + Bread Pakora',
      reason: 'Morning energy: rich Cappuccino with hot Bread Pakora to kickstart your day',
      icon: 'wb_sunny',
      tag: 'Morning Starter',
      price: 85,
    });
  }

  if (hour >= 14 && hour < 18) {
    suggestions.push({
      combo: 'Cold Coffee + Cheese Maggi',
      reason: 'Post-lunch slump? Cold Coffee + Cheese Maggi is the perfect pick-me-up',
      icon: 'ramen_dining',
      tag: 'Afternoon Rescue',
      price: 120,
    });
  }

  // Exam/study mode suggestions (always show)
  suggestions.push({
    combo: 'Black Coffee + Masala Maggi',
    reason: 'The Exam Warrior special — strong coffee to keep you awake, hot Maggi to keep you going',
    icon: 'bolt',
    tag: 'Exam Mode',
    price: 75,
  });

  return suggestions.slice(0, 2);
}

// ── Gemini API suggestions ──
async function getGeminiSuggestions(apiKey) {
  const ctx = getContext();
  const menuList = MENU_ITEMS.map(i => `${i.name} (₹${i.price})`).join(', ');

  const prompt = `You are the AI barista for Nescafé SRM Kiosk, a college coffee kiosk in India.
Context:
- Time: ${ctx.timeOfDay} (${new Date().toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit'})})
- Weather vibe: ${ctx.weather}
- Day: ${ctx.dayContext}
- Menu: ${menuList}

Suggest exactly 2 smart combo combinations from the menu above that would be perfect for this moment.
Respond ONLY with a JSON array, no markdown, no code blocks:
[
  {
    "combo": "<Item 1> + <Item 2>",
    "reason": "<1 engaging sentence in casual Indian English explaining why this combo is perfect right now>",
    "icon": "<material_symbol_name>",
    "tag": "<3 word catchy tag>",
    "price": <combined price as number>
  },
  {...}
]`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 512 }
      })
    }
  );

  if (!res.ok) throw new Error('Gemini API error');
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
  return JSON.parse(text.trim());
}

// ── Main export ──
export async function getAISuggestions(apiKey = null) {
  if (!apiKey) return getFallbackSuggestions();
  try {
    return await getGeminiSuggestions(apiKey);
  } catch (e) {
    console.warn('Gemini fallback:', e.message);
    return getFallbackSuggestions();
  }
}

export { getContext };
