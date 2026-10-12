import { Toggle } from '@/components/ui/toggle';
import { LIBELLE_TAILLE } from '@/domain/format';
import type { Taille } from '@/domain/score';
import { ORDRE_TAILLES } from '@/domain/url';

// D11 : pastilles cumulables, dans l'ordre de l'adresse (R7) ; aucune cochée = « Peu importe ».
const HABITANTS: Record<Taille, string> = {
  'petite-commune': 'moins de 10 000 hab.',
  'petite-ville': '10 000 – 50 000 hab.',
  'ville-moyenne': '50 000 – 200 000 hab.',
  'grande-ville': 'plus de 200 000 hab.',
};

type Props = { tailles: Taille[]; onChange: (t: Taille[]) => void; disabled?: boolean };

export function SizeChips({ tailles, onChange, disabled = false }: Props) {
  const basculer = (id: Taille, on: boolean) => onChange(ORDRE_TAILLES.filter((t) => (t === id ? on : tailles.includes(t))));
  return (
    <div className="flex flex-col gap-2">
      <h2 id="titre-taille" className="text-categorie uppercase text-muted-foreground">
        Taille de ville
      </h2>
      <div role="group" aria-labelledby="titre-taille" className="flex flex-wrap gap-2">
        {ORDRE_TAILLES.map((t) => (
          <Toggle key={t} pressed={tailles.includes(t)} onPressedChange={(on) => basculer(t, on)} disabled={disabled}>
            <span>{LIBELLE_TAILLE[t]}</span>
            <span className="text-mentions">{HABITANTS[t]}</span>
          </Toggle>
        ))}
      </div>
      <p className="text-secondaire text-muted-foreground">Aucune cochée : peu importe</p>
    </div>
  );
}
