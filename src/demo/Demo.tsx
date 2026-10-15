import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Toggle } from '@/components/ui/toggle';

// Page de démonstration des composants (tâche 0b), servie en dev seulement (/demo.html), comparée à la planche Figma 9:636.
function Curseur({ libelle, valeur, sousTexte, value }: { libelle: string; valeur: string; sousTexte?: string; value: number }) {
  const [v, setV] = useState(value);
  return (
    <div className="flex w-full flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <label className="text-texte">{libelle}</label>
        <span className="text-valeur tabular-nums">{valeur}</span>
      </div>
      <Slider min={0} max={100} step={1} value={[v]} onValueChange={([n]) => setV(n)} aria-label={libelle} />
      {sousTexte && <p className="text-secondaire text-muted-foreground">{sousTexte}</p>}
    </div>
  );
}

// Pastille : libellé en chiffres, comme les tailles de la catégorie « Cadre de vie » (R27 de cadre-de-vie).
function Pastille({ libelle, cochee }: { libelle: string; cochee?: boolean }) {
  const [on, setOn] = useState(!!cochee);
  return (
    <Toggle pressed={on} onPressedChange={setOn}>
      {libelle}
    </Toggle>
  );
}

export function Demo() {
  return (
    <main className="flex flex-wrap items-start gap-8 p-8">
      <section className="flex flex-col items-start gap-3 rounded-panel border border-border bg-card p-4">
        <h2 className="text-categorie uppercase">Bouton</h2>
        <Button>Réessayer</Button>
        <div className="flex gap-1">
          <Button variant="icone" aria-label="Zoomer">+</Button>
          <Button variant="icone" aria-label="Dézoomer">−</Button>
        </div>
        <Button variant="lien">← Les 10 premières</Button>
      </section>
      <section className="flex w-reglages flex-col gap-3 rounded-panel border border-border bg-card p-4">
        <h2 className="text-categorie uppercase">Curseur</h2>
        <Curseur libelle="Loyer maximum" valeur="1 200 €" sousTexte="par mois pour 52 m²" value={51} />
        <Curseur libelle="Loyer maximum" valeur="1 200 €" sousTexte="par mois pour 52 m²" value={27} />
        <Curseur libelle="Loyer maximum" valeur="Sans limite" value={100} />
      </section>
      <section className="flex flex-col items-start gap-3 rounded-panel border border-border bg-card p-4">
        <h2 className="text-categorie uppercase">Pastille</h2>
        <Pastille libelle="10 000 – 50 000 hab." />
        <Pastille libelle="10 000 – 50 000 hab." cochee />
      </section>
      <section className="flex w-liste flex-col gap-1 rounded-panel border border-border bg-card p-4 shadow-panneau">
        <p className="font-serif text-marque">Où vivre en France</p>
        <p className="font-serif text-titre-fiche">Douarnenez (29)</p>
        <p className="text-texte tabular-nums">601 € par mois pour 52 m² (11,6 €/m²)</p>
        <p className="text-texte-fort">269 communes passent tes critères</p>
        <p className="text-score-grand tabular-nums">74</p>
        <p className="text-mentions text-muted-foreground">Source : Insee, populations légales</p>
      </section>
    </main>
  );
}
