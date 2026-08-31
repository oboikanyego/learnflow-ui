import { writeFileSync } from 'node:fs';

const apiUrl = (process.env.LEARNFLOW_API_URL || 'http://localhost:3000').replace(/\/$/, '');
const production = process.env.CONTEXT === 'production' || process.env.NODE_ENV === 'production';

if (production && !process.env.LEARNFLOW_API_URL) {
  throw new Error('LEARNFLOW_API_URL must be configured for a production Netlify build.');
}

writeFileSync(
  new URL('../src/environments/environment.ts', import.meta.url),
  `export const environment = ${JSON.stringify({ production, apiUrl }, null, 2)};\n`,
  'utf8'
);

console.log(`Configured LearnFlow API URL for ${production ? 'production' : 'non-production'} build.`);
