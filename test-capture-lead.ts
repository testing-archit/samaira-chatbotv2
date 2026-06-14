import { config } from 'dotenv';
config({ path: '.env.local' });
if (process.env.DATABASE_URL?.startsWith('"')) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace(/^"|"$/g, '');
}
import { getTools } from './src/lib/tools/index.js';

async function main() {
  console.log('Testing request_callback tool...');
  const tools = getTools({
    sessionId: '00000000-0000-0000-0000-000000000000',
    profileId: '00000000-0000-0000-0000-000000000001',
    userId: '00000000-0000-0000-0000-000000000002',
    profileName: 'Archit Test',
    profileRelation: 'Self',
  });
  const result = await tools.request_callback.execute({
    name: 'Archit Test',
    phone: '9999999999',
    query: 'I need help setting up my profile.'
  });

  console.log('Tool Result:', result);
}

main().catch(console.error);
