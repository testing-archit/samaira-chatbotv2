import 'dotenv/config';
import { model } from './src/lib/model';

async function run() {
  const { embedding } = await model.embed('Hello world');
  console.log('Embedding type:', typeof embedding);
  console.log('Is Array?', Array.isArray(embedding));
  console.log('Length:', embedding?.length);
  if (embedding?.length > 0) {
    console.log('First element:', embedding[0]);
  }
}
run();
