import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';
import { text } from '@/theme/tokens';

// tailwind-merge ne sait pas que `text-pastille` est une taille et `text-foreground` une couleur :
// sans ça, il garde la dernière des deux et perd le style de texte.
const twMerge = extendTailwindMerge({
  extend: { classGroups: { 'font-size': [{ text: Object.keys(text) }] } },
});

// Utilitaire shadcn : assemble des classes et laisse la dernière gagner en cas de conflit.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
