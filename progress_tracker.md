# AI-Powered CSV Importer — Progress Tracker

This document lists the core accomplishments, structural problems faced and resolved during setup, current server/dashboard status, and the immediate action items.

---

## 1. Accomplishments & Features Completed

We have built a fully functional end-to-end monorepo matching the provided specifications and visual design:

*   **Shared CRM Schema Layout (`/shared`)**: Configured strict validation criteria for the 15 schema fields, Zod constraints (rejecting records if both email and mobile are absent), and TypeScript enums/interfaces.
*   **Custom CSV Parser (`/backend`)**: Programmed custom parsing logic supporting UTF-8 BOM detection, duplicate header suffixing, multi-line cells, and greedy empty line stripping.
*   **Express Backend Server (`/backend`)**: Configured with Multer CSV validation filters, Winston logs, Zod environment schema parser, and API health routes.
*   **Gemini AI Mapping Service (`/backend`)**: Integrated model mapping coordinator using a queue with concurrency limit (3) and batch size (20).
*   **Next.js Dashboard Client (`/frontend`)**: Replicated UI layout including the sidebar navigation, admin badge header, 4-step stepper indicators, drag-and-drop CSV preview table, matrix animation loading progressive checker, and results dashboard.
*   **Test Verification**: Implemented 24 Jest tests verifying end-to-end parsing, Zod validators, and server routes. All tests pass successfully.

---

## 2. Problems Faced & Resolved

| Problem Faced | Root Cause | Resolution |
| :--- | :--- | :--- |
| **TS6059: File is not under rootDir** | Backend `tsconfig.json` had `"rootDir": "src"`, preventing it from compiling imports from parallel `/shared` files. | Updated `"rootDir"` to `".."`, replaced `@shared` path aliases with native relative imports (`../../../shared/`), and updated `package.json` main/start scripts to run from `dist/backend/src/server.js`. |
| **Google API key invalid (400)** | The API key entered was truncated in `.env` (due to copy-pasting the 52-character visual text preview from AI Studio). Additionally, the backend was running an older `@google/generative-ai` SDK (`0.11.4`) that did not support the new `AQ.` key format. | Upgraded the SDK dependency to the latest version to recognize the new format. Instructed copying the full key via the official **Copy Key** button. |
| **Dotenv environment caching** | The shell terminal cached the old dummy key, and `dotenv` by default ignores `.env` files if the variable already exists in the environment. | Added `{ override: true }` in [env.ts](file:///d:/4.WorkingProjects/GrowEasy/backend/src/config/env.ts) to force-overwrite existing environment variables. |
| **404 Model Not Found** | The Gemini API endpoints returned 404 for `gemini-1.5-flash` under `v1beta`, indicating it was deprecated or unavailable for this project's key. | Queried the API to list available models, found `gemini-2.0-flash` is active, and updated [AIService.ts](file:///d:/4.WorkingProjects/GrowEasy/backend/src/ai/AIService.ts) to target it. |

---

## 3. Current Status & Problem

### Current Status
*   **Frontend**: Built and running locally at `http://localhost:3001`.
*   **Backend**: Compiles successfully with zero TypeScript compiler errors. All **24/24 unit tests pass**. Running locally at `http://localhost:3000`.
*   **Credentials**: The server successfully reads and boots using your correct `AQ.` formatted API key (length 53).

### Active Block (Quota Exceeded)
The AI mapping requests fail with the following API gateway error:
`[429 Too Many Requests] You exceeded your current quota (limit: 0, model: gemini-2.0-flash)`

*   **Cause**: The Google AI Studio Free Tier has a request/token limit of `0` in certain locations (such as the EU and UK) due to regional privacy and compliance regulations.
*   **How to Resolve**:
    1.  **Pay-As-You-Go Billing (Recommended)**: Set up a billing account on your project in [Google AI Studio](https://aistudio.google.com/) under **Settings** -> **Billing** to transition from the Free Tier to the paid tier (which is supported globally and costs less than a fraction of a cent for these tests).
    2.  **VPN Routing**: Connect to a VPN and route your local traffic through a country where the Free Tier is supported (like the **United States** or **India**), then restart the backend server.
    3.  **Alternative AI Provider (Groq)**: Set `AI_PROVIDER=groq` and provide a `GROQ_API_KEY` in `backend/.env` to run mapping jobs via Llama 3 on Groq's high-speed free tier.
