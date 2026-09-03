const { loadConfig, validateConfig, readNumber } = require("../src/config");
const { createRegistry, refreshMetrics, setOrRemove } = require("../src/metricsRegistry");
const { createApp } = require("../src/app");

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 7, 30, 12, 0, 0);

const CONFIG = {
  jenkinsUrl: "http://jenkins:8080/jenkins",
  jobPath: "job/furious-duck/job/PREPROD",
  jenkinsUser: "",
  jenkinsToken: "",
  windowDays: 30,
  maxBuilds: 200,
  timeoutMs: 5000,
  cacheTtlMs: 60000,
};

const SILENT = { error: () => {}, log: () => {} };

function jenkinsResponding(builds) {
  return jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: "OK",
    json: async () => ({ builds }),
  });
}

/** Lit la valeur d'une metrique dans le texte expose au format Prometheus. */
function metricValue(text, name, labels = "") {
  const needle = labels ? `${name}{${labels}}` : name;
  const line = text
    .split("\n")
    .find((l) => l.startsWith(`${needle} `));
  return line ? Number(line.split(" ")[1]) : undefined;
}

describe("config", () => {
  test("readNumber retombe sur la valeur par defaut si l'entree est invalide", () => {
    expect(readNumber("abc", 42)).toBe(42);
    expect(readNumber(undefined, 42)).toBe(42);
    expect(readNumber("7", 42)).toBe(7);
  });

  test("readNumber borne les valeurs hors limites", () => {
    expect(readNumber("0", 30, { min: 1, max: 365 })).toBe(1);
    expect(readNumber("9999", 30, { min: 1, max: 365 })).toBe(365);
  });

  test("loadConfig applique les valeurs par defaut", () => {
    const config = loadConfig({});
    expect(config.port).toBe(9110);
    expect(config.windowDays).toBe(30);
    expect(config.maxBuilds).toBe(200);
    expect(config.cacheTtlMs).toBe(60000);
  });

  test("loadConfig lit l'environnement", () => {
    const config = loadConfig({
      PORT: "9999",
      JENKINS_URL: "http://x",
      JENKINS_JOB_PATH: "job/y",
      DORA_ENVIRONMENT: "preprod",
      DORA_WINDOW_DAYS: "7",
    });
    expect(config.port).toBe(9999);
    expect(config.jenkinsUrl).toBe("http://x");
    expect(config.jobPath).toBe("job/y");
    expect(config.environment).toBe("preprod");
    expect(config.windowDays).toBe(7);
  });

  test("validateConfig exige URL et job", () => {
    const errors = validateConfig(loadConfig({}));
    expect(errors).toHaveLength(2);
    expect(errors.join(" ")).toMatch(/JENKINS_URL/);
    expect(errors.join(" ")).toMatch(/JENKINS_JOB_PATH/);
  });

  test("validateConfig refuse un utilisateur sans jeton", () => {
    const errors = validateConfig(
      loadConfig({ JENKINS_URL: "http://x", JENKINS_JOB_PATH: "job/y", JENKINS_USER: "bob" })
    );
    expect(errors.join(" ")).toMatch(/JENKINS_TOKEN/);
  });

  test("validateConfig accepte une configuration complete", () => {
    expect(
      validateConfig(
        loadConfig({
          JENKINS_URL: "http://x",
          JENKINS_JOB_PATH: "job/y",
          JENKINS_USER: "bob",
          JENKINS_TOKEN: "t",
        })
      )
    ).toEqual([]);
  });
});

describe("setOrRemove", () => {
  test("ecrit une valeur numerique", async () => {
    const { registry, metrics } = createRegistry();
    setOrRemove(metrics.leadTime, 120, { quantile: "0.5" });
    const text = await registry.metrics();
    expect(metricValue(text, "dora_lead_time_seconds", 'quantile="0.5"')).toBe(120);
  });

  test("retire la serie quand la valeur est nulle, au lieu d'ecrire 0", async () => {
    const { registry, metrics } = createRegistry();
    setOrRemove(metrics.leadTime, 120, { quantile: "0.5" });
    setOrRemove(metrics.leadTime, null, { quantile: "0.5" });

    const text = await registry.metrics();
    // Un MTTR ou lead time a 0 se lirait comme "instantane" alors que la
    // realite est "pas encore de donnee".
    expect(metricValue(text, "dora_lead_time_seconds", 'quantile="0.5"')).toBeUndefined();
  });

  test("remet a zero une jauge sans label", async () => {
    const { registry, metrics } = createRegistry();
    setOrRemove(metrics.lastDeployment, 1000);
    setOrRemove(metrics.lastDeployment, null);

    const text = await registry.metrics();
    expect(metricValue(text, "dora_last_deployment_timestamp_seconds")).toBeUndefined();
  });

  test("ignore NaN", async () => {
    const { registry, metrics } = createRegistry();
    setOrRemove(metrics.lastDeployment, NaN);
    const text = await registry.metrics();
    expect(metricValue(text, "dora_last_deployment_timestamp_seconds")).toBeUndefined();
  });
});

