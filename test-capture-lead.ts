import { config } from 'dotenv';
config({ path: '.env.local' });
import { getTools } from './src/lib/tools/index.js';

async function main() {
  console.log('Testing capture_lead tool...');
  const tools = getTools('test-session', 'test-profile');
  const result = await tools.capture_lead.execute({
    name: 'Archit Test',
    phone: '9999999999',
    query: 'What is Archit AMC and why do you not know it?'
  });

  console.log('Tool Result:', result);
}

main().catch(console.error);
