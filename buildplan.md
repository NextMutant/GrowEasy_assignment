# AI-Powered CSV Importer — Complete Build Plan
### GrowEasy Assignment — Deadline 12 July 2026

---

## 1. Folder Structure

```
groweasy-csv-importer/
│
├── README.md                          # setup instructions — required for submission
├── docker-compose.yml                 # optional bonus
├── .gitignore
│
├── shared/                            # single source of truth for both sides
│   ├── crmSchema.ts                   # 15 fields, types
│   ├── enums.ts                       # crm_status[] and data_source[] literal arrays
│   └── types.ts                       # CrmRecord, ImportResult, etc.
│
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example                   # GEMINI_API_KEY, PORT, CORS_ORIGIN
│   ├── src/
│   │   ├── server.ts                  # entrypoint, listen()
│   │   ├── app.ts                     # express app, middleware wiring
│   │   ├── config/
│   │   │   └── env.ts                 # validated env vars (zod)
│   │   ├── routes/
│   │   │   ├── health.route.ts
│   │   │   └── upload.route.ts
│   │   ├── controllers/
│   │   │   └── upload.controller.ts   # orchestrates parse → AI → validate → respond
│   │   ├── middleware/
│   │   │   ├── errorHandler.ts
│   │   │   ├── uploadMiddleware.ts    # multer config, CSV-only filter
│   │   │   └── requestLogger.ts
│   │   ├── csv/
│   │   │   └── csvParser.ts           # file buffer → Array<Record<string,string>>
│   │   ├── ai/
│   │   │   ├── AIService.ts           # batches rows, calls LLM, merges results
│   │   │   ├── promptBuilder.ts       # builds the extraction prompt from crmSchema
│   │   │   └── batchProcessor.ts      # chunking (20 rows/batch), concurrency limit
│   │   ├── validation/
│   │   │   └── crmValidator.ts        # zod schema + retry-once-then-skip logic
│   │   ├── services/
│   │   │   └── ImportService.ts       # ties csv + ai + validation together
│   │   ├── utils/
│   │   │   └── logger.ts
│   │   └── types/
│   │       └── index.ts
│   └── tests/
│       ├── health.test.ts
│       ├── upload.test.ts
│       ├── csvParser.test.ts
│       ├── AIService.test.ts          # mocked LLM responses
│       └── crmValidator.test.ts
│
└── frontend/
    ├── package.json
    ├── tsconfig.json
    ├── next.config.js
    ├── tailwind.config.ts
    ├── .env.example                   # NEXT_PUBLIC_API_URL
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx                   # Home → drives the 4-step flow
    │   └── globals.css
    ├── components/
    │   ├── Navbar.tsx
    │   ├── UploadBox.tsx              # drag & drop + file picker
    │   ├── PreviewTable.tsx           # sticky header, scroll, pagination
    │   ├── ResultsTable.tsx           # 15 CRM columns + skip reasons
    │   ├── StatsCards.tsx             # Total Imported / Skipped / Success Rate
    │   ├── ConfirmModal.tsx
    │   ├── Loader.tsx
    │   ├── Toast.tsx
    │   └── ui/
    │       └── Button.tsx
    ├── lib/
    │   ├── api.ts                     # fetch wrapper to backend
    │   ├── csvClientParser.ts         # PapaParse for preview-only parsing
    │   └── types.ts                   # re-export from shared/
    ├── hooks/
    │   ├── useCsvUpload.ts
    │   └── useImportFlow.ts           # state machine: uploading→parsing→ai→done
    └── tests/
        └── components/
```

---

## 2. Step-by-Step Build Plan

### Step 0 — Setup (30 min)
1. Init monorepo, `shared/`, `backend/`, `frontend/` folders
2. In `shared/`, write `enums.ts` and `crmSchema.ts` first — everything downstream imports from here, so get the 15 fields and exact enum values right before writing any other code
3. `git init`, `.gitignore`, push empty repo to GitHub (do this now, not at the end)

### Step 1 — Backend Skeleton
1. `npm init`, install express, typescript, multer, zod, cors, dotenv
2. `app.ts` (middleware, routes) + `server.ts` (listen)
3. `config/env.ts` — validate `GEMINI_API_KEY`, `PORT`, `CORS_ORIGIN` with zod at boot, fail fast if missing
4. `middleware/errorHandler.ts` — catches thrown errors, returns consistent JSON error shape
5. `middleware/uploadMiddleware.ts` — multer, `fileFilter` rejects non-`.csv`/non-`text/csv`
6. `routes/health.route.ts` → `GET /health`
7. `routes/upload.route.ts` → `POST /upload`
8. Write tests: health check, valid upload, invalid file type, missing file, error middleware fires correctly

