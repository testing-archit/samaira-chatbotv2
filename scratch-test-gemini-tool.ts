import 'dotenv/config';
async function test() {
  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gemini-2.5-flash',
      messages: [
        { role: 'user', content: 'What is 2+2?' },
        { role: 'assistant', tool_calls: [{ id: 'call_1', type: 'function', function: { name: 'calculator', arguments: '{"expr":"2+2"}' } }] },
        { role: 'tool', tool_call_id: 'call_1', content: '4' }
      ],
      tools: [{ type: 'function', function: { name: 'calculator', parameters: { type: 'object', properties: { expr: { type: 'string' } } } } }],
    }),
  });
  const data = await res.json();
  console.log(data);
}
test();
