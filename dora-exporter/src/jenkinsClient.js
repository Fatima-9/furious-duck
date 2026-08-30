const DEFAULT_TIMEOUT_MS = 15000;

/**
 * Champs demandes a l'API Jenkins.
 *
 * On passe par ?tree= plutot que de recuperer le JSON complet : une instance
 * Jenkins avec quelques centaines de builds renvoie plusieurs megaoctets par
 * appel sinon, et l'exporter est interroge toutes les 60 secondes.
 *
 * changeSets porte les commits inclus dans le build, avec leur horodatage.
 * C'est ce qui permet de calculer le lead time sans avoir besoin d'un acces
 * au depot git depuis le conteneur.
 */
const BUILD_TREE = [
  "number",
  "result",
  "timestamp",
  "duration",
  "building",
  "changeSets[items[commitId,timestamp]]",
].join(",");

class JenkinsError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = "JenkinsError";
    this.cause = cause;
  }
}

/**
 * Construit l'en-tete Authorization pour Jenkins.
 * Jenkins accepte un token d'API en Basic auth, a la place du mot de passe.
 */
function buildAuthHeader(user, token) {
  if (!user || !token) {
    return {};
  }
  const encoded = Buffer.from(`${user}:${token}`).toString("base64");
  return { Authorization: `Basic ${encoded}` };
}

/**
 * Assemble l'URL de l'API en evitant les doubles slashs, qui font repondre
 * 404 a Jenkins quand il est servi derriere un prefixe (--prefix=/jenkins).
 */
function buildUrl(baseUrl, jobPath, maxBuilds) {
  const base = String(baseUrl).replace(/\/+$/, "");
  const path = String(jobPath).replace(/^\/+/, "").replace(/\/+$/, "");
  const tree = `builds[${BUILD_TREE}]{0,${maxBuilds}}`;
  return `${base}/${path}/api/json?tree=${encodeURIComponent(tree)}`;
}

/**
 * Recupere l'historique de builds d'un job Jenkins.
 *
 * Renvoie la liste brute des builds, du plus recent au plus ancien (ordre
 * garanti par Jenkins). Les builds en cours sont conserves : c'est
 * l'appelant qui decide de les ignorer, car un build en cours n'est ni un
 * succes ni un echec et ne doit pas peser sur le taux d'echec.
 */
async function fetchBuilds({
  baseUrl,
  jobPath,
  user,
  token,
  maxBuilds = 200,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  fetchImpl = fetch,
}) {
  if (!baseUrl) {
    throw new JenkinsError("JENKINS_URL n'est pas configure");
  }
  if (!jobPath) {
    throw new JenkinsError("JENKINS_JOB_PATH n'est pas configure");
  }

  const url = buildUrl(baseUrl, jobPath, maxBuilds);

  // Sans timeout explicite, un Jenkins qui ne repond pas bloquerait le
  // rafraichissement des metriques indefiniment.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetchImpl(url, {
      headers: {
        Accept: "application/json",
        ...buildAuthHeader(user, token),
      },
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new JenkinsError(`Jenkins n'a pas repondu en ${timeoutMs} ms`, error);
    }
    throw new JenkinsError(`Appel a Jenkins impossible : ${error.message}`, error);
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    throw new JenkinsError(
      `Jenkins a repondu ${response.status} ${response.statusText || ""}`.trim()
    );
  }

  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    throw new JenkinsError("Reponse Jenkins illisible (JSON invalide)", error);
  }

  if (!payload || !Array.isArray(payload.builds)) {
    throw new JenkinsError("Reponse Jenkins inattendue : champ 'builds' absent");
  }

  return payload.builds;
}

module.exports = {
  BUILD_TREE,
  JenkinsError,
  buildAuthHeader,
  buildUrl,
  fetchBuilds,
};
