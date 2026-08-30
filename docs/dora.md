# Métriques DORA

Les métriques DORA (*DevOps Research and Assessment*) sont quatre indicateurs
qui mesurent la performance d'une équipe de livraison logicielle.

| # | Métrique | Ce qu'elle mesure | Niveau « Elite » |
|---|---|---|---|
| 1 | **Fréquence de déploiement** | À quelle cadence on livre | Plusieurs fois par jour |
| 2 | **Lead time for changes** | Délai entre l'écriture du code et sa mise en ligne | Moins d'un jour |
| 3 | **Change failure rate** | Part des déploiements qui échouent | Moins de 15 % |
| 4 | **Time to restore service** | Temps pour revenir à un état sain | Moins d'une heure |

Les deux premières mesurent la **vitesse**, les deux dernières la
**stabilité**. Elles se lisent ensemble : déployer dix fois par jour n'a aucune
valeur si la moitié des déploiements casse la production. Inversement, un taux
d'échec nul obtenu en ne déployant qu'une fois par trimestre ne prouve rien.

## Comment elles sont produites

```
Jenkins  ──API REST──▶  dora-exporter  ──/metrics──▶  Prometheus  ──▶  Grafana
```

`dora-exporter` est un petit service Node dans [`dora-exporter/`](../dora-exporter).
Il interroge l'API Jenkins, calcule les quatre métriques et les expose au
format Prometheus sur le port `9110`.

Aucun plugin Jenkins n'est nécessaire. Le plugin Prometheus pour Jenkins
exporte des métriques de build brutes, mais **pas** les métriques DORA : il
aurait fallu les recalculer en PromQL dans Grafana, ce qui est fragile et
impossible à tester.

## Définitions retenues

Ces choix comptent, parce qu'ils changent les chiffres. Ils sont tous couverts
par des tests dans [`dora-exporter/tests/`](../dora-exporter/tests).

**Ce qui compte comme un déploiement.** Un build Jenkins terminé avec le
résultat `SUCCESS` sur la branche déployée.

**Ce qui compte comme un échec.** `FAILURE` et `UNSTABLE`. `UNSTABLE` signifie
que le build est passé mais que des tests sont rouges : au sens DORA, le
déploiement n'a pas livré un service sain, c'est donc un échec.

**`ABORTED` est exclu du calcul.** Un build annulé à la main n'est ni un
déploiement réussi ni un échec de changement. Le compter gonflerait
artificiellement le taux d'échec à chaque fois que quelqu'un annule un build.

**Le lead time part du commit le plus ancien du lot**, pas du plus récent.
C'est la définition DORA : le délai doit couvrir toute l'attente du changement
le plus ancien embarqué dans la livraison. Les commits et leurs horodatages
viennent des `changeSets` de l'API Jenkins — pas besoin d'accès au dépôt git
depuis le conteneur.

**Une série d'échecs consécutifs compte pour un seul incident.** Trois builds
rouges pendant qu'on corrige un bug, c'est un incident, pas trois. Le temps de
rétablissement se mesure du **premier** échec de la série au retour du premier
succès.

**Un incident encore ouvert n'est pas comptabilisé.** Sa durée n'est pas encore
connue ; l'inclure avec sa durée actuelle ferait baisser artificiellement le
MTTR.

**Médiane, pas moyenne**, pour le lead time et le MTTR. Un seul incident traité
en trois jours suffirait à doubler une moyenne et rendrait la métrique
illisible. Le p95 est exposé en parallèle pour voir la queue de distribution.

**Absence de donnée ≠ zéro.** Quand il n'y a aucun incident résolu, la série
`dora_time_to_restore_seconds` est **retirée**, pas mise à 0. Un MTTR affiché à
0 se lirait « on restaure instantanément », alors que la réalité est « on ne
sait pas encore ». Grafana affiche un trou, ce qui est honnête.

## Métriques exposées

| Métrique | Type | Description |
|---|---|---|
| `dora_deployment_frequency_per_day` | gauge | Déploiements réussis par jour |
| `dora_deployments_total` | gauge | Déploiements réussis sur la fenêtre |
| `dora_last_deployment_timestamp_seconds` | gauge | Horodatage du dernier déploiement |
| `dora_lead_time_seconds{quantile}` | gauge | Lead time, `0.5` et `0.95` |
| `dora_lead_time_samples` | gauge | Nombre d'échantillons du lead time |
| `dora_change_failure_rate` | gauge | Taux d'échec, entre 0 et 1 |
| `dora_builds_total` | gauge | Builds terminés sur la fenêtre |
| `dora_failures_total` | gauge | Builds en échec sur la fenêtre |
| `dora_time_to_restore_seconds{quantile}` | gauge | MTTR, `0.5` et `0.95` |
| `dora_incidents_resolved_total` | gauge | Incidents résolus sur la fenêtre |
| `dora_window_days` | gauge | Fenêtre d'observation, en jours |
| `dora_scrape_success` | gauge | 1 si le dernier appel Jenkins a réussi |
| `dora_scrape_duration_seconds` | gauge | Durée du dernier appel Jenkins |
| `dora_last_successful_scrape_timestamp_seconds` | gauge | Dernier appel abouti |

