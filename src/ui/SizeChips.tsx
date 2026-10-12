import { Toggle } from '@/components/ui/toggle';
import type { Taille } from '@/domain/score';

// D11 : pastilles cumulables, dans l'ordre de l'adresse (R7) ; aucune cochée = « Peu importe ».
export const TAILLES: { id: Taille; libelle: string; habitants: string }[] = [
  { id: 'petite-commune', libelle: 'Petite commune', habitants: 'moins de 10 000 hab.' },
  { id: 'petite-ville', libelle: 'Petite ville', habitants: '10 000 – 50 000 hab.' },
  { id: 'ville-moyenne', libelle: 'Ville moyenne', habitants: '50 000 – 200 000 hab.' },
  { id: 'grande-ville', libelle: 'Grande ville', habitants: 'plus de 200 000 hab.' },
];

type Props = { tailles: Taille[]; onChange: (t: Taille[]) => void; disabled?: boolean };

export function SizeChips({ tailles, onChange, disabled = false }: Props) {
  const basculer = (id: Taille, on: boolean) => onChange(TAILLES.map((t) => t.id).filter((t) => (t === id ? on : tailles.includes(t))));
  return (
    <div className="flex flex-col gap-2">
      <h2 id="titre-taille" className="text-categorie uppercase text-muted-foreground">
        Taille de ville
      </h2>
      <div role="group" aria-labelledby="titre-taille" className="flex flex-wrap gap-2">
        {TAILLES.map((t) => (
          <Toggle key={t.id} pressed={tailles.includes(t.id)} onPressedChange={(on) => basculer(t.id, on)} disabled={disabled}>
            <span>{t.libelle}</span>
            <span className="text-mentions">{t.habitants}</span>
          </Toggle>
        ))}
      </div>
      <p className="text-secondaire text-muted-foreground">Aucune cochée : peu importe</p>
    </div>
  );
}
