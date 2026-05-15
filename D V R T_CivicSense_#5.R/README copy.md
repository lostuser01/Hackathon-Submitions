# PrestigeProtocol

# 🏛️ Prestige Protocol
### AI-Driven Civic Complaint Management System

> *"A city works when its citizens are heard — and heard fast."*

---

## 🎯 1. Problem Statement

### The Problem
Municipal complaints in India — potholes, streetlight failures, water leaks, sanitation breakdowns — are filed by citizens through portals that route them manually. The result:

- **70%+ complaints** in municipal systems remain unresolved for 30+ days (National Urban Affairs data)
- Citizens file the **same complaint multiple times** with zero awareness it already exists
- Complaints land in the **wrong departments**, causing delays and blame-shifting
- **No visibility**: after submission, citizens have zero idea what's happening with their complaint
- Supervisors are **overwhelmed** with mis-routed complaints they can't act on

### Who Is Affected
| Stakeholder | Pain Point |
|---|---|
| 🏘️ Citizens | No feedback loop, repeated filing, ignored complaints |
| 🏢 Municipal Staff | Manual routing load, inbox overload, no prioritisation |
| 🛠️ Department Heads | Receive wrong complaints, delayed action |
| 🏛️ Administrators | No oversight, no data, no accountability |

### Why It Matters Now
India has **4,800+ urban local bodies** managing complaints from 500 million urban citizens. With Smart City initiatives expanding, the infrastructure for civic grievance redressal is critically broken. AI-driven automation is no longer a luxury — it's a necessity.

---

## 💡 2. Proposed Solution

### What We Built: Prestige Protocol
A full-stack **AI-driven civic complaint management platform** that:

1. **Citizens** submit geotagged complaints with photos via a sleek web dashboard
2. An **AI vector pipeline** instantly embeds the complaint text using semantic AI and:
   - Detects **duplicate complaints** from the same area (radius: 50m, similarity: 85%)
   - Routes the complaint to the **correct department** using learned semantic patterns
   - Identifies the **nearest office** based on GPS coordinates
3. Complaints flow through a **strict role-based hierarchy** (Admin → Manager → Supervisor)
4. Status updates propagate back to citizens in **real-time**

### Why It's Better Than Existing Solutions
| Feature | Existing Portals | Prestige Protocol |
|---|---|---|
| Routing | Manual / Random | AI Semantic Routing |
| Duplicate Detection | None | Vector Proximity Check |
| Citizen Visibility | Minimal | Live Status + Resolution Notes |
| Role Hierarchy | Flat | Admin → Manager → Supervisor |
| Image Evidence | Rare | Native Support + Cloud Storage |
| Scalability | Single server | Supabase (serverless Postgres) |

---

## 🚀 3. Innovation & Differentiation

### What Makes This New

**1. Semantic Duplicate Deduplication**
Instead of comparing complaint text literally, we embed complaints into a 384-dimensional vector space using `BAAI/bge-small-en-v1.5`. Two complaints about the same pothole in different words — one saying *"road broken near temple"* and another saying *"crater on the lane by the mandir"* — are detected as duplicates. The second citizen upvotes the existing ticket instead of creating noise.

**2. AI Department Routing via RPC**
A PostgreSQL RPC function (`predict_department`) runs vector similarity against a labelled embedding table of historic complaint-to-department mappings. Confidence threshold: 60%. Below that, human triage kicks in — no false routing.

**3. Geo-Aware Office Assignment**
After department prediction, `get_closest_office` RPC identifies the nearest physical municipal office to the complaint GPS coordinates — ensuring field staff closest to the problem get the ticket.

**4. Hierarchical Role Control**
The `Admin → Manager → Supervisor` hierarchy ensures:
- Admins provision Managers per department
- Managers can reassign departments and update ticket status
- Supervisors can mark progress and resolve tickets
- Citizens only see their own data

**Compared to tools like:**
- **MyGov / PG Portal**: No AI routing, no deduplication, no role hierarchy
- **Salesforce Govt Cloud**: Expensive, no India-specific civic routing
- **Custom spreadsheets**: Zero automation, zero visibility

---

## 🛠️ 4. Technical Approach

### Architecture

