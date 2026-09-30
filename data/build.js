const fs = require("fs");
const path = require("path");

const LEVELS = ["primary", "middle", "high", "cet4"];
const dataDir = __dirname;

function parseLevel(name) {
  const raw = fs.readFileSync(path.join(dataDir, name + ".txt"), "utf8");
  const lines = raw.split(/\r?\n/);
  const seen = new Set();
  const entries = [];
  let malformed = 0;
  let duplicates = 0;
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    const parts = line.split("|");
    if (parts.length !== 3 || !parts[0].trim() || !parts[1].trim() || !parts[2].trim()) {
      malformed++;
      console.error(`[${name}] malformed line: "${line}"`);
      continue;
    }
    const en = parts[0].trim();
    const phonetic = parts[1].trim();
    const zh = parts[2].trim();
    const key = en.toLowerCase();
    if (seen.has(key)) {
      duplicates++;
      continue;
    }
    seen.add(key);
    entries.push([en, phonetic, zh]);
  }
  return { entries, malformed, duplicates };
}

const results = {};
for (const lvl of LEVELS) {
  results[lvl] = parseLevel(lvl);
}

// cross-level duplicate info (not removed, just reported)
const wordToLevels = new Map();
for (const lvl of LEVELS) {
  for (const [en] of results[lvl].entries) {
    const key = en.toLowerCase();
    if (!wordToLevels.has(key)) wordToLevels.set(key, []);
    wordToLevels.get(key).push(lvl);
  }
}
let crossLevelCount = 0;
for (const [, lvls] of wordToLevels) {
  if (new Set(lvls).size > 1) crossLevelCount++;
}

console.log("==== Build report ====");
for (const lvl of LEVELS) {
  const r = results[lvl];
  console.log(`${lvl}: final=${r.entries.length}  malformed=${r.malformed}  intra-level duplicates removed=${r.duplicates}`);
}
console.log(`cross-level duplicate words (appear in >1 level): ${crossLevelCount}`);

function toTemplateLiteral(entries) {
  return entries.map(([en, phonetic, zh]) => `${en}|${phonetic}|${zh}`).join("\n");
}

const jsBlock = `const RAW_PRIMARY = \`
${toTemplateLiteral(results.primary.entries)}
\`;

const RAW_MIDDLE = \`
${toTemplateLiteral(results.middle.entries)}
\`;

const RAW_HIGH = \`
${toTemplateLiteral(results.high.entries)}
\`;

const RAW_CET4 = \`
${toTemplateLiteral(results.cet4.entries)}
\`;

function parseWordList(raw) {
  return raw
    .split("\\n")
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => line.split("|"));
}

const WORD_BANK = {
  primary: parseWordList(RAW_PRIMARY),
  middle: parseWordList(RAW_MIDDLE),
  high: parseWordList(RAW_HIGH),
  cet4: parseWordList(RAW_CET4),
};`;

fs.writeFileSync(path.join(dataDir, "wordbank.generated.js"), jsBlock, "utf8");
console.log("Wrote wordbank.generated.js");
