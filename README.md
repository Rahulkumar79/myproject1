# Learning Companion — AI Learning Assistant

Lumina Scholar is a full-stack, production-ready AI Learning Assistant and personalized digital tutor built for computer science and engineering students.

## 1. Main Features
- **Complete JWT Authentication & RBAC**: Registration, login, logout, profile management, password hashing with `bcryptjs`, and strict Student vs. Admin role-based authorization.
- **8 Pre-Seeded Computer Science Subjects & 32 Topics**: Java, Data Structures & Algorithms, DBMS, Operating Systems, Computer Networks, Web Development, Software Engineering, and Artificial Intelligence.
- **5-Mode Socratic AI Tutor**: Supports *Beginner*, *Intermediate*, *Advanced*, *Interview Preparation*, and *Exam Preparation* modes with persistent conversation history, renaming, clearing, and Socratic follow-up questions.
- **10-Section AI Notes Generator**: Generates structured academic notes covering Overview, Formal Definitions, Key Concepts, Detailed Explanations, Examples, Advantages/Disadvantages, Common Mistakes, Important Points, Quick Revision, and Exam Questions.
- **Secure Server-Graded AI Quiz Engine**: Supports MCQ, True/False, Short Answer, and Mixed quizzes with a live countdown timer. Correct answers and explanations are never sent to the browser before submission.
- **Document Upload & Grounded RAG Q&A**: Supports PDF, DOCX, TXT, and MD uploads (via `multer`), FlateDecode PDF stream extraction & `mammoth` DOCX parsing, prompt-injection sanitization, chunking with overlap, vector embeddings (`gemini-embedding-2-preview` + hybrid lexical/semantic similarity), and grounded answers with source/page citations.
- **Personalized AI Study Planner & Task Tracker**: Generates realistic daily and weekly study schedules respecting available study hours, exam dates, and weak subjects.
- **Data-Driven Weak Topic Detection & AI Recommendation Engine**: Automatically flags "Topics That Need Attention" with factual reasons based on low quiz scores, repeated mistakes, low completion rates, or long gaps between study sessions.
- **Global Search, Chronological Learning History & Live Focus Stopwatch**: Search across all authorized learning entities and log Pomodoro/focus study sessions.
- **Admin Dashboard**: Manage users (enable/disable accounts, inspect user activity), manage subjects/topics/documents, and view platform-wide analytics.

## 2. Tech Stack
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, React Router v7, Axios, Lucide React, Recharts
- **Backend**: Node.js, Express.js, Mongoose / MongoDB Atlas (with automatic zero-config persistent local JSON adapter fallback), JWT (`jsonwebtoken`), `bcryptjs`, `multer`, `helmet`, `cors`, `express-rate-limit`
- **AI & RAG**: `@google/genai` SDK (`gemini-3.8-flash` for tutoring/notes/quizzes/RAG synthesis and `gemini-embedding-2-preview` for vector embeddings)

## 3. Architecture & Folder Structure
```text
├── server.ts                          # Full-stack entrypoint (Express API + Vite middleware / static dist)
├── server/
│   ├── data/                          # Persistent local JSON database fallback (auto-created)
│   ├── uploads/                       # Uploaded study documents (PDF, DOCX, TXT)
│   └── src/
│       ├── app.ts                     # Express application & middleware pipeline
│       ├── server.ts                  # Standalone backend server entrypoint
│       ├── config/                    # Environment, MongoDB/Local DB adapter, Gemini AI client
│       ├── controllers/               # Modular REST API controllers
│       ├── middleware/                # JWT auth, RBAC, Multer upload, Centralized error handler
│       ├── models/                    # 17 Mongoose schemas & models
│       ├── routes/                    # Express API routes (/api/*)
│       ├── seed/                      # 8 CS subjects, 32 topics, demo accounts & RAG PDF seed
│       ├── services/                  # AI service, RAG vector service, Weak Topic & Recommendation engine
│       ├── tests/                     # Automated integration test suite
│       ├── utils/                     # JWT, PDF/DOCX extractor, vector math & chunking
│       └── validators/                # Input validation, XSS & NoSQL operator sanitization
└── src/
    ├── api/                           # Centralized Axios client & 17 modular API services
    ├── components/                    # Reusable UI modals, Markdown renderer, ProtectedRoute
    ├── context/                       # AuthContext & ToastContext
    ├── layouts/                       # Responsive DashboardLayout with sidebar & mobile drawer
    └── pages/                         # Public, Student, and Admin pages
```

