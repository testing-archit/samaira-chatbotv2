import fs from 'fs';
const lines = fs.readFileSync('/Users/archit/.gemini/antigravity-ide/brain/ffa75aa8-2860-4695-817b-f3f60ea54f36/.system_generated/logs/transcript.jsonl', 'utf-8').split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Compare Octaraa to Groww')) {
    console.log("Found user prompt at line", i);
    // Print the next 50 lines to find the AI's actual generated response or log
    for (let j = i; j < Math.min(i + 50, lines.length); j++) {
      if (lines[j].includes('Guardrail trip: banned phrase')) {
        console.log("FOUND GUARDRAIL: ", lines[j]);
      }
    }
  }
}
