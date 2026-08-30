#!/usr/bin/env bash
#
# Sauvegarde complete du workflow : Jenkins, Prometheus, Grafana, Traefik.
#
# Ce qui est sauvegarde, et pourquoi :
#   jenkins_home           jobs, historique de builds, credentials, plugins.
#                          C'est le plus long a reconstruire a la main.
#   prometheus_data        historique des metriques (series temporelles).
#   grafana_data           dashboards crees a la main, utilisateurs, datasources.
#   traefik_letsencrypt    acme.json = certificats TLS. Sans lui, Let's Encrypt
#                          doit tout reemettre et on peut taper le rate limit.
#   configs                docker-compose*.yml, Jenkinsfile, monitoring/, traefik/
#                          tels qu'ils sont reellement deployes sur la VM.
#
# Les noms de volumes docker sont prefixes par le nom du projet compose
# (furious-duck-preprod-live_prometheus_data_preprod, etc.). Comme ce prefixe
# varie selon l'environnement, on decouvre les volumes par suffixe au lieu de
# les coder en dur. Plusieurs environnements coexistant sur la VM produisent
# toutefois le meme suffixe : COMPOSE_PROJECT departage et designe celui qui est
# reellement deploye.
#
# Usage :
#   ./backup-workflow.sh
#
# Variables surchargeables :
#   BACKUP_ROOT     racine des sauvegardes  (defaut /home/thetiptop_gp2/backups)
#   RETENTION_DAYS  jours de retention      (defaut 14)
#   PROJECT_DIR     repo deploye sur la VM  (defaut /home/thetiptop_gp2/furious-duck)
#   COMPOSE_PROJECT projet compose deploye  (defaut furious-duck-preprod-live)

set -euo pipefail

SCRIPT_NAME="backup-workflow"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./backup-common.sh
source "${SCRIPT_DIR}/backup-common.sh"

PROJECT_DIR="${PROJECT_DIR:-/home/thetiptop_gp2/furious-duck}"

# Projet compose reellement deploye. Sert a departager les volumes de meme
# suffixe appartenant a plusieurs environnements sur la meme VM.
COMPOSE_PROJECT="${COMPOSE_PROJECT:-furious-duck-preprod-live}"
DEST_DIR="${BACKUP_ROOT}/workflow"
STAGING_DIR="${DEST_DIR}/.staging_${TIMESTAMP}"

init_backup_dir "$DEST_DIR"
log "=== Debut de la sauvegarde du workflow ==="

require_docker

# Nettoie le staging meme en cas d'erreur ou d'interruption.
cleanup() { rm -rf "$STAGING_DIR"; }
trap cleanup EXIT

mkdir -p "$STAGING_DIR"

# Liste TOUS les volumes docker dont le nom se termine par le suffixe donne.
# Ne journalise rien : la sortie est capturee par l'appelant.
list_volumes() {
  docker volume ls --format '{{.Name}}' | grep -E "(^|_)${1}$" || true
}

# Archive un volume docker vers le staging, via un conteneur alpine jetable
# qui monte le volume en lecture seule.
backup_volume() {
  local suffix="$1"
  local label="$2"
  local matches count volume

  matches="$(list_volumes "$suffix")"
  count="$(printf '%s' "$matches" | grep -c . || true)"

  if [ "$count" -eq 0 ]; then
    log "ATTENTION: aucun volume trouve pour '${suffix}' (${label}) - ignore"
    VOLUMES_MISSING=$((VOLUMES_MISSING + 1))
    return 0
  fi

  # Plusieurs projets compose coexistent sur cette VM et creent des volumes de
  # meme suffixe : furious-duck-dev-live_prometheus_data_preprod et
  # furious-duck-preprod-live_prometheus_data_preprod. Prendre le premier venu
  # revenait a sauvegarder les donnees d'un environnement mort au lieu de
  # celles reellement en production. On privilegie donc explicitement le projet
  # deploye.
  volume="$(printf '%s\n' "$matches" | grep -E "^${COMPOSE_PROJECT}_" | head -n1 || true)"

  if [ -z "$volume" ]; then
    # Jenkins et Traefik vivent dans leur propre projet : c'est le cas normal.
    volume="$(printf '%s\n' "$matches" | head -n1)"
    if [ "$count" -gt 1 ]; then
      log "ATTENTION: ${count} volumes correspondent a '${suffix}', aucun du projet ${COMPOSE_PROJECT} ; choix de ${volume}"
    fi
  fi

  log "Archivage du volume ${volume} (${label})"
  if docker run --rm \
    -v "${volume}:/source:ro" \
    -v "${STAGING_DIR}:/backup" \
    alpine:3.20 \
    tar czf "/backup/${label}.tar.gz" -C /source . 2>>"$LOG_FILE"
  then
    VOLUMES_OK=$((VOLUMES_OK + 1))
  else
    log "ATTENTION: echec de l'archivage de ${volume}"
    VOLUMES_FAILED=$((VOLUMES_FAILED + 1))
  fi
}

