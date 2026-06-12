import fs from 'fs';
const lines = fs.readFileSync('/Users/archit/.gemini/antigravity-ide/brain/ffa75aa8-2860-4695-817b-f3f60ea54f36/.system_generated/logs/transcript.jsonl', 'utf-8').split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Compare Octaraa to Groww')) {
    for (let j = i; j < Math.min(i + 50, lines.length); j++) {
      if (lines[j].includes('Guardrail trip: banned phrase')) {
        const match = lines[j].match(/"match":"([^"]+)"/);
        if (match) console.log("MATCH STRING WAS: ", match[1]);
      }
    }
  }
}
