// Jetons du système de design — source unique pour le CSS (variables du thème shadcn) et le style MapLibre.
// Mêmes noms et valeurs que les variables Figma (src/theme/figma-variables.json) ; contrat : docs/design/system/README.md.
// Toute valeur visuelle de l'interface vient d'ici (contrôle : scripts/check-tokens.mjs).

export const color = {
  background: '#F7F4EE',
  foreground: '#1F2A2A',
  'muted-foreground': '#5B6664',
  card: '#FFFFFF',
  'card-foreground': '#1F2A2A',
  border: '#DDD8CF',
  primary: '#1F2A2A',
  'primary-foreground': '#FFFFFF',
  ring: '#1F2A2A',
  'score-1': '#76B8A9',
  'score-2': '#4C9D8D',
  'score-3': '#2C8072',
  'score-4': '#176258',
  'score-5': '#0A433D',
  'area-unranked': '#D8C08A',
  'area-excluded': '#E0DBD2',
  'map-sea': '#BFD6E4',
  'map-river': '#8DB3CA',
  'map-neighbour': '#EFECE6',
  'map-border': '#8E9896',
  'place-marker': '#B4532A', // repère d'un proche, ligne et pastille de proche (primitive Figma terre-cuite/600)
  'place-marker-foreground': '#FFFFFF',
} as const;

/** Espacements, en px. */
export const space = {
  'space-1': 4,
  'space-2': 8,
  'space-3': 12,
  'space-4': 16,
  'space-6': 24,
  'space-8': 32,
} as const;

/** Rayons, en px. */
export const radius = {
  radius: 8,
  'radius-chip': 10,
  'radius-panel': 12,
  'radius-sheet': 16,
  'radius-echantillon': 3,
  'radius-pastille-score': 2,
} as const;

/**
 * Tailles de composants, en px. Ajoutées par /build (tâche 0b) : le contrat les cite comme règles
 * (zoom 32 × 32, cibles 24 et 44, pastille ≥ 28, focus 2 px décalé de 2 px) ou Figma les dessine sans variable (poignée 18, piste 24, rail 4).
 */
export const size = {
  'taille-cible': 24,
  'taille-toucher': 44,
  'taille-bouton-icone': 32,
  'taille-pastille': 28,
  'taille-poignee': 18,
  'taille-rail': 4,
  'taille-reglages': 340,
  'taille-liste': 320,
  'taille-echantillon': 14,
  'taille-ecart-echantillon': 2,
  'taille-rang': 22,
  'taille-pastille-score': 10,
  'taille-rond': 22,
  'taille-rond-choisi': 26,
  'trait-focus': 2,
  'ecart-focus': 2,
  'taille-poignee-feuille': 40, // poignée de la feuille mobile, 40 × 4 (Figma 7:363)
  'taille-goutte': 26, // repère d'un proche : goutte 26 × 34 (Figma « Repère proche » 18:144), tranche proches
  'taille-goutte-haut': 34,
  'taille-bande-carte': 40, // 390 px : bande de carte au-dessus de la feuille montée pendant l'ajout d'un proche (Figma 27:1160), tranche proches
  // 390 px : taille du texte des champs de saisie. Sous 16 px, Safari sur iPhone agrandit la page quand un champ prend le
  // focus ; le style `texte` (15) reste le reste du temps. Classe : `max-bureau:text-(length:--taille-saisie)`.
  'taille-saisie': 16,
  // Sous 1 024 px : hauteur minimale de la feuille ouverte (D9 et H48 d'interface-telephone), pour que le curseur du prix
  // reste visible à 375 × 548. 272 → 338 (D11 d'interface-telephone, /ui immobilier : le réglage du prix est plus haut ; le
  // titre est masqué sous 1 024 px et la France reste peinte au-dessus). Classes : `h-feuille`, `max-h-feuille`, `bottom-feuille`.
  'taille-feuille-min': 338,
  // Sous 1 024 px : barre de la feuille repliée, poignée et compte (Figma « Tête de feuille », état Repliée ≈ 51 px ; H48 :
  // au plus 64 px), à quoi s'ajoute la marge du geste d'accueil de l'iPhone. Classe : `h-barre-feuille`.
  'taille-barre-feuille': 51,
} as const;

/**
 * Mise en page (tâche 6 de loyer-mer) : en dessous de `largeur-bureau`, la page passe en feuille mobile ; la feuille ouverte
 * couvre `part-feuille` de la hauteur, jamais moins de `taille-feuille-min` (D9 d'interface-telephone : 45 %, au moins
 * 338 px depuis D11 ; 56 % et 272 px avant). Classes : `bureau:`, `max-bureau:`, `h-feuille`.
 */
export const layout = {
  'largeur-bureau': 1024,
  'part-feuille': 0.45,
} as const;

/**
 * Feuille mobile repliable (interface-telephone, H45, H46) : passage d'une position à l'autre en `duree-feuille-ms` (aucun si
 * l'on réduit les animations) ; un geste de moins de `seuil-toucher` px est un toucher ; au-delà de `seuil-change` px, la
 * feuille change de position au lâcher. `avaler-clic-ms` : délai pendant lequel le clic qui suit un toucher est avalé.
 */
export const geste = {
  'duree-feuille-ms': 300,
  'seuil-toucher': 10,
  'seuil-change': 80,
  'avaler-clic-ms': 400,
} as const;

export const shadow = {
  'ombre-panneau': { x: 0, y: 2, blur: 10, color: color.foreground, alpha: 0.08 },
  'ombre-feuille': { x: 0, y: -2, blur: 12, color: color.foreground, alpha: 0.12 },
} as const;

