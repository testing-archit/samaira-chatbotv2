import { config } from 'dotenv';
config({ path: '.env.local' });
import { getTools } from './src/lib/tools/index.js';

async function main() {
  console.log('Testing capture_lead tool...');
  const tools = getTools({
    sessionId: 'test-session',
    profileId: 'test-profile',
    userId: 'test-user',
    profileName: 'Archit Test',
    profileRelation: 'Self',
  });
  const result = await tools.capture_lead.execute({
    name: 'Archit Test',
    phone: '9999999999',
    query: 'I need help setting up my profile.'
  });

  console.log('Tool Result:', result);
}

main().catch(console.error);
