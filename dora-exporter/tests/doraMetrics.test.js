const {
  computeDoraMetrics,
  computeRestoreDurations,
  finishedAt,
  isCompleted,
  isFailure,
  isSuccess,
  matchesEnvironment,
  median,
  oldestCommitTimestamp,
  percentile,
} = require("../src/doraMetrics");

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const NOW = Date.UTC(2026, 7, 30, 12, 0, 0);

/** Fabrique un build Jenkins minimal mais realiste. */
function build({
  daysAgo = 0,
  result = "SUCCESS",
  duration = 5 * 60 * 1000,
  commits = [],
  building = false,
  number = 1,
}) {
  return {
    number,
    result,
    building,
    timestamp: NOW - daysAgo * DAY,
    duration,
    changeSets: commits.length
      ? [{ items: commits.map((c, i) => ({ commitId: `sha${i}`, timestamp: c })) }]
      : [],
  };
}

describe("helpers", () => {
  test("median gere les longueurs paires et impaires", () => {
    expect(median([])).toBeNull();
    expect(median([5])).toBe(5);
    expect(median([1, 3])).toBe(2);
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 3, 2])).toBe(2.5);
  });

  test("median ne modifie pas le tableau source", () => {
    const values = [3, 1, 2];
    median(values);
    expect(values).toEqual([3, 1, 2]);
  });

  test("percentile encadre les bornes", () => {
    expect(percentile([], 95)).toBeNull();
    expect(percentile([1, 2, 3, 4, 5], 95)).toBe(5);
    expect(percentile([1, 2, 3, 4, 5], 50)).toBe(3);
    expect(percentile([1, 2, 3, 4, 5], 0)).toBe(1);
  });

  test("finishedAt ajoute la duree, et tolere une duree absente", () => {
    expect(finishedAt({ timestamp: 1000, duration: 500 })).toBe(1500);
    expect(finishedAt({ timestamp: 1000 })).toBe(1000);
  });

  test("isSuccess, isFailure et isCompleted classent les resultats Jenkins", () => {
    expect(isSuccess({ result: "SUCCESS" })).toBe(true);
    expect(isFailure({ result: "FAILURE" })).toBe(true);
    // UNSTABLE = build passe mais tests rouges : c'est un echec de changement.
    expect(isFailure({ result: "UNSTABLE" })).toBe(true);
    expect(isCompleted({ result: "SUCCESS", building: false })).toBe(true);
    // Un build en cours n'est ni un succes ni un echec.
    expect(isCompleted({ result: null, building: true })).toBe(false);
    // ABORTED est exclu : annulation humaine, pas un echec de changement.
    expect(isCompleted({ result: "ABORTED", building: false })).toBe(false);
  });

  test("matchesEnvironment lit l'environnement marque par Jenkins", () => {
    expect(
      matchesEnvironment({ description: "branch=PREPROD deploy_env=preprod" }, "preprod")
    ).toBe(true);
    expect(
      matchesEnvironment({ description: "branch=DEV deploy_env=dev" }, "preprod")
    ).toBe(false);
    expect(matchesEnvironment({ description: "" }, "")).toBe(true);
  });

  test("oldestCommitTimestamp retient le commit le plus ancien", () => {
    const b = build({ commits: [NOW - 3 * DAY, NOW - 1 * DAY, NOW - 5 * DAY] });
    expect(oldestCommitTimestamp(b)).toBe(NOW - 5 * DAY);
  });

  test("oldestCommitTimestamp renvoie null sans changeset", () => {
    expect(oldestCommitTimestamp(build({}))).toBeNull();
    expect(oldestCommitTimestamp({})).toBeNull();
    expect(oldestCommitTimestamp({ changeSets: [{}] })).toBeNull();
  });

  test("oldestCommitTimestamp ignore les horodatages non numeriques", () => {
    const b = {
      changeSets: [
        { items: [{ commitId: "a", timestamp: "hier" }, { commitId: "b", timestamp: 42 }] },
      ],
    };
    expect(oldestCommitTimestamp(b)).toBe(42);
  });
});