describe("refreshMetrics", () => {
  test("renseigne les quatre metriques DORA", async () => {
    const { registry, metrics } = createRegistry();
    const builds = [
      {
        number: 3,
        result: "SUCCESS",
        building: false,
        timestamp: NOW - 2 * DAY,
        duration: 0,
        changeSets: [{ items: [{ commitId: "a", timestamp: NOW - 4 * DAY }] }],
      },
      { number: 2, result: "FAILURE", building: false, timestamp: NOW - 5 * DAY, duration: 0 },
      { number: 1, result: "SUCCESS", building: false, timestamp: NOW - 8 * DAY, duration: 0 },
    ];

    const result = await refreshMetrics({
      metrics,
      config: CONFIG,
      fetchImpl: jenkinsResponding(builds),
      now: () => NOW,
    });

    expect(result.ok).toBe(true);

    const text = await registry.metrics();
    expect(metricValue(text, "dora_deployments_total")).toBe(2);
    expect(metricValue(text, "dora_deployment_frequency_per_day")).toBeCloseTo(2 / 30);
    expect(metricValue(text, "dora_lead_time_seconds", 'quantile="0.5"')).toBe(
      (2 * DAY) / 1000
    );
    expect(metricValue(text, "dora_change_failure_rate")).toBeCloseTo(1 / 3);
    expect(metricValue(text, "dora_time_to_restore_seconds", 'quantile="0.5"')).toBe(
      (3 * DAY) / 1000
    );
    expect(metricValue(text, "dora_scrape_success")).toBe(1);
  });

  test("ne garde que les builds de l'environnement configure", async () => {
    const { registry, metrics } = createRegistry();
    const builds = [
      {
        number: 2,
        description: "branch=PREPROD deploy_env=preprod",
        result: "SUCCESS",
        building: false,
        timestamp: NOW - DAY,
        duration: 0,
      },
      {
        number: 1,
        description: "branch=DEV deploy_env=dev",
        result: "SUCCESS",
        building: false,
        timestamp: NOW - DAY,
        duration: 0,
      },
    ];

    await refreshMetrics({
      metrics,
      config: { ...CONFIG, environment: "preprod" },
      fetchImpl: jenkinsResponding(builds),
      now: () => NOW,
    });

    const text = await registry.metrics();
    expect(metricValue(text, "dora_deployments_total")).toBe(1);
    expect(metricValue(text, "dora_builds_total")).toBe(1);
  });

  test("passe scrape_success a 0 quand Jenkins echoue", async () => {
    const { registry, metrics } = createRegistry();

    const result = await refreshMetrics({
      metrics,
      config: CONFIG,
      fetchImpl: jest.fn().mockRejectedValue(new Error("ECONNREFUSED")),
      now: () => NOW,
    });

    expect(result.ok).toBe(false);
    const text = await registry.metrics();
    expect(metricValue(text, "dora_scrape_success")).toBe(0);
  });

  test("conserve les dernieres valeurs connues apres un echec Jenkins", async () => {
    const { registry, metrics } = createRegistry();
    const builds = [
      { number: 1, result: "SUCCESS", building: false, timestamp: NOW - DAY, duration: 0 },
    ];

    await refreshMetrics({
      metrics,
      config: CONFIG,
      fetchImpl: jenkinsResponding(builds),
      now: () => NOW,
    });
    await refreshMetrics({
      metrics,
      config: CONFIG,
      fetchImpl: jest.fn().mockRejectedValue(new Error("boom")),
      now: () => NOW,
    });

    const text = await registry.metrics();
    // Effacer les metriques a chaque hoquet reseau ferait clignoter les
    // dashboards et declencherait de fausses alertes.
    expect(metricValue(text, "dora_deployments_total")).toBe(1);
    expect(metricValue(text, "dora_scrape_success")).toBe(0);
  });

  test("renseigne l'horodatage du dernier appel reussi", async () => {
    const { registry, metrics } = createRegistry();

    await refreshMetrics({
      metrics,
      config: CONFIG,
      fetchImpl: jenkinsResponding([]),
      now: () => NOW,
    });

    const text = await registry.metrics();
    expect(
      metricValue(text, "dora_last_successful_scrape_timestamp_seconds")
    ).toBe(Math.floor(NOW / 1000));
  });
});

