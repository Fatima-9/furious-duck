const {
  JenkinsError,
  buildAuthHeader,
  buildUrl,
  fetchBuilds,
} = require("../src/jenkinsClient");

/** Reponse fetch minimale. */
function response(body, { ok = true, status = 200, statusText = "OK" } = {}) {
  return {
    ok,
    status,
    statusText,
    json: async () => body,
  };
}

const BASE = {
  baseUrl: "http://jenkins:8080/jenkins",
  jobPath: "job/furious-duck/job/PREPROD",
};

describe("buildAuthHeader", () => {
  test("encode l'identifiant et le jeton en Basic", () => {
    expect(buildAuthHeader("bob", "token")).toEqual({
      Authorization: `Basic ${Buffer.from("bob:token").toString("base64")}`,
    });
  });

  test("n'ajoute rien si l'un des deux manque", () => {
    expect(buildAuthHeader("", "token")).toEqual({});
    expect(buildAuthHeader("bob", "")).toEqual({});
    expect(buildAuthHeader()).toEqual({});
  });
});

describe("buildUrl", () => {
  test("assemble une URL correcte", () => {
    const url = buildUrl(BASE.baseUrl, BASE.jobPath, 200);
    expect(url).toContain("http://jenkins:8080/jenkins/job/furious-duck/job/PREPROD/api/json");
    expect(decodeURIComponent(url)).toContain("description");
    expect(url).toContain("tree=");
  });

  test("ne produit pas de double slash", () => {
    // Jenkins derriere --prefix=/jenkins repond 404 sur un double slash.
    const url = buildUrl("http://jenkins:8080/jenkins/", "/job/x/", 10);
    expect(url).not.toMatch(/[^:]\/\//);
  });

  test("encode le parametre tree", () => {
    const url = buildUrl(BASE.baseUrl, BASE.jobPath, 5);
    expect(url).toContain("%5B");
    expect(url).toContain("%7B0%2C5%7D");
  });
});

describe("fetchBuilds", () => {
  test("renvoie la liste des builds", async () => {
    const builds = [{ number: 2 }, { number: 1 }];
    const fetchImpl = jest.fn().mockResolvedValue(response({ builds }));

    await expect(fetchBuilds({ ...BASE, fetchImpl })).resolves.toEqual(builds);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  test("transmet l'en-tete d'authentification", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(response({ builds: [] }));

    await fetchBuilds({ ...BASE, user: "bob", token: "t", fetchImpl });

    const [, options] = fetchImpl.mock.calls[0];
    expect(options.headers.Authorization).toMatch(/^Basic /);
  });

  test("echoue explicitement sans URL", async () => {
    await expect(fetchBuilds({ jobPath: "x" })).rejects.toThrow(/JENKINS_URL/);
  });

  test("echoue explicitement sans job", async () => {
    await expect(fetchBuilds({ baseUrl: "http://x" })).rejects.toThrow(
      /JENKINS_JOB_PATH/
    );
  });

  test("remonte le code HTTP en cas de reponse non ok", async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValue(response(null, { ok: false, status: 403, statusText: "Forbidden" }));

    await expect(fetchBuilds({ ...BASE, fetchImpl })).rejects.toThrow(/403 Forbidden/);
  });

  test("signale un JSON invalide", async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error("Unexpected token");
      },
    });

    await expect(fetchBuilds({ ...BASE, fetchImpl })).rejects.toThrow(/illisible/);
  });

  test("signale une reponse sans champ builds", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(response({ jobs: [] }));

    await expect(fetchBuilds({ ...BASE, fetchImpl })).rejects.toThrow(/'builds' absent/);
  });

  test("signale une reponse vide", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(response(null));

    await expect(fetchBuilds({ ...BASE, fetchImpl })).rejects.toThrow(/inattendue/);
  });

  test("transforme un timeout en JenkinsError lisible", async () => {
    const abortError = new Error("aborted");
    abortError.name = "AbortError";
    const fetchImpl = jest.fn().mockRejectedValue(abortError);

    await expect(
      fetchBuilds({ ...BASE, timeoutMs: 1234, fetchImpl })
    ).rejects.toThrow(/n'a pas repondu en 1234 ms/);
  });

  test("enveloppe une erreur reseau", async () => {
    const fetchImpl = jest.fn().mockRejectedValue(new Error("ECONNREFUSED"));

    const promise = fetchBuilds({ ...BASE, fetchImpl });
    await expect(promise).rejects.toThrow(/ECONNREFUSED/);
    await expect(promise).rejects.toBeInstanceOf(JenkinsError);
  });

  test("passe un signal d'abandon a fetch", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(response({ builds: [] }));

    await fetchBuilds({ ...BASE, fetchImpl });

    const [, options] = fetchImpl.mock.calls[0];
    expect(options.signal).toBeDefined();
  });
});