```
┌──────────────────────────────────────────────────────┐
│                     CITIZEN / STAFF                  │
│              Next.js 14 Frontend (App Router)        │
│         [Login] [Dashboard] [Submit Complaint]       │
└───────────────────────┬──────────────────────────────┘
                        │  JWT Auth (Supabase Auth)
                        ▼
┌──────────────────────────────────────────────────────┐
│              FastAPI Backend (Python 3.13)           │
│  /auth  /complaints  /profiles  /departments         │
│  /offices                                            │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │         AI ROUTING PIPELINE (Async)          │   │
│  │  1. FastEmbed → 384-d vector embedding       │   │
│  │  2. find_duplicate_complaint RPC (pgvector)  │   │
│  │  3. predict_department RPC (cosine sim)      │   │
│  │  4. get_closest_office RPC (geo distance)    │   │
│  └──────────────────────────────────────────────┘   │
└───────────────────────┬──────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────┐
│               Supabase (PostgreSQL + pgvector)       │
│  Tables: profiles | complaints | departments         │
│          offices | complaint_embeddings              │
│          complaint_upvotes | complaint_audit_logs    │
│  Storage: Supabase Buckets (complaint images)        │
└──────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14, TypeScript, Tailwind-free Vanilla CSS, Leaflet Maps |
| **Backend** | FastAPI (Python 3.13), Pydantic v2, Uvicorn |
| **Auth** | Supabase Auth (JWT / ES256) |
| **AI / ML** | FastEmbed (`BAAI/bge-small-en-v1.5`), ONNX Runtime |
| **Database** | PostgreSQL via Supabase + `pgvector` extension |
| **Storage** | Supabase Storage (S3-compatible buckets) |
| **Hosting** | Vercel (Frontend), Uvicorn local / cloud-deployable |

### Core Flow

```
Citizen submits complaint
        │
        ▼
[FastAPI] Generate 384-d embedding (FastEmbed)
        │
        ├──► [pgvector RPC] Duplicate check within 50m radius?
        │           YES → Upvote existing ticket → Return early
        │           NO  → Continue
        │
        ├──► Insert complaint record (status: pending_routing)
        │
        └──► [Background Task]
                    │
                    ├──► Store embedding in complaint_embeddings
                    ├──► predict_department (cosine similarity > 60%)
                    ├──► get_closest_office (geolocation)
                    └──► Update complaint: department_id, office_id, status: routed
```

---

## 🌍 5. Impact & Scalability

### Who Benefits
- **Citizens**: Real-time updates, no repeated filing, photographic evidence supported
- **Municipal Staff**: Laser-focused queues — only relevant complaints in their office
- **Department Managers**: Department-level reassignment and audit trail
- **City Administrators**: Full visibility dashboard, oversight across all departments
- **Environment**: Faster infrastructure repair = less resource waste, fewer accidents

### Short-Term Impact
- Reduce average complaint resolution time from 30+ days → under 7 days
- Eliminate 40–60% of duplicate complaints from clogging queues
- Enable data-driven insights: which sectors have the most infrastructure failures

### Long-Term Impact
- City-wide complaint heat maps for proactive infrastructure maintenance
- Predictive maintenance: AI flagging areas before citizens complain
- Integration with IoT sensors (potholes, streetlights, water meters)

### Scalability
- **Supabase** offers serverless, globally-distributed PostgreSQL — zero infrastructure overhead
- **pgvector** supports millions of vector rows with ANN indexing (IVFFlat / HNSW)
- **FastAPI** is async-first — horizontally scalable behind load balancers
- **Next.js** deploys globally via Vercel CDN — sub-100ms TTFB
- Designed to serve **4,800+ municipal bodies** across India with department-level partitioning

---

## 💰 6. Business Model / Sustainability

### Revenue Streams

| Model | Description |
|---|---|
| **SaaS B2G** (Primary) | License fees to Urban Local Bodies / State Govts per city (₹5–20L/year) |
| **Per-Complaint Processing** | Micro-fee model for large cities (₹1–2/complaint processed) |
| **Premium Analytics** | Paid dashboard for city planners: heat maps, trend reports, SLA tracking |
| **API Access** | Third-party integrations (NGOs, news portals) via metered API keys |

### Cost Structure
- **Infrastructure**: Near-zero for MVP (Supabase free tier covers 500MB DB + 1GB storage)
- **AI Model**: FastEmbed runs on-device (no OpenAI API costs) — zero per-query inference cost
- **Hosting**: Vercel Hobby → Pro at scale (~$20/mo frontend, ~$25/mo backend VM)

### Sustainability Without Revenue
- Open-source the core engine → contributions from civic tech community
- Grant funding: Digital India, Smart Cities Mission, UNDP Civic Innovation Fund
- Partnership with government digital service providers (NIC, e-Gov Foundation)

---

## 📊 7. Market Validation

### The Numbers
- **500M+** urban citizens in India produce civic complaints daily
- India's Smart City Mission covers **100 cities** with ₹2.05 lakh crore budget
- **72%** of complaints to ULBs go unresolved within stipulated SLA periods (CAG Report, 2023)
- The global GovTech market is valued at **$25 billion** (2024) and growing at 12% CAGR

### Existing Demand
- **MyGov** and **Swachh Bharat** portals see millions of complaints annually but lack AI routing
- Bangalore (BBMP) alone receives **10,000+ complaints/month** — all manually triaged
- Smart City ATL (Action Triage Layer) initiatives actively seeking AI automation vendors

### Competitive Gap
No existing Indian civic portal combines:
- ✅ Semantic AI routing
- ✅ Vector-based deduplication
- ✅ Hierarchical role-based access
- ✅ Geo-aware assignment
- ✅ Real-time citizen visibility

---

## 🧪 8. Prototype / Demo

### What's Live
- ✅ Citizen complaint submission with live GPS map (Leaflet)
- ✅ Photo upload with Supabase Storage (evidence attached to complaint)
- ✅ AI pipeline: embedding → duplicate detection → department routing (background task)
- ✅ Citizen dashboard: real-time status tracking + resolution notes
- ✅ Manager dashboard: status updates + department reassignment
- ✅ Supervisor dashboard: ticket queue + resolution filing
- ✅ Admin dashboard: system overview + complaint routing + manager/supervisor provisioning
- ✅ Role-based auth with JWT (Supabase ES256)
- ✅ Full audit log per complaint (who changed what, when)

### User Flow

```
[Citizen]         Register → Submit Complaint (+ geo + photo)
                       │
