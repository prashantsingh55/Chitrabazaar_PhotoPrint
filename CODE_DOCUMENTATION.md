# 📖 Chitrabazaar Platform — Comprehensive Code & Technical Architecture Documentation

Welcome to the definitive developer and architect technical documentation for **Chitrabazaar**, a physical darkroom photo-printing marketplace designed as a high-performance **Modular Monolith with Decoupled Asynchronous Background Workers** under a strictly enforced **Zero-Cost DevOps Architecture ($0.00/month)** requiring **100% ZERO Credit Card**.

---

## Table of Contents

1. [Architectural Overview & Core Guarantees](#1-architectural-overview--core-guarantees)
2. [High-Level Topology & Data Flow](#2-high-level-topology--data-flow)
3. [Project Directory & Module Structure](#3-project-directory--module-structure)
4. [Database Architecture & Entity Model](#4-database-architecture--entity-model)
5. [In-Process Modular Monolith Domain Services](#5-in-process-modular-monolith-domain-services)
   - [Storage Module (`src/modules/storage/r2.ts`)](#51-storage-module)
   - [Print Jobs Module (`src/modules/print-jobs/index.ts`)](#52-print-jobs-module)
   - [Delivery & Transit Module (`src/modules/delivery/index.ts`)](#53-delivery--transit-module)
   - [Payment & IPN Module (`src/modules/payments/index.ts`)](#54-payment--ipn-module)
   - [Orders Domain Service (`src/modules/orders/index.ts`)](#55-orders-domain-service)
   - [Notification Dispatcher (`src/lib/notifications.ts`)](#56-notification-dispatcher)
6. [Durable Queuing & Background Media Processing](#6-durable-queuing--background-media-processing)
   - [Zero-Redis Queuing Engine (`src/lib/queue.ts`)](#61-zero-redis-queuing-engine)
   - [Sharp SIMD Preflight & 300 DPI Rendering (`src/worker/media-processor.ts`)](#62-sharp-simd-preflight--300-dpi-rendering)
   - [Worker Daemon & Embedded Health Server (`src/worker/index.ts`)](#63-worker-daemon--embedded-health-server)
7. [API Routes & Webhook Endpoints](#7-api-routes--webhook-endpoints)
8. [Observability, Telemetry & Health Probes](#8-observability-telemetry--health-probes)
9. [Production Deployment Guide (Vercel + Render)](#9-production-deployment-guide-vercel--render)
   - [Deploying Web Monolith to Vercel](#91-deploying-web-monolith-to-vercel)
   - [Deploying Media Worker to Render](#92-deploying-media-worker-to-render)
   - [24/7 Keep-Alive Automation (UptimeRobot)](#93-247-keep-alive-automation-uptimerobot)
10. [Local Development, Seeding & Operations](#10-local-development-seeding--operations)

---

## 1. Architectural Overview & Core Guarantees

Chitrabazaar was re-architected from the ground up to solve the real-world operational challenges of heavy media uploads, print fidelity verification, and distributed status coordination without incurring cloud infrastructure bills or requiring credit card verification.

### The Four Pillars of the Architecture

```
+-----------------------------------------------------------------------------------------+
|                                CHITRABAZAAR ARCHITECTURE                                 |
+----------------------------+-----------------------------+------------------------------+
| 1. ZERO SERVER BUFFERING   | 2. ZERO-REDIS QUEUE         | 3. MODULAR MONOLITH          |
| Client browser streams     | Durable pg-boss jobs run in | Single deployable Next.js    |
| raw 50MB camera files      | PostgreSQL ACID transaction | monolith with strict domain  |
| directly to Cloudflare R2  | alongside order creation.   | boundaries on Vercel Edge.   |
+----------------------------+-----------------------------+------------------------------+
| 4. ZERO CREDIT CARD HOSTS  | 5. HEADLESS SIMD WORKER     | 6. MULTI-LAYER TELEMETRY     |
| Vercel (Hobby Web) +       | Render Web Service runs     | Prometheus scraper + health  |
| Render (Free Worker) +     | Sharp process for 300 DPI   | probes + external keep-alive |
| Neon Serverless PostgreSQL | master print plate rendering| for 24/7 uninterrupted uptime|
+----------------------------+-----------------------------+------------------------------+
```

### Free-Tier Cost Breakdown ($0.00 / Month — No Credit Card Ever)

| Layer | Provider & Tier | Allocation & Free Limits | Credit Card Required? |
| :--- | :--- | :--- | :--- |
| **Web Storefront & APIs** | **Vercel (Hobby Tier)** | Global Anycast Edge, SSL/TLS, Zero Cold Starts, 100 GB Bandwidth | **STRICTLY NO** |
| **Background Media Worker**| **Render (Free Web Service)**| 512 MB RAM, Node 20, Sharp SIMD acceleration, 750 free hrs/mo | **STRICTLY NO** |
| **Database** | **Neon Serverless PostgreSQL**| 0.5 GiB storage, connection pooling (PgBouncer), branching, 100 compute-hours | **STRICTLY NO** |
| **Object Storage** | **Cloudflare R2 / Supabase** | S3-compatible, presigned client uploads & downloads, **$0 egress fees** | **STRICTLY NO** |
| **Public Edge & CDN** | **Vercel Edge + Cloudflare** | Global Anycast DNS, DDoS mitigation, Automatic TLS 1.3 / HTTPS | **STRICTLY NO** |
| **Keep-Alive Probe** | **UptimeRobot / cron-job.org**| Free 14-minute HTTP ping to `/health` preventing 15m idle sleep | **STRICTLY NO** |
| **Queuing Engine** | **`pg-boss` in Neon PostgreSQL**| Durable transactional queue embedded in database (**eliminates Redis**) | **STRICTLY NO** |

---

## 2. High-Level Topology & Data Flow

### End-to-End Commission & Darkroom Execution Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer Browser
    participant Web as Vercel Next.js Web Monolith
    participant R2 as Cloudflare R2 Storage
    participant DB as Neon PostgreSQL
    participant Worker as Render Sharp Media Worker
    participant Studio as Partner Darkroom Studio
    participant Courier as Courier / Counter

    %% Phase 1: Upload
    Customer->>Web: POST /api/upload/presign (filename, mimeType, size)
    Web-->>Customer: 15-min Presigned PUT URL + assetKey (raw/...)
    Customer->>R2: Direct HTTP PUT raw image stream (Zero Server RAM Load)
    R2-->>Customer: 200 OK

    %% Phase 2: Order Placement & Settlement
    Customer->>Web: POST /api/orders (items, studioId, deliveryMethod)
    Web->>DB: ACID Transaction (Create Order, Payment, PrintJobs with Dockets)
    Web->>DB: Enqueue pgboss.job (media-processing, print-job, notification)
    Web-->>Customer: Order Confirmed (with Counter Pickup PIN if applicable)

    %% Phase 3: Background Worker Preflight
    Worker->>DB: pg-boss pulls media-processing job
    Worker->>R2: Fetch raw image buffer
    Worker->>Worker: Sharp SIMD Pipeline (EXIF orient, calculate DPI, render 300 DPI master & WebP proof)
    Worker->>R2: Upload masters/300dpi.jpg & proofs/proof.webp
    Worker->>DB: Update PrintJob (status: READY_FOR_PRESS, detectedDpi, warnings)

    %% Phase 4: Darkroom Fulfillment
    Studio->>Web: GET /api/print-jobs (assigned darkroom queue)
    Studio->>Web: GET /api/print-jobs/[id]/master
    Web-->>Studio: 15-min Presigned GET URL for 300 DPI Master
    Studio->>Studio: Physical darkroom exposure, emulsion chemical bath, drying
    Studio->>Web: PATCH /api/print-jobs/[id] (status: COMPLETED)

    %% Phase 5: Handover
    alt Counter Pickup
        Customer->>Studio: Presents 6-digit Pickup PIN
        Studio->>Web: Verify PIN & Handover
    else Doorstep Courier
        Studio->>Web: Attach Courier Waybill Number & Tracking URL
        Courier->>Customer: Physical delivery verified
    end
```

---

## 3. Project Directory & Module Structure

```
c:/Users/Asus/Desktop/Photoprint/
├── .github/
│   └── workflows/
│       └── ci-cd.yml                # CI validation (Lint -> TypeScript -> Prisma -> Build)
├── prisma/
│   ├── schema.prisma                # PostgreSQL schema with PrintJob, Delivery, Order models
│   └── seed.ts                      # Idempotent demo database seeder
├── public/
│   ├── images/
│   │   ├── zero_cost_devops_architecture.svg   # 6-section system architecture diagram
│   │   └── zero_cost_devops_architecture.jpg   # High-resolution photorealistic render
│   └── uploads/                     # Local fallback asset storage (dev environment)
├── src/
│   ├── app/                         # Next.js 14 App Router (Portals & API endpoints)
│   │   ├── (customer)/              # Customer portal: /, /upload, /checkout, /orders
│   │   ├── admin/                   # Super Admin portal: /admin/dashboard, /admin/studios, etc.
│   │   ├── studio/                  # Photo Studio portal: /studio/dashboard, /studio/orders
│   │   └── api/                     # Serverless Route Handlers
│   │       ├── health/route.ts      # Vercel liveness probe (/api/health)
│   │       ├── metrics/route.ts     # Prometheus scrape target (/api/metrics)
│   │       ├── upload/presign/      # Storage presigned PUT generator
│   │       ├── webhooks/            # External IPN listeners (Stripe & eSewa)
│   │       └── print-jobs/          # Studio darkroom queue & signed master downloader
│   ├── modules/                     # Encapsulated Modular Monolith Domain Logic
│   │   ├── storage/r2.ts            # S3 client, presigned URL issuer, storage health check
│   │   ├── print-jobs/index.ts      # Print specs, DPI math, docket generator, state machine
│   │   ├── delivery/index.ts        # 6-digit pickup PIN, courier waybills, handover tracking
│   │   ├── payments/index.ts        # Stripe/eSewa webhook handler, commission calculation
│   │   └── orders/index.ts          # Order creation coordinator, transactional job enqueuer
│   ├── worker/                      # Headless Asynchronous Media Processing Worker
│   │   ├── index.ts                 # Worker entrypoint daemon + embedded HTTP /health server
│   │   └── media-processor.ts       # Sharp/libvips preflight, DPI validation, 300 DPI master renderer
│   └── lib/                         # Shared Cross-Cutting Utilities
│       ├── db.ts                    # Global Prisma Client instance
│       ├── queue.ts                 # pg-boss queue singleton (connection & job enqueuing)
│       ├── metrics.ts               # prom-client metrics registry & Prometheus collector
│       └── notifications.ts         # SSE event emitter & in-app notification dispatcher
├── render.yaml                      # Render Infrastructure-as-Code Blueprint for Media Worker
├── vercel.json                      # Vercel deployment configuration
├── Dockerfile                       # Multi-stage Docker build (for local container testing)
├── package.json                     # Project scripts and dependencies
└── tsconfig.json                    # Strict TypeScript compiler options
```

---

## 4. Database Architecture & Entity Model

The relational database model is designed for strict referential integrity and auditability.

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│      User       │       │     Studio      │       │      Photo      │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (UUID, PK)   │       │ id (UUID, PK)   │       │ id (UUID, PK)   │
│ email (Unique)  │◄──┐   │ name            │◄──┐   │ userId (FK)     ├──► User
│ name            │   │   │ address, phone  │   │   │ originalKey     │
│ role (Enum)     │   │   │ commissionRate  │   │   │ mimeType, size  │
└─────────────────┘   │   │ isActive        │   │   │ width, height   │
                      │   └─────────────────┘   │   │ detectedDpi     │
                      │                         │   └────────┬────────┘
                      │   ┌─────────────────┐   │            │
                      │   │      Order      │   │            │
                      │   ├─────────────────┤   │            │
                      └───┤ customerId (FK) │   │            │
                          │ studioId (FK)   ├───┘            │
                          │ status (Enum)   │                │
                          │ totalAmount     │                │
                          │ deliveryMethod  │                │
                          └────────┬────────┘                │
                                   │ 1                       │
                                   │                         │
                                   ▼ *                       │
                          ┌─────────────────┐                │
                          │    PrintJob     │                │
                          ├─────────────────┤                │
                          │ id (UUID, PK)   │                │
                          │ orderId (FK)    │                │
                          │ photoId (FK)    ├────────────────┘
                          │ status (Enum)   │
                          │ format, finish  │
                          │ masterKey       │
                          │ proofKey        │
                          │ docketNumber    │
                          └────────┬────────┘
                                   │ 1
                                   ▼ 1
                          ┌─────────────────┐
                          │    Delivery     │
                          ├─────────────────┤
                          │ id (UUID, PK)   │
                          │ printJobId (FK) │
                          │ method (Enum)   │
                          │ pickupPin       │
                          │ courierName     │
                          │ waybillNumber   │
                          │ status (Enum)   │
                          └─────────────────┘
```

---

## 5. In-Process Modular Monolith Domain Services

### 5.1. Storage Module
**Location**: [`src/modules/storage/r2.ts`](file:///c:/Users/Asus/Desktop/Photoprint/src/modules/storage/r2.ts)

Handles direct-to-storage operations using the AWS S3 SDK, supporting Cloudflare R2, Supabase Storage, or a local disk fallback.

- `getPresignedUploadUrl(filename, contentType)`: Issues a 15-minute presigned HTTP `PUT` URL so client browsers upload directly to the storage bucket, completely bypassing server memory.
- `getPresignedDownloadUrl(key, expiresInSeconds)`: Generates a short-lived signed HTTP `GET` URL for darkroom studios to securely fetch the 300 DPI master print plate.
- `checkStorageHealth()`: Verifies S3 credentials and bucket accessibility during `/api/health` probes.

### 5.2. Print Jobs Module
**Location**: [`src/modules/print-jobs/index.ts`](file:///c:/Users/Asus/Desktop/Photoprint/src/modules/print-jobs/index.ts)

Encapsulates manufacturing business logic:
- Standard print formats (`4x6`, `5x7`, `8x10`, `12x18`, `A4`).
- DPI Preflight Calculator: $\text{DPI} = \frac{\text{Pixel Dimension}}{\text{Physical Size (Inches)}}$.
- Quality warnings: Flags photos below 150 DPI as `POOR`, between 150–299 DPI as `FAIR`, and $\ge 300$ DPI as `EXCELLENT`.
- Work Order Docket generation: Produces unique alphanumeric manufacturing dockets (e.g., `DOC-2026-X8K9`).

### 5.3. Delivery & Transit Module
**Location**: [`src/modules/delivery/index.ts`](file:///c:/Users/Asus/Desktop/Photoprint/src/modules/delivery/index.ts)

Manages physical handover:
- **Counter Pickup**: Generates a cryptographically random 6-digit PIN and barcode. The partner studio validates the PIN at the counter before handing over the package.
- **Courier Transit**: Manages courier carrier tracking numbers and waybill references.

### 5.4. Payment & IPN Module
**Location**: [`src/modules/payments/index.ts`](file:///c:/Users/Asus/Desktop/Photoprint/src/modules/payments/index.ts)

Handles transactions with zero payment processor lock-in:
- Stripe Checkout Session creation and webhook cryptographic signature validation (`stripe.webhooks.constructEvent`).
- eSewa Instant Payment Notification (IPN) HMAC-SHA256 signature verification.
- Mock gateway for zero-cost developer testing.

### 5.5. Orders Domain Service
**Location**: [`src/modules/orders/index.ts`](file:///c:/Users/Asus/Desktop/Photoprint/src/modules/orders/index.ts)

Coordinates the end-to-end checkout transaction:
- Validates basket items, quantities, and pricing tariffs.
- Executes an atomic PostgreSQL transaction that writes the `Order`, `Payment`, `PrintJob`, and `Delivery` records simultaneously.
- Atomically enqueues background processing jobs into `pg-boss`.

### 5.6. Notification Dispatcher
**Location**: [`src/lib/notifications.ts`](file:///c:/Users/Asus/Desktop/Photoprint/src/lib/notifications.ts)

Maintains an in-memory Server-Sent Events (SSE) bus for real-time dashboard updates without needing third-party WebSockets services like Pusher.

---

## 6. Durable Queuing & Background Media Processing

### 6.1. Zero-Redis Queuing Engine
**Location**: [`src/lib/queue.ts`](file:///c:/Users/Asus/Desktop/Photoprint/src/lib/queue.ts)

Built on `pg-boss`, which creates dedicated queue tables directly inside Neon PostgreSQL. This completely eliminates Redis, saving memory and hosting costs.

- Automatically calls `boss.createQueue()` on initialization to register queues (`media-processing`, `print-job`, `notification`, `delivery`).
- Jobs survive crashes and reboots thanks to PostgreSQL ACID durability.

### 6.2. Sharp SIMD Preflight & 300 DPI Rendering
**Location**: [`src/worker/media-processor.ts`](file:///c:/Users/Asus/Desktop/Photoprint/src/worker/media-processor.ts)

Runs hardware-accelerated image manipulation using `sharp` (libvips):
1. **EXIF Auto-Orientation**: Reads camera orientation tags and rotates pixels to avoid upside-down prints.
2. **DPI Verification**: Calculates actual print resolution against target dimensions.
3. **Master Rendering**: Produces high-resolution 300 DPI press plates formatted with print bleed margins.
4. **Web Proof Generation**: Emits lightweight, watermarked WebP/AVIF thumbnails for the browser portal.

### 6.3. Worker Daemon & Embedded Health Server
**Location**: [`src/worker/index.ts`](file:///c:/Users/Asus/Desktop/Photoprint/src/worker/index.ts)

Includes a built-in native Node HTTP health server:
```typescript
const PORT = process.env.PORT || 10000;
const healthServer = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy', worker: 'active', queues: [...] }));
  }
});
```
This enables Render to run the background worker as a **Free Web Service** with active health checking, allowing external keep-alive bots (UptimeRobot) to ping `/health` every 14 minutes and prevent sleep.

---

## 7. API Routes & Webhook Endpoints

| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Web application liveness & readiness probe |
| `GET` | `/api/metrics` | Internal / Prometheus | Exports Prometheus metrics for latency, memory, and job throughput |
| `POST` | `/api/upload/presign` | Authenticated / Guest | Returns a 15-min presigned PUT URL for Cloudflare R2 / S3 |
| `POST` | `/api/orders` | Customer | Creates order, authorizes payment, spawns PrintJobs |
| `GET` | `/api/orders` | Customer / Studio / Admin | Scoped list of orders based on authenticated role |
| `GET` | `/api/print-jobs` | Studio / Admin | Assigned darkroom print jobs for press operators |
| `PATCH` | `/api/print-jobs/[id]` | Studio Admin | Progresses print plate status (`PRINTING` $\rightarrow$ `COMPLETED`) |
| `GET` | `/api/print-jobs/[id]/master` | Studio Admin | Issues 15-min signed GET URL for 300 DPI master plate |
| `POST` | `/api/webhooks/stripe` | External (Stripe) | Verifies cryptographic signature & settles order |
| `GET/POST`| `/api/webhooks/esewa` | External (eSewa) | Validates HMAC-SHA256 callback & settles order |
| `GET` | `/api/notifications/stream`| Authenticated | SSE real-time push connection for live dashboard alerts |

---

## 8. Observability, Telemetry & Health Probes

### 8.1. Metrics Registry
**Location**: [`src/lib/metrics.ts`](file:///c:/Users/Asus/Desktop/Photoprint/src/lib/metrics.ts)

Built with `prom-client`. Designed with idempotent metric getters (`getOrCreateCounter`, `getOrCreateHistogram`) to ensure that Next.js Hot Module Reloads in development never throw duplicate registration collisions.

#### Metrics Exported
- `chitrabazaar_http_requests_total`: Request counter tagged by method, route, and status.
- `chitrabazaar_http_request_duration_seconds`: Response latency histogram.
- `chitrabazaar_orders_created_total`: Orders created tagged by delivery method.
- `chitrabazaar_orders_paid_total`: Completed orders tagged by payment gateway.
- `chitrabazaar_print_jobs_created_total`: Print jobs queued tagged by format and paper.
- `chitrabazaar_print_jobs_completed_total`: Total darkroom print jobs finished.
- `chitrabazaar_media_processing_duration_seconds`: Sharp rendering time histogram.

### 8.2. Health Check Probe
**Location**: [`src/app/api/health/route.ts`](file:///c:/Users/Asus/Desktop/Photoprint/src/app/api/health/route.ts)

Returns HTTP 200 when healthy or HTTP 503 if degraded.

```json
{
  "status": "healthy",
  "timestamp": "2026-09-09T07:15:20.125Z",
  "uptimeSeconds": 3600,
  "latencyMs": 1,
  "environment": "production",
  "version": "1.0.0",
  "checks": {
    "database": {
      "status": "healthy",
      "latencyMs": 1
    },
    "storage": {
      "status": "healthy",
      "provider": "local"
    }
  }
}
```

---

## 9. Production Deployment Guide (Vercel + Render)

### 9.1. Deploying Web Monolith to Vercel
1. Go to [vercel.com](https://vercel.com) and log in with GitHub (no credit card needed).
2. Click **Add New** $\rightarrow$ **Project** $\rightarrow$ Select your `Photoprint` repository.
3. Configure Environment Variables in the Vercel dashboard:
   - `DATABASE_URL`: Pooled connection string from Neon (`?sslmode=require&pgbouncer=true`)
   - `DIRECT_URL`: Direct connection string from Neon
   - `NEXTAUTH_SECRET`: Random 32-byte string (`openssl rand -base64 32`)
   - `NEXTAUTH_URL`: `https://your-project.vercel.app`
   - `STORAGE_PROVIDER`: `local` (or `s3` with Cloudflare R2 credentials)
   - `PAYMENT_GATEWAY`: `mock` (or `stripe` / `esewa`)
4. Click **Deploy**. Vercel will build and launch your application globally!

### 9.2. Deploying Media Worker to Render
1. Go to [render.com](https://render.com) and log in with GitHub (no credit card needed).
2. Click **New +** $\rightarrow$ **Web Service**.
3. Select your `Photoprint` GitHub repository.
4. Settings:
   - **Name**: `chitrabazaar-worker`
   - **Language**: `Node`
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `npm run worker`
   - **Instance Type**: `Free`
   - **Health Check Path**: `/health`
5. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: Same pooled Neon connection string as Vercel
   - `STORAGE_PROVIDER`, `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` (if using R2)
6. Click **Create Web Service**. Render installs dependencies and launches the Sharp worker listening on port 10000.

### 9.3. 24/7 Keep-Alive Automation (UptimeRobot)
1. Sign up at [uptimerobot.com](https://uptimerobot.com) (free).
2. Add a new **HTTP(s) Monitor**:
   - URL: `https://chitrabazaar-worker.onrender.com/health`
   - Interval: **14 minutes**
3. This recurring GET keeps the Render free worker warm and prevents it from sleeping, ensuring customer print orders are processed immediately!

---

## 10. Local Development, Seeding & Operations

### Prerequisites
- Node.js 18+ (Node 20 recommended)
- PostgreSQL 16+ running locally (or remote Neon DB connection)

### 1. Installation
```bash
git clone <repo-url>
cd Photoprint
npm install
```

### 2. Environment Configuration
Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```

Key environment variables:
```env
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5433/chitrabazaar?schema=public"
DIRECT_URL="postgresql://postgres:postgres@127.0.0.1:5433/chitrabazaar?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="chitrabazaar-development-secret-key-2026"
NEXT_PUBLIC_ENABLE_DEMO_LOGIN="true"
STORAGE_PROVIDER="local"
PAYMENT_GATEWAY="mock"
```

### 3. Database Migration & Seed
```bash
npx prisma db push
npx prisma db seed
```

### 4. Running the Development Stack
```bash
# Terminal 1: Next.js Web Monolith
npm run dev

# Terminal 2: Asynchronous Media Worker
npm run worker
```

### 5. Verification Commands
```bash
# TypeScript compilation audit
npx tsc --noEmit

# Production build verification
npm run build

# Health probe check
curl http://localhost:3000/api/health

# Prometheus metrics check
curl http://localhost:3000/api/metrics
```

### 6. Default Demo Credentials
- **Super Admin**: `admin@chitrabazaar.com` / `admin123`
- **Studio Admin (Apex Digital)**: `apex@chitrabazaar.com` / `studio123`
- **Customer (Rahul)**: `rahul@example.com` / `customer123`
- **Customer (Sneha)**: `sneha@example.com` / `customer123`

---

*Chitrabazaar Platform Architecture & Code Documentation — Certified 100% Zero Credit Card & $0.00/Month Production Ready.*
