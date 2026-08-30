const client = require("prom-client");

const { fetchBuilds } = require("./jenkinsClient");
const { computeDoraMetrics } = require("./doraMetrics");

/**
 * Registre Prometheus dedie a l'exporter DORA.
 *
 * On cree un registre isole plutot que d'utiliser le registre global de
 * prom-client : les metriques par defaut du process node (heap, GC) sont
 * ajoutees a part, ce qui permet de tester les metriques DORA seules.
 */
function createRegistry() {
  const registry = new client.Registry();

  const gauge = (name, help, labelNames = []) =>
    new client.Gauge({ name, help, labelNames, registers: [registry] });

  const metrics = {
    windowDays: gauge(
      "dora_window_days",
      "Fenetre d'observation utilisee pour calculer les metriques DORA, en jours"
    ),

    // 1. Frequence de deploiement
    deploymentsTotal: gauge(
      "dora_deployments_total",
      "Nombre de deploiements reussis sur la fenetre d'observation"
    ),
    deploymentFrequency: gauge(
      "dora_deployment_frequency_per_day",
      "Frequence de deploiement : deploiements reussis par jour"
    ),
    lastDeployment: gauge(
      "dora_last_deployment_timestamp_seconds",
      "Horodatage unix du dernier deploiement reussi"
    ),

    // 2. Lead time for changes
    leadTime: gauge(
      "dora_lead_time_seconds",
      "Lead time for changes : delai entre le commit le plus ancien du lot et sa mise en ligne",
      ["quantile"]
    ),
    leadTimeSamples: gauge(
      "dora_lead_time_samples",
      "Nombre de deploiements ayant servi au calcul du lead time"
    ),

    // 3. Change failure rate
    changeFailureRate: gauge(
      "dora_change_failure_rate",
      "Change failure rate : part des deploiements en echec, entre 0 et 1"
    ),
    buildsTotal: gauge(
      "dora_builds_total",
      "Nombre de builds termines sur la fenetre, succes et echecs confondus"
    ),
    failuresTotal: gauge(
      "dora_failures_total",
      "Nombre de builds en echec sur la fenetre"
    ),

    // 4. Time to restore service
    timeToRestore: gauge(
      "dora_time_to_restore_seconds",
      "Time to restore service : duree entre le premier echec d'un incident et le retour au vert",
      ["quantile"]
    ),
    incidentsResolved: gauge(
      "dora_incidents_resolved_total",
      "Nombre d'incidents resolus sur la fenetre"
    ),

    // Sante de l'exporter lui-meme
    scrapeSuccess: gauge(
      "dora_scrape_success",
      "1 si le dernier appel a Jenkins a reussi, 0 sinon"
    ),
    scrapeDuration: gauge(
      "dora_scrape_duration_seconds",
      "Duree du dernier appel a l'API Jenkins"
    ),
    lastSuccessfulScrape: gauge(
      "dora_last_successful_scrape_timestamp_seconds",
      "Horodatage unix du dernier appel a Jenkins ayant abouti"
    ),
  };

  return { registry, metrics };
}

/**
 * Ecrit une valeur qui peut etre absente.
 *
 * Quand il n'y a pas encore de donnee (aucun incident resolu, par exemple),
 * on RETIRE la serie au lieu d'ecrire 0. Un MTTR affiche a 0 se lirait comme
 * "on restaure instantanement", alors que la realite est "on ne sait pas
 * encore". Prometheus affichera un trou, ce qui est honnete.
 */
function setOrRemove(gauge, value, labels) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    // remove() et non reset() : reset() reecrit la jauge a 0, ce qui pour un
    // horodatage donnerait le 1er janvier 1970 et pour un MTTR "restauration
    // instantanee". remove() supprime la serie et Prometheus affiche un trou.
    gauge.remove(labels || {});
    return;
  }
  if (labels) {
    gauge.set(labels, value);
  } else {
    gauge.set(value);
  }
}

/**
 * Interroge Jenkins et met a jour toutes les jauges.
 *
 * En cas d'echec, les metriques DORA precedentes sont CONSERVEES et seul
 * dora_scrape_success passe a 0. Effacer les valeurs a chaque hoquet reseau
 * ferait clignoter les dashboards et declencherait de fausses alertes ;
 * l'age de la donnee reste visible via dora_last_successful_scrape.
 */
async function refreshMetrics({ metrics, config, fetchImpl, now = Date.now }) {
  const startedAt = Date.now();

  try {
    const builds = await fetchBuilds({
      baseUrl: config.jenkinsUrl,
      jobPath: config.jobPath,
      user: config.jenkinsUser,
      token: config.jenkinsToken,
      maxBuilds: config.maxBuilds,
      timeoutMs: config.timeoutMs,
      fetchImpl,
    });

    const dora = computeDoraMetrics(builds, {
      windowDays: config.windowDays,
      now: now(),
    });

    metrics.windowDays.set(dora.windowDays);
    metrics.deploymentsTotal.set(dora.deploymentsTotal);
    metrics.deploymentFrequency.set(dora.deploymentsPerDay);
    setOrRemove(metrics.lastDeployment, dora.lastDeploymentTimestampSeconds);

    setOrRemove(metrics.leadTime, dora.leadTimeMedianSeconds, { quantile: "0.5" });
    setOrRemove(metrics.leadTime, dora.leadTimeP95Seconds, { quantile: "0.95" });
    metrics.leadTimeSamples.set(dora.leadTimeSamples);

    metrics.changeFailureRate.set(dora.changeFailureRate);
    metrics.buildsTotal.set(dora.buildsTotal);
    metrics.failuresTotal.set(dora.failuresTotal);

    setOrRemove(metrics.timeToRestore, dora.timeToRestoreMedianSeconds, {
      quantile: "0.5",
    });
    setOrRemove(metrics.timeToRestore, dora.timeToRestoreP95Seconds, {
      quantile: "0.95",
    });
    metrics.incidentsResolved.set(dora.incidentsResolved);

    metrics.scrapeSuccess.set(1);
    metrics.lastSuccessfulScrape.set(Math.floor(now() / 1000));
    metrics.scrapeDuration.set((Date.now() - startedAt) / 1000);

    return { ok: true, dora };
  } catch (error) {
    metrics.scrapeSuccess.set(0);
    metrics.scrapeDuration.set((Date.now() - startedAt) / 1000);
    return { ok: false, error };
  }
}

module.exports = { createRegistry, refreshMetrics, setOrRemove };
