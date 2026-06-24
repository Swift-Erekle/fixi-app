import { C } from './theme';
import { getCategoryByValue } from './categories';

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
  interior: { fg: '#f472b6', gradient: ['#db2777', '#f472b6'] },
  moving: { fg: '#14b8a6', gradient: ['#0f766e', '#14b8a6'] },
  tailor: { fg: '#d946ef', gradient: ['#a21caf', '#d946ef'] },
  photographer: { fg: '#3b82f6', gradient: ['#1d4ed8', '#3b82f6'] },
  trainer: { fg: '#22c55e', gradient: ['#15803d', '#22c55e'] },
  tutor: { fg: '#6366f1', gradient: ['#4338ca', '#6366f1'] },
  translator: { fg: '#0ea5e9', gradient: ['#0369a1', '#0ea5e9'] },
  accountant: { fg: '#f59e0b', gradient: ['#b45309', '#f59e0b'] },
  automechanic: { fg: '#ef4444', gradient: ['#dc2626', '#ef4444'] },
  towtruck: { fg: '#ea580c', gradient: ['#c2410c', '#ea580c'] },
};

const DEFAULT_THEME = {
  fg: C.accent,
  gradient: [C.accent, '#ff8c55'],
};

export function getCategoryTheme(value) {
  const category = getCategoryByValue(value);
  const theme = (category && CATEGORY_THEMES[category.id]) || DEFAULT_THEME;

  return {
    ...theme,
    soft: `${theme.fg}22`,
    border: `${theme.fg}55`,
    shadow: `${theme.fg}66`,
  };
}
