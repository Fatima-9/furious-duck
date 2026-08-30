#!/usr/bin/env bash
#
# Sauvegarde nocturne de la base PostgreSQL (Neon).
#
# Le serveur Neon tourne en PostgreSQL 18 : pg_dump doit etre en version 18 ou
# superieure, sinon il refuse de dumper ("server version mismatch"). On passe
# donc par l'image docker postgres:18-alpine plutot que par un client local,
# ce qui evite d'installer et de maintenir postgresql-client sur la VM.
#
# Usage :
#   ./backup-db.sh
#
# Variables surchargeables :
#   BACKUP_ROOT     racine des sauvegardes      (defaut /home/thetiptop_gp2/backups)
#   RETENTION_DAYS  jours de retention          (defaut 14)
#   ENV_FILE        fichier contenant DATABASE_URL
#   PG_IMAGE        image docker du client pg   (defaut postgres:18-alpine)

set -euo pipefail

SCRIPT_NAME="backup-db"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./backup-common.sh
source "${SCRIPT_DIR}/backup-common.sh"

ENV_FILE="${ENV_FILE:-/home/thetiptop_gp2/furious-duck/backend/.env}"
PG_IMAGE="${PG_IMAGE:-postgres:18-alpine}"
DEST_DIR="${BACKUP_ROOT}/database"

init_backup_dir "$DEST_DIR"
log "=== Debut de la sauvegarde base de donnees ==="

require_docker

# DATABASE_URL peut venir de l'environnement (utile pour les tests) ou du .env
# du backend deploye. On ne source pas le .env : il contient des valeurs non
# quotees (SMTP_FROM avec des espaces) qui casseraient un `source`.
if [ -z "${DATABASE_URL:-}" ]; then
  [ -f "$ENV_FILE" ] || fail "fichier d'environnement introuvable : $ENV_FILE"
  DATABASE_URL="$(grep -E '^DATABASE_URL=' "$ENV_FILE" | head -n1 | cut -d= -f2-)"
fi
[ -n "${DATABASE_URL:-}" ] || fail "DATABASE_URL est vide"

DUMP_NAME="neondb_${TIMESTAMP}.dump"
DUMP_FILE="${DEST_DIR}/${DUMP_NAME}"

log "Dump en cours vers ${DUMP_NAME}"

# Le repertoire de destination est MONTE dans le conteneur et pg_dump y ecrit
# lui-meme via --file, plutot que de rediriger sa sortie standard.
#
# C'est indispensable pour la verification qui suit : pg_restore a besoin d'un
# fichier positionnable pour relire une archive au format custom. Passer
# l'archive par le stdin d'un conteneur echoue avec
#   "pg_restore: error: did not find magic string in file header"
# alors meme que le dump est complet et valide.
#
# --user : sans cela le fichier appartiendrait a root, et l'utilisateur du cron
# ne pourrait pas le compresser ensuite.
#
# --format=custom : archive compressee et surtout restaurable selectivement
#   (une seule table, sans les donnees, etc.) via pg_restore.
# --no-owner / --no-privileges : le role neondb_owner n'existera pas forcement
#   sur la cible de restauration, on evite des erreurs inutiles au restore.
DOCKER_RUN=(
  docker run --rm
  --user "$(id -u):$(id -g)"
  -v "${DEST_DIR}:/backup"
  -e PGCONNECT_TIMEOUT=30
  "$PG_IMAGE"
)

if ! "${DOCKER_RUN[@]}" pg_dump "$DATABASE_URL" \
  --format=custom \
  --no-owner \
  --no-privileges \
  --verbose \
  --file="/backup/${DUMP_NAME}" 2>>"$LOG_FILE"
then
  rm -f "$DUMP_FILE"
  fail "pg_dump a echoue (voir $LOG_FILE)"
fi

# Un pg_dump interrompu peut laisser un fichier tronque mais non vide : on
# valide l'archive en la relisant depuis le repertoire monte.
if ! docker run --rm \
  --user "$(id -u):$(id -g)" \
  -v "${DEST_DIR}:/backup:ro" \
  "$PG_IMAGE" \
  pg_restore --list "/backup/${DUMP_NAME}" >/dev/null 2>>"$LOG_FILE"
then
  rm -f "$DUMP_FILE"
  fail "l'archive produite est illisible par pg_restore, sauvegarde rejetee"
fi

gzip -f "$DUMP_FILE"
DUMP_FILE="${DUMP_FILE}.gz"

SIZE="$(du -h "$DUMP_FILE" | cut -f1)"
log "Sauvegarde OK : $(basename "$DUMP_FILE") (${SIZE})"

prune_old_backups "$DEST_DIR" "neondb_*.dump.gz"

log "=== Fin de la sauvegarde base de donnees ==="
