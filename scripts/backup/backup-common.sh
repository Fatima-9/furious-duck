#!/usr/bin/env bash
# Fonctions et reglages partages par les scripts de sauvegarde.
# Ce fichier n'est pas executable seul : il est source par les autres scripts.

# Racine des sauvegardes. Surchargeable via l'environnement.
BACKUP_ROOT="${BACKUP_ROOT:-/home/thetiptop_gp2/backups}"

# Nombre de jours de retention avant suppression des anciennes archives.
RETENTION_DAYS="${RETENTION_DAYS:-14}"

# Fichier de log commun aux deux sauvegardes.
LOG_FILE="${LOG_FILE:-${BACKUP_ROOT}/backup.log}"

# Horodatage utilise pour nommer les archives (tri chronologique naturel).
TIMESTAMP="$(date +%Y-%m-%d_%H-%M-%S)"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$SCRIPT_NAME] $*" | tee -a "$LOG_FILE"
}

fail() {
  log "ECHEC: $*"
  exit 1
}

# Cree l'arborescence de destination et s'assure que le log est ecrivable.
init_backup_dir() {
  local dir="$1"
  mkdir -p "$dir" || { echo "Impossible de creer $dir"; exit 1; }
  mkdir -p "$(dirname "$LOG_FILE")"
  touch "$LOG_FILE" || { echo "Impossible d'ecrire dans $LOG_FILE"; exit 1; }
}

# Supprime les archives plus vieilles que RETENTION_DAYS jours.
# $1 = repertoire, $2 = motif glob (ex: "*.dump.gz")
prune_old_backups() {
  local dir="$1"
  local pattern="$2"
  local removed
  removed="$(find "$dir" -maxdepth 1 -type f -name "$pattern" -mtime "+${RETENTION_DAYS}" -print -delete | wc -l)"
  log "Retention ${RETENTION_DAYS} jours : ${removed} archive(s) supprimee(s) dans ${dir}"
}

# Verifie que docker est disponible : les deux sauvegardes en dependent.
require_docker() {
  command -v docker >/dev/null 2>&1 || fail "docker est introuvable dans le PATH"
  docker info >/dev/null 2>&1 || fail "le daemon docker ne repond pas (droits ou service arrete)"
}
