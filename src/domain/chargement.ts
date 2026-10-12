// Budgets du chargement (H9) : l'indicateur apparaît après 300 ms et reste au moins 300 ms ;
// au bout de 15 s sans données, la page passe en erreur.
export const DELAI_INDICATEUR_MS = 300;
export const DUREE_MIN_INDICATEUR_MS = 300;
export const DELAI_DONNEES_MS = 15_000;

/** Pilote l'indicateur : `debut()` à l'ouverture (ou « Réessayer »), `fin()` quand la carte est là ou en erreur. */
export function indicateur(onChange: (visible: boolean) => void) {
  let montreA: number | null = null;
  let minuterie: ReturnType<typeof setTimeout> | undefined;
  return {
    debut() {
      clearTimeout(minuterie);
      if (montreA != null) return; // déjà montré : il reste
      minuterie = setTimeout(() => {
        montreA = Date.now();
        onChange(true);
      }, DELAI_INDICATEUR_MS);
    },
    fin() {
      clearTimeout(minuterie);
      if (montreA == null) return;
      const reste = montreA + DUREE_MIN_INDICATEUR_MS - Date.now();
      minuterie = setTimeout(() => {
        montreA = null;
        onChange(false);
      }, Math.max(0, reste));
    },
    arreter() {
      clearTimeout(minuterie);
    },
  };
}

/** La promesse, ou un échec si elle n'a pas répondu après `ms`. */
export function avecDelai<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`délai de ${ms} ms dépassé`)), ms);
    p.then(
      (v) => (clearTimeout(t), resolve(v)),
      (e) => (clearTimeout(t), reject(e)),
    );
  });
}
