import 'dotenv/config';

async function testChat() {
  const models = [
    'openai/gpt-oss-20b:free',
    'meta-llama/llama-3.3-70b-instruct:free'
  ];
  const testTools = [
    {
      type: 'function',
      function: {
        name: 'get_profile',
        description: 'Get user profile',
        parameters: { type: 'object', properties: {} },
      },
    }
  ];
  for (const model of models) {
    console.log(`Testing Chat Model with Tools (${model})...`);
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: 'Get my profile details.' }],
        tools: testTools,
        tool_choice: 'auto'
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`Chat Model (${model}) FAILED:`, res.status, text);
    } else {
      const data = await res.json();
      console.log(`Chat Model (${model}) SUCCESS. Response:`, JSON.stringify(data.choices[0]?.message));
    }
  }
  return true;
}

async function testEmbedding() {
  console.log('\nTesting Embedding Model (nvidia/llama-nemotron-embed-vl-1b-v2:free)...');
  const res = await fetch('https://openrouter.ai/api/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'nvidia/llama-nemotron-embed-vl-1b-v2:free',
      input: 'Test string for embeddings.',
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error('Embedding Model FAILED:', res.status, text);
    return false;
  }
  const data = await res.json();
  console.log('Embedding Model SUCCESS. Dimensions:', data.data[0]?.embedding?.length);
  return true;
}

async function run() {
  await testChat();
  await testEmbedding();
}
run();
