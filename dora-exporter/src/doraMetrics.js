/**
 * Calcul des quatre metriques DORA a partir de l'historique de builds Jenkins.
 *
 * Les quatre metriques (DevOps Research and Assessment) :
 *
 *   1. Frequence de deploiement  - a quelle cadence on livre.
 *   2. Lead time for changes     - delai entre l'ecriture du code et sa mise en ligne.
 *   3. Change failure rate       - part des deploiements qui echouent.
 *   4. Time to restore service   - temps pour revenir a un etat sain apres un echec.
 *
 * Les deux premieres mesurent la vitesse, les deux dernieres la stabilite.
 * Elles se lisent ensemble : deployer dix fois par jour n'a aucune valeur si
 * la moitie des deploiements casse la production.
 */

// UNSTABLE = build passe mais tests en echec. C'est un echec de changement au
// sens DORA : le deploiement n'a pas livre un service sain.
const FAILURE_RESULTS = new Set(["FAILURE", "UNSTABLE"]);
const SUCCESS_RESULTS = new Set(["SUCCESS"]);

/**
 * ABORTED est exclu volontairement : un build annule a la main n'est ni un
 * deploiement reussi ni un echec de changement. Le compter gonflerait
 * artificiellement le taux d'echec.
 */
function isCompleted(build) {
  return (
    !build.building &&
    (SUCCESS_RESULTS.has(build.result) || FAILURE_RESULTS.has(build.result))
  );
}

function isSuccess(build) {
  return SUCCESS_RESULTS.has(build.result);
}

function isFailure(build) {
  return FAILURE_RESULTS.has(build.result);
}

/** Instant ou le build s'est termine, en millisecondes. */
function finishedAt(build) {
  return build.timestamp + (build.duration || 0);
}

/**
 * Mediane, et non moyenne : un seul incident traite en trois jours suffirait a
 * doubler une moyenne de MTTR et rendrait la metrique illisible.
 */
function median(values) {
  if (values.length === 0) {
    return null;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function percentile(values, p) {
  if (values.length === 0) {
    return null;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1)
  );
  return sorted[index];
}

/**
 * Horodatage du commit le plus ancien inclus dans le build.
 *
 * On prend le plus ancien et non le plus recent : le lead time doit couvrir
 * tout le temps d'attente du changement le plus ancien embarque dans la
 * livraison, ce qui est la definition DORA.
 *
 * Renvoie null si le build n'embarque aucun commit (relance manuelle d'un
 * build identique, ou premier build d'une branche).
 */
function oldestCommitTimestamp(build) {
  const sets = Array.isArray(build.changeSets) ? build.changeSets : [];
  let oldest = null;

  for (const set of sets) {
    const items = Array.isArray(set.items) ? set.items : [];
    for (const item of items) {
      if (typeof item.timestamp !== "number") {
        continue;
      }
      if (oldest === null || item.timestamp < oldest) {
        oldest = item.timestamp;
      }
    }
  }

  return oldest;
}

/**
 * Duree de chaque incident, en millisecondes.
 *
 * Un incident commence au PREMIER echec d'une serie et se termine au retour
 * du premier succes. Compter chaque echec separement surestimerait le nombre
 * d'incidents : trois echecs consecutifs pendant qu'on corrige un bug, c'est
 * un seul incident, pas trois.
 *
 * `builds` doit etre trie du plus ancien au plus recent.
 */
function computeRestoreDurations(builds) {
  const durations = [];
  let incidentStart = null;

  for (const build of builds) {
    if (isFailure(build)) {
      // Seul le premier echec de la serie ouvre l'incident.
      if (incidentStart === null) {
        incidentStart = finishedAt(build);
      }
    } else if (isSuccess(build) && incidentStart !== null) {
      durations.push(finishedAt(build) - incidentStart);
      incidentStart = null;
    }
  }

  // Un incident encore ouvert a la fin de la fenetre n'est pas comptabilise :
  // sa duree n'est pas encore connue.
  return durations;
}

/**
 * Calcule les quatre metriques DORA.
 *
 * @param {Array} builds  builds Jenkins bruts, ordre indifferent
 * @param {Object} options
 * @param {number} options.windowDays  fenetre d'observation en jours
 * @param {number} options.now         instant de reference en ms (injectable pour les tests)
 */
function computeDoraMetrics(builds, { windowDays = 30, now = Date.now() } = {}) {
  const windowMs = windowDays * 24 * 60 * 60 * 1000;
  const since = now - windowMs;

  const inWindow = (Array.isArray(builds) ? builds : [])
    .filter((build) => typeof build.timestamp === "number")
    .filter((build) => build.timestamp >= since)
    .filter(isCompleted)
    // Du plus ancien au plus recent : indispensable pour reconstituer les
    // series d'echecs dans computeRestoreDurations.
    .sort((a, b) => a.timestamp - b.timestamp);

  const successes = inWindow.filter(isSuccess);
  const failures = inWindow.filter(isFailure);

  const leadTimes = [];
  for (const build of successes) {
    const commitAt = oldestCommitTimestamp(build);
    if (commitAt === null) {
      continue;
    }
    const leadTime = finishedAt(build) - commitAt;
    // Une horloge d'agent Jenkins desynchronisee peut produire un lead time
    // negatif. On l'ecarte plutot que de fausser la mediane.
    if (leadTime >= 0) {
      leadTimes.push(leadTime);
    }
  }

  const restoreDurations = computeRestoreDurations(inWindow);

  const lastDeployment = successes.length
    ? successes[successes.length - 1]
    : null;

  return {
    windowDays,

    // 1. Frequence de deploiement
    deploymentsTotal: successes.length,
    deploymentsPerDay: successes.length / windowDays,
    lastDeploymentTimestampSeconds: lastDeployment
      ? Math.floor(finishedAt(lastDeployment) / 1000)
      : null,

    // 2. Lead time for changes
    leadTimeMedianSeconds: toSeconds(median(leadTimes)),
    leadTimeP95Seconds: toSeconds(percentile(leadTimes, 95)),
    leadTimeSamples: leadTimes.length,

    // 3. Change failure rate
    failuresTotal: failures.length,
    buildsTotal: inWindow.length,
    changeFailureRate: inWindow.length ? failures.length / inWindow.length : 0,

    // 4. Time to restore service
    timeToRestoreMedianSeconds: toSeconds(median(restoreDurations)),
    timeToRestoreP95Seconds: toSeconds(percentile(restoreDurations, 95)),
    incidentsResolved: restoreDurations.length,
  };
}

function toSeconds(milliseconds) {
  return milliseconds === null ? null : milliseconds / 1000;
}

module.exports = {
  computeDoraMetrics,
  computeRestoreDurations,
  finishedAt,
  isCompleted,
  isFailure,
  isSuccess,
  median,
  oldestCommitTimestamp,
  percentile,
};
