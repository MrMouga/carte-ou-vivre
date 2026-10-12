import type { ComponentProps } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

// shadcn Button, rethémé (Figma « Bouton » : Principal · Icône · Lien). Focus : outline global (index.css).
const buttonVariants = cva('inline-flex items-center justify-center cursor-pointer disabled:cursor-default disabled:opacity-50', {
  variants: {
    variant: {
      principal: 'rounded-base bg-primary px-4 py-2 text-texte-fort text-primary-foreground',
      icone: 'size-bouton-icone rounded-base border border-border bg-card text-valeur text-foreground',
      lien: 'min-h-cible rounded-base px-1 text-pastille text-muted-foreground hover:text-foreground hover:underline',
    },
  },
  defaultVariants: { variant: 'principal' },
});

export function Button({ className, variant, type = 'button', ...props }: ComponentProps<'button'> & VariantProps<typeof buttonVariants>) {
  return <button type={type} className={cn(buttonVariants({ variant }), className)} {...props} />;
}
