# LearnFlow UI

Angular frontend for LearnFlow — an AI-assisted learning planner and accountability application inspired by Jira but optimized for personal learning.

## Stack
- Angular 20 LTS
- Angular Material
- RxJS + Signals
- Strict TypeScript
- Netlify

## Implemented capabilities
- Register/login with guarded application routes
- Learning Path creation and management
- Phase → Module → Lesson hierarchy management
- Jira-style board using lesson lifecycle states
- Direct lesson scheduling and missed-lesson rescheduling
- Excel/CSV learning-plan upload
- Persistent reminder and missed-session notification center
- Learning analytics dashboard
- AI plan preview and Generate & Save flow
- Responsive desktop/mobile layouts

## Local development
The default local API URL is `http://localhost:3000`.

```bash
npm install
npm start
```

## Production build
The build script generates the Angular environment from `LEARNFLOW_API_URL` before running `ng build`.

```bash
LEARNFLOW_API_URL=https://your-api.onrender.com npm run build
```

For production/Netlify builds, `LEARNFLOW_API_URL` is required. The generator intentionally fails a production build when the API URL is missing so a deployed application cannot silently call localhost.

## Netlify deployment
Connect this repository to Netlify and deploy the `dev` branch while validating the application. Promote to `main` for the production release.

Set this Netlify environment variable:
- `LEARNFLOW_API_URL` — the Render API base URL, for example `https://your-api.onrender.com`

`netlify.toml` contains the Angular build command, browser output directory and SPA fallback redirect.

## Learning-plan import columns
Excel and CSV files use this exact header contract:

`Learning Path, Phase, Module, Lesson, Description, Date, Time, Duration, Priority, Resource`

This is intentionally simple enough for a user to ask ChatGPT to create a learning schedule and upload the resulting spreadsheet directly into LearnFlow.

## Main routes
- `/dashboard` — analytics and progress
- `/learning-paths` — learning paths
- `/learning-paths/:id` — phases, modules, lessons and scheduling
- `/board` — Jira-style lesson board
- `/import` — Excel/CSV import
- `/ai-planner` — AI preview/generate-and-save
- `/notifications` — reminders and missed lesson alerts

## Quality gate
`.github/workflows/ci.yml` installs dependencies and runs the production Angular build on pushes to `dev` and `main`.

## Branch strategy
- `dev` — active development/integration branch
- `main` — release-ready production branch
