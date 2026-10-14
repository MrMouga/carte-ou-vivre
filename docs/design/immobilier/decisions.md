# Décisions de design — immobilier
2026-10-14 · /ui · prototypes en code, branche `prototype/immobilier` (variantes `?variant=A|B|C|F`, `src/proto/BlocPrix.tsx`)

## Directions comparées
- **A — Segmenté en tête** (réf. Redfin) : Louer / Acheter en segmenté pleine largeur, Appartement / Maison en pastilles, unité en petit segmenté et surface dans le sous-texte du curseur. Le plus compact.
- **B — Onglets et tuiles** (réf. Realtor.com) : Louer / Acheter en onglets soulignés, Appartement / Maison en tuiles avec icône, ligne unité + surface, curseur en bas. Le plus visuel, le plus haut.
- **C — Phrase** : « Louer un appartement de [52] m² pour [1 200 €] max par mois », chaque mot une pastille qui bascule.

Pari de Vincent après essai : **B**. Relecture à l'aveugle ([review-directions.md](review-directions.md)) : **A** comme base ; contre B, trois Majeurs (plus de catégorie repliable ni de résumé ; tuiles plus fortes que Louer / Acheter ; la plus haute) ; contre C, un Bloquant (le choix non retenu n'est jamais visible, contraire à H56 et H65). Mesure vérifiée par Claude : bascules de A et de B à 34 px, champ surface à 28 px (44 exigés au toucher).

## Retenu : F, fusion sur la base de B (choix de Vincent)
- De **B** : Louer / Acheter en texte souligné ; Appartement / Maison en tuiles avec icône, **compactes** (icône à gauche, 44 px, choix de Vincent) pour que Louer / Acheter reste le choix principal.
- Corrections de la relecture : la catégorie « Logement » repliable, avec son résumé (« Louer · Appartement · 52 m² · 1 200 € », la surface seulement en Total) ; toutes les cibles à 44 px (mesuré : onglets, tuiles, Total / Au m², champ surface).
- De **A** : la ligne Total / Au m² + champ surface **sous** le curseur (gain mesuré : 54 px).
- Petit téléphone (375 × 548) : feuille et AC-1 d'interface-telephone en conflit. Une feuille de 430 px (ligne au-dessus du curseur) ou de 376 px (avec le titre) laisse 118 ou 172 px de carte : la carte s'ouvre sur l'Europe, sans communes peintes (AC-1 protégé cassé, captures `F-548-plancher-376`). Choix de Vincent : **masquer le titre « Où vivre en France » dans la feuille sur téléphone** (lu par les lecteurs d'écran) et une feuille d'au moins **338 px** : curseur en bas à 537 px, France visible et peinte (210 px de carte). Sur 390 × 844, rien ne change (45 % = 380 px suffisent, curseur à 793 px). Spec : D11 d'interface-telephone.
- Retours de Vincent sur F :
  - panneau de réglages en bureau 300 → **340 px** (`taille-reglages`) ;
  - libellés du curseur : **« Loyer mensuel »** et **« Prix d'achat »**, dans les deux unités ; nom lu « Loyer mensuel, loyer maximum » (le nom commence par le libellé visible, WCAG 2.5.3, et garde « Loyer maximum » que cherchent les tests protégés) ;
  - **plus de sous-texte** sous le curseur du prix (« par mois pour 52 m² », « au m², prix médian des ventes »…) ; plus de « prix au m² » ni de libellé « Surface » devant le champ (nom lu « Surface en m² ») ;
  - tuiles Appartement / Maison à 44 px en bureau aussi ;
  - valeur des curseurs (prix, mer, proches) en **16 px** gras : style `valeur-curseur` ; le compte de la feuille garde `valeur` (18) ;
  - catégorie repliée : le **résumé passe sous le titre**, aligné à gauche, chaque morceau insécable (« 5 800 €/m² » jamais coupé) ; pour toutes les catégories ;
  - « à vol d'oiseau » retiré sous le curseur de la mer (la fiche le garde, D8 de loyer-mer) ;
  - légende **inchangée** : pas de ligne « Prix inconnu » (H60 révisée).

Spec révisée en conséquence : D10 d'immobilier (H56, H60, H65, AC-4), D11 d'interface-telephone.

## Écarté
- A : préférée par la relecture, écartée par Vincent après essai ; son segmenté rappelait les onglets « Critères / Les 10 premières » juste au-dessus.
- C : le choix non retenu n'apparaît jamais ; changer d'unité en touchant le montant.
- Les grandes tuiles de B (62 px, icône au-dessus) : plus fortes que Louer / Acheter.
- Agrandir la feuille en gardant le titre : casse AC-1 d'interface-telephone sur petit téléphone.
- La surface utilisable en Au m² (retour 11 de Vincent, retiré par lui) : elle ne change rien en Au m² (R22).
