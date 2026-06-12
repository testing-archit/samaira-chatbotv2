import fs from 'fs';
const lines = fs.readFileSync('/Users/archit/.gemini/antigravity-ide/brain/ffa75aa8-2860-4695-817b-f3f60ea54f36/.system_generated/logs/transcript.jsonl', 'utf-8').split('\n');
for (const line of lines) {
  if (line.includes('Guardrail trip: banned phrase')) {
    // Try to extract the match from the raw line string, because NextJS console.log output might be mixed with ANSI codes or just raw text depending on how winston/logger printed it
    console.log("Found raw log line:");
    console.log(line);
  }
}
