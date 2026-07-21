# Traefik

Traefik est le reverse proxy du projet. Son role est de recevoir les requetes
HTTP et de les envoyer au bon service Docker.

Dans cette configuration locale :

- `http://localhost:8088/api/...` va vers le backend.
- `http://localhost:8088/` va vers le frontend.
- `http://localhost:8081` ouvre le dashboard Traefik.

## Lancer le projet avec Traefik

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.traefik.yml up --build
```

## Tester

Backend via Traefik :

```text
http://localhost:8088/api/health
```

Frontend via Traefik :

```text
http://localhost:8088
```

Dashboard Traefik :

```text
http://localhost:8081
```

## Arreter

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.traefik.yml down
```
