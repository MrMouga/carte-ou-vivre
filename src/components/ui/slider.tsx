import type { ComponentProps } from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '@/lib/cn';

// shadcn Slider, rethémé (Figma « Curseur ») : rail border, rempli et poignée primary.
// Le rôle `slider` est sur la poignée (Radix) : le nom et le texte de la valeur y sont posés.
export function Slider({
  className,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  'aria-valuetext': ariaValuetext,
  ...props
}: ComponentProps<typeof SliderPrimitive.Root>) {
  return (
    <SliderPrimitive.Root className={cn('relative flex h-cible w-full touch-none select-none items-center data-disabled:opacity-50', className)} {...props}>
      <SliderPrimitive.Track className="relative h-rail w-full grow overflow-hidden rounded-full bg-border">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        aria-valuetext={ariaValuetext}
        className="block size-poignee cursor-pointer rounded-full bg-primary ring-2 ring-card"
      />
    </SliderPrimitive.Root>
  );
}