## 4. Environment Variables (`.env`)
Copy `.env.example` to `.env` and configure:
```env
PORT=3000
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/lumina_scholar"
JWT_SECRET="replace_with_a_strong_random_jwt_secret"
GEMINI_API_KEY="your_google_gemini_api_key"
CLIENT_URL="http://localhost:3000"
SERVER_URL="http://localhost:3000"
```
*Note: If `MONGODB_URI` is omitted in local/preview environments, the server automatically uses the persistent JSON store in `server/data/lumina_db.json`.*

## 5. Installation, Seeding, Testing & Running
```bash
# 1. Install dependencies
npm install

# 2. Seed the database (also runs automatically on server startup if empty)
npm run seed

# 3. Run automated backend integration tests
npm test

# 4. Start full-stack development server on port 3000
npm run dev

# 5. Build frontend for production & start production server
npm run build
npm start
```

## 6. Pre-Seeded Demo Accounts
- **Demo Student**: `student@lumina.edu` / `Student@123`
- **Demo Admin**: `admin@lumina.edu` / `Admin@123`

---

## 7. Production Deployment Guide

### Required & Optional Environment Variables
Create a `.env` file (or configure platform secrets in Cloud Run, Render, Railway, or Docker) using `.env.example` as a template:

| Variable | Required | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | Yes | Set to `"production"` in production deployments |
| `PORT` | Yes | HTTP port to bind (`3000` default) |
| `JWT_SECRET` | Yes | Cryptographically strong 64+ character random secret for signing JWTs |
| `JWT_EXPIRES_IN` | Optional | Token expiration TTL (e.g., `"7d"`, `"24h"`, `"3600"`). Defaults to `"7d"` |
| `GEMINI_API_KEY` | Recommended | Google Gemini API key for live AI Tutor, Notes, Quizzes, and Embeddings (gracefully falls back to deterministic local academic engine if omitted) |
| `MONGODB_URI` | Recommended | MongoDB Atlas connection string (`mongodb+srv://...`). Automatically falls back to atomic local JSON store (`server/data/lumina_db.json`) if unset |
| `CLIENT_URL` | Optional | Allowed frontend origin(s) for CORS (supports comma-separated URLs) |
| `SERVER_URL` | Optional | Public URL of the backend API server |

> **Security Note:** Backend secrets (`GEMINI_API_KEY`, `JWT_SECRET`, `MONGODB_URI`) are strictly read by the Node.js server (`server/src/config/env.ts`) and are **never** exposed to or bundled into the Vite frontend client.

### Production Build & Start Commands
```bash
# 1. Install dependencies
npm install

# 2. Type-check frontend and backend TypeScript
npm run lint

# 3. Compile optimized production frontend bundle to /dist
npm run build

# 4. Start the production full-stack server (NODE_ENV=production)
npm start
```

### Production Architecture & Routing Behavior
- **Static Assets:** When `NODE_ENV=production` and `dist/index.html` is present, `server.ts` serves compiled assets from `/dist` with cache headers (`maxAge: '1d'`).
- **API Routing:** All `/api/*` routes are mounted before static/SPA middleware. Unknown `/api/*` endpoints always return a JSON `404` (`{ "success": false, "message": "Requested API endpoint does not exist." }`) and are never intercepted by the SPA HTML fallback.
- **SPA Fallback:** Non-API client routes (`/dashboard`, `/subjects`, `/ai-tutor`, `/admin`, etc.) fall back to `dist/index.html` so browser refreshes work seamlessly.
- **Health Check:** `GET /api/health` returns `{ "status": "ok", "timestamp": "...", "environment": "production", "success": true }` for load balancers and container orchestrators.
- **Graceful Shutdown:** Handles `SIGTERM` and `SIGINT` signals with duplicate-execution protection, cleanly closing active HTTP connections and flushing/closing MongoDB connections before exit.

### Reverse Proxy, MongoDB Atlas & Upload Persistence Notes
- **Reverse Proxy (Nginx / Cloudflare / Cloud Run):** Forward traffic to `http://127.0.0.1:3000` and allow up to `10MB` request bodies (`client_max_body_size 10M;`) for PDF/DOCX document uploads.
- **MongoDB Atlas:** Whitelist your deployment outbound IPs (or `0.0.0.0/0` for serverless containers) in Atlas Network Access and use a `mongodb+srv://` URI with `retryWrites=true&w=majority`.
- **Upload Storage:** Uploaded study documents are stored in `server/uploads/` with randomized filenames and stripped of path traversal characters. In containerized deployments, mount a persistent volume at `/app/server/uploads` and `/app/server/data` if using local JSON persistence.

