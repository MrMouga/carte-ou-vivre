# Mesure de la tâche 0 — l'IGN tel qu'il est (proches-fiables)
Mesuré le 2026-10-16 entre 01:45 et 01:59 (heure de Paris), depuis le Mac de Vincent (Node 22, `fetch` natif : **aucun cache**, chaque zone est un vrai calcul de l'IGN). Requêtes construites comme `urlIsochrone` de `src/proches/ign.ts` (bdtopo-valhalla, voiture, départ), les 12 zones la plus longue d'abord, une toutes les 250 ms comptées depuis le départ réel de la précédente ; une zone en erreur (réponse non 200 reçue avant 45 s) redemandée une fois, en passant par la même file ; chaque requête laissée aller jusqu'au bout (l'IGN coupe à 60 s) pour voir ce qui arrive après 45 s. Script jetable : `scratchpad/t0/mesure.mjs` (hors dépôt).

## Réponse courte
**Cette nuit, aucun des 9 proches mesurés n'aurait été prêt.** Avec le plafond de 2 h à l'ajout : **7 partiels, 2 en km** (Lyon à 01:47, Toulouse à 01:56 : couverture 1 h 45). Le second essai a ajouté 1 ou 2 zones à 3 proches sur 9 mais n'a changé l'état d'aucun. Le risque de la spec est donc réel à cette heure : un IGN lent met presque tous les proches en approximatif, et parfois en km. Une seule heure de mesure (trois séries à la suite, 01:45, 01:48, 01:55), **pas de seconde série une heure plus tard** : la session ne l'a pas permis ; à refaire en journée si on veut la fréquence en journée.

**Deux découvertes qui touchent le plan** :
1. **Le navigateur garde les erreurs de l'IGN 21 jours.** Les réponses 500, 502 et 504 de l'IGN portent `cache-control: private, max-age=1814400` (21 jours), comme les réponses réussies. Vérifié dans Chromium (Playwright, serveur local qui imite ces en-têtes) : une seconde demande de la même zone rend la **même erreur sans rien demander à l'IGN**. Le second essai de R33 et le recalcul de R36 seraient donc inutiles avec un `fetch` ordinaire. `fetch(url, { cache: 'reload' })` ou `{ cache: 'no-store' }` repart bien vers le serveur (2 requêtes reçues sur 2). Safari (WebKit) : non vérifié, navigateur de test non installé.
2. **Une 504 arrive à 60 s, donc toujours après les 45 s** : elle ne peut jamais être redemandée, c'est en pratique une zone « sans réponse ». Seules les 502 et 500 (qui arrivent de 3,9 s à 57 s) peuvent l'être ; 7 erreurs sur 42 sont arrivées avant 45 s.

## Les 9 proches, état selon R33 (plafond 2 h)
| Série (heure de début) | Départ | Zones obtenues à 45 s, sans / avec second essai | Couverture | Zones manquantes (avec second essai) | État sans / avec second essai | Dernière réponse |
|---|---|---|---|---|---|---|
| 1 (01:45:24) | 12 rue de la Paix, Nantes | 5 / 7 | 2 h 15 | 1 h 45, 2 h, 2 h 30, 2 h 45, 3 h | partiel / partiel | 62,1 s |
| 1 (01:46:26) | place du Capitole, Toulouse | 11 / 11 | 3 h | 1 h 45 | partiel / partiel | 61,3 s |
| 1 (01:47:27) | place Bellecour, Lyon | 5 / 5 | 1 h 45 | 1 h 15, 1 h 30, 2 h, 2 h 15, 2 h 30, 2 h 45, 3 h | **km / km** | 61,7 s |
| 2 (01:48:45) | Nantes | 8 / 8 | 2 h 45 | 1 h 30, 1 h 45, 2 h 15, 3 h | partiel / partiel | 60,1 s |
| 2 (01:49:46) | Toulouse | 11 / 11 | 3 h | 2 h 15 | partiel / partiel | 60,9 s |
| 2 (01:50:47) | Lyon | 6 / 6 | 2 h 15 | 1 h 15, 1 h 30, 2 h, 2 h 30, 2 h 45, 3 h | partiel / partiel | 61,8 s |
| 3 (01:54:58) | Nantes | 6 / 7 | 2 h | 1 h 30, 2 h 15, 2 h 30, 2 h 45, 3 h | partiel / partiel (couverture = plafond) | 61,7 s |
| 3 (01:56:00) | Toulouse | 6 / 6 | 1 h 45 | 1 h 30, 2 h, 2 h 15, 2 h 30, 2 h 45, 3 h | **km / km** | 73,4 s |
| 3 (01:57:13) | Lyon | 7 / 8 | 2 h 15 | 2 h, 2 h 30, 2 h 45, 3 h | partiel / partiel | 66,2 s |

