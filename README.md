no
🌍 GreenShield

GreenShield is an environmental intelligence web application built for the Hack the Habitat 2026 hackathon.

It combines real environmental data, interactive maps, transparent risk calculations, and AI-powered guidance to help people understand environmental conditions and take practical action.

✨ Features
🌦️ Real-time weather information
🌫️ Air-quality monitoring
🌍 Interactive environmental map
📍 Location search and map-based location selection
📊 Environmental risk score (0–100)
📈 Historical climate trends
⚠️ Risk explanations
🌱 Practical environmental actions
🤖 AI environmental chatbot
📋 Data sources and methodology
📱 Responsive design for desktop and mobile
🛡️ Loading, error, and fallback states
🧠 How It Works

GreenShield collects environmental information from public data services and processes it through a transparent risk-scoring system.

User Location
     ↓
Environmental APIs
     ↓
Data Processing
     ↓
GreenShield Risk Engine
     ↓
Risk Score + Visualizations
     ↓
AI Assistant
     ↓
Practical Recommendations

The AI assistant is grounded in the GreenShield data brief and should not invent environmental measurements.

🌐 Data Sources
Open-Meteo

Used for:

Weather
Air quality
Historical environmental data
Geocoding

No API key is required for the public services used by GreenShield.

OpenStreetMap / Leaflet

Used for:

Interactive maps
Map tiles
Location-based interaction
Nominatim

Used for:

Reverse geocoding when a user selects a point on the map
🤖 AI

GreenShield uses the Google Gemini API for:

Environmental questions
Risk explanations
Context-aware recommendations
Environmental action guidance

The Gemini API key is kept server-side and is never exposed directly to the browser.

🛠️ Technology Stack
React
TypeScript
Vite
Tailwind CSS
TanStack Router
React Query
Leaflet
React Leaflet
OpenStreetMap
Recharts
Google Gemini API
Zod
shadcn/ui / Radix UI
Lucide Icons
🚀 Local Development
Requirements
Node.js 20+
npm or Bun
Google Gemini API key
Installation
npm install

or:

bun install
Environment Variables

Create .env in the project root:

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=your_model_name
Run
npm run dev

or:

bun run dev

Open the local development URL shown in the terminal.

🔐 API Key Security

The Gemini API key must remain server-side.

Never commit .env to GitHub.

Add this to .gitignore:

.env
.env.local
📊 Risk Scoring

GreenShield calculates environmental risk scores on a 0–100 scale using available environmental measurements.

The application clearly distinguishes between:

Raw measurements → provided by environmental data sources
Risk scores → calculated by GreenShield
AI explanations → generated from the available GreenShield data

This makes the system easier to understand and audit.

🎯 Hackathon Alignment

GreenShield directly addresses the Hack the Habitat theme:

Build tech that protects the planet.

Instead of presenting environmental information alone, GreenShield turns real environmental data into understandable risk information and practical actions.

📁 Project Structure
src/
├── components/       # Reusable UI components
├── routes/           # Application pages
├── lib/              # Data, AI and utility logic
├── hooks/            # React hooks
└── styles/           # Application styling
🌱 Future Improvements
More environmental datasets
Localized environmental alerts
Additional climate indicators
Community reporting
Conservation-focused monitoring
More advanced predictive models
Regional environmental comparisons
📜 Attribution

GreenShield uses third-party services and open data including:

Open-Meteo
OpenStreetMap
Nominatim
Leaflet
Google Gemini API

Their respective licenses and usage requirements apply.

👥 Project

Built for Hack the Habitat 2026.

GreenShield — Turning environmental data into action.
