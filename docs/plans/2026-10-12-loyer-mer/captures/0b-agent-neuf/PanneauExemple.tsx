import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/cn";

const TAILLES = [
  { id: "petite", nom: "Petite ville", plage: "10 000 – 50 000 hab." },
  { id: "moyenne", nom: "Ville moyenne", plage: "50 000 – 200 000 hab." },
] as const;

// Paliers de score (R3) : [0,20) … [80,100]
const PALIERS = [
  { classe: "bg-score-1", plage: "0 à 20" },
  { classe: "bg-score-2", plage: "20 à 40" },
  { classe: "bg-score-3", plage: "40 à 60" },
  { classe: "bg-score-4", plage: "60 à 80" },
  { classe: "bg-score-5", plage: "80 à 100" },
] as const;

export function PanneauExemple() {
  const [loyer, setLoyer] = useState([51]);
  const [tailles, setTailles] = useState<Record<string, boolean>>({
    petite: true,
    moyenne: false,
  });

  return (
    <aside
      aria-label="Réglages"
      className="w-reglages flex flex-col gap-3 rounded-panel border border-border bg-card p-4 text-card-foreground shadow-panneau"
    >
      <p className="text-marque font-serif text-foreground">Carte où vivre</p>

      {/* Loyer */}
      <section aria-labelledby="titre-loyer" className="flex flex-col gap-2">
        <h2 id="titre-loyer" className="text-categorie uppercase text-muted-foreground">
          Loyer
        </h2>
        <div className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-2">
            <span id="libelle-loyer" className="text-texte text-foreground">
              Loyer maximum
            </span>
            <span className="text-valeur tabular-nums text-foreground">1 200 €</span>
          </div>
          <Slider
            aria-labelledby="libelle-loyer"
            aria-valuetext="1 200 € par mois pour 52 m²"
            value={loyer}
            onValueChange={setLoyer}
            min={0}
            max={100}
            step={1}
          />
          <span className="text-secondaire text-muted-foreground">par mois pour 52 m²</span>
        </div>
      </section>

      {/* Taille de ville */}
      <section aria-labelledby="titre-taille" className="flex flex-col gap-2">
        <h2 id="titre-taille" className="text-categorie uppercase text-muted-foreground">
          Taille de ville
        </h2>
        <div className="flex flex-col gap-2">
          {TAILLES.map((t) => (
            <Toggle
              key={t.id}
              pressed={tailles[t.id]}
              onPressedChange={(p: boolean) => setTailles((s) => ({ ...s, [t.id]: p }))}
              className="min-h-pastille flex flex-col items-start rounded-chip px-3 py-1"
            >
              <span className="text-pastille">{t.nom}</span>
              <span
                className={cn(
                  "text-secondaire tabular-nums",
                  tailles[t.id] ? "text-primary-foreground" : "text-muted-foreground",
                )}
              >
                {t.plage}
              </span>
            </Toggle>
          ))}
        </div>
      </section>

      {/* Compte */}
      <p className="text-texte text-foreground" aria-live="polite">
        <span className="text-texte-fort tabular-nums">269</span> communes passent tes critères
      </p>

      {/* Légende */}
      <div className="flex flex-col gap-1">
        <ul className="flex gap-1" aria-label="Légende des scores">
          {PALIERS.map((p) => (
            <li key={p.classe} className={cn("h-3 w-8 rounded-base", p.classe)}>
              <span className="sr-only">Score de {p.plage}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col items-start gap-2">
        <Button variant="principal">Réessayer</Button>
        <Button variant="lien">← Les 10 premières</Button>
      </div>
    </aside>
  );
}
