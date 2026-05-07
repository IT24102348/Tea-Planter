# Tea Planter

Intelligent estate management for Sri Lankan tea plantations—digitizing operations for owners, clerks, and workers with dashboards, QR workflows, payroll, inventory, and AI-assisted tools.

Website: [teaplanter.online](https://teaplanter.online)

---

## Table of contents

- [About](#about)
- [Features](#features)
- [AI capabilities](#ai-capabilities)
- [Tech stack](#tech-stack)
- [Repository layout](#repository-layout)
- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Links](#links)

---

## About

Tea Planter grew out of life on plantations in Sri Lanka: attendance, harvest logs, payroll, and coordination often still live on paper. This project is a full-stack platform that aims to reduce manual work, improve visibility, and bring modern tooling to one of the country’s core industries—including secure APIs, JWT auth, role-based access, and scheduled automation for subscriptions and reminders.

---

## Features

- Role-based access for owners, clerks, and workers
- Real-time dashboard and operational analytics
- QR-based attendance, harvest records, and payment verification
- Worker productivity and harvest contribution tracking
- Payroll and financial management
- Inventory with low-stock alerts
- Delivery and factory management
- Task assignment and coordination
- PDF report generation
- Plantation plots/blocks with map integration
- Subscription lifecycle and payment workflows (e.g. PayHere)

---

## AI capabilities

| Capability | Description |
| --- | --- |
| Disease & nutrient scanner | Upload a tea-leaf photo; the system suggests possible diseases or deficiencies with severity, confidence, and treatment or prevention hints. |
| Tea price predictor | Forecasts green-leaf prices from historical and seasonal patterns to support delivery and cash-flow planning. |
| Multi-agent assistant (planned) | In-app assistant with coordinated agents for weather, harvest, inventory, and tasks. |

---

## Tech stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Recharts, [Clerk](https://clerk.com/) |
| Backend | Java 17, Spring Boot 4.x, PostgreSQL, Spring Security, OAuth2 Resource Server (JWT / JWK) |

---

## Repository layout

```
Tea-Planter/
├── FrontEnd/     # React (Vite) SPA
├── BackEnd/      # Spring Boot API
└── README.md
```

---

## Prerequisites

- **Node.js** (LTS recommended) for the frontend
- **Java 17** and **Maven** (or use the included `mvnw` / `mvnw.cmd`)
- **PostgreSQL** database
- **[Clerk](https://clerk.com/)** application (JWT issuer / JWK set, backend secret)
- Optional: separate ML/price HTTP services referenced by the frontend (see `.env`)

---

## Getting started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd Tea-Planter
```

### 2. Backend

From `BackEnd/`:

**Windows:**

```powershell
.\mvnw.cmd spring-boot:run
```

**macOS / Linux:**

```bash
./mvnw spring-boot:run
```

Configure environment variables before starting—see [Environment variables](#environment-variables). The app reads optional file-based config via `spring.config.import=optional:file:env.BackEnd`; you can place settings there or export the same variables in your shell.

Default API port: **8080** (override with `PORT`).

### 3. Frontend

From `FrontEnd/`:

```bash
npm install
cp .env.example .env    # Unix/macOS; on Windows copy manually
npm run dev
```

Run `npm run dev` and use the URL printed in the terminal. Backend defaults for PayHere redirects assume the frontend at `http://localhost:5174`; if you use another port, update `FRONTEND_URL` and related URLs in backend config.

Build for production:

```bash
npm run build
```

---

## Environment variables

### Backend (Spring Boot)

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | JDBC URL for PostgreSQL |
| `DATABASE_USERNAME` | Database user |
| `DATABASE_PASSWORD` | Database password |
| `CLERK_JWK_SET_URI` | Clerk JWKS URL for JWT validation |
| `CLERK_SECRET_KEY` | Clerk secret for server-side API use |
| `FRONTEND_URL` | Frontend origin (default `http://localhost:5174`) |
| `PAYHERE_*` | PayHere merchant, webhook, subscription, and redirect URLs |
| Mail / SMTP | As required by `application.properties` for outbound mail |

See `BackEnd/src/main/resources/application.properties` for the full list and defaults.

### Frontend (Vite)

The build reads variables from shell environment **or** `FrontEnd/env.FrontEnd` (plain `KEY=value` lines)—see `FrontEnd/vite.config.ts`.

| Variable | Purpose |
| --- | --- |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key for the SPA |
| `VITE_API_BASE_URL` | Base URL for the Spring Boot API |
| `VITE_ML_API_URL` | Base URL for the disease / nutrient ML API |
| `VITE_PRICE_API_URL` | Base URL for the price prediction API |

`FrontEnd/.env.example` documents the ML and price URLs; mirror the same keys in `env.FrontEnd` or your environment when running locally.

---

## Links

- **Live demo:** [LinkedIn post](https://lnkd.in/gV3ptj43)
- **Source / walkthrough:** [LinkedIn repository link](https://lnkd.in/g_5yhDZn)
