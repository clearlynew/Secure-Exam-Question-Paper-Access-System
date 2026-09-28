# Secure Exam Question Paper Access System

```
backend/    Express + MongoDB API (auth, papers, audit chain). Also serves ../frontend
frontend/   Static web UI (index.html, css/, js/) — talks to the backend's /api
crypto/     AES-256-GCM + Shamir secret sharing (used by backend/controllers/paperController.js)
```

## Run

```bash
cd backend
copy .env.example .env      # Windows (use cp on Mac/Linux), then edit MONGO_URI / JWT_SECRET
npm install
npm run dev
```

Open http://localhost:5000 — the backend serves the frontend on the same port.

There are no pre-made accounts: use **Create an account** on the sign-in page
(make at least 1 setter, 2 approvers, 1 invigilator).

## Roles (enforced by the backend)

| Role        | Can do                                                            |
|-------------|-------------------------------------------------------------------|
| setter      | upload a paper, pick approvers + threshold k                      |
| approver    | approve papers they were designated for                           |
| invigilator | approve (if designated) and unlock/decrypt once k approvals + exam window are satisfied |
| everyone    | view papers relevant to them, audit log, audit verification       |

## Tests

```bash
node crypto/test.js           # crypto unit tests (13)
node backend/test-flow.js     # end-to-end API test; start the backend first
```

## Testing tamper detection

There is intentionally no "tamper" API. To see the detector fire, edit an entry
directly in MongoDB (e.g. change an `action` in the `auditlogs` collection), then
open the Audit page and press **Verify Hash Chain Now**.
