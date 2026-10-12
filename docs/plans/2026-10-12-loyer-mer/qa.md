# QA navigateur — loyer-mer (2026-10-13)

## Résultat : test NON FAIT, navigateur de test inutilisable

`studio-browse` ne démarre pas, ni en mode visible (`BROWSE_HEADED=1`) ni en mode normal. Message : « Executable doesn't exist at ~/Library/Caches/ms-playwright/chromium-1208/chrome-mac-arm64/Google Chrome for Testing.app/... ». L'outil attend la version 1208 de Chromium. Le Mac a seulement les versions 1228 et 1243 (et leurs variantes « headless shell »).

Essayé : `studio-browse goto http://localhost:5173` en mode normal, puis avec `BROWSE_HEADED=1`, puis avec `PLAYWRIGHT_BROWSERS_PATH` pointant sur le dossier des navigateurs. Même échec trois fois.

Le message propose `npx playwright install` (installer un navigateur sur la machine). Je ne l'ai pas lancé : une installation sur la machine demande l'accord de Vincent (règle globale), et ma consigne limite Bash aux commandes `studio-browse`.

## Findings
Aucun : je n'ai vu aucun écran. Aucune capture n'a été prise (le dossier captures/qa/ est vide).

## Ce qui est conforme
Rien de vérifié par moi.

## Non vérifié (tout)
Tous les états (chargement, erreur et « Réessayer », sans WebGL, fond indisponible, sans plafond, aucune commune, fiche qui passe / ne passe pas, groupes de ronds de rang), les deux largeurs (1440 et 390 × 844), la comparaison aux frames Figma, le passage clavier, la vérification de bout en bout, la console, les noms longs. Les 51 tests Playwright du build restent la seule preuve existante, mais ils ne remplacent pas ce passage.

## Pour débloquer (choix de Vincent)
1. Autoriser `npx playwright install` pour la version 1208 (téléchargement d'environ 150 Mo, local, gratuit), ou
2. Mettre à jour `studio-browse` (gstack dans `~/tools/gstack`) pour qu'il utilise les Chromium 1228 / 1243 déjà installés.
Puis relancer ce passage.
