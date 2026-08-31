# LearnFlow UI

Angular frontend for LearnFlow — an AI-assisted learning planner and accountability application.

## Stack
- Angular 20+
- Angular Material
- RxJS + Signals
- TypeScript
- Netlify

## Architecture
Feature-first Angular structure with reusable core services and lazy-loaded routes.

## Local development
```bash
npm install
npm start
```

## Production build
```bash
npm run build
```

The frontend is designed to be deployed to Netlify and consumes the LearnFlow API through an environment-based API URL.

## Planned MVP
- Authentication
- Learning paths
- Phases, modules and lessons
- Excel/CSV learning-plan import
- Jira-inspired learning board
- Scheduling and lesson status tracking
- Reminder visibility
- Learning progress dashboard

See the project documentation in the API repository for the broader product requirements.
