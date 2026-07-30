# No Soul Media — Client Analytics Platform

An editorial, high-performance client analytics platform for YouTube channels built for No Soul Media.

## Architecture

- **Frontend**: React, TypeScript, Vite, React Router, Recharts, Vanilla CSS Modules
- **Backend**: Node.js, Express, TypeScript, JWT (Access & httpOnly Refresh tokens), bcrypt, Zod validation
- **Database**: PostgreSQL (Supabase schema definition included)
- **External Integration**: YouTube Data API v3 (Phase 1 — API Key based current channel and video totals)

---

## Design System & Style Guidelines

- **Background**: `#0A0A0A`
- **Cards**: `#141414`
- **Borders**: `#2A2A2A`
- **Primary Accent**: `#F2C230`
- **Secondary Accent**: `#E8232D`
- **Typography**:
  - Headings: `Space Grotesk`
  - Body & Tabular Metrics: `Inter`
- **UI Feel**: Premium editorial dark mode with soft shadows, card rounded corners (12–16px), and hover lifts (`translateY(-3px)`).

---

## Getting Started

### 1. Environment Setup

Copy `.env.example` in `server/` to `server/.env`:

```env
PORT=4000
DATABASE_URL=postgresql://user:pass@localhost:5432/nosoulmedia
JWT_ACCESS_SECRET=your_jwt_access_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
YOUTUBE_API_KEY=your_google_youtube_data_api_v3_key
NODE_ENV=development
```

### 2. Backend Installation & Server Run

```bash
cd server
npm install
npm run build
npm start
# Or for live dev reloading:
npm run dev
```

### 3. Frontend Installation & Dev Server

```bash
cd frontend
npm install
npm run build
npm run dev
```

---

## Phase 1 Deliverables & Endpoints

### Authentication
- `POST /api/auth/register` — Register agency staff/admin
- `POST /api/auth/login` — Login user (returns JWT access token & sets httpOnly refresh cookie)
- `POST /api/auth/refresh` — Refresh access token
- `POST /api/auth/logout` — Logout user

### Channel Analytics (YouTube Data API v3)
- `GET /api/channels` — List all connected channels
- `POST /api/channels` — Add channel by YouTube handle (`@MKBHD`), URL, or Channel ID
- `GET /api/channels/:id/stats` — Fetch live current totals:
  - Total Views
  - Total Likes
  - Total Comments
  - Public Subscriber Count
  - Total Video Count
  - Calculated Engagement Rate
  - Top Videos sorted by view count
  - Full video analytics table with search, pagination, CSV, and JSON export

---

## Phase Roadmap

- **Phase 1 (Completed)**: MVP Data API v3 real-time channel stats, video performance table, client auth.
- **Phase 2 (Next)**: Google OAuth 2.0 flow for YouTube Analytics API (unlocking day-by-day historical breakdowns, date range filters, and period comparison).
- **Phase 3**: Redis caching, nightly sync cron jobs, Docker Compose, Swagger docs, Jest test suite, Pino logging.