### Step 2 — CSV Parsing Engine
1. `csv/csvParser.ts`: buffer → `Array<Record<string,string>>` using PapaParse or csv-parser
2. Handle: UTF-8 BOM, empty row stripping, quoted values, embedded commas, multiline cells, duplicate headers (auto-suffix), blank lines
3. Wire into `upload.controller.ts` — at this stage, return the parsed rows directly (no AI yet) so you can verify parsing in isolation
4. Test at 10 / 100 / 1000 / 5000 rows, plus each edge case above

### Step 3 — AI Extraction Service (core of the grade — spend the most time here)
1. `ai/promptBuilder.ts` — builds a single prompt template that injects, from `shared/crmSchema.ts` and `shared/enums.ts`:
   - all 15 target fields with descriptions
   - the exact 4 `crm_status` values
   - the exact 5 `data_source` values + "leave blank if not confident"
   - `created_at` must be parseable by `new Date(...)`
   - multi-email/multi-mobile → first value in field, rest appended to `crm_note`
   - skip a row only if **both** email and mobile are absent
   - no raw line breaks in any field — escape as `\n`
   - "return JSON only, never invent fields or values"
2. `ai/batchProcessor.ts` — chunk rows into batches of ~20, call `AIService` per batch with a concurrency cap (e.g. 3 in flight), merge results in original order
3. `ai/AIService.ts` — the actual LLM call (Gemini/OpenAI/Claude), parse response as JSON, throw on malformed output so the caller can retry
4. Mock the LLM in tests. Cover: unknown/renamed columns, missing email only, missing mobile only, missing both (must skip), multiple emails, multiple mobiles, shuffled column order, ambiguous headers

### Step 4 — Response Validation
1. `validation/crmValidator.ts` — zod schema mirroring `shared/crmSchema.ts`:
   - `crm_status` must be one of the 4 enum values (or reject)
   - `data_source` must be one of the 5 values or empty string
   - `created_at` passed through `new Date()`, reject if `Invalid Date`
   - reject if both `email` and `mobile_without_country_code` are empty
2. On a record failing validation: retry that single batch through the AI once → if still invalid, drop the record and record a skip reason (e.g. `"invalid crm_status"`, `"missing email and mobile"`)
3. `services/ImportService.ts` ties csv → AI → validation together and returns `{ imported: CrmRecord[], skipped: {row, reason}[], totalImported, totalSkipped }`
4. Test with mocked bad AI output: malformed JSON, wrong enum, invalid date, missing fields

**Checkpoint:** `curl -F file=@sample.csv localhost:3000/upload` returns valid CRM JSON with accurate skip counts.

### Step 5 — Frontend Foundation
1. `create-next-app` with TypeScript + Tailwind
2. Build shared components: `Navbar`, `UploadBox`, `Modal`/`ConfirmModal`, `Button`, `Loader`, `Toast`, base `Table`
3. `hooks/useImportFlow.ts` — a small state machine: `idle → uploaded → previewing → confirmed → uploading → parsing → running_ai → done → error`

### Step 6 — Upload UI (assignment Step 1)
1. `UploadBox.tsx`: react-dropzone for drag & drop + click-to-browse
2. Client-side reject non-CSV before it ever touches the backend
3. Show selected file name/size, allow remove

### Step 7 — CSV Preview (assignment Step 2 — explicitly no AI call yet)
1. Parse client-side with PapaParse purely for display
2. `PreviewTable.tsx`: sticky header, horizontal + vertical scroll, responsive, paginated
3. Test with 5000 rows, 100 columns, long text cells, missing values

### Step 8 — Confirm → Import Flow (assignment Steps 3 & 4)
1. `ConfirmModal.tsx` / inline Confirm button — this is a hard gate; no backend call fires before it's clicked
2. On confirm: `POST /upload` → show sequential loading states (`Uploading… → Parsing… → Running AI… → Finishing…`)
3. Handle: request timeout, cancel-in-flight, retry after failure, disable button to prevent double-submit

### Step 9 — Results Dashboard (assignment Step 4)
1. `StatsCards.tsx`: Total Imported, Total Skipped, Success Rate
2. `ResultsTable.tsx`: all 15 CRM fields as columns; show skip reasons for skipped rows
3. Test: empty import, partial import, fully-skipped dataset, mixed results

### Step 10 — Error Handling Pass (cross-cutting, do a dedicated pass)
1. Backend: invalid CSV, empty CSV, unsupported encoding, oversized file → clear 4xx messages
2. AI: timeout, quota exceeded, invalid/unparseable response, rate limit → surfaced as user-readable errors, not stack traces
3. Frontend: mid-flow refresh, retry button, network disconnect, duplicate submission guard

### Step 11 — Performance Pass (time permitting)
1. Backend: streaming CSV parse for large files, concurrency-limited AI batching (already built in Step 3), retry failed batches only (not the whole set), memory checks
2. Frontend: virtualize the results table for large datasets, memoize table rows, lazy-render off-screen rows
3. Test at 20,000 rows / 100MB CSV / 100 columns — measure memory, API latency, render time