Les quatre dernières servent à superviser l'exporter lui-même. **Un
`dora_scrape_success` à 0 signifie que les métriques DORA affichées sont figées
à leur dernière valeur connue** : en cas d'échec Jenkins, l'exporter conserve
volontairement les valeurs précédentes plutôt que de les effacer, pour ne pas
faire clignoter les dashboards à chaque hoquet réseau.

## Configuration

| Variable | Défaut | Rôle |
|---|---|---|
| `JENKINS_URL` | — (obligatoire) | Ex. `http://furious_duck_jenkins:8080/jenkins` |
| `JENKINS_JOB_PATH` | — (obligatoire) | Ex. `job/furious-duck/job/PREPROD` |
| `JENKINS_USER` | vide | Compte de service Jenkins |
| `JENKINS_TOKEN` | vide | Jeton d'API du compte |
| `DORA_WINDOW_DAYS` | `30` | Fenêtre d'observation |
| `DORA_MAX_BUILDS` | `200` | Builds demandés à Jenkins |
| `DORA_CACHE_TTL_MS` | `60000` | Durée du cache |
| `JENKINS_TIMEOUT_MS` | `15000` | Timeout de l'appel Jenkins |
| `PORT` | `9110` | Port d'écoute |

L'URL doit inclure le préfixe `/jenkins` : Jenkins tourne avec
`--prefix=/jenkins`, et sans lui l'API répond 404.

Le `JENKINS_JOB_PATH` est calculé automatiquement par le Jenkinsfile à partir
de `JOB_NAME` : sur un pipeline multibranche, `furious-duck/PREPROD` devient
`job/furious-duck/job/PREPROD`.

Le cache de 60 s est important : Prometheus scrape toutes les 15 s, soit
5 760 appels par jour à l'API Jenkins sans lui, pour une donnée qui ne bouge
qu'à chaque build.

## Credentials Jenkins à créer

Deux credentials de type **Secret text** sont attendus par le Jenkinsfile :

| ID | Contenu |
|---|---|
| `furious-duck-jenkins-api-user` | Nom du compte de service |
| `furious-duck-jenkins-api-token` | Jeton d'API de ce compte |

Créez un compte de service en **lecture seule** plutôt que d'utiliser le compte
admin : l'exporter n'a besoin que de lire l'historique de builds.

Le jeton se génère dans Jenkins : *Utilisateur → Configure → API Token → Add
new Token*.

## Lancer en local

```bash
cd dora-exporter
npm install

JENKINS_URL=https://preprod.dsp5-archi-o24a-g2.fr/jenkins \
JENKINS_JOB_PATH=job/furious-duck/job/PREPROD \
JENKINS_USER=<compte> \
JENKINS_TOKEN=<jeton> \
npm start

curl http://localhost:9110/metrics
```

## Tests

```bash
cd dora-exporter
npm test
npm run test:coverage
```

73 tests couvrent les quatre calculs, le client Jenkins et le serveur HTTP,
dont les cas limites : horloge d'agent désynchronisée produisant un lead time
négatif, build sans changeset (relance manuelle), incident encore ouvert,
division par zéro quand il n'y a aucun build, Jenkins injoignable.

## Vérifier en préproduction

```bash
# L'exporter répond ?
docker exec furious_duck_prometheus_preprod \
  wget -qO- http://dora-exporter:9110/metrics | grep dora_deployment

# La cible Prometheus est-elle "up" ?
curl -s https://preprod.dsp5-archi-o24a-g2.fr/prometheus/api/v1/targets \
  | grep -o '"job":"dora"[^}]*"health":"[a-z]*"'

# L'exporter joint-il Jenkins ?
docker logs furious_duck_dora_exporter_preprod --tail 20
```

Si `dora_scrape_success` vaut 0, les causes habituelles sont : mauvais
`JENKINS_JOB_PATH` (Jenkins répond 404), credentials absents ou expirés
(403), ou l'exporter n'est pas sur le réseau `traefik_proxy` où vit Jenkins.

## Limite à connaître

Les métriques sont calculées **à la demande** sur une fenêtre glissante de
30 jours, à partir de l'historique Jenkins. Elles ne sont donc valables que
tant que Jenkins conserve ses builds : le Jenkinsfile utilise
`buildDiscarder(logRotator(numToKeepStr: '10'))`, qui ne garde que **les 10
derniers builds**.

Avec 10 builds conservés, la fenêtre de 30 jours ne contiendra jamais plus de
10 déploiements, ce qui fausse la fréquence de déploiement dès que le rythme
dépasse un build tous les trois jours. Pour des métriques DORA fiables, il faut
augmenter cette rétention, par exemple :

```groovy
buildDiscarder(logRotator(numToKeepStr: '200', daysToKeepStr: '90'))
```

Ce changement n'est pas inclus dans cette branche : il modifie le comportement
de la pipeline au-delà des métriques et mérite une décision explicite.
