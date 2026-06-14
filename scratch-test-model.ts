import 'dotenv/config';
async function test() {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      models: ['google/gemma-4-31b-it:free'],
      route: 'fallback',
      messages: [{ role: 'user', content: 'Say hello!' }],
    }),
  });
  const data = await res.json();
  console.log(data);
}
test();
