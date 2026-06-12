import 'dotenv/config';
import { POST } from './src/app/api/chat/route';

async function run() {
  const req = new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'what are the tax options availale on onctaraa' }],
      user_id: 'test_user',
      profile_id: 'test_profile'
    })
  });

  const res = await POST(req);
  if (res.body) {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value);
      console.log(text);
    }
  }
}
run().catch(console.error);
