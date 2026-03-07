const m = require("./backups/latest/matches.json");
const combos = [...new Set(m.map((r) => r.sport + "||" + r.gender))];
console.log("Unique match sport||gender combos:");
combos.forEach((c) => console.log("  ", c));
