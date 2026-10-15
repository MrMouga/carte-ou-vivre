#!/usr/bin/env bash
# Rétro du 2026-10-16 : prouve qu'une mise en ligne a eu lieu (/ship). Les mises en ligne du 13 et du 14 visaient une
# adresse qui n'existait pas. Échoue si l'adresse ne répond pas, si elle ne sert pas le commit attendu, ou si
# achat.json (ventes DVF) n'est pas exclu des moteurs de recherche (D9 d'immobilier).
# Usage : scripts/check-live.sh [commit attendu, par défaut origin/main] [adresse]
set -u
URL="${2:-https://ou-vivre-en-france.narnia-assistant.workers.dev}"
ATTENDU="$(git rev-parse "${1:-origin/main}")" || { echo "ÉCHEC : commit inconnu"; exit 1; }
erreur=0

code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$URL/")"
if [ "$code" = "200" ]; then echo "ok    page : $URL/ répond 200"; else echo "ÉCHEC page : $URL/ répond « $code »"; erreur=1; fi

servi="$(curl -s --max-time 20 "$URL/version.txt?t=$(date +%s)" | tr -d '[:space:]')"
if [ "$servi" = "$ATTENDU" ]; then echo "ok    version servie : $servi"; else echo "ÉCHEC version servie : « $servi », attendu $ATTENDU"; erreur=1; fi

if curl -sI --max-time 20 "$URL/data/achat.json" | grep -qi '^x-robots-tag: *noindex'; then
  echo "ok    achat.json : x-robots-tag noindex"
else
  echo "ÉCHEC achat.json : pas d'en-tête x-robots-tag noindex"; erreur=1
fi
exit $erreur
