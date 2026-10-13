import { Toggle } from '@/components/ui/toggle';
import { LIBELLE_TAILLE } from '@/domain/format';
import type { Taille } from '@/domain/score';
import { ORDRE_TAILLES } from '@/domain/url';
import { Categorie } from './Categorie';

// D11 : pastilles cumulables, dans l'ordre de l'adresse (R7) ; aucune cochée = « Peu importe ».
const HABITANTS: Record<Taille, string> = {
  'petite-commune': 'moins de 10 000 hab.',
  'petite-ville': '10 000 – 50 000 hab.',
  'ville-moyenne': '50 000 – 200 000 hab.',
  'grande-ville': 'plus de 200 000 hab.',
};

type Props = { tailles: Taille[]; onChange: (t: Taille[]) => void; disabled?: boolean };

export function SizeChips({ tailles, onChange, disabled = false }: Props) {
  // Résumé de la catégorie repliée : « Peu importe », ou les tailles cochées dans l'ordre de l'adresse.
  const resume = tailles.length === 0 ? 'Peu importe' : ORDRE_TAILLES.filter((t) => tailles.includes(t)).map((t) => LIBELLE_TAILLE[t]).join(', ');
  const basculer = (id: Taille, on: boolean) => onChange(ORDRE_TAILLES.filter((t) => (t === id ? on : tailles.includes(t))));
  return (
    <Categorie titre="Taille de ville" resume={resume} idTitre="titre-taille">
      <div role="group" aria-labelledby="titre-taille" className="flex flex-wrap gap-2">
        {ORDRE_TAILLES.map((t) => (
          <Toggle key={t} pressed={tailles.includes(t)} onPressedChange={(on) => basculer(t, on)} disabled={disabled}>
            <span>{LIBELLE_TAILLE[t]}</span>
            <span className="text-mentions">{HABITANTS[t]}</span>
          </Toggle>
        ))}
      </div>
      <p className="text-secondaire text-muted-foreground">Aucune cochée : peu importe</p>
    </Categorie>
  );
}
