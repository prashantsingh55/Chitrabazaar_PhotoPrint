---
title: Chitrabazaar Physical Photo Printing
emoji: 📸
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# 📸 Chitrabazaar — Online Photo-Printing Marketplace

Chitrabazaar is a full-stack, production-grade online photo-printing marketplace built with **Next.js 14+ (App Router)**, **TypeScript**, **PostgreSQL + Prisma ORM**, and **Tailwind CSS**, styled in a bold, tactile **Neo-Brutalist** design aesthetic.

The platform connects customers with certified partner photo studios. Customers upload digital photos, configure custom print dimensions and darkroom paper finishes, choose between studio counter pickup or doorstep delivery, and track their orders through a real-time darkroom production pipeline.

> [!TIP]
> 📚 **Detailed Technical Documentation**:
> - [**Comprehensive Code Documentation**](./CODE_DOCUMENTATION.md): Deep-dive into domain modules, Sharp SIMD worker pipeline, pg-boss queue, API references, telemetry, and security.
> - [**Zero-Cost DevOps Architecture Blueprint**](./zero_cost_devops_architecture.md): Complete cloud infrastructure topology, free-tier provisioning ($0.00/mo), Caddy TLS, and GitHub Actions CI/CD.

---

## 🎨 Neo-Brutalist Design System

The application strictly adheres to neo-brutalist UI principles across all portals:
- **Thick, Solid Borders**: 3–4px high-contrast black borders (`border-3`, `border-4`, `border-black`).
- **Zero-Blur Hard Drop Shadows**: `shadow-brutal` (`4px 4px 0px 0px #000000`), `shadow-brutal-lg` (`6px 6px 0px 0px #000000`), `shadow-brutal-xl` (`8px 8px 0px 0px #000000`).
- **Tactile Active Pressed States**: Physical button depression on click (`active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`).
- **Loud, High-Contrast Palette**:
  - Electric Yellow (`#FFE600`)
  - Shocking Magenta / Pink (`#FF2E93`)
  - Cobalt Blue (`#2563EB`)
  - Mint / Emerald Green (`#00D084`)
  - Warm Canvas Cream (`#FFFDF8`)
  - Pitch Ink Black (`#000000`)
- **Sharp Corners**: Rectangular geometric shape language (`rounded-none`).

---

## 👥 Three Role-Based Portals

### 1. Customer Experience
- **Interactive Landing Page**: Hero showcase, "How It Works" 3-step cards, live print pricing calculator, studio network highlights, and FAQ accordion.
- **Upload Studio (`/upload`)**: Drag-and-drop file upload zone, client-side MIME & 20MB validation, 90° image rotation, aspect ratio previews, per-photo size selection (4×6, 5×7, A4, Passport, 8×10, 12×18), paper selection (Glossy, Matte, Lustre), finish (Borderless / White Border), and real-time subtotal estimation.
- **Checkout (`/checkout`)**: Studio pickup vs. home delivery, studio auto-assignment or manual studio selection, saved addresses, transparent fees breakdown, and payment authorization modal.
- **Order Tracking (`/orders/[id]`)**: Live 5-step darkroom pipeline (`Placed` ➔ `Assigned` ➔ `Printing` ➔ `Ready` ➔ `Completed` / `Cancelled`), high-res photo inspection, assigned studio contact card, counter pickup instructions, and printable invoice.
- **Order History & Profile (`/orders`, `/profile`)**: Reorder previous print batches with 1 click, address book management.

### 2. Photo Studio Admin Panel (`/studio/*`)
- **Live Studio Dashboard (`/studio/dashboard`)**: Scoped to the partner studio's darkroom data with real-time incoming order alert banners and synthetic audio chime.
- **Orders Queue (`/studio/orders`)**: Pipeline filter tabs (`Placed`, `Printing`, `Ready`, `Completed`, `Cancelled`), search by Order Number or customer name.
- **Order Fulfillment Console (`/studio/orders/[id]`)**: Full-resolution direct photo file downloads, exact paper specs, customer delivery info, darkroom status progression triggers, order rejection with reason, and printable **Physical Print Job Docket Slip** for attaching to packaging.
- **Studio Profile & Dedicated Payout Ledger (`/studio/profile`)**: Darkroom specifications, operating hours, and an immutable audit ledger of settled vs. pending payout cycles.

### 3. Chitrabazaar Super Admin Dashboard (`/admin/*`)
- **Platform Command (`/admin/dashboard`)**: Recharts analytics (7-day gross volume & revenue trends, pipeline status distribution donut chart, studio performance rankings).
- **Studio Network Manager (`/admin/studios`, `/admin/studios/[id]`)**: Onboard new photo studios, approve/reject pending applications, deactivate labs, and override custom commission rates.
- **Global Orders Desk (`/admin/orders`)**: Platform-wide order inspection with interactive **Studio Reassignment Modal** (rebalances darkroom capacity and notifies both studios).
- **Customer Directory (`/admin/users`)**: Search registered customers and toggle account access.
- **Platform Settings & Broadcast (`/admin/settings`)**: Currency configuration, platform cut %, CSV export of historical orders, and live SSE broadcast announcements to all studio dashboards.

---

## 🔔 Real-Time Notifications & Payout Architecture

1. **Unidirectional SSE + Polling Push**:
   - Built using Server-Sent Events (`/api/notifications/stream`) paired with a robust 4-second polling fallback.
   - Designed for server-to-client notifications: the moment a customer places an order, the assigned studio receives an instant visual banner and sound chime without reloading. When the studio marks an order `READY`, the customer receives an immediate push notification.
