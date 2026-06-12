import fs from 'fs';
const lines = fs.readFileSync('/Users/archit/.gemini/antigravity-ide/brain/ffa75aa8-2860-4695-817b-f3f60ea54f36/.system_generated/logs/transcript.jsonl', 'utf-8').split('\n');
const parsed = lines.map(l => { try { return JSON.parse(l); } catch(e) { return null; } }).filter(Boolean);
for (const p of parsed) {
  if (p.content && typeof p.content === 'string' && p.content.includes('Match STRING WAS')) {
     console.log(p.content);
  }
}
