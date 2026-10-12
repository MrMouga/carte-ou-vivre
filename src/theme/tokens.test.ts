import { describe, expect, it } from 'vitest';
import figma from './figma-variables.json';
import { color, radius, shadow, space, text, themeCss } from './tokens';

const vars = Object.fromEntries(
  Object.entries(figma as Record<string, string>)
    .filter(([k]) => k.startsWith('var(--'))
    .map(([k, v]) => [k.slice(6, -1), v]),
);

function parseFont(s: string) {
  const g = (k: string) => s.match(new RegExp(`${k}: ([^,)]+)`))![1].replace(/"/g, '');
  return { family: g('family'), size: +g('size'), weight: +g('weight'), lineHeight: +g('lineHeight'), letterSpacing: +g('letterSpacing') };
}

describe('jetons = variables Figma', () => {
  it('chaque couleur de Figma existe dans tokens.ts avec la même valeur, et inversement', () => {
    const figmaColors = Object.entries(vars).filter(([, v]) => v.startsWith('#'));
    expect(Object.keys(color).sort()).toEqual(figmaColors.map(([k]) => k).sort());
    for (const [k, v] of figmaColors) expect(color[k as keyof typeof color].toLowerCase()).toBe(v);
  });

  it('espacements et rayons de Figma (space-6 et space-8 : contrat, non liés dans Figma)', () => {
    for (const [k, v] of Object.entries(vars).filter(([k]) => /^(space|radius)/.test(k))) {
      const all: Record<string, number> = { ...space, ...radius };
      expect(all[k]).toBe(Number(v));
    }
    expect(space['space-6']).toBe(24);
    expect(space['space-8']).toBe(32);
  });

  it('styles de texte : police, taille, graisse, interligne (au centième) et approche', () => {
    for (const [k, t] of Object.entries(text)) {
      const f = parseFont((figma as Record<string, string>)[k]);
      expect(f.family).toBe(t.family === 'serif' ? 'Source Serif 4' : 'Source Sans 3');
      expect(f.size).toBe(t.size);
      expect(f.weight).toBe(t.weight);
      expect(f.lineHeight).toBeCloseTo(t.lineHeight, 2);
      expect(f.letterSpacing / 100).toBe(t.tracking);
    }
  });

  it('ombres', () => {
    const fig = figma as Record<string, string>;
    for (const [k, s] of Object.entries(shadow)) {
      const m = fig[k].match(/color: #(\w{6})(\w{2}), offset: \((-?\d+), (-?\d+)\), radius: (\d+)/)!;
      expect(`#${m[1]}`).toBe(s.color);
      expect(Math.round(s.alpha * 255)).toBe(parseInt(m[2], 16));
      expect([+m[3], +m[4], +m[5]]).toEqual([s.x, s.y, s.blur]);
    }
  });

  it('le CSS généré ne contient aucune variable qui se référence elle-même', () => {
    const selfRef = [...themeCss().matchAll(/(--[\w-]+):\s*var\((--[\w-]+)\)/g)].filter((m) => m[1] === m[2]);
    expect(selfRef).toEqual([]);
  });
});
