import 'dotenv/config';

import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL as string);

async function main() {
  // Insert dummy user to satisfy foreign key constraints
  await sql`
    INSERT INTO users (id, email, password_hash)
    VALUES ('user_123', 'test@test.com', 'hash')
    ON CONFLICT (id) DO NOTHING
  `;

  const res = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: "How does Octaraa's AI (Samaira AI) help users?" }],
      user_id: 'user_123',
      session_id: 'sess_123'
    })
  });

  console.log('Status:', res.status, res.statusText);
  if (!res.ok) {
    const errText = await res.text();
    console.log('Error text:', errText);
  }

  const reader = res.body?.getReader();
  const decoder = new TextDecoder();
  
  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value);
      console.log(text);
    }
  }
}

main();
