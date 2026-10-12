import type { ComponentProps } from 'react';
import * as TogglePrimitive from '@radix-ui/react-toggle';
import { cn } from '@/lib/cn';

// shadcn Toggle, rethémé (Figma « Pastille ») : aria-pressed ; cochée = primary ; à 390 px, padding vertical space-2 (49 px).
export function Toggle({ className, ...props }: ComponentProps<typeof TogglePrimitive.Root>) {
  return (
    <TogglePrimitive.Root
      className={cn(
        'flex min-h-pastille cursor-pointer flex-col items-start rounded-chip border border-border bg-card px-3 py-1 max-bureau:py-2 text-left text-pastille text-foreground',
        'aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground',
        'disabled:cursor-default disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}
