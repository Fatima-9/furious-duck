# Traefik

Traefik est l'entrée du serveur. Quand quelqu'un ouvre le site, Jenkins,
Grafana ou Prometheus, c'est Traefik qui reçoit la requête en premier et qui
l'envoie au bon conteneur Docker.

## Fichiers par environnement

| Environnement | Fichier Traefik | Domaines |
|---|---|---|
| DEV | `docker-compose.traefik.dev.yml` | `dev.dsp5-archi-o24a-g2.fr`, `dev.dsp5-archi-o24a-g2.com` |
| PREPROD | `docker-compose.traefik.preprod.yml` | `preprod.dsp5-archi-o24a-g2.fr`, `preprod.dsp5-archi-o24a-g2.com` |

Le fichier `docker-compose.traefik.yml` reste le fichier historique. Pour les
VM, il faut utiliser les fichiers explicites `dev` ou `preprod` afin d'éviter
de lancer le mauvais domaine.

## Lancer Traefik sur PREPROD

```bash
cd /home/thetiptop_gp2/furious-duck
docker network create traefik_proxy 2>/dev/null || true
docker compose -f docker-compose.traefik.preprod.yml up -d
```

## Lancer Traefik sur DEV

```bash
cd /home/thetiptop_gp2/furious-duck
docker network create traefik_proxy 2>/dev/null || true
docker compose -f docker-compose.traefik.dev.yml up -d
```

## Vérifier

```bash
docker ps | grep traefik
docker logs furious_duck_traefik --tail 50
```

Sur PREPROD, les accès attendus sont :

```text
https://preprod.dsp5-archi-o24a-g2.fr
https://preprod.dsp5-archi-o24a-g2.fr/jenkins
https://preprod.dsp5-archi-o24a-g2.fr/grafana
https://preprod.dsp5-archi-o24a-g2.fr/prometheus
https://preprod.dsp5-archi-o24a-g2.fr/traefik
```

Sur DEV, il faut remplacer `preprod` par `dev`.
