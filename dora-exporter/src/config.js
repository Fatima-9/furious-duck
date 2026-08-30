/**
 * Configuration de l'exporter, lue depuis l'environnement.
 *
 * Aucune valeur par defaut n'est fournie pour l'URL et le job : un exporter
 * qui demarre en pointant silencieusement vers une mauvaise instance produit
 * des metriques fausses, ce qui est pire qu'un exporter qui refuse de demarrer.
 */
function readNumber(value, fallback, { min, max } = {}) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  if (min !== undefined && parsed < min) {
    return min;
  }
  if (max !== undefined && parsed > max) {
    return max;
  }
  return parsed;
}

function loadConfig(env = process.env) {
  const config = {
    port: readNumber(env.PORT, 9110, { min: 1, max: 65535 }),

    jenkinsUrl: env.JENKINS_URL || "",
    // Chemin du job dans Jenkins. Pour un pipeline multibranche, il inclut la
    // branche : "job/furious-duck/job/PREPROD".
    jobPath: env.JENKINS_JOB_PATH || "",
    jenkinsUser: env.JENKINS_USER || "",
    jenkinsToken: env.JENKINS_TOKEN || "",

    // 30 jours : assez long pour lisser les creux d'activite, assez court pour
    // que les metriques reagissent a un changement de pratiques.
    windowDays: readNumber(env.DORA_WINDOW_DAYS, 30, { min: 1, max: 365 }),

    // Plafond de builds demandes a Jenkins. Au-dela, la reponse grossit sans
    // rien apporter : les builds hors fenetre sont ecartes de toute facon.
    maxBuilds: readNumber(env.DORA_MAX_BUILDS, 200, { min: 1, max: 2000 }),

    timeoutMs: readNumber(env.JENKINS_TIMEOUT_MS, 15000, { min: 1000 }),

    // Duree de validite du cache. Prometheus scrape toutes les 15 s ; sans
    // cache, l'API Jenkins serait interrogee 5 760 fois par jour pour des
    // metriques qui ne bougent qu'a chaque build.
    cacheTtlMs: readNumber(env.DORA_CACHE_TTL_MS, 60000, { min: 0 }),
  };

  return config;
}

/**
 * Renvoie la liste des problemes de configuration, vide si tout est correct.
 */
function validateConfig(config) {
  const errors = [];

  if (!config.jenkinsUrl) {
    errors.push("JENKINS_URL est obligatoire (ex: http://jenkins:8080/jenkins)");
  }
  if (!config.jobPath) {
    errors.push(
      "JENKINS_JOB_PATH est obligatoire (ex: job/furious-duck/job/PREPROD)"
    );
  }
  // Jenkins peut autoriser la lecture anonyme, mais ce n'est pas le cas par
  // defaut : on previent plutot que de laisser l'exporter renvoyer des 403.
  if (config.jenkinsUser && !config.jenkinsToken) {
    errors.push("JENKINS_TOKEN est requis des lors que JENKINS_USER est defini");
  }

  return errors;
}

module.exports = { loadConfig, validateConfig, readNumber };
