# Sauvegardes automatiques

Deux tâches planifiées tournent chaque nuit sur la VM de préproduction :

| Tâche | Heure | Ce qui est sauvegardé |
|---|---|---|
| `backup-db.sh` | 02h30 | Base PostgreSQL (Neon) |
| `backup-workflow.sh` | 03h30 | Jenkins, Prometheus, Grafana, Traefik + configs |

Les deux tâches sont espacées d'une heure pour ne pas faire tourner deux
archivages lourds en même temps.

## Arborescence sur la VM

```
/home/thetiptop_gp2/backups/
├── backup.log                          # log applicatif des deux scripts
├── cron.log                            # sortie brute de cron
├── database/
│   └── neondb_2026-08-30_02-30-01.dump.gz
└── workflow/
    └── workflow_2026-08-30_03-30-02.tar.gz
```

Rétention : **14 jours** par défaut (`RETENTION_DAYS`). Les archives plus
anciennes sont supprimées à la fin de chaque exécution.

Le dossier est en `chmod 700` : les dumps contiennent des données personnelles
d'utilisateurs, ils ne doivent pas être lisibles par les autres comptes de la VM.

## Sauvegarde de la base de données

Le serveur Neon tourne en **PostgreSQL 18.6**. `pg_dump` refuse de dumper un
serveur plus récent que lui, donc le script passe par l'image Docker
`postgres:18-alpine` plutôt que par un client installé sur la VM — ça évite
d'avoir à maintenir la version du client à la main.

Le dump est au format `custom` (`-Fc`), ce qui permet une restauration
sélective (une seule table, schéma sans les données, etc.) via `pg_restore`.

Le script **vérifie l'archive** après le dump en la relisant avec
`pg_restore --list`. Un `pg_dump` qui échoue en cours de route peut laisser un
fichier tronqué mais non vide ; sans cette vérification, on croirait avoir une
sauvegarde valide.

## Sauvegarde du workflow

| Volume | Pourquoi c'est critique |
|---|---|
| `jenkins_home` | Jobs, historique de builds, credentials, plugins. Le plus long à reconstruire à la main. |
| `prometheus_data_preprod` | Historique des métriques. Perdu = plus d'antériorité pour les métriques DORA. |
| `grafana_data_preprod` | Dashboards créés à la main, utilisateurs. |
| `traefik_letsencrypt` | `acme.json` = certificats TLS. Sans lui, Let's Encrypt doit tout réémettre, avec un risque de rate limit. |
| Configs | `docker-compose*.yml`, `Jenkinsfile`, `monitoring/`, `scripts/` tels que déployés sur la VM. |

Les noms de volumes Docker sont préfixés par le nom du projet Compose
(`furious-duck-preprod-live_prometheus_data_preprod`). Ce préfixe change selon
l'environnement, donc le script **découvre les volumes par suffixe** au lieu de
les coder en dur.

**Attention au piège :** plusieurs environnements coexistent sur cette VM et
produisent des volumes de même suffixe — `furious-duck-dev-live_grafana_data_preprod`
et `furious-duck-preprod-live_grafana_data_preprod`. Une première version du
script prenait le premier venu et sauvegardait donc les données d'un
environnement mort. La variable `COMPOSE_PROJECT` désigne désormais
explicitement le projet à sauvegarder ; en l'absence de correspondance (cas
normal de Jenkins et Traefik, qui ont leur propre projet), le script se rabat
sur l'unique candidat et journalise un avertissement s'il y en a plusieurs.

L'archive contient un `MANIFEST.txt` (inventaire + compteurs) et un
`DEPLOYED_COMMIT.txt` (SHA et branche déployés), pour savoir à quel état du code
correspond la sauvegarde.

> **Limite connue :** la sauvegarde est *à chaud*, sans arrêter les conteneurs.
> Si un build Jenkins écrit pendant l'archivage, le `jenkins_home` sauvegardé
> peut être légèrement incohérent. C'est un compromis assumé : arrêter Jenkins
> chaque nuit coûterait plus cher que ce risque. Les builds tournent en journée,
> l'archivage à 03h30.

## Installation

Sur la VM, depuis le dépôt déployé :

```bash
cd /home/thetiptop_gp2/furious-duck
git pull
sudo ./scripts/backup/install-cron.sh
```

Le script crée l'arborescence, pose les bons droits, installe
`/etc/cron.d/furious-duck-backup` et recharge cron. Il est **idempotent** :
le relancer met simplement le fichier cron à jour.

Il vérifie aussi que `thetiptop_gp2` est dans le groupe `docker`. Sans ça, les
sauvegardes échoueraient silencieusement chaque nuit :

```bash
sudo usermod -aG docker thetiptop_gp2
```

## Vérifier que ça marche

```bash
# Lancer une sauvegarde à la main, sans attendre la nuit
sudo -u thetiptop_gp2 /home/thetiptop_gp2/furious-duck/scripts/backup/backup-db.sh
sudo -u thetiptop_gp2 /home/thetiptop_gp2/furious-duck/scripts/backup/backup-workflow.sh

# Suivre les logs
tail -f /home/thetiptop_gp2/backups/backup.log

# Vérifier que cron a bien pris le fichier
sudo systemctl status cron
grep CRON /var/log/syslog | tail -20
```

## Restaurer la base

**Une sauvegarde jamais restaurée n'est pas une sauvegarde.** Testez la
restauration sur une base de test au moins une fois.

```bash
# Lister les archives disponibles
./scripts/backup/restore-db.sh

# Inspecter le contenu d'une archive sans rien restaurer
./scripts/backup/restore-db.sh /home/thetiptop_gp2/backups/database/neondb_2026-08-30_02-30-01.dump.gz --list

# Restaurer vers une base de TEST
./scripts/backup/restore-db.sh <archive.dump.gz> --target "postgresql://user:pass@host/base_de_test?sslmode=require"
```

`--target` est **obligatoire** : il n'y a pas de cible par défaut, pour éviter
d'écraser la production par une faute de frappe. Le script demande en plus de
taper `RESTAURER` en toutes lettres avant d'agir.

## Restaurer le workflow

```bash
# Extraire l'archive
mkdir -p /tmp/restore && tar xzf workflow_2026-08-30_03-30-02.tar.gz -C /tmp/restore
cat /tmp/restore/MANIFEST.txt

# Restaurer un volume (exemple : Grafana). Arrêter le conteneur d'abord.
docker compose -p furious-duck-preprod-live stop grafana
docker run --rm \
  -v furious-duck-preprod-live_grafana_data_preprod:/target \
  -v /tmp/restore:/backup \
  alpine:3.20 sh -c "rm -rf /target/* && tar xzf /backup/grafana.tar.gz -C /target"
docker compose -p furious-duck-preprod-live start grafana
```

Adaptez le nom du volume et de l'archive (`jenkins.tar.gz`, `prometheus.tar.gz`,
`traefik.tar.gz`).

## Variables d'environnement

| Variable | Défaut | Rôle |
|---|---|---|
| `BACKUP_ROOT` | `/home/thetiptop_gp2/backups` | Racine des sauvegardes |
| `RETENTION_DAYS` | `14` | Jours de rétention |
| `ENV_FILE` | `.../furious-duck/backend/.env` | Fichier contenant `DATABASE_URL` |
| `PROJECT_DIR` | `/home/thetiptop_gp2/furious-duck` | Dépôt déployé sur la VM |
| `COMPOSE_PROJECT` | `furious-duck-preprod-live` | Projet Compose dont on sauvegarde les volumes |
| `PG_IMAGE` | `postgres:18-alpine` | Image du client PostgreSQL |