[AI Backend]      Embed → Deduplicate → Route → Assign Office
                       │
[Manager]         View Queue → Update Status → Reassign Dept
                       │
[Supervisor]      View Office Queue → Mark Progress → Resolve + Report
                       │
[Citizen]         Sees status change → Reads resolution note ✅
```

### Dashboards
| Role | Color | Key Actions |
|---|---|---|
| 👤 Citizen | Cyan `#00F5FF` | Submit, View complaints, Track status |
| 🟡 Supervisor | Gold `#FFD60A` | Process queue, Resolve tickets |
| 🟡 Manager | Gold `#FFD60A` | Reassign departments, Update status |
| 🔴 Admin | Red `#FF2D55` | All complaints, Provision staff, Operations |

---

## ⚙️ 9. Practicality & Implementation

### Challenges & Solutions

| Challenge | Our Solution |
|---|---|
| AI routing accuracy cold start | Seed embedding table with labelled historical data; fallback to manual triage below 60% confidence |
| Duplicate detection false positives | Two-gate check: geo radius (50m) AND vector similarity (85%) — both must match |
| Role escalation abuse | JWT-validated role in every request; office jurisdiction enforced at DB layer |
| Image upload size & cost | Direct-to-Supabase Storage (bypasses API server), 5MB limit enforced on client |
| Offline citizens (rural) | Platform is web-based; SMS fallback API (Twilio/MSG91) planned in V2 |

### Deployment Plan

**Phase 1 — Hackathon MVP (Now)**
- Fully functional web app: citizen → AI routing → staff resolution
- Deployed locally with Supabase cloud DB

**Phase 2 — Pilot (Month 1–3)**
- Onboard 1 municipal body (target: Ward-level in Bangalore or Pune)
- Real complaint data to train and improve vector routing model
- Add SMS notification on status change

**Phase 3 — City Rollout (Month 4–12)**
- Multi-tenant architecture (one instance per city)
- Mobile app (React Native)
- SLA enforcement engine with escalation triggers
- Analytics dashboard for city planners

---

## 🧭 10. Roadmap (Future Scope)

### V2 Features
- 📱 **Mobile App** (React Native) — offline-capable complaint drafting
- 📲 **SMS Notifications** — Twilio/MSG91 integration for non-smartphone users
- 🤖 **LLM-Powered Triage Notes** — Auto-generate action recommendations for supervisors
- 🗺️ **Public Heatmap** — Citizen-visible city-wide issue density map
- 🔔 **SLA Escalation Engine** — Auto-escalate if no action in 72 hours

### V3 — Predictive Infrastructure
- 🌩️ **Predictive Maintenance**: ML model flags sectors likely to generate complaints based on historical patterns + weather data
- 📡 **IoT Integration**: Sensor data from smart streetlights, water meters auto-generates complaints before citizens even report
- 📊 **City Intelligence Dashboard**: Real-time KPI tracking for municipal commissioners

### Expansion
- Pan-India rollout via NIC (National Informatics Centre) partnership
- ASEAN market: Philippines, Bangladesh, Sri Lanka (similar civic infrastructure gaps)
- UN SDG 11 (Sustainable Cities) grant application

---

## 👥 Team

**Prestige Protocol** — Built at Hackathon 2025

---

## 🔧 Quick Start

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
# API Docs: http://127.0.0.1:8000/docs
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# App: http://localhost:3000
```

### Environment Variables
```
# backend/.env
SUPABASE_URL=...
SUPABASE_KEY=...
JWT_SECRET=...

# frontend/.env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

---

*"Prestige Protocol — Where every complaint becomes a priority."*
