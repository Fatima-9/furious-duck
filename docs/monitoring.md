# Supervision : Prometheus et Grafana

## Ce qui est collecté

| Source | Cible scrapée | Ce qu'elle apporte |
|---|---|---|
| Backend Node | `backend:5000/metrics` | Requêtes HTTP applicatives, durées, métriques Node (heap, event loop, GC) |
| **node-exporter** | `node-exporter:9100` | CPU, RAM, disque, réseau, charge de la **VM hôte** |
| **cAdvisor** | `cadvisor:8080` | CPU, mémoire, réseau et I/O **par conteneur** |
| **Traefik** | `furious_duck_traefik:8082` | Trafic **HTTPS** : débit, codes de retour, latence, certificats TLS |
| Prometheus | `prometheus:9090` | Auto-supervision |

node-exporter et cAdvisor sont complémentaires : le premier voit la machine
dans son ensemble, le second attribue la consommation à un conteneur précis.
Sans cAdvisor, un pic CPU sur la VM ne dit pas *qui* le provoque.

Aucun des deux exporters n'a de label Traefik : ils ne sont **pas exposés
publiquement**, Prometheus les atteint uniquement par le réseau Docker interne.

## Dashboards

Deux dashboards sont versionnés dans `monitoring/grafana/dashboards/` et
provisionnés automatiquement au démarrage de Grafana, dans le dossier
**Furious Duck**.

### Système et conteneurs (`fd-system-overview`)

CPU, mémoire, disque, réseau de la VM, puis les mêmes métriques ventilées par
conteneur. Comprend un panneau « Redémarrages de conteneurs » qui rend visible
un service qui boucle sur `restart: unless-stopped`.

### Trafic HTTPS (`fd-traefik-https`)

Débit, codes de retour, latence p50/p95/p99, répartition par service et par
routeur. Le panneau **Certificat TLS (jours restants)** est le plus important :
Let's Encrypt renouvelle à 30 jours de l'échéance, donc une valeur qui descend
sous 15 jours signifie que le renouvellement automatique a échoué.

Les dashboards sont en `allowUiUpdates: false` : les modifications faites dans
l'interface Grafana sont écrasées au redémarrage. C'est volontaire — la source
de vérité est le dépôt. Pour modifier un dashboard durablement, éditez le JSON
et committez.

## Points de configuration à connaître

**`uid: prometheus` sur la datasource.** Les dashboards versionnés référencent
cette valeur. Sans `uid` explicite, Grafana en génère un aléatoire au premier
démarrage et les dashboards pointeraient vers une source introuvable.

**Le backend est scrapé via `dns_sd_configs`, pas `static_configs`.** Le
déploiement tourne avec `--scale backend=2` : le DNS Docker renvoie les deux IP
en round-robin, et un `static_configs` sur `backend:5000` n'aurait scrapé
qu'une seule réplique à la fois, perdant la moitié des mesures.

**Traefik expose ses métriques sur un entrypoint dédié `:8082`**, non publié
dans `ports:`. Il n'est joignable que depuis le réseau `traefik_proxy`, où
Prometheus est également connecté. Les en-têtes `Authorization` et `Cookie`
sont retirés des access logs pour ne pas y écrire de jetons.

**Le chemin du fichier `prometheus.yml` est absolu** dans
`docker-compose.monitoring.yml`
(`/home/thetiptop_gp2/furious-duck/monitoring/prometheus/prometheus.yml`). La
pile monitoring ne démarre donc correctement que sur la VM, à cet emplacement
exact. En local, remplacez ce chemin par `./monitoring/prometheus/prometheus.yml`.

## Lancer la pile

Sur la VM (fait automatiquement par Jenkins au déploiement) :

```bash
docker compose -p furious-duck-preprod-live \
  -f docker-compose.yml \
  -f docker-compose.dev.live.yml \
  -f docker-compose.monitoring.yml \
  up -d --build --scale backend=2 --scale frontend=2
```

Traefik tourne dans un projet Compose séparé :

```bash
docker compose -f docker-compose.traefik.yml up -d
```

En local (sans Traefik) :

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.monitoring.yml up -d --build
```

## Accès

En préproduction, derrière Traefik :

- Application : https://preprod.dsp5-archi-o24a-g2.fr
- Prometheus : https://preprod.dsp5-archi-o24a-g2.fr/prometheus
- Grafana : https://preprod.dsp5-archi-o24a-g2.fr/grafana
- Traefik : https://preprod.dsp5-archi-o24a-g2.fr/traefik (basic auth)
- Jenkins : https://preprod.dsp5-archi-o24a-g2.fr/jenkins

En local :

- Backend : http://localhost:5000 — métriques sur `/metrics`
- Prometheus : http://localhost:9090
- Grafana : http://localhost:3001 (`admin` / `admin`)

> Les identifiants Grafana sont `admin` / `admin` en dur dans
> `docker-compose.monitoring.yml`. À changer avant toute mise en production
> réelle, via `GF_SECURITY_ADMIN_PASSWORD`.

## Vérifier que la collecte fonctionne

```bash
# Toutes les cibles doivent être "up"
curl -s https://preprod.dsp5-archi-o24a-g2.fr/prometheus/api/v1/targets \
  | python3 -m json.tool | grep -E '"job"|"health"'

# Métriques système présentes ?
curl -s 'https://preprod.dsp5-archi-o24a-g2.fr/prometheus/api/v1/query?query=node_load1'

# Métriques Traefik présentes ?
curl -s 'https://preprod.dsp5-archi-o24a-g2.fr/prometheus/api/v1/query?query=traefik_entrypoint_requests_total'
```

Si la cible `traefik` est `down`, c'est presque toujours que le conteneur
Traefik a été redémarré sans les nouvelles options `--metrics.prometheus`, ou
qu'il n'est pas sur le réseau `traefik_proxy`.

## Arrêter la pile

```bash
docker compose -p furious-duck-preprod-live \
  -f docker-compose.yml \
  -f docker-compose.dev.live.yml \
  -f docker-compose.monitoring.yml down
```
