# NutriAI - Smart Calorie Tracker

A production-ready AI-powered nutrition tracking application with comprehensive meal planning, lifestyle tracking, and health insights.

## Quick Start

### Prerequisites
- Node.js 18+ installed
- pnpm package manager (`npm install -g pnpm`)
- OpenAI API key configured on the server

### Run the App

```bash
# Install dependencies
pnpm install

# Start AI proxy (in a separate terminal)
OPENAI_API_KEY=sk-... AI_PROXY_AUTH_TOKEN=dev-token pnpm server

# Start development server
VITE_API_AUTH_TOKEN=dev-token pnpm dev
```

The app will start at **http://localhost:5173**

### First-Time Setup

1. Open http://localhost:5173 in your browser
2. Start tracking meals!

## Features

### Core Features
- **Smart Food Logging** - Natural language meal entry with AI parsing
- **Meal Planning** - AI-generated meal plans based on your goals
- **Lifestyle Tracking** - Water, sleep, exercise, and mood monitoring
- **Analytics Dashboard** - Comprehensive nutrition trends and charts
- **Shopping Lists** - Auto-generated from meal plans
- **Meal Prep** - Batch cooking planning and organization
- **Multi-language Support** - English, Spanish, French, German, Chinese, Japanese

### AI-Powered Features
- Natural language food parsing ("2 eggs and toast")
- Personalized meal suggestions based on goals
- Nutritional insights and recommendations
- Recipe details and cooking instructions
- Food comparisons ("chicken vs salmon")

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Radix UI + Tailwind CSS
- **State**: React Context + localStorage
- **AI**: OpenAI GPT-4
- **Backend**: Minimal Node.js API proxy
- **Charts**: Recharts
- **Deployment**: Vercel

## Project Structure

```
src/
├── components/        # UI components
│   ├── features/      # Feature-specific components
│   ├── lifestyle/     # Lifestyle tracking components
│   ├── analytics/     # Analytics and charts
│   └── ui/           # Reusable UI components
├── context/          # React context providers
├── hooks/            # Custom React hooks
├── utils/            # Utility functions
└── types/            # TypeScript types
```

## Available Scripts

```bash
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm preview          # Preview production build
```

## Environment Variables

Configure via environment variables or a `.env` file:

```env
# Backend (server/index.mjs)
OPENAI_API_KEY=sk-...
AI_PROXY_AUTH_TOKEN=your-shared-token
AI_PROXY_AUTH_REQUIRED=true
AI_PROXY_ALLOWED_ORIGINS=http://localhost:5173
AI_PROXY_PORT=3001
AI_PROXY_RATE_LIMIT_MAX=60
AI_PROXY_RATE_LIMIT_WINDOW_MS=60000

# Frontend
VITE_API_AUTH_TOKEN=your-shared-token
VITE_API_BASE_URL=http://localhost:3001
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

If you want to disable auth in local development, set `AI_PROXY_AUTH_REQUIRED=false` and omit `VITE_API_AUTH_TOKEN`.

Optional: set `VITE_API_PROXY_TARGET` to override the Vite dev proxy target (defaults to `http://localhost:3001`).

## Supabase Migration

Schema, rollback, and seed scripts live in `supabase/migrations`.

Recommended workflow (local Supabase CLI):
1. `supabase start`
2. `supabase db reset` to apply migrations + seed data

Rollback strategy:
- Run the matching `*.down.sql` scripts in `supabase/migrations` in reverse order.
- For production, apply rollbacks in a transaction and validate with `supabase/validation.sql`.

Migrating existing local exports:
1. Export data from the app (`Utility Panel` > Export JSON).
2. Generate SQL for Supabase:
   ```bash
   node scripts/migrate-local-export.mjs path/to/export.json <auth_user_id> output.sql
   ```
3. Execute `output.sql` in Supabase SQL editor.

Note: when signed in, the app syncs settings, meals, and meal plans to Supabase. When signed out, it falls back to localStorage for offline use.

## Deployment

This project is configured for Vercel deployment:

1. Connect your GitHub repository to Vercel
2. Vercel auto-deploys on push to `main` branch
3. Build command: `pnpm build`
4. Output directory: `dist`

## Troubleshooting

### App Won't Start

```bash
# Clean install
rm -rf node_modules
pnpm install
pnpm dev
```

### Settings Format Errors

1. Open DevTools Console
2. Run: `localStorage.clear()`
3. Refresh the page
4. Re-enter your settings as needed

### AI Features Not Working

1. Ensure the AI proxy is running (`node server/index.mjs`)
2. Verify `OPENAI_API_KEY` is set on the server
3. If auth is enabled, confirm `VITE_API_AUTH_TOKEN` matches `AI_PROXY_AUTH_TOKEN`

## License

See [LICENSE](LICENSE) file for details.

---

Built with React, TypeScript, and OpenAI