### Step 12 — Bonus Features (only after core is solid)
Ordered by the assignment's own bonus list:
1. Progress indicators during AI processing
2. Retry mechanism for failed AI batches (surface in UI)
3. README with full setup instructions (**required regardless of bonus**)
4. Deploy: frontend → Vercel, backend → Railway/Render (**required regardless of bonus**)
5. Dark mode
6. Formalize unit test coverage across backend
7. Docker setup (`docker-compose.yml`)
8. Virtualized table (if not already done in Step 11)
9. Streaming/incremental upload parsing

### Step 13 — Deployment
1. Backend → Railway/Render, set env vars: `GEMINI_API_KEY`, `PORT`, `CORS_ORIGIN`
2. Frontend → Vercel, set `NEXT_PUBLIC_API_URL` to deployed backend URL
3. Full production smoke test: upload → preview → confirm → AI → results, using a real messy CSV (e.g. a Facebook Lead Export)

### Step 14 — Final QA & Submission
1. Run the full checklist below
2. Write/finalize README (setup steps, env vars, how to run locally, architecture summary)
3. Email `varun@groweasy.ai`: hosted app URL, GitHub repo URL, position (Intern/Full-Time)
4. Submit before **12 July 2026**

---

## 3. Complete Feature Checklist

### CRM Schema & AI Correctness
- [ ] All 15 fields present: `created_at, name, email, country_code, mobile_without_country_code, company, city, state, country, lead_owner, crm_status, crm_note, data_source, possession_time, description`
- [ ] `crm_status` restricted to exactly: `GOOD_LEAD_FOLLOW_UP`, `DID_NOT_CONNECT`, `BAD_LEAD`, `SALE_DONE`
- [ ] `data_source` restricted to exactly: `leads_on_demand`, `meridian_tower`, `eden_park`, `varah_swamy`, `sarjapur_plots`, or blank
- [ ] `created_at` always valid under `new Date(created_at)`
- [ ] Multiple emails → first in `email`, rest appended to `crm_note`
- [ ] Multiple mobiles → first in `mobile_without_country_code`, rest appended to `crm_note`
- [ ] Record skipped only when **both** email and mobile are absent
- [ ] No raw line breaks inside any CSV field (escaped as `\n`)
- [ ] AI never invents fields/values not present in the schema
- [ ] AI works across differently-shaped CSVs: Facebook Lead Export, Google Ads Export, Excel-exported sheet, real-estate CRM export, manually-made spreadsheet

### Backend
- [ ] `GET /health`
- [ ] `POST /upload` — CSV-only, rejects other types with clear error
- [ ] CSV parser handles UTF-8, quotes, commas-in-fields, multiline cells, duplicate columns, blank lines
- [ ] AI batching (~20 rows/batch) with merge-in-order
- [ ] Concurrency-limited batch calls
- [ ] Validation layer never trusts raw AI output
- [ ] Retry-once-then-skip on invalid AI output, with skip reason recorded
- [ ] Structured JSON response: imported records + skipped records + counts
- [ ] Centralized error handler, consistent error JSON shape
- [ ] Env var validation at boot

### Frontend
- [ ] Drag & drop upload
- [ ] File picker fallback
- [ ] Client-side file-type validation
- [ ] Preview table: sticky header, horizontal scroll, vertical scroll, responsive, pagination
- [ ] No AI call before preview stage
- [ ] Explicit Confirm button gating the AI call
- [ ] Sequential loading states (upload/parse/AI/finish)
- [ ] Results table showing all 15 fields
- [ ] Stats cards: Total Imported, Total Skipped, Success Rate
- [ ] Skipped records shown with reason
- [ ] Loading, error, and empty states for every async step
- [ ] Mobile-responsive throughout

### Error Handling
- [ ] Invalid/empty/oversized CSV handled gracefully
- [ ] Unsupported encoding handled
- [ ] AI timeout, quota, rate-limit, malformed-response all handled without crashing
- [ ] Network disconnect / refresh mid-flow doesn't corrupt state
- [ ] Duplicate-submit guard (disabled button during in-flight request)
- [ ] Retry affordance on failure

### Code Quality
- [ ] TypeScript strict mode, no `any` leaking into public interfaces
- [ ] Shared schema/types used by both frontend and backend (no duplication/drift)
- [ ] Clear separation: routes → controllers → services → ai/csv/validation
- [ ] Unit tests for parser, validator, AI service (mocked), and API routes

### Bonus (stack-rank if time-constrained)
- [ ] Progress indicators during AI processing
- [ ] Retry mechanism for failed AI batches (UI-visible)
- [ ] Virtualized results table for large CSVs
- [ ] Dark mode
- [ ] Streaming/incremental CSV parsing
- [ ] Docker setup
- [ ] Broader unit test coverage

### Submission (non-negotiable — graded independent of code)
- [ ] Application publicly hosted and reachable
- [ ] GitHub repository public
- [ ] README with clear setup instructions
- [ ] Email sent to varun@groweasy.ai with: hosted URL, repo URL, position applied for
- [ ] Sent before 12 July 2026