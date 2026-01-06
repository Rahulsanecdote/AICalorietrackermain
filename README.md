# NutriAI - Smart Calorie Tracker

A production-ready AI-powered nutrition tracking application with comprehensive meal planning, lifestyle tracking, and health insights.

## Quick Start

### Prerequisites
- Node.js 18+ installed
- pnpm package manager (`npm install -g pnpm`)
- OpenAI API key (get one at https://platform.openai.com/api-keys)

### Run the App

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The app will start at **http://localhost:5173**

### First-Time Setup

1. Open http://localhost:5173 in your browser
2. Click the Settings icon in the top right
3. Enter your OpenAI API key
4. Start tracking meals!

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

Configure in the app UI or create a `.env` file:

```env
# Optional: Pre-configure OpenAI API key
VITE_OPENAI_API_KEY=sk-...
```

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
4. Re-enter your API key in Settings

### AI Features Not Working

1. Verify API key is set in Settings
2. Check console for errors
3. Ensure you have OpenAI API credits

## License

See [LICENSE](LICENSE) file for details.

---

Built with React, TypeScript, and OpenAI
