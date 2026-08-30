const http = require("http");

const { createRegistry, refreshMetrics } = require("./metricsRegistry");

/**
 * Cree le serveur HTTP de l'exporter.
 *
 * Volontairement sans framework : l'exporter n'a que deux routes, ajouter
 * Express pour cela n'apporterait qu'une dependance a maintenir.
 */
function createApp({ config, fetchImpl = fetch, now = Date.now, logger = console }) {
  const { registry, metrics } = createRegistry();

  let cachedAt = 0;
  let inFlight = null;

  /**
   * Rafraichit les metriques en respectant le TTL du cache.
   *
   * `inFlight` evite l'effet troupeau : si plusieurs scrapes arrivent pendant
   * qu'un appel a Jenkins est en cours, ils attendent le meme appel au lieu
   * d'en declencher un chacun.
   */
  async function ensureFresh() {
    const age = now() - cachedAt;
    if (age < config.cacheTtlMs && cachedAt !== 0) {
      return;
    }
    if (inFlight) {
      return inFlight;
    }

    inFlight = refreshMetrics({ metrics, config, fetchImpl, now })
      .then((result) => {
        cachedAt = now();
        if (!result.ok) {
          logger.error(
            `[dora-exporter] Jenkins injoignable : ${result.error.message}`
          );
        }
        return result;
      })
      .finally(() => {
        inFlight = null;
      });

    return inFlight;
  }

  const server = http.createServer(async (req, res) => {
    const url = (req.url || "/").split("?")[0];

    if (url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok" }));
      return;
    }

    if (url === "/metrics") {
      try {
        await ensureFresh();
        const body = await registry.metrics();
        res.writeHead(200, { "Content-Type": registry.contentType });
        res.end(body);
      } catch (error) {
        // Une erreur ici vient du registre, pas de Jenkins : un echec Jenkins
        // est deja absorbe par refreshMetrics.
        logger.error(`[dora-exporter] Erreur interne : ${error.message}`);
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("internal error");
      }
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("not found");
  });

  return { server, registry, metrics, ensureFresh };
}

module.exports = { createApp };