2. **Dedicated Payout Audit Ledger Model**:
   - Rather than calculating studio payouts ad-hoc on the fly, Chitrabazaar persists records in a dedicated `Payout` model in PostgreSQL (`id`, `studioId`, `periodStart`, `periodEnd`, `orderIds[]`, `grossAmount`, `commissionAmount`, `netPayout`, `status`, `paidAt`, `transactionRef`).
   - Ensures an immutable financial audit trail for what has been settled vs. what is currently pending.

---

## 🔑 Demo Login Credentials

For testing and demonstration, Chitrabazaar includes an environment-gated 1-click login bar (`DemoLoginBar`) on `/login`:

| Role | Email | Password | Primary Portal |
| :--- | :--- | :--- | :--- |
| **Customer** | `rahul@example.com` | `customer123` | `/orders` |
| **Customer** | `sneha@example.com` | `customer123` | `/orders` |
| **Studio Admin (Apex)** | `apex@photostudio.com` | `studio123` | `/studio/dashboard` |
| **Studio Admin (Prism)** | `prism@photostudio.com` | `studio123` | `/studio/dashboard` |
| **Super Admin** | `admin@chitrabazaar.com` | `admin123` | `/admin/dashboard` |

*(The demo login bar is strictly gated behind `NODE_ENV !== 'production' || NEXT_PUBLIC_ENABLE_DEMO_LOGIN === 'true'` and will never be exposed in production).*

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- Node.js 18+ (Tested on Node.js v24)
- PostgreSQL running locally or a hosted cloud PostgreSQL database (Neon, Supabase, Vercel Postgres)

### 2. Clone & Install
```bash
git clone <repository-url>
cd Photoprint
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the project root:
```env
# PostgreSQL Connection String
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/chitrabazaar?schema=public"

# NextAuth Secret & URL
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-32-character-secret-key-here"

# Gated Demo Logins in Development
NEXT_PUBLIC_ENABLE_DEMO_LOGIN="true"

# Localization Defaults
NEXT_PUBLIC_DEFAULT_CURRENCY="$"
NEXT_PUBLIC_APP_NAME="Chitrabazaar"

# Pluggable Storage & Payment Services
STORAGE_PROVIDER="local"
PAYMENT_GATEWAY="mock"
```

### 4. Setup Database & Seed Demo Data
```bash
# Push schema to PostgreSQL database
npx prisma db push

# Seed demo studios, orders, payout batches, and users
npx prisma db seed
```

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Build & Verification Commands

```bash
# Verify TypeScript without errors
npx tsc --noEmit

# Production Build
npm run build

# Start Production Server
npm run start
```

---

## 🏗️ Production DevOps Architecture ($0 Cloud-Native Stack)

Chitrabazaar includes a fully engineered, enterprise-grade DevOps architecture running on a permanent **$0.00/month free tier**:

```
[Edge: Cloudflare WAF/CDN + Stripe] ──► [OCI Always-Free VM: Caddy + Next.js + Worker]
                                               │                      │
                                               ▼                      ▼
                           [Neon Postgres + pg-boss Queue]   [Cloudflare R2 Storage]
```

### 1. Compute & Domain Services (Oracle Cloud Always-Free)
- **Node Specs**: 4 OCPUs (ARM Ampere A1) + 24 GB RAM + 200 GB NVMe storage running streamlined **Docker Compose** (with simple K3s upgrade path).
- **Core Next.js Web & Domain Services**:
  - **Order & Payment Service**: Stripe / eSewa checkout integration with automated webhook listener and escrow ledger.
  - **Print Job Manufacturing Service**: Explicit decoupled manufacturing unit handling paper emulsion, plate DPI verification, and printable darkroom job dockets.
  - **Delivery & Fulfillment Dispatcher**: Branched fulfillment handling (Counter Pickup with 6-digit PIN/barcode vs. Courier dispatch with Waybill/Tracking #).
- **Asynchronous Media Processing Pipeline**: Dedicated worker powered by **Sharp / libvips** executing EXIF auto-rotation, color space conversion (sRGB -> ProPhoto/CMYK), DPI preflight auditing, and thumbnail rendering.

### 2. External Managed Data & Durable Queue (Neon Serverless Postgres)
- **ACID Durable Queue (`pg-boss`)**: Jobs are enqueued in the **exact same database transaction** as the customer order. Eliminates Redis entirely, guaranteeing zero dropped print jobs.
- **Dual-Connection Strategy**:
  - `DATABASE_URL`: Built-in PgBouncer pooled connection for running app and worker containers.
  - `DIRECT_URL`: Direct port 5432 connection used exclusively by **GitHub Actions** during CI/CD to run `npx prisma migrate deploy` safely before deployment.

### 3. Zero-Trust Object Storage (Cloudflare R2)
- **Presigned Uploads**: Customer photos (up to 100MB camera RAW/TIFF) stream directly to private R2 storage via 15-minute presigned URLs, bypassing application server memory.
- **HMAC Signed Reads**: Private master prints are restricted to authorized partner studios via short-lived signed tokens.
- **$0 egress fees** across all photo transfers.

### 4. Continuous Integration & Deployment Pipeline
- **GitHub Actions**: Automated linting, type-checking (`tsc --noEmit`), Trivy container security scans, and Prisma migrations.
- **GHCR**: Multi-architecture ARM64/AMD64 Docker image registry.

### 5. Architectural Blueprints & Diagrams
- **High-Res 4K Infographic**: `public/images/zero_cost_devops_architecture.jpg`
- **Scalable Vector Graphic (SVG)**: `public/images/zero_cost_devops_architecture.svg`
- **Complete DevOps Specification**: [`zero_cost_devops_architecture.md`](./zero_cost_devops_architecture.md)

