import type { ComponentProps } from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '@/lib/cn';

// shadcn Slider, rethémé (Figma « Curseur ») : rail border, rempli et poignée primary.
export function Slider({ className, ...props }: ComponentProps<typeof SliderPrimitive.Root>) {
  return (
    <SliderPrimitive.Root className={cn('relative flex h-cible w-full touch-none select-none items-center', className)} {...props}>
      <SliderPrimitive.Track className="relative h-rail w-full grow overflow-hidden rounded-full bg-border">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block size-poignee cursor-pointer rounded-full bg-primary ring-2 ring-card" />
    </SliderPrimitive.Root>
  );
}
