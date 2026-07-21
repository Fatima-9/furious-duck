# Prometheus et Grafana

Cette configuration ajoute deux outils d'observation au projet.

Prometheus collecte les mesures exposees par le backend sur `/metrics`. Il permet de voir si le backend repond, combien de requetes passent, combien de temps elles prennent et si l'application commence a avoir des erreurs.

Grafana se connecte automatiquement a Prometheus grace au fichier de provisioning. Il sert a afficher les donnees sous forme de tableaux de bord plus lisibles.

## Lancer la pile avec Docker

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.monitoring.yml up -d --build
```

## Acces locaux

- Backend: http://localhost:5000
- Metriques backend: http://localhost:5000/metrics
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001

Les identifiants locaux Grafana sont `admin` / `admin`.

## Arreter la pile

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.monitoring.yml down
```