describe("serveur HTTP", () => {
  /** Appelle le handler du serveur sans ouvrir de socket. */
  function call(app, url) {
    return new Promise((resolve) => {
      const chunks = [];
      const res = {
        writeHead(status, headers) {
          this.statusCode = status;
          this.headers = headers;
        },
        end(body) {
          if (body) chunks.push(body);
          resolve({ status: this.statusCode, headers: this.headers, body: chunks.join("") });
        },
      };
      app.server.emit("request", { url, method: "GET" }, res);
    });
  }

  test("/health repond 200", async () => {
    const app = createApp({
      config: CONFIG,
      fetchImpl: jenkinsResponding([]),
      now: () => NOW,
      logger: SILENT,
    });

    const res = await call(app, "/health");
    expect(res.status).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ status: "ok" });
  });

  test("/metrics expose le format Prometheus", async () => {
    const app = createApp({
      config: CONFIG,
      fetchImpl: jenkinsResponding([
        { number: 1, result: "SUCCESS", building: false, timestamp: NOW - DAY, duration: 0 },
      ]),
      now: () => NOW,
      logger: SILENT,
    });

    const res = await call(app, "/metrics");
    expect(res.status).toBe(200);
    expect(res.headers["Content-Type"]).toMatch(/text\/plain/);
    expect(res.body).toContain("# HELP dora_deployments_total");
    expect(metricValue(res.body, "dora_deployments_total")).toBe(1);
  });

  test("une route inconnue repond 404", async () => {
    const app = createApp({ config: CONFIG, fetchImpl: jenkinsResponding([]), logger: SILENT });
    const res = await call(app, "/autre");
    expect(res.status).toBe(404);
  });

  test("ignore la query string dans le routage", async () => {
    const app = createApp({ config: CONFIG, fetchImpl: jenkinsResponding([]), logger: SILENT });
    const res = await call(app, "/health?x=1");
    expect(res.status).toBe(200);
  });

  test("le cache evite de rappeler Jenkins a chaque scrape", async () => {
    const fetchImpl = jenkinsResponding([]);
    const app = createApp({
      config: CONFIG,
      fetchImpl,
      now: () => NOW,
      logger: SILENT,
    });

    await call(app, "/metrics");
    await call(app, "/metrics");
    await call(app, "/metrics");

    // Prometheus scrape toutes les 15 s ; sans cache, ce serait 5 760 appels
    // par jour a l'API Jenkins pour une donnee qui bouge a chaque build.
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  test("le cache expire apres le TTL", async () => {
    const fetchImpl = jenkinsResponding([]);
    let clock = NOW;
    const app = createApp({
      config: { ...CONFIG, cacheTtlMs: 1000 },
      fetchImpl,
      now: () => clock,
      logger: SILENT,
    });

    await call(app, "/metrics");
    clock += 2000;
    await call(app, "/metrics");

    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  test("des scrapes simultanes ne declenchent qu'un seul appel a Jenkins", async () => {
    let resolveFetch;
    const fetchImpl = jest.fn().mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = () =>
          resolve({ ok: true, status: 200, json: async () => ({ builds: [] }) });
      })
    );
    const app = createApp({ config: CONFIG, fetchImpl, now: () => NOW, logger: SILENT });

    const first = call(app, "/metrics");
    const second = call(app, "/metrics");
    resolveFetch();
    await Promise.all([first, second]);

    // Sans le garde-fou inFlight, chaque scrape arrivant pendant un appel en
    // cours en declencherait un nouveau (effet troupeau).
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  test("repond 500 si le registre echoue", async () => {
    const app = createApp({ config: CONFIG, fetchImpl: jenkinsResponding([]), logger: SILENT });
    jest.spyOn(app.registry, "metrics").mockRejectedValue(new Error("registre casse"));

    const res = await call(app, "/metrics");
    expect(res.status).toBe(500);
    expect(res.body).toBe("internal error");
  });

  test("/metrics reste disponible quand Jenkins est injoignable", async () => {
    const app = createApp({
      config: CONFIG,
      fetchImpl: jest.fn().mockRejectedValue(new Error("ECONNREFUSED")),
      now: () => NOW,
      logger: SILENT,
    });

    const res = await call(app, "/metrics");
    // L'exporter doit repondre 200 avec scrape_success=0, sinon Prometheus
    // marque la cible "down" et on perd aussi l'information de l'echec.
    expect(res.status).toBe(200);
    expect(metricValue(res.body, "dora_scrape_success")).toBe(0);
  });
});
