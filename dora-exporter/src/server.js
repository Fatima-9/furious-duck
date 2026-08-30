const { loadConfig, validateConfig } = require("./config");
const { createApp } = require("./app");

const config = loadConfig();
const errors = validateConfig(config);

if (errors.length > 0) {
  console.error("[dora-exporter] Configuration invalide :");
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  process.exit(1);
}

const { server } = createApp({ config });

server.listen(config.port, () => {
  console.log(
    `[dora-exporter] En ecoute sur le port ${config.port} | job=${config.jobPath} | fenetre=${config.windowDays} j`
  );
});

// Sans cela, docker stop attend 10 s puis tue le process a coups de SIGKILL.
for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => {
    console.log(`[dora-exporter] ${signal} recu, arret en cours`);
    server.close(() => process.exit(0));
  });
}
