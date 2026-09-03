# Commandes importantes du workflow

Ce fichier sert de pense-bête pour DEV et PREPROD. La PROD est volontairement
mise de côté tant que les dernières fonctionnalités ne sont pas livrées.

## Sur la VM PREPROD

Mettre le dépôt à jour :

```bash
cd /home/thetiptop_gp2/furious-duck
git pull origin PREPROD
```

Démarrer ou redémarrer Traefik :

```bash
docker network create traefik_proxy 2>/dev/null || true
docker compose -f docker-compose.traefik.preprod.yml up -d
```

Déployer l'application, Prometheus, Grafana et DORA :

```bash
GRAFANA_ADMIN_PASSWORD='<mot_de_passe_grafana>' docker compose -p furious-duck-preprod-live \
  -f docker-compose.yml \
  -f docker-compose.preprod.live.yml \
  -f docker-compose.monitoring.yml \
  up -d --build --scale backend=2 --scale frontend=2
```

Voir les conteneurs :

```bash
docker compose -p furious-duck-preprod-live \
  -f docker-compose.yml \
  -f docker-compose.preprod.live.yml \
  -f docker-compose.monitoring.yml \
  ps
```

Redémarrer Prometheus et Grafana après une modification dans `monitoring/` :

```bash
docker restart furious_duck_prometheus_preprod furious_duck_grafana_preprod
```

## Sur la VM DEV

Mettre le dépôt à jour :

```bash
cd /home/thetiptop_gp2/furious-duck
git pull origin DEV
```

Démarrer ou redémarrer Traefik :

```bash
docker network create traefik_proxy 2>/dev/null || true
docker compose -f docker-compose.traefik.dev.yml up -d
```

Déployer l'application, Prometheus, Grafana et DORA :

```bash
GRAFANA_ADMIN_PASSWORD='<mot_de_passe_grafana>' docker compose -p furious-duck-dev-live \
  -f docker-compose.yml \
  -f docker-compose.dev.live.yml \
  -f docker-compose.monitoring.dev.yml \
  up -d --build --scale backend=2 --scale frontend=2
```

## Vérifications rapides

Tester l'API :

```bash
curl -i https://preprod.dsp5-archi-o24a-g2.fr/api/health
curl -i https://preprod.dsp5-archi-o24a-g2.fr/api/db/health
```

Vérifier Prometheus :

```bash
curl -s https://preprod.dsp5-archi-o24a-g2.fr/prometheus/api/v1/targets
```

Vérifier DORA depuis Prometheus :

```bash
docker exec furious_duck_prometheus_preprod wget -qO- http://dora-exporter:9110/metrics
```

Vérifier les sauvegardes :

```bash
ls -lh /home/thetiptop_gp2/backups/database
ls -lh /home/thetiptop_gp2/backups/workflow
tail -50 /home/thetiptop_gp2/backups/backup.log
tail -50 /home/thetiptop_gp2/backups/cron.log
```