describe("1. Frequence de deploiement", () => {
  test("compte les deploiements reussis sur la fenetre", () => {
    const builds = [
      build({ daysAgo: 1, number: 3 }),
      build({ daysAgo: 5, number: 2 }),
      build({ daysAgo: 10, number: 1 }),
    ];
    const dora = computeDoraMetrics(builds, { windowDays: 30, now: NOW });

    expect(dora.deploymentsTotal).toBe(3);
    expect(dora.deploymentsPerDay).toBeCloseTo(3 / 30);
  });

  test("exclut les builds hors fenetre", () => {
    const builds = [
      build({ daysAgo: 5, number: 2 }),
      build({ daysAgo: 40, number: 1 }),
    ];
    const dora = computeDoraMetrics(builds, { windowDays: 30, now: NOW });

    expect(dora.deploymentsTotal).toBe(1);
  });

  test("les echecs ne comptent pas comme des deploiements", () => {
    const builds = [
      build({ daysAgo: 1, result: "FAILURE", number: 2 }),
      build({ daysAgo: 2, number: 1 }),
    ];
    const dora = computeDoraMetrics(builds, { windowDays: 30, now: NOW });

    expect(dora.deploymentsTotal).toBe(1);
  });

  test("filtre les builds par environnement quand Jenkins melange plusieurs branches", () => {
    const builds = [
      build({ daysAgo: 1, number: 3, result: "SUCCESS" }),
      build({ daysAgo: 2, number: 2, result: "SUCCESS" }),
      build({ daysAgo: 3, number: 1, result: "FAILURE" }),
    ];
    builds[0].description = "branch=PREPROD deploy_env=preprod";
    builds[1].description = "branch=DEV deploy_env=dev";
    builds[2].description = "branch=PREPROD deploy_env=preprod";

    const dora = computeDoraMetrics(builds, {
      windowDays: 30,
      environment: "preprod",
      now: NOW,
    });

    expect(dora.deploymentsTotal).toBe(1);
    expect(dora.buildsTotal).toBe(2);
    expect(dora.failuresTotal).toBe(1);
  });

  test("remonte l'horodatage du dernier deploiement", () => {
    const builds = [
      build({ daysAgo: 10, number: 1 }),
      build({ daysAgo: 2, duration: HOUR, number: 2 }),
    ];
    const dora = computeDoraMetrics(builds, { windowDays: 30, now: NOW });

    expect(dora.lastDeploymentTimestampSeconds).toBe(
      Math.floor((NOW - 2 * DAY + HOUR) / 1000)
    );
  });

  test("aucun deploiement : frequence a zero et dernier deploiement absent", () => {
    const dora = computeDoraMetrics([], { windowDays: 30, now: NOW });

    expect(dora.deploymentsTotal).toBe(0);
    expect(dora.deploymentsPerDay).toBe(0);
    expect(dora.lastDeploymentTimestampSeconds).toBeNull();
  });
});

describe("2. Lead time for changes", () => {
  test("mesure du commit le plus ancien a la fin du build", () => {
    const builds = [
      build({ daysAgo: 1, duration: HOUR, commits: [NOW - 3 * DAY] }),
    ];
    const dora = computeDoraMetrics(builds, { windowDays: 30, now: NOW });

    // commit a J-3, build termine a J-1 + 1 h  =>  2 jours + 1 heure
    expect(dora.leadTimeMedianSeconds).toBe((2 * DAY + HOUR) / 1000);
    expect(dora.leadTimeSamples).toBe(1);
  });

  test("part du commit le plus ancien du lot, pas du plus recent", () => {
    const builds = [
      build({
        daysAgo: 1,
        duration: 0,
        commits: [NOW - 2 * DAY, NOW - 6 * DAY, NOW - 4 * DAY],
      }),
    ];
    const dora = computeDoraMetrics(builds, { windowDays: 30, now: NOW });

    expect(dora.leadTimeMedianSeconds).toBe((5 * DAY) / 1000);
  });

  test("ignore les builds sans commit, comme les relances manuelles", () => {
    const builds = [
      build({ daysAgo: 1, duration: 0, commits: [NOW - 2 * DAY], number: 2 }),
      build({ daysAgo: 2, duration: 0, commits: [], number: 1 }),
    ];
    const dora = computeDoraMetrics(builds, { windowDays: 30, now: NOW });

    expect(dora.leadTimeSamples).toBe(1);
    expect(dora.deploymentsTotal).toBe(2);
  });

  test("ecarte un lead time negatif du a une horloge desynchronisee", () => {
    const builds = [
      // Commit date dans le futur par rapport a la fin du build.
      build({ daysAgo: 5, duration: 0, commits: [NOW - 1 * DAY] }),
    ];
    const dora = computeDoraMetrics(builds, { windowDays: 30, now: NOW });

    expect(dora.leadTimeSamples).toBe(0);
    expect(dora.leadTimeMedianSeconds).toBeNull();
  });

  test("aucun echantillon : mediane et p95 absentes plutot qu'a zero", () => {
    const dora = computeDoraMetrics([], { windowDays: 30, now: NOW });

    expect(dora.leadTimeMedianSeconds).toBeNull();
    expect(dora.leadTimeP95Seconds).toBeNull();
  });
});

