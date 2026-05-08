import { C } from './theme';
import { CATEGORIES } from './categories';

const CATEGORY_THEMES = {
  electrician: { fg: '#a855f7', gradient: ['#8b5cf6', '#a855f7'] },
  plumber: { fg: '#3b82f6', gradient: ['#2563eb', '#3b82f6'] },
  carpenter: { fg: '#8b5cf6', gradient: ['#6d28d9', '#8b5cf6'] },
  painter: { fg: '#ec4899', gradient: ['#db2777', '#ec4899'] },
  builder: { fg: '#f59e0b', gradient: ['#d97706', '#f59e0b'] },
  hvac: { fg: '#10b981', gradient: ['#059669', '#10b981'] },
  handyman: { fg: '#06b6d4', gradient: ['#0891b2', '#06b6d4'] },
  gardener: { fg: '#22c55e', gradient: ['#16a34a', '#22c55e'] },
  technician: { fg: '#6366f1', gradient: ['#4f46e5', '#6366f1'] },
  specialist: { fg: '#eab308', gradient: ['#ca8a04', '#eab308'] },
  household: { fg: '#0ea5e9', gradient: ['#0284c7', '#0ea5e9'] },
  tiler: { fg: '#fb7185', gradient: ['#e11d48', '#fb7185'] },
  welder: { fg: '#ef4444', gradient: ['#dc2626', '#ef4444'] },
  locksmith: { fg: '#a855f7', gradient: ['#9333ea', '#a855f7'] },
};

const DEFAULT_THEME = {
  fg: C.accent,
  gradient: [C.accent, '#ff8c55'],
};

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function matchesCategoryText(categoryText, value) {
  const category = normalize(categoryText);
  const query = normalize(value);
  return Boolean(category && query && (category === query || category.includes(query) || query.includes(category)));
}

export function getCategoryTheme(value) {
  const category = CATEGORIES.find((item) =>
    matchesCategoryText(item.name, value) ||
    item.subs?.some((sub) => matchesCategoryText(sub, value))
  );
  const theme = (category && CATEGORY_THEMES[category.id]) || DEFAULT_THEME;

  return {
    ...theme,
    soft: `${theme.fg}22`,
    border: `${theme.fg}55`,
    shadow: `${theme.fg}66`,
  };
}
