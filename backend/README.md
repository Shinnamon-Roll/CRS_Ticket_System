# CRS Ticket System Backend (Go)

RESTful API for CRS Ticket System using Gin + GORM + PostgreSQL.

## Structure

```text
backend/
├── controllers/
├── database/
├── models/
├── routes/
├── uploads/
├── .env
├── go.mod
└── main.go
```

## Setup

1. Create PostgreSQL database (example):

```sql
CREATE DATABASE crs_ticket_system;
```

2. Configure environment in `.env`:

```env
PORT=8080
FRONTEND_ORIGIN=http://localhost:5173
DATABASE_URL=host=localhost user=postgres password=postgres dbname=crs_ticket_system port=5432 sslmode=disable TimeZone=Asia/Bangkok
```

3. Install dependencies and run:

```bash
cd backend
go mod tidy
go run .
```

If PostgreSQL is not available, backend automatically falls back to SQLite file `backend/crs_ticket_system.db`.
You can set custom SQLite path with `SQLITE_PATH=your_file.db`.

## API Endpoints

- `GET /api/tickets` (supports query: `q`, `status`, `location`, `requester_id`, `assignee_id`)
- `GET /api/tickets/:id`
- `POST /api/tickets` (multipart/form-data, file field: `image`)
- `PATCH /api/tickets/:id/status`
- `PATCH /api/tickets/:id/assign`
- `GET /api/users`
- `GET /health`

## Example: Create Ticket with image upload

```bash
curl -X POST http://localhost:8080/api/tickets \
  -F "title=Printer is broken" \
  -F "description=Cannot print from accounting room" \
  -F "location=Building A Floor 2" \
  -F "priority=high" \
  -F "requester_id=1" \
  -F "image=@/path/to/photo.jpg"
```

Uploaded file is saved in `backend/uploads` and returned as `image_url` (for example: `/uploads/123_file.jpg`).
Each ticket is assigned a searchable `ticket_code` (example: `CRS-2026-123456`).