describe("3. Change failure rate", () => {
  test("rapporte les echecs au total des builds termines", () => {
    const builds = [
      build({ daysAgo: 1, result: "FAILURE", number: 4 }),
      build({ daysAgo: 2, number: 3 }),
      build({ daysAgo: 3, number: 2 }),
      build({ daysAgo: 4, number: 1 }),
    ];
    const dora = computeDoraMetrics(builds, { windowDays: 30, now: NOW });

    expect(dora.buildsTotal).toBe(4);
    expect(dora.failuresTotal).toBe(1);
    expect(dora.changeFailureRate).toBe(0.25);
  });

  test("UNSTABLE compte comme un echec", () => {
    const builds = [
      build({ daysAgo: 1, result: "UNSTABLE", number: 2 }),
      build({ daysAgo: 2, number: 1 }),
    ];
    const dora = computeDoraMetrics(builds, { windowDays: 30, now: NOW });

    expect(dora.changeFailureRate).toBe(0.5);
  });

  test("ABORTED est exclu du calcul et ne gonfle pas le taux", () => {
    const builds = [
      build({ daysAgo: 1, result: "ABORTED", number: 3 }),
      build({ daysAgo: 2, result: "FAILURE", number: 2 }),
      build({ daysAgo: 3, number: 1 }),
    ];
    const dora = computeDoraMetrics(builds, { windowDays: 30, now: NOW });

    expect(dora.buildsTotal).toBe(2);
    expect(dora.changeFailureRate).toBe(0.5);
  });

  test("les builds en cours sont exclus", () => {
    const builds = [
      build({ daysAgo: 0, result: null, building: true, number: 3 }),
      build({ daysAgo: 1, result: "FAILURE", number: 2 }),
      build({ daysAgo: 2, number: 1 }),
    ];
    const dora = computeDoraMetrics(builds, { windowDays: 30, now: NOW });

    expect(dora.buildsTotal).toBe(2);
  });

  test("aucun build : taux a zero et non NaN", () => {
    const dora = computeDoraMetrics([], { windowDays: 30, now: NOW });

    expect(dora.changeFailureRate).toBe(0);
    expect(Number.isNaN(dora.changeFailureRate)).toBe(false);
  });
});