export const fontFamily = {
  sans: "'Source Sans 3', system-ui, sans-serif",
  serif: "'Source Serif 4', Georgia, serif",
} as const;

type TextStyle = { family: keyof typeof fontFamily; size: number; weight: 400 | 600 | 700; lineHeight: number; tracking: number; caps?: true };

/** Styles de texte (tracking en em ; Figma : letterSpacing en %). */
export const text: Record<string, TextStyle> = {
  marque: { family: 'serif', size: 20, weight: 600, lineHeight: 1.3, tracking: 0 },
  'titre-fiche': { family: 'serif', size: 22, weight: 600, lineHeight: 1.25, tracking: 0 },
  categorie: { family: 'sans', size: 12, weight: 700, lineHeight: 1.3, tracking: 0.06, caps: true },
  texte: { family: 'sans', size: 15, weight: 400, lineHeight: 1.4, tracking: 0 },
  'texte-fort': { family: 'sans', size: 15, weight: 600, lineHeight: 1.4, tracking: 0 },
  valeur: { family: 'sans', size: 18, weight: 700, lineHeight: 1.25, tracking: 0 },
  // Valeur d'un curseur (prix, mer, proches), /ui immobilier : 16 au lieu de 18 ; `valeur` reste pour le compte et le zoom.
  'valeur-curseur': { family: 'sans', size: 16, weight: 700, lineHeight: 1.25, tracking: 0 },
  'score-grand': { family: 'sans', size: 30, weight: 700, lineHeight: 1.1, tracking: 0 },
  pastille: { family: 'sans', size: 13, weight: 400, lineHeight: 1.25, tracking: 0 },
  secondaire: { family: 'sans', size: 12, weight: 400, lineHeight: 1.3, tracking: 0 },
  mentions: { family: 'sans', size: 11, weight: 400, lineHeight: 1.35, tracking: 0 },
  rang: { family: 'sans', size: 12, weight: 700, lineHeight: 1, tracking: 0 },
};

/** Carte (H10, D16, D17) : opacités et contour de la commune choisie. */
export const map = {
  'opacite-france': 0.88,
  'opacite-zoom': 0.7,
  'opacite-sans-plafond': 0.7,
  'zoom-france': 7,
  'zoom-ville': 11,
  'opacite-estompage': 0.45,
  'choisie-halo': 4,
  'choisie-trait': 1.8,
  'zoom-commune-max': 12,
  'duree-zoom-ms': 500,
  'trait-cote': 1, // fond de secours : trait de côte et frontières (R8)
  'duree-pulse-ms': 1200, // anneau du repère d'un proche en calcul (Figma « Repère proche » 18:144)
} as const;

function rgba(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/**
 * CSS généré : variables du thème sur :root (noms du contrat), et le thème Tailwind avec les mêmes valeurs
 * (littérales, pour qu'aucun nom ne se référence lui-même). Le thème par défaut de Tailwind est vidé :
 * seules les classes issues de ces jetons existent.
 */
export function themeCss(): string {
  const root: string[] = [];
  const theme: string[] = ['--*: initial;'];
  for (const [k, v] of Object.entries(color)) {
    root.push(`--${k}: ${v};`);
    theme.push(`--color-${k}: ${v};`);
  }
  theme.push('--spacing-0: 0px;'); // inset-0, m-0… : zéro n'est pas une valeur arbitraire
  for (const [k, v] of Object.entries(space)) {
    root.push(`--${k}: ${v}px;`);
    theme.push(`--spacing-${k.replace('space-', '')}: ${v}px;`);
  }
  for (const [k, v] of Object.entries(radius)) {
    root.push(`--${k}: ${v}px;`);
    theme.push(`--radius-${k === 'radius' ? 'base' : k.replace('radius-', '')}: ${v}px;`);
  }
  for (const [k, v] of Object.entries(size)) {
    root.push(`--${k}: ${v}px;`);
    if (k.startsWith('taille-')) theme.push(`--spacing-${k.replace('taille-', '')}: ${v}px;`);
  }
  // Feuille mobile : marge du geste d'accueil (iPhone, avec `viewport-fit=cover`), hauteur visible repliée, durée du passage.
  root.push('--marge-geste: env(safe-area-inset-bottom, 0px);');
  root.push('--hauteur-repliee: calc(var(--taille-barre-feuille) + var(--marge-geste));');
  root.push(`--duree-feuille: ${geste['duree-feuille-ms']}ms;`);
  for (const [k, s] of Object.entries(shadow)) {
    root.push(`--${k}: ${s.x}px ${s.y}px ${s.blur}px ${rgba(s.color, s.alpha)};`);
    theme.push(`--shadow-${k.replace('ombre-', '')}: ${s.x}px ${s.y}px ${s.blur}px ${rgba(s.color, s.alpha)};`);
  }
  theme.push(`--breakpoint-bureau: ${layout['largeur-bureau']}px;`);
  theme.push(`--spacing-feuille: max(${layout['part-feuille'] * 100}dvh, ${size['taille-feuille-min']}px);`);
  for (const [k, v] of Object.entries(fontFamily)) theme.push(`--font-${k}: ${v};`);
  for (const [k, t] of Object.entries(text)) {
    theme.push(`--text-${k}: ${t.size}px;`);
    theme.push(`--text-${k}--line-height: ${t.lineHeight};`);
    theme.push(`--text-${k}--font-weight: ${t.weight};`);
    theme.push(`--text-${k}--letter-spacing: ${t.tracking}em;`);
  }
  return `:root {\n  ${root.join('\n  ')}\n}\n@theme inline {\n  ${theme.join('\n  ')}\n}\n`;
}