Points d'adresse rendus par la recherche IGN : Nantes `12 Rue de la Paix 44000 Nantes` (44109) [-1.554555, 47.215051] ; Toulouse `Place du Capitole 31000 Toulouse` (31555) [1.443054, 43.604354] ; Lyon `Place Bellecour 69002 Lyon` (69382, ramené à 69123 par le site) [4.831662, 45.757597].

Zones obtenues avant 45 s, sur 9 proches (second essai compris) :

| Zone | 15 min | 30 | 45 | 1 h | 1 h 15 | 1 h 30 | 1 h 45 | 2 h | 2 h 15 | 2 h 30 | 2 h 45 | 3 h |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Obtenue | 9 | 9 | 9 | 9 | 7 | 4 | 6 | 4 | 4 | 3 | 3 | 2 |

Ce que ça dit :
- Les petites zones (jusqu'à 1 h) arrivent toujours ; au-delà, c'est une loterie, et pas dans l'ordre des durées (il manque une zone **sous** la couverture chez les 9 proches sur 9 : le cas « jusqu'à » de R34 sera la règle, pas l'exception).
- Premiers essais : 108 requêtes, 66 réponses 200, 32 réponses 504, 9 réponses 502, 1 réponse 500 ; durée d'une zone réussie de 0,4 s à 49,2 s (médiane 11 s). Seconds essais : 7, dont 4 réussis avant 45 s.
- La même zone, quand elle réussit, rend exactement le même fichier d'une série à l'autre (même nombre d'octets) : aucun signe d'un cache côté IGN, la durée varie (Toulouse 3 h : 13,7 s, 10,4 s, puis 504).
- **Seule, une grande zone échoue aussi** (01:52 à 01:55, une requête à la fois, rien d'autre en cours) : Nantes 3 h → 502 en 45,0 s ; Nantes 2 h → 504 en 60,3 s ; Lyon 3 h → 504 en 60,4 s ; Lyon 2 h → 200 en 3,8 s. La lenteur vient de l'IGN cette nuit, pas des 12 demandes à la fois.
- Aucun refus 429 sur 120 demandes de zones et 9 recherches d'adresse, à 4 par seconde au plus. L'en-tête `x-ratelimit-limit-second: 1` est présent sur chaque réponse, avec `ratelimit-limit: 5` ; la règle des 5 par seconde (leçon du 2026-10-13) tient.
- Comparaison : le 2026-10-13, Toulouse avait ses zones jusqu'à 3 h en 29,6 s. Cette nuit, l'IGN est bien plus lent que ce jour-là.

## Corps et en-têtes des erreurs réelles (pour le faux IGN des tests)
Toutes en `content-type: application/json; charset=utf-8`, avec `cache-control: private, max-age=1814400` et `access-control-allow-origin: *` :
- **504** (33 fois, toujours vers 60 s) — 51 octets :
  ```
  {
    "message":"The upstream server is timing out"
  }
  ```
- **502** (10 fois, de 3,9 s à 57 s) — 75 octets :
  ```
  {
    "message":"An invalid response was received from the upstream server"
  }
  ```
- **500** (1 fois, en 31,2 s) — 46 octets :
  ```
  {
    "message":"An unexpected error occurred"
  }
  ```
En-têtes complets d'une 502 (curl, 2026-10-15T23:58:31Z, Nantes 3 h, reçue en 4,8 s) :
```
HTTP/2 502
date: Thu, 15 Oct 2026 23:58:36 GMT
content-type: application/json; charset=utf-8
content-length: 75
x-ratelimit-limit-second: 1
ratelimit-limit: 5
www-authenticate: Key realm="kong"
cache-control: private, max-age=1814400
strict-transport-security: max-age=31536000; includeSubDomains
access-control-allow-origin: *
access-control-allow-credentials: true
access-control-allow-methods: GET, PUT, POST, DELETE, PATCH, OPTIONS
access-control-allow-headers: DNT,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,Content-Disposition,Content-Length,X-Community
access-control-max-age: 1728000
x-iplb-request-id: 5CA97B79:E351_91EFC1E7:01BB_6AD168A7_6AA3C445:38C2F7
x-iplb-instance: 61217
```

## Le navigateur et les erreurs gardées (Chromium)
Script `scratchpad/t0/cache502.mjs` puis `cache-modes.mjs` : un serveur local (port 5391) rend 200, 500, 502 ou 504 avec les en-têtes de l'IGN ci-dessus ; une page Chromium (Playwright, profil neuf) demande deux fois chaque adresse. Sorties brutes :
```
statuts vus par la page : {"200":[200,200],"500":[500,500],"502":[502,502],"504":[504,504]}
requêtes reçues par le serveur : {"/":1,"/200":1,"/500":1,"/502":1,"/504":1} (1 par adresse = gardée en cache ; 2 = redemandée)

statuts vus par la page : {"502-default":[502,502],"502-reload":[502,502],"502-no-store":[502,502],"504-default":[504,504],"504-reload":[504,504],"504-no-store":[504,504]}
requêtes reçues par le serveur : {"/":1,"/502?default":1,"/502?reload":2,"/502?no-store":2,"/504?default":1,"/504?reload":2,"/504?no-store":2} (1 par adresse = gardée en cache ; 2 = redemandée)
```
→ avec `fetch` ordinaire (le code d'aujourd'hui), la seconde demande d'une zone en erreur ne part pas : l'erreur gardée revient. Avec `cache: 'reload'` ou `cache: 'no-store'`, elle part. (Avec `reload`, la réponse obtenue remplace celle gardée ; avec `no-store`, le cache n'est ni lu ni écrit.) À noter aussi pour R36 : une erreur gardée lors d'une visite revient à la visite suivante, jusqu'à 21 jours.

## Distance à vol d'oiseau, 12 rue de la Paix (Nantes) → mairie de La Rochelle (H95)
Point de départ : celui rendu par la recherche IGN, [-1.554555, 47.215051]. Mairie de La Rochelle telle que le site la connaît : `public/data/reperes.json`, index 5823 = index du code INSEE `17300` dans `public/data/communes.json` (jointure par code, pas par nom) : [-1.1513, 46.1596]. Sphère de 6 371 km (haversine) : **121,324 km → 121 km**.

## Sorties brutes
### Série 1 (2026-10-16 01:45:23 CEST)
```

== 12 rue de la Paix, Nantes → 12 Rue de la Paix 44000 Nantes (44109) [-1.554555,47.215051] début 2026-10-15T23:45:24.105Z
  180 min essai 1 : départ +0.00 s, 504    durée 60.0 s, fin +60.0 s, 51 o corps="{\n  \"message\":\"The upstream server is timing out\"\n}"
  165 min essai 1 : départ +0.25 s, 504    durée 60.1 s, fin +60.3 s, 51 o corps="{\n  \"message\":\"The upstream server is timing out\"\n}"
  150 min essai 1 : départ +0.51 s, 504    durée 60.1 s, fin +60.6 s, 51 o corps="{\n  \"message\":\"The upstream server is timing out\"\n}"
  135 min essai 1 : départ +0.76 s, 200    durée 37.2 s, fin +37.9 s, 91264 o
  120 min essai 1 : départ +1.01 s, 504    durée 61.1 s, fin +62.1 s, 51 o corps="{\n  \"message\":\"The upstream server is timing out\"\n}"
  105 min essai 1 : départ +1.26 s, 504    durée 60.1 s, fin +61.3 s, 51 o corps="{\n  \"message\":\"The upstream server is timing out\"\n}"
   90 min essai 1 : départ +1.51 s, 200    durée 2.2 s, fin +3.7 s, 47599 o
   75 min essai 1 : départ +1.76 s, 200    durée 12.9 s, fin +14.7 s, 38452 o
   60 min essai 1 : départ +2.02 s, 500    durée 31.2 s, fin +33.3 s, 46 o corps="{\n  \"message\":\"An unexpected error occurred\"\n}"
   45 min essai 1 : départ +2.27 s, 200    durée 5.0 s, fin +7.3 s, 34162 o
   30 min essai 1 : départ +2.52 s, 200    durée 1.7 s, fin +4.2 s, 14411 o
   15 min essai 1 : départ +2.77 s, 502    durée 17.7 s, fin +20.4 s, 75 o corps="{\n  \"message\":\"An invalid response was received from the upstream server\"\n}"
   15 min essai 2 : départ +20.43 s, 200    durée 2.0 s, fin +22.4 s, 3943 o
   60 min essai 2 : départ +33.26 s, 200    durée 9.7 s, fin +43.0 s, 42199 o
  fin de la dernière zone : +62.1 s
  à 45 s, sans second essai : {"obtenues":5,"couverture":135,"manquantes":[15,60,105,120,150,165,180],"etat":"partiel"}
  à 45 s, avec second essai : {"obtenues":7,"couverture":135,"manquantes":[105,120,150,165,180],"etat":"partiel"}
  en-têtes (zone 180) : {"access-control-max-age":"1728000","cache-control":"private, max-age=1814400","date":"Thu, 15 Oct 2026 23:46:24 GMT","x-iplb-instance":"61217","x-iplb-request-id":"5CA97B79:DC34_91EFC1E7:01BB_6AD16594_6A9BFE1B:38C2F7","x-ratelimit-limit-second":"1"}

== place du Capitole, Toulouse → Place du Capitole 31000 Toulouse (31555) [1.443054,43.604354] début 2026-10-15T23:46:26.276Z
  180 min essai 1 : départ +0.00 s, 200    durée 13.7 s, fin +13.7 s, 142889 o
  165 min essai 1 : départ +0.25 s, 200    durée 14.2 s, fin +14.4 s, 136521 o
  150 min essai 1 : départ +0.50 s, 200    durée 13.0 s, fin +13.5 s, 117509 o
  135 min essai 1 : départ +0.75 s, 200    durée 11.0 s, fin +11.8 s, 111782 o
  120 min essai 1 : départ +1.00 s, 200    durée 28.2 s, fin +29.2 s, 93129 o
  105 min essai 1 : départ +1.26 s, 504    durée 60.0 s, fin +61.3 s, 51 o corps="{\n  \"message\":\"The upstream server is timing out\"\n}"
   90 min essai 1 : départ +1.51 s, 200    durée 3.2 s, fin +4.7 s, 50156 o
   75 min essai 1 : départ +1.76 s, 200    durée 20.4 s, fin +22.1 s, 38814 o
   60 min essai 1 : départ +2.01 s, 200    durée 4.2 s, fin +6.2 s, 39147 o
   45 min essai 1 : départ +2.26 s, 200    durée 3.0 s, fin +5.2 s, 39379 o
   30 min essai 1 : départ +2.51 s, 200    durée 17.5 s, fin +20.0 s, 15239 o
   15 min essai 1 : départ +2.77 s, 200    durée 0.7 s, fin +3.4 s, 3316 o
  fin de la dernière zone : +61.3 s
  à 45 s, sans second essai : {"obtenues":11,"couverture":180,"manquantes":[105],"etat":"partiel"}
  à 45 s, avec second essai : {"obtenues":11,"couverture":180,"manquantes":[105],"etat":"partiel"}
  en-têtes (zone 180) : {"access-control-max-age":"1728000","cache-control":"private, max-age=1814400","date":"Thu, 15 Oct 2026 23:46:39 GMT","origin-agent-cluster":"?1","x-content-type-options":"nosniff","x-dns-prefetch-control":"off","x-download-options":"noopen","x-frame-options":"SAMEORIGIN","x-iplb-instance":"61217","x-iplb-request-id":"5CA97B79:DC34_91EFC1E7:01BB_6AD165D2_6A9C93F6:38C2F7","x-permitted-cross-domain-policies":"none","x-ratelimit-limit-second":"1","x-xss-protection":"0"}

== place Bellecour, Lyon → Place Bellecour 69002 Lyon (69382) [4.831662,45.757597] début 2026-10-15T23:47:27.658Z
  180 min essai 1 : départ +0.00 s, 504    durée 60.1 s, fin +60.1 s, 51 o corps="{\n  \"message\":\"The upstream server is timing out\"\n}"
  165 min essai 1 : départ +0.25 s, 504    durée 60.1 s, fin +60.3 s, 51 o corps="{\n  \"message\":\"The upstream server is timing out\"\n}"
  150 min essai 1 : départ +0.51 s, 504    durée 60.1 s, fin +60.6 s, 51 o corps="{\n  \"message\":\"The upstream server is timing out\"\n}"
  135 min essai 1 : départ +0.76 s, 504    durée 60.1 s, fin +60.8 s, 51 o corps="{\n  \"message\":\"The upstream server is timing out\"\n}"
  120 min essai 1 : départ +1.01 s, 504    durée 60.1 s, fin +61.1 s, 51 o corps="{\n  \"message\":\"The upstream server is timing out\"\n}"
  105 min essai 1 : départ +1.26 s, 200    durée 11.1 s, fin +12.4 s, 87755 o
   90 min essai 1 : départ +1.51 s, 504    durée 60.2 s, fin +61.7 s, 51 o corps="{\n  \"message\":\"The upstream server is timing out\"\n}"
   75 min essai 1 : départ +1.77 s, 200    durée 49.2 s, fin +51.0 s, 48727 o
   60 min essai 1 : départ +2.02 s, 200    durée 13.1 s, fin +15.1 s, 46952 o
   45 min essai 1 : départ +2.27 s, 200    durée 20.5 s, fin +22.7 s, 39435 o
   30 min essai 1 : départ +2.52 s, 200    durée 6.9 s, fin +9.4 s, 31364 o
   15 min essai 1 : départ +2.77 s, 200    durée 4.8 s, fin +7.6 s, 15417 o
  fin de la dernière zone : +61.7 s
  à 45 s, sans second essai : {"obtenues":5,"couverture":105,"manquantes":[75,90,120,135,150,165,180],"etat":"km"}
  à 45 s, avec second essai : {"obtenues":5,"couverture":105,"manquantes":[75,90,120,135,150,165,180],"etat":"km"}
  en-têtes (zone 180) : {"access-control-max-age":"1728000","cache-control":"private, max-age=1814400","date":"Thu, 15 Oct 2026 23:48:27 GMT","x-iplb-instance":"61217","x-iplb-request-id":"5CA97B79:E064_91EFC1E7:01BB_6AD1660F_6A9D2B24:38C2F7","x-ratelimit-limit-second":"1"}
```
### Série 2 (2026-10-16 01:48:45 CEST)
```

== 12 rue de la Paix, Nantes → 12 Rue de la Paix 44000 Nantes (44109) [-1.554555,47.215051] début 2026-10-15T23:48:45.924Z
  180 min essai 1 : départ +0.00 s, 504    durée 60.1 s, fin +60.1 s, 51 o corps="{\n  \"message\":\"The upstream server is timing out\"\n}"
  165 min essai 1 : départ +0.25 s, 200    durée 18.7 s, fin +19.0 s, 117558 o
  150 min essai 1 : départ +0.50 s, 200    durée 16.8 s, fin +17.3 s, 101503 o
  135 min essai 1 : départ +0.76 s, 502    durée 52.9 s, fin +53.7 s, 75 o corps="{\n  \"message\":\"An invalid response was received from the upstream server\"\n}"
  120 min essai 1 : départ +1.01 s, 200    durée 13.4 s, fin +14.4 s, 67608 o
  105 min essai 1 : départ +1.26 s, 502    durée 46.8 s, fin +48.0 s, 75 o corps="{\n  \"message\":\"An invalid response was received from the upstream server\"\n}"
   90 min essai 1 : départ +1.51 s, 502    durée 46.5 s, fin +48.0 s, 75 o corps="{\n  \"message\":\"An invalid response was received from the upstream server\"\n}"
   75 min essai 1 : départ +1.76 s, 200    durée 7.2 s, fin +9.0 s, 38452 o
   60 min essai 1 : départ +2.01 s, 200    durée 21.8 s, fin +23.9 s, 42199 o
   45 min essai 1 : départ +2.27 s, 200    durée 2.9 s, fin +5.1 s, 34162 o
   30 min essai 1 : départ +2.52 s, 200    durée 1.2 s, fin +3.7 s, 14411 o
   15 min essai 1 : départ +2.77 s, 200    durée 4.0 s, fin +6.8 s, 3943 o
  fin de la dernière zone : +60.1 s
  à 45 s, sans second essai : {"obtenues":8,"couverture":165,"manquantes":[90,105,135,180],"etat":"partiel"}
  à 45 s, avec second essai : {"obtenues":8,"couverture":165,"manquantes":[90,105,135,180],"etat":"partiel"}
  en-têtes (zone 180) : {"access-control-max-age":"1728000","cache-control":"private, max-age=1814400","date":"Thu, 15 Oct 2026 23:49:45 GMT","x-iplb-instance":"61217","x-iplb-request-id":"5CA97B79:E1C5_91EFC1E7:01BB_6AD1665D_6A9E00F3:38C2F7","x-ratelimit-limit-second":"1"}

== place du Capitole, Toulouse → Place du Capitole 31000 Toulouse (31555) [1.443054,43.604354] début 2026-10-15T23:49:46.089Z
  180 min essai 1 : départ +0.00 s, 200    durée 10.4 s, fin +10.4 s, 142889 o
  165 min essai 1 : départ +0.25 s, 200    durée 27.1 s, fin +27.3 s, 136521 o
  150 min essai 1 : départ +0.51 s, 200    durée 28.5 s, fin +29.1 s, 117509 o
  135 min essai 1 : départ +0.76 s, 504    durée 60.1 s, fin +60.9 s, 51 o corps="{\n  \"message\":\"The upstream server is timing out\"\n}"
  120 min essai 1 : départ +1.01 s, 200    durée 33.5 s, fin +34.5 s, 93129 o
  105 min essai 1 : départ +1.26 s, 200    durée 12.1 s, fin +13.3 s, 70301 o
   90 min essai 1 : départ +1.51 s, 200    durée 22.5 s, fin +24.0 s, 50156 o
   75 min essai 1 : départ +1.76 s, 200    durée 25.6 s, fin +27.4 s, 38814 o
   60 min essai 1 : départ +2.01 s, 200    durée 7.3 s, fin +9.3 s, 39147 o
   45 min essai 1 : départ +2.26 s, 200    durée 7.9 s, fin +10.2 s, 39379 o
   30 min essai 1 : départ +2.51 s, 200    durée 6.7 s, fin +9.3 s, 15239 o
   15 min essai 1 : départ +2.77 s, 200    durée 4.9 s, fin +7.7 s, 3316 o
  fin de la dernière zone : +60.9 s
  à 45 s, sans second essai : {"obtenues":11,"couverture":180,"manquantes":[135],"etat":"partiel"}
  à 45 s, avec second essai : {"obtenues":11,"couverture":180,"manquantes":[135],"etat":"partiel"}
  en-têtes (zone 180) : {"access-control-max-age":"1728000","cache-control":"private, max-age=1814400","date":"Thu, 15 Oct 2026 23:49:56 GMT","origin-agent-cluster":"?1","x-content-type-options":"nosniff","x-dns-prefetch-control":"off","x-download-options":"noopen","x-frame-options":"SAMEORIGIN","x-iplb-instance":"61217","x-iplb-request-id":"5CA97B79:E1C5_91EFC1E7:01BB_6AD16699_6A9EA78E:38C2F7","x-permitted-cross-domain-policies":"none","x-ratelimit-limit-second":"1","x-xss-protection":"0"}

== place Bellecour, Lyon → Place Bellecour 69002 Lyon (69382) [4.831662,45.757597] début 2026-10-15T23:50:47.123Z
  180 min essai 1 : départ +0.00 s, 504    durée 60.2 s, fin +60.2 s, 51 o corps="{\n  \"message\":\"The upstream server is timing out\"\n}"
  165 min essai 1 : départ +0.25 s, 504    durée 60.1 s, fin +60.3 s, 51 o corps="{\n  \"message\":\"The upstream server is timing out\"\n}"
  150 min essai 1 : départ +0.50 s, 504    durée 60.3 s, fin +60.8 s, 51 o corps="{\n  \"message\":\"The upstream server is timing out\"\n}"
  135 min essai 1 : départ +0.75 s, 200    durée 19.1 s, fin +19.8 s, 116003 o
  120 min essai 1 : départ +1.01 s, 504    durée 60.1 s, fin +61.1 s, 51 o corps="{\n  \"message\":\"The upstream server is timing out\"\n}"
  105 min essai 1 : départ +1.26 s, 200    durée 14.2 s, fin +15.4 s, 87755 o
   90 min essai 1 : départ +1.51 s, 504    durée 60.1 s, fin +61.6 s, 51 o corps="{\n  \"message\":\"The upstream server is timing out\"\n}"
   75 min essai 1 : départ +1.76 s, 504    durée 60.1 s, fin +61.8 s, 51 o corps="{\n  \"message\":\"The upstream server is timing out\"\n}"
   60 min essai 1 : départ +2.01 s, 200    durée 27.5 s, fin +29.5 s, 46952 o
   45 min essai 1 : départ +2.26 s, 200    durée 9.3 s, fin +11.6 s, 39435 o
   30 min essai 1 : départ +2.52 s, 200    durée 2.9 s, fin +5.4 s, 31364 o
   15 min essai 1 : départ +2.77 s, 200    durée 3.6 s, fin +6.4 s, 15417 o
  fin de la dernière zone : +61.8 s
  à 45 s, sans second essai : {"obtenues":6,"couverture":135,"manquantes":[75,90,120,150,165,180],"etat":"partiel"}
  à 45 s, avec second essai : {"obtenues":6,"couverture":135,"manquantes":[75,90,120,150,165,180],"etat":"partiel"}
  en-têtes (zone 180) : {"access-control-max-age":"1728000","cache-control":"private, max-age=1814400","date":"Thu, 15 Oct 2026 23:51:47 GMT","x-iplb-instance":"61218","x-iplb-request-id":"5CA97B79:E2EB_91EFC1E7:01BB_6AD166D7_6A4C608A:3DA25E","x-ratelimit-limit-second":"1"}
```
### Série 3 (2026-10-16 01:54:58 CEST)
```

== 12 rue de la Paix, Nantes → 12 Rue de la Paix 44000 Nantes (44109) [-1.554555,47.215051] début 2026-10-15T23:54:58.371Z
  180 min essai 1 : départ +0.00 s, 504    durée 60.1 s, fin +60.1 s, 51 o corps="{\n  \"message\":\"The upstream server is timing out\"\n}"
  165 min essai 1 : départ +0.25 s, 504    durée 60.1 s, fin +60.4 s, 51 o corps="{\n  \"message\":\"The upstream server is timing out\"\n}"
  150 min essai 1 : départ +0.50 s, 504    durée 60.1 s, fin +60.6 s, 51 o corps="{\n  \"message\":\"The upstream server is timing out\"\n}"
  135 min essai 1 : départ +0.76 s, 504    durée 60.3 s, fin +61.0 s, 51 o corps="{\n  \"message\":\"The upstream server is timing out\"\n}"
  120 min essai 1 : départ +1.01 s, 200    durée 3.0 s, fin +4.1 s, 67608 o
  105 min essai 1 : départ +1.26 s, 502    durée 36.9 s, fin +38.1 s, 75 o corps="{\n  \"message\":\"An invalid response was received from the upstream server\"\n}"
   90 min essai 1 : départ +1.51 s, 504    durée 60.1 s, fin +61.7 s, 51 o corps="{\n  \"message\":\"The upstream server is timing out\"\n}"
   75 min essai 1 : départ +1.76 s, 200    durée 27.7 s, fin +29.5 s, 38452 o
   60 min essai 1 : départ +2.01 s, 200    durée 2.5 s, fin +4.6 s, 42199 o
   45 min essai 1 : départ +2.27 s, 200    durée 0.9 s, fin +3.1 s, 34162 o
   30 min essai 1 : départ +2.52 s, 200    durée 7.9 s, fin +10.4 s, 14411 o
   15 min essai 1 : départ +2.77 s, 200    durée 6.5 s, fin +9.3 s, 3943 o
  105 min essai 2 : départ +38.13 s, 200    durée 2.1 s, fin +40.2 s, 58182 o
  fin de la dernière zone : +61.7 s
  à 45 s, sans second essai : {"obtenues":6,"couverture":120,"manquantes":[90,105,135,150,165,180],"etat":"partiel"}
  à 45 s, avec second essai : {"obtenues":7,"couverture":120,"manquantes":[90,135,150,165,180],"etat":"partiel"}
  en-têtes (zone 180) : {"access-control-max-age":"1728000","cache-control":"private, max-age=1814400","date":"Thu, 15 Oct 2026 23:55:58 GMT","x-iplb-instance":"61218","x-iplb-request-id":"5CA97B79:E30F_91EFC1E7:01BB_6AD167D2_6A4F0743:3DA25E","x-ratelimit-limit-second":"1"}

== place du Capitole, Toulouse → Place du Capitole 31000 Toulouse (31555) [1.443054,43.604354] début 2026-10-15T23:56:00.067Z
  180 min essai 1 : départ +0.00 s, 504    durée 60.0 s, fin +60.0 s, 51 o corps="{\n  \"message\":\"The upstream server is timing out\"\n}"
  165 min essai 1 : départ +0.25 s, 504    durée 60.0 s, fin +60.3 s, 51 o corps="{\n  \"message\":\"The upstream server is timing out\"\n}"
  150 min essai 1 : départ +0.51 s, 504    durée 60.2 s, fin +60.7 s, 51 o corps="{\n  \"message\":\"The upstream server is timing out\"\n}"
  135 min essai 1 : départ +0.76 s, 504    durée 60.0 s, fin +60.8 s, 51 o corps="{\n  \"message\":\"The upstream server is timing out\"\n}"
  120 min essai 1 : départ +1.01 s, 504    durée 60.3 s, fin +61.3 s, 51 o corps="{\n  \"message\":\"The upstream server is timing out\"\n}"
  105 min essai 1 : départ +1.26 s, 200    durée 32.0 s, fin +33.3 s, 70301 o
   90 min essai 1 : départ +1.51 s, 502    durée 14.9 s, fin +16.4 s, 75 o corps="{\n  \"message\":\"An invalid response was received from the upstream server\"\n}"
   75 min essai 1 : départ +1.76 s, 200    durée 31.4 s, fin +33.1 s, 38814 o
   60 min essai 1 : départ +2.01 s, 200    durée 2.0 s, fin +4.0 s, 39147 o
   45 min essai 1 : départ +2.27 s, 200    durée 13.5 s, fin +15.8 s, 39379 o
   30 min essai 1 : départ +2.52 s, 200    durée 0.4 s, fin +2.9 s, 15239 o
   15 min essai 1 : départ +2.77 s, 200    durée 7.0 s, fin +9.8 s, 3316 o
   90 min essai 2 : départ +16.42 s, 502    durée 57.0 s, fin +73.4 s, 75 o corps="{\n  \"message\":\"An invalid response was received from the upstream server\"\n}"
  fin de la dernière zone : +73.4 s
  à 45 s, sans second essai : {"obtenues":6,"couverture":105,"manquantes":[90,120,135,150,165,180],"etat":"km"}
  à 45 s, avec second essai : {"obtenues":6,"couverture":105,"manquantes":[90,120,135,150,165,180],"etat":"km"}
  en-têtes (zone 180) : {"access-control-max-age":"1728000","cache-control":"private, max-age=1814400","date":"Thu, 15 Oct 2026 23:57:00 GMT","x-iplb-instance":"61218","x-iplb-request-id":"5CA97B79:E30F_91EFC1E7:01BB_6AD16810_6A4FBB41:3DA25E","x-ratelimit-limit-second":"1"}

== place Bellecour, Lyon → Place Bellecour 69002 Lyon (69382) [4.831662,45.757597] début 2026-10-15T23:57:13.626Z
  180 min essai 1 : départ +0.00 s, 504    durée 60.1 s, fin +60.1 s, 51 o corps="{\n  \"message\":\"The upstream server is timing out\"\n}"
  165 min essai 1 : départ +0.25 s, 502    durée 3.9 s, fin +4.2 s, 75 o corps="{\n  \"message\":\"An invalid response was received from the upstream server\"\n}"
  150 min essai 1 : départ +0.50 s, 502    durée 18.9 s, fin +19.4 s, 75 o corps="{\n  \"message\":\"An invalid response was received from the upstream server\"\n}"
  135 min essai 1 : départ +0.76 s, 200    durée 7.1 s, fin +7.9 s, 116003 o
  120 min essai 1 : départ +1.01 s, 504    durée 60.1 s, fin +61.1 s, 51 o corps="{\n  \"message\":\"The upstream server is timing out\"\n}"
  105 min essai 1 : départ +1.26 s, 200    durée 28.6 s, fin +29.9 s, 87755 o
   90 min essai 1 : départ +1.51 s, 200    durée 25.4 s, fin +26.9 s, 62464 o
   75 min essai 1 : départ +1.76 s, 200    durée 17.6 s, fin +19.4 s, 48727 o
   60 min essai 1 : départ +2.02 s, 200    durée 11.0 s, fin +13.0 s, 46952 o
   45 min essai 1 : départ +2.27 s, 502    durée 17.0 s, fin +19.2 s, 75 o corps="{\n  \"message\":\"An invalid response was received from the upstream server\"\n}"
   30 min essai 1 : départ +2.52 s, 200    durée 7.8 s, fin +10.3 s, 31364 o
   15 min essai 1 : départ +2.77 s, 200    durée 2.3 s, fin +5.1 s, 15417 o
  165 min essai 2 : départ +4.18 s, 504    durée 60.2 s, fin +64.4 s, 51 o corps="{\n  \"message\":\"The upstream server is timing out\"\n}"
   45 min essai 2 : départ +19.24 s, 200    durée 7.1 s, fin +26.3 s, 39435 o
  150 min essai 2 : départ +19.49 s, 200    durée 46.7 s, fin +66.2 s, 160149 o
  fin de la dernière zone : +66.2 s
  à 45 s, sans second essai : {"obtenues":7,"couverture":135,"manquantes":[45,120,150,165,180],"etat":"partiel"}
  à 45 s, avec second essai : {"obtenues":8,"couverture":135,"manquantes":[120,150,165,180],"etat":"partiel"}
  en-têtes (zone 180) : {"access-control-max-age":"1728000","cache-control":"private, max-age=1814400","date":"Thu, 15 Oct 2026 23:58:13 GMT","x-iplb-instance":"61217","x-iplb-request-id":"5CA97B79:E341_91EFC1E7:01BB_6AD16859_6AA30E65:38C2F7","x-ratelimit-limit-second":"1"}
```
### Zones seules (01:52 à 01:55)
```
2026-10-15T23:52:48.244Z Nantes 180 min seule : 502, 45.0 s, 75 o {
  "message":"An invalid response was received from the upstream server"
}
2026-10-15T23:53:48.507Z Nantes 120 min seule : 504, 60.3 s, 51 o {
  "message":"The upstream server is timing out"
}
2026-10-15T23:54:48.894Z Lyon 180 min seule : 504, 60.4 s, 51 o {
  "message":"The upstream server is timing out"
}
2026-10-15T23:54:52.729Z Lyon 120 min seule : 200, 3.8 s, 107104 o
```