describe("4. Time to restore service", () => {
  test("mesure du premier echec au retour au vert", () => {
    // ordre chronologique : succes, echec, succes
    const builds = [
      { result: "SUCCESS", building: false, timestamp: NOW - 10 * DAY, duration: 0 },
      { result: "FAILURE", building: false, timestamp: NOW - 5 * DAY, duration: 0 },
      { result: "SUCCESS", building: false, timestamp: NOW - 3 * DAY, duration: 0 },
    ];
    const dora = computeDoraMetrics(builds, { windowDays: 30, now: NOW });

    expect(dora.incidentsResolved).toBe(1);
    expect(dora.timeToRestoreMedianSeconds).toBe((2 * DAY) / 1000);
  });

  test("une serie d'echecs consecutifs est un seul incident", () => {
    const builds = [
      { result: "FAILURE", building: false, timestamp: NOW - 6 * DAY, duration: 0 },
      { result: "FAILURE", building: false, timestamp: NOW - 5 * DAY, duration: 0 },
      { result: "FAILURE", building: false, timestamp: NOW - 4 * DAY, duration: 0 },
      { result: "SUCCESS", building: false, timestamp: NOW - 2 * DAY, duration: 0 },
    ];
    const dora = computeDoraMetrics(builds, { windowDays: 30, now: NOW });

    expect(dora.incidentsResolved).toBe(1);
    // Depuis le PREMIER echec (J-6), pas le dernier.
    expect(dora.timeToRestoreMedianSeconds).toBe((4 * DAY) / 1000);
  });

  test("un incident encore ouvert n'est pas comptabilise", () => {
    const builds = [
      { result: "SUCCESS", building: false, timestamp: NOW - 5 * DAY, duration: 0 },
      { result: "FAILURE", building: false, timestamp: NOW - 1 * DAY, duration: 0 },
    ];
    const dora = computeDoraMetrics(builds, { windowDays: 30, now: NOW });

    expect(dora.incidentsResolved).toBe(0);
    expect(dora.timeToRestoreMedianSeconds).toBeNull();
  });

  test("plusieurs incidents distincts sont mesures separement", () => {
    const builds = [
      { result: "FAILURE", building: false, timestamp: NOW - 20 * DAY, duration: 0 },
      { result: "SUCCESS", building: false, timestamp: NOW - 19 * DAY, duration: 0 },
      { result: "FAILURE", building: false, timestamp: NOW - 10 * DAY, duration: 0 },
      { result: "SUCCESS", building: false, timestamp: NOW - 7 * DAY, duration: 0 },
    ];
    const dora = computeDoraMetrics(builds, { windowDays: 30, now: NOW });

    expect(dora.incidentsResolved).toBe(2);
    // Incidents de 1 j et 3 j -> mediane 2 j
    expect(dora.timeToRestoreMedianSeconds).toBe((2 * DAY) / 1000);
  });

  test("computeRestoreDurations part d'une liste triee du plus ancien au plus recent", () => {
    const durations = computeRestoreDurations([
      { result: "FAILURE", building: false, timestamp: 0, duration: 0 },
      { result: "SUCCESS", building: false, timestamp: 1000, duration: 0 },
    ]);

    expect(durations).toEqual([1000]);
  });

  test("un succes sans echec anterieur ne cree pas d'incident", () => {
    expect(
      computeRestoreDurations([
        { result: "SUCCESS", building: false, timestamp: 0, duration: 0 },
        { result: "SUCCESS", building: false, timestamp: 1000, duration: 0 },
      ])
    ).toEqual([]);
  });
});

describe("robustesse", () => {
  test("l'ordre des builds en entree n'influe pas sur le resultat", () => {
    const chrono = [
      { result: "FAILURE", building: false, timestamp: NOW - 6 * DAY, duration: 0 },
      { result: "SUCCESS", building: false, timestamp: NOW - 4 * DAY, duration: 0 },
    ];
    const inverse = [...chrono].reverse();

    expect(computeDoraMetrics(inverse, { windowDays: 30, now: NOW })).toEqual(
      computeDoraMetrics(chrono, { windowDays: 30, now: NOW })
    );
  });

  test("tolere une entree qui n'est pas un tableau", () => {
    const dora = computeDoraMetrics(null, { windowDays: 30, now: NOW });
    expect(dora.deploymentsTotal).toBe(0);
  });

  test("ignore les builds sans horodatage", () => {
    const dora = computeDoraMetrics(
      [{ result: "SUCCESS", building: false, duration: 0 }],
      { windowDays: 30, now: NOW }
    );
    expect(dora.deploymentsTotal).toBe(0);
  });

  test("utilise la fenetre par defaut de 30 jours", () => {
    const dora = computeDoraMetrics([], { now: NOW });
    expect(dora.windowDays).toBe(30);
  });
});
