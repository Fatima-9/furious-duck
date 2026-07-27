// Charge un script externe une seule fois, meme si plusieurs composants
// le demandent. Renvoie une promesse resolue quand le script est pret.
const cache = {};

export function loadScript(src) {
  if (cache[src]) {
    return cache[src];
  }

  cache[src] = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      delete cache[src];
      reject(new Error(`Impossible de charger le script : ${src}`));
    };
    document.head.appendChild(script);
  });

  return cache[src];
}
