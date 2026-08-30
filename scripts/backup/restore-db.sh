#!/usr/bin/env bash
#
# Restauration de la base PostgreSQL a partir d'une archive produite par
# backup-db.sh.
#
# Une sauvegarde qui n'a jamais ete restauree n'est pas une sauvegarde : ce
# script existe pour que la restauration soit testee, pas improvisee le jour
# de l'incident.
#
# Usage :
#   ./restore-db.sh <archive.dump.gz> [--target <DATABASE_URL>]
#   ./restore-db.sh <archive.dump.gz> --list      # inspecte sans restaurer
#
# Par securite, la cible par defaut n'est PAS la base de production : il faut
# passer --target explicitement.

set -euo pipefail

SCRIPT_NAME="restore-db"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./backup-common.sh
source "${SCRIPT_DIR}/backup-common.sh"

PG_IMAGE="${PG_IMAGE:-postgres:18-alpine}"

ARCHIVE="${1:-}"
MODE="restore"
TARGET_URL=""

shift || true
while [ $# -gt 0 ]; do
  case "$1" in
    --list)   MODE="list"; shift ;;
    --target) TARGET_URL="${2:-}"; shift 2 ;;
    *) echo "Option inconnue : $1"; exit 2 ;;
  esac
done

if [ -z "$ARCHIVE" ] || [ ! -f "$ARCHIVE" ]; then
  echo "Usage : $0 <archive.dump.gz> [--target <DATABASE_URL>] [--list]"
  echo ""
  echo "Archives disponibles :"
  ls -1t "${BACKUP_ROOT}/database"/*.dump.gz 2>/dev/null | head -20 || echo "  (aucune)"
  exit 2
fi

require_docker

# Decompression dans un fichier temporaire : pg_restore a besoin d'un fichier
# navigable, il ne sait pas travailler sur un flux compresse.
TMP_DUMP="$(mktemp)"
cleanup() { rm -f "$TMP_DUMP"; }
trap cleanup EXIT

echo "Decompression de $(basename "$ARCHIVE")..."
gunzip -c "$ARCHIVE" > "$TMP_DUMP"

if [ "$MODE" = "list" ]; then
  echo "Contenu de l'archive :"
  docker run --rm -i "$PG_IMAGE" pg_restore --list /dev/stdin < "$TMP_DUMP"
  exit 0
fi

if [ -z "$TARGET_URL" ]; then
  echo "ERREUR: --target est obligatoire."
  echo "Indiquez explicitement la base de destination, par exemple une base de"
  echo "test, pour eviter d'ecraser la production par accident."
  exit 2
fi

echo ""
echo "!!! ATTENTION !!!"
echo "Cette operation va ECRASER les objets existants de la base cible."
echo "Archive : $(basename "$ARCHIVE")"
echo "Cible   : ${TARGET_URL%%\?*}"
echo ""
read -r -p "Tapez RESTAURER en majuscules pour confirmer : " CONFIRM
[ "$CONFIRM" = "RESTAURER" ] || { echo "Annule."; exit 1; }

echo "Restauration en cours..."
# --clean --if-exists : supprime les objets avant de les recreer.
# --no-owner : le role d'origine n'existe pas forcement sur la cible.
# On ne met pas -e : pg_restore remonte des avertissements benins (objets
# absents lors du --clean initial) qu'on ne veut pas traiter comme fatals.
docker run --rm -i "$PG_IMAGE" \
  pg_restore \
    --dbname="$TARGET_URL" \
    --clean --if-exists \
    --no-owner --no-privileges \
    --verbose \
    /dev/stdin < "$TMP_DUMP" \
  && echo "Restauration terminee." \
  || echo "Restauration terminee avec des avertissements (verifiez la sortie ci-dessus)."
