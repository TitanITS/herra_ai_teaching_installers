# Herra AI Teaching Platform — S5 Baseline

This repository contains the **Herra AI Teaching Platform** with a fully integrated
**FastAPI backend** and **Vite + React + TypeScript frontend**.

This README documents the **S5 baseline** — a known-stable, fully working integration
between backend and frontend.

---

## ✅ S5 Status (LOCKED BASELINE)

The following are confirmed working:

- Backend API (FastAPI)
- Frontend UI (React + Vite)
- API key authentication
- CORS configuration
- Typed API contracts (S5 envelopes)
- Ingest flow (list, create, penalize)
- System flow (audit, trust, confidence, AI sources)
- Frontend build (`npm run build`) passes

⚠️ **This state is intentionally locked.**
Changes should only be made incrementally and deliberately.

---

## 🗂 Project Structure

herra_ai_teaching/
├── backend/
│ ├── api/
│ │ ├── contracts.py # S5 response envelopes (DO NOT MODIFY)
│ │ ├── dependencies.py # API key auth (single source of truth)
│ │ ├── ingest.py
│ │ └── system.py
│ ├── storage/
│ ├── utils/
│ ├── main.py # FastAPI app + CORS + health endpoint
│ └── scripts/
│ └── smoke_test_backend.py
│
├── frontend/
│ ├── src/
│ │ ├── lib/http/ # API client + endpoints + types (LOCKED)
│ │ ├── features/
│ │ │ ├── ingest/
│ │ │ └── system/
│ │ ├── pages/
│ │ │ ├── IngestListPage.tsx
│ │ │ └── SystemAuditPage.tsx
│ │ └── App.tsx
│ ├── .env # local only (NOT committed)
│ ├── package.json
│ └── package-lock.json
│
└── README.md


---

## 🧠 Architecture Principles (S5)

- Backend and frontend are **loosely coupled**
- All API responses use a **stable S5 envelope**
- Frontend never talks to FastAPI directly — only via `apiClient.ts`
- Authentication is enforced only via `x-api-key`
- CORS is configured centrally in `backend/main.py`

---

## 🔐 Authentication

All protected endpoints require:


The API key logic lives **only** in:

x-api-key: herra-dev-key-001


Do **not** duplicate authentication logic elsewhere.

---

## 🌐 Environment Variables (Frontend)

Create a file:


With contents:

VITE_API_BASE_URL=http://127.0.0.1:8000

VITE_API_KEY=herra-dev-key-001


⚠️ `.env` must NOT be committed.

---

## ▶️ Running the Backend

**Python version:** 3.13  
(Use the same version you developed with.)

From the project root:

```bash
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000

Swagger UI: http://127.0.0.1/8000/docs
Health Check: http://127.0.0.1/8000/health

Running Frontend

cd frontend
npm install
npm run dev

Open http://127.0.0.1:5173

Smoke Tests

python backend/scripts/smoke_test_backend.py

Expected:

/health → OK
/ingest/list → data
/system/audit → response

Frontend Build Test:

cd frontend
npm run build


DO NOT TOUCH (S5 LOCKDOWN)

Unless intentionally breaking S5, do NOT modify:

Backend

backend/api/contracts.py

backend/api/dependencies.py

backend/main.py (except health/CORS if explicitly planned)

Frontend

src/lib/http/types.ts

src/lib/http/apiClient.ts

src/lib/http/endpoints.ts

New features should be added in new feature folders, not by modifying these.

Rrecovery:

Using Git:

git checkout s5-baseline