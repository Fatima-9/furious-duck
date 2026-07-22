// Caracteres qui font qu'Excel/LibreOffice interpretent une cellule comme une
// formule. Un nom qui commence par "=" pourrait executer du code chez la
// personne qui ouvre l'export : on neutralise en prefixant par une apostrophe.
const FORMULA_PREFIXES = ["=", "+", "-", "@", "\t", "\r"];

function escapeCsvValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  let text = value instanceof Date ? value.toISOString() : String(value);

  if (FORMULA_PREFIXES.includes(text.charAt(0))) {
    text = `'${text}`;
  }

  // Une valeur contenant un separateur, un guillemet ou un saut de ligne doit
  // etre entouree de guillemets, et ses guillemets internes doubles.
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function toCsv(rows, columns) {
  const header = columns.map(escapeCsvValue).join(",");
  const lines = rows.map((row) =>
    columns.map((column) => escapeCsvValue(row[column])).join(",")
  );

  return [header, ...lines].join("\n");
}

module.exports = {
  toCsv,
  escapeCsvValue,
};
