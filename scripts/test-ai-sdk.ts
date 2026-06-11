import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
const openai = createOpenAI({ apiKey: 'test' });
const res = streamText({ model: openai('gpt-4'), prompt: 'test' });
console.log(Object.keys(res));
