const fs = require("fs");
const path = require("path");

const htmlPath = path.join(__dirname, "..", "vocab_game.html");
const html = fs.readFileSync(htmlPath, "utf8");
const newBlock = fs.readFileSync(path.join(__dirname, "wordbank.generated.js"), "utf8").trim();

const startMarker = "const WORD_BANK = {";
const startIdx = html.indexOf(startMarker);
if (startIdx === -1) {
  console.error("start marker not found");
  process.exit(1);
}
// find the matching closing "};" for this object literal by counting braces
let depth = 0;
let i = startIdx + startMarker.length - 1; // position at the first '{'
let endIdx = -1;
for (; i < html.length; i++) {
  const ch = html[i];
  if (ch === "{") depth++;
  else if (ch === "}") {
    depth--;
    if (depth === 0) {
      // expect a ';' right after (maybe with spaces)
      let j = i + 1;
      while (html[j] === " " || html[j] === "\t") j++;
      if (html[j] === ";") {
        endIdx = j;
      } else {
        endIdx = i;
      }
      break;
    }
  }
}
if (endIdx === -1) {
  console.error("matching end not found");
  process.exit(1);
}

const before = html.slice(0, startIdx);
const after = html.slice(endIdx + 1);
const result = before + newBlock + after;
fs.writeFileSync(htmlPath, result, "utf8");
console.log("Spliced. Old block length:", endIdx + 1 - startIdx, "New block length:", newBlock.length);
