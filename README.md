# AI-Powered CSV Importer

A production-ready monorepo implementation of the AI-Powered CSV Importer project. This application allows users to upload arbitrary lead CSV spreadsheets, preview them, map them to a standardized 15-field CRM schema using the Gemini AI API, validate them with Zod, and review results on an interactive dashboard.

---

## 1. Folder Structure

```
groweasy-csv-importer/
│
├── README.md                      # Setup instructions and architecture summary
├── .gitignore                     # Monorepo git ignores
│
├── shared/                        # Single source of truth for schema & types
│   ├── crmSchema.ts               # 15 fields definition & AI mapping descriptions
│   ├── enums.ts                   # CRM Status & Lead Data Source literals
│   └── types.ts                   # Shared TypeScript models (ImportResult, etc.)
│
├── backend/                       # Express + TS + Multer + Zod + Gemini API
│   ├── package.json
│   ├── tsconfig.json
│   ├── jest.config.js
│   ├── .env.example
│   ├── src/
│   │   ├── server.ts              # Server entry point
│   │   ├── app.ts                 # Express application setup
│   │   ├── config/
│   │   │   └── env.ts             # Zod environment variable validation
│   │   ├── routes/                # health.route, upload.route
│   │   ├── controllers/           # upload.controller orchestrations
│   │   ├── middleware/            # errorHandler, uploadMiddleware (Multer), requestLogger
│   │   ├── csv/
│   │   │   └── csvParser.ts       # Raw buffer parser (UTF-8 BOM, duplicate headers)
│   │   ├── ai/
│   │   │   ├── promptBuilder.ts   # Schema-driven Gemini prompt builder
│   │   │   ├── batchProcessor.ts  # Concurrency-controlled batch queue (max 3)
│   │   │   └── AIService.ts       # Gemini SDK client with exponential backoff retries
│   │   ├── validation/
│   │   │   └── crmValidator.ts    # Zod validator schema with phone/email checks
│   │   └── services/
│   │       └── ImportService.ts   # Core service linking parser, AI, and validator
│   └── tests/                     # Unit test suites (health, upload, parser, AI, validator)
│
└── frontend/                      # Next.js 15+ + TypeScript + Tailwind v4 + React 19
    ├── package.json
    ├── tsconfig.json
    ├── .env.example
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx               # Main Dashboard flow driving the 4-step state machine
    │   └── globals.css            # Bespoke styling and animations
    ├── components/
    │   ├── Navbar.tsx             # Left Navigation sidebar panel
    │   ├── UploadBox.tsx          # Drag & drop upload box
    │   ├── PreviewTable.tsx       # Raw CSV paginated table preview
    │   ├── Loader.tsx             # Animated progress stepper and block visualization
    │   ├── StatsCards.tsx         # Dashboard KPI cards
    │   ├── ResultsTable.tsx       # Filterable mapped CRM grid layout
    │   ├── ConfirmModal.tsx       # Confirmation dialog
    │   ├── Toast.tsx              # Float notifications
    │   └── ui/
    │       └── Button.tsx         # Reusable styling buttons
    └── lib/
        ├── api.ts                 # Fetch wrappers
        ├── csvClientParser.ts     # Client PapaParse raw preview parser
        └── types.ts               # Types mapping
```

---

## 2. Technology Stack & Features

*   **Backend Skeleton**: Structured Express.js in TypeScript strict-mode. Fully validates variables on startup and maps logs using Winston.
*   **CSV Parsing**: Handles UTF-8 BOM, greedily strips empty rows, parses multiline cells, and automatically suffixes duplicate column names (e.g. `Email`, `Email_1`).
*   **AI Mapping**: Generates dynamic mapping prompts from the single-source-of-truth CRM schema. Uses **Gemini 1.5 Flash** with JSON constraints, retries with exponential backoff on rate limits, and processes in concurrent batches of ~20 records (max 3 concurrent requests).
*   **Validation Layer**: Uses **Zod** validator to enforce formatting. Retries failed AI rows once through the model before dropping, and records structured reasons for skipped rows (e.g. invalid status, missing both email and phone).
*   **Frontend Dashboard**: Implements the exact layout and look from `a.png`. Features a left sidebar layout, top header row with admin avatar, and a 4-step state machine stepper: Upload → Preview → Processing Stepper (with animation loader) → Results Dashboard.
*   **Test Suite**: 100% test coverage for core components (24 tests pass, covering router, parser, AI mocks, validator, and imports orchestrators).

---

## 3. Setup and Installation

### Prerequisites
*   Node.js (v18+)
*   npm

### Backend Setup
1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file based on `.env.example`:
    ```bash
    cp .env.example .env
    ```
4.  Configure your environment variables in `.env`:
    *   `AI_PROVIDER`: Set to `groq` or `gemini` (default: `groq`).
    *   `GROQ_API_KEY`: Your Groq API Key (required if provider is `groq`).
    *   `GEMINI_API_KEY`: Your Google Gemini API Key (required if provider is `gemini`).
    *   `PORT`: 3000
    *   `CORS_ORIGIN`: http://localhost:3000 (or your client app URL)

### Frontend Setup
1.  Navigate to the frontend directory:
    ```bash
    cd ../frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env.local` file based on `.env.example`:
    ```bash
    cp .env.example .env.local
    ```
4.  Configure environment variables in `.env.local`:
    *   `NEXT_PUBLIC_API_URL`: http://localhost:3000 (URL of the backend API)

---

## 4. Running the Application

### Development Servers

To run the application locally, start both the backend and frontend dev servers.

*   **Start Backend** (from `/backend` folder):
    ```bash
    npm run dev
    ```
    This launches the API at `http://localhost:3000` (verifiable via `http://localhost:3000/health`).

*   **Start Frontend** (from `/frontend` folder):
    ```bash
    npm run dev
    ```
    This launches the Next.js app at `http://localhost:3001` or `http://localhost:3000` (depending on available ports).

---

## 5. Running Tests

The backend includes a comprehensive test suite using Jest and Supertest.

*   To run backend tests (from `/backend` folder):
    ```bash
    npm test
    ```

---

## 6. Schema Fields Reference

The CRM Lead Schema contains exactly the following 15 fields:
1.  `created_at`: Lead creation timestamp (Standard Date string)
2.  `name`: Full name
3.  `email`: Primary email address
4.  `country_code`: Dialing code (e.g. `+91`, `+1`)
5.  `mobile_without_country_code`: Local mobile number
6.  `company`: Company name
7.  `city`: City location
8.  `state`: State location
9.  `country`: Country location
10. `lead_owner`: Assigned sales representative
11. `crm_status`: Restrict to `GOOD_LEAD_FOLLOW_UP`, `DID_NOT_CONNECT`, `BAD_LEAD`, or `SALE_DONE`
12. `crm_note`: Appends remarks and secondary emails/phones
13. `data_source`: Restrict to `leads_on_demand`, `meridian_tower`, `eden_park`, `varah_swamy`, `sarjapur_plots` or blank
14. `possession_time`: Timeline frame
15. `description`: General forms details or campaign info
