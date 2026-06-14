import 'dotenv/config';
import { getTools } from './src/lib/tools/index';

async function test() {
  const tools = getTools({
    sessionId: 'test',
    profileId: 'cm6k32p9u000108l5exq49f53', // I need a valid profileId... Let's just use a dummy one and see if it fails.
    userId: 'test',
    profileName: 'Test Profile',
    profileRelation: 'Self',
  });
  
  try {
    const res = await tools.export_plan.execute({ email: 'test@example.com' });
    console.log("SUCCESS:", res);
  } catch (err: any) {
    console.error("ERROR:", err.message);
  }
}
test();