VOLUMES_OK=0
VOLUMES_MISSING=0
VOLUMES_FAILED=0

backup_volume "jenkins_home"             "jenkins"
backup_volume "prometheus_data_preprod"  "prometheus"
backup_volume "grafana_data_preprod"     "grafana"
backup_volume "traefik_letsencrypt"      "traefik"

# Configuration reellement deployee sur la VM. Le repo est sur GitHub, mais on
# veut l'etat exact de la VM (fichiers modifies a la main, .env exclus).
if [ -d "$PROJECT_DIR" ]; then
  log "Archivage de la configuration depuis ${PROJECT_DIR}"
  tar czf "${STAGING_DIR}/config.tar.gz" \
    -C "$PROJECT_DIR" \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='coverage' \
    --exclude='dist' \
    --exclude='*.env' \
    --exclude='.env' \
    docker-compose.yml \
    docker-compose.dev.live.yml \
    docker-compose.monitoring.yml \
    docker-compose.traefik.yml \
    docker-compose.jenkins.yml \
    Jenkinsfile \
    monitoring \
    scripts \
    traefik \
    2>>"$LOG_FILE" || log "ATTENTION: archivage config partiel (fichiers absents ?)"

  # Le SHA deploye permet de savoir a quel commit correspond la sauvegarde.
  if [ -d "${PROJECT_DIR}/.git" ]; then
    git -C "$PROJECT_DIR" rev-parse HEAD > "${STAGING_DIR}/DEPLOYED_COMMIT.txt" 2>/dev/null || true
    git -C "$PROJECT_DIR" rev-parse --abbrev-ref HEAD >> "${STAGING_DIR}/DEPLOYED_COMMIT.txt" 2>/dev/null || true
  fi
else
  log "ATTENTION: ${PROJECT_DIR} introuvable, configuration non sauvegardee"
fi

# Inventaire lisible de ce que contient l'archive.
{
  echo "Sauvegarde workflow du ${TIMESTAMP}"
  echo "Hote      : $(hostname)"
  echo "Volumes OK: ${VOLUMES_OK} | absents: ${VOLUMES_MISSING} | echecs: ${VOLUMES_FAILED}"
  echo ""
  echo "Contenu :"
  ls -lh "$STAGING_DIR"
} > "${STAGING_DIR}/MANIFEST.txt"

ARCHIVE="${DEST_DIR}/workflow_${TIMESTAMP}.tar.gz"
tar czf "$ARCHIVE" -C "$STAGING_DIR" . || fail "impossible de creer l'archive finale"

SIZE="$(du -h "$ARCHIVE" | cut -f1)"
log "Sauvegarde OK : $(basename "$ARCHIVE") (${SIZE}) - volumes: ${VOLUMES_OK} ok, ${VOLUMES_MISSING} absents, ${VOLUMES_FAILED} echecs"

prune_old_backups "$DEST_DIR" "workflow_*.tar.gz"

# Un echec d'archivage de volume est signale au cron par un code de sortie non nul,
# tout en ayant produit une archive avec ce qui a pu etre sauvegarde.
if [ "$VOLUMES_FAILED" -gt 0 ]; then
  log "=== Fin avec ${VOLUMES_FAILED} echec(s) ==="
  exit 1
fi

log "=== Fin de la sauvegarde du workflow ==="
