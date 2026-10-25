# Equilibrium — Anonymous Workplace Wellness & Climate Analytics Platform

Equilibrium is an enterprise-grade platform designed to collect anonymous employee voice data, surface organizational friction and morale trends, and enable leadership to take transparent, actionable interventions.

---

## 🌟 Key Features

1. **Anonymous Employee Portal:**
   - Submit Daily Work Summaries and Targeted Incidents.
   - Clean, minimal wellness-focused UI (warm alabaster, sage green, clay palette).
   - Monochrome emotional energy & battery level indicators.
   - Preserves colleague names (e.g., *Matthew in Sales*) while neutralizing author identity.
   - Side-by-side "Preview Submission" and "Submit" controls.

2. **Public Company Action Board:**
   - Completely public to all employees (no login required).
   - Real-time transparency showing company interventions across:
     - *Under Review*
     - *In Progress*
     - *Action Deployed*

3. **HR Portal (Protected):**
   - Credentials: User ID `Raunak`, Password `Raunak123`.
   - Longitudinal trend analytics across 4 timeframes (`Day`, `Week`, `1 Month`, `3 Month`).
   - 4 Tracking Metrics: `All Metrics`, `Morale`, `Strain`, `Productivity`.
   - **"See All Submissions (20)" Directory:** Dedicated view with live search, submission type filters, department filters, AI-automated tags, and 5-way sorting.
   - **Discuss Workplace Problems with AI:** Powered by Gemini 2.5 Flash, the AI advisor answers questions about complaints and generates **1-click Action Proposals** that publish directly to the Action Board.
   - **Automated Problem Highlighting:** Stacked top weekly operational hurdles followed by monthly systemic bottlenecks.

---

## 🚀 Running Locally

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the Express backend:**
   ```bash
   npm run server
   ```
   *Runs on `http://localhost:3001`.*

3. **Start the Vite frontend:**
   ```bash
   npm run dev
   ```
   *Open `http://localhost:5173` in your browser.*

---

## 🗄️ PostgreSQL Setup (Optional)

Equilibrium automatically supports PostgreSQL. If no database URL is provided, it seamlessly uses the local JSON store (`server/data/`).

To use PostgreSQL (Neon, Render, Railway, Vercel Postgres, or local):
1. Set the environment variable:
   ```bash
   DATABASE_URL=postgres://username:password@host:5432/database
   ```
2. On startup, Equilibrium automatically creates the tables (`submissions`, `actions`, `clusters`) and seeds the 20 realistic workplace submissions.

---

## ☁️ Deploying on Vercel

Equilibrium is configured out-of-the-box for Vercel Serverless:
- `vercel.json` rewrites `/api/*` to the serverless entrypoint in `api/index.js`.
- The Vite frontend builds to `/dist` automatically.

### Deployment Steps:
1. Push this repository to GitHub.
2. In [Vercel](https://vercel.com), click **"Add New Project"** and select this GitHub repository.
3. Add Environment Variables:
   - `GEMINI_API_KEY`: Your Google Gemini API key.
   - `DATABASE_URL` *(Optional)*: Your PostgreSQL connection string (or use Vercel Postgres / Neon).
4. Click **Deploy**.
