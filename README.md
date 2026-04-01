# CRS Ticket System (Monorepo)

This project is organized into frontend and backend folders.

## Structure

```text
CRS_Ticket_System/
├── frontend/   # React + Vite UI
└── backend/    # Go + Gin + GORM + PostgreSQL API
```

## Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend default URL: `http://localhost:5173`

Optional frontend env (`frontend/.env`):

```env
VITE_API_BASE_URL=http://localhost:8080
```

## Run Backend

```bash
cd backend
go mod tidy
go run .
```

Backend default URL: `http://localhost:8080`

Backend details and API examples are documented in `backend/README.md`.
