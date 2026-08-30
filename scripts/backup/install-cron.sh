#!/usr/bin/env bash
#
# Installe les taches planifiees de sauvegarde sur la VM.
# A lancer une seule fois, en root :  sudo ./install-cron.sh
#
# Le script est idempotent : le relancer met simplement a jour le fichier cron.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CRON_SOURCE="${SCRIPT_DIR}/furious-duck-backup.cron"
CRON_TARGET="/etc/cron.d/furious-duck-backup"
BACKUP_ROOT="${BACKUP_ROOT:-/home/thetiptop_gp2/backups}"
BACKUP_USER="${BACKUP_USER:-thetiptop_gp2}"

[ "$(id -u)" -eq 0 ] || { echo "Ce script doit etre lance en root (sudo)."; exit 1; }
[ -f "$CRON_SOURCE" ] || { echo "Fichier cron introuvable : $CRON_SOURCE"; exit 1; }

id "$BACKUP_USER" >/dev/null 2>&1 || { echo "Utilisateur inconnu : $BACKUP_USER"; exit 1; }

# L'utilisateur doit pouvoir parler au daemon docker : les deux sauvegardes
# passent par des conteneurs jetables.
if ! groups "$BACKUP_USER" | grep -qw docker; then
  echo "ATTENTION: $BACKUP_USER n'est pas dans le groupe docker."
  echo "  Corrigez avec :  sudo usermod -aG docker $BACKUP_USER"
  echo "  Sans cela, les sauvegardes echoueront silencieusement chaque nuit."
fi

echo "Creation de l'arborescence dans ${BACKUP_ROOT}"
mkdir -p "${BACKUP_ROOT}/database" "${BACKUP_ROOT}/workflow"
touch "${BACKUP_ROOT}/backup.log" "${BACKUP_ROOT}/cron.log"
chown -R "${BACKUP_USER}:${BACKUP_USER}" "$BACKUP_ROOT"
# Les dumps contiennent des donnees personnelles : lecture proprietaire seule.
chmod 700 "$BACKUP_ROOT" "${BACKUP_ROOT}/database" "${BACKUP_ROOT}/workflow"

echo "Installation de ${CRON_TARGET}"
install -o root -g root -m 644 "$CRON_SOURCE" "$CRON_TARGET"

chmod +x "${SCRIPT_DIR}"/*.sh

# cron ignore silencieusement un fichier /etc/cron.d mal forme : on verifie
# que le service l'a bien pris en compte.
if command -v systemctl >/dev/null 2>&1; then
  systemctl reload cron 2>/dev/null || systemctl restart cron 2>/dev/null || true
fi

echo ""
echo "Installation terminee."
echo ""
echo "Taches planifiees :"
grep -E '^[0-9]' "$CRON_TARGET" | sed 's/^/  /'
echo ""
echo "Verifications recommandees :"
echo "  sudo -u ${BACKUP_USER} ${SCRIPT_DIR}/backup-db.sh        # test immediat"
echo "  sudo -u ${BACKUP_USER} ${SCRIPT_DIR}/backup-workflow.sh  # test immediat"
echo "  tail -f ${BACKUP_ROOT}/backup.log                        # suivi des logs"
