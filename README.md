# PrivacyGuard AI — Offline Privacy Protection System

**Scan a screenshot, find everything in it that could expose you, score the risk, and blur it — all on-device, before you ever hit "post."**

> Problem: people share screenshots without realizing sensitive data is visible.
> Solution: on-device AI detects it, scores the risk, explains why, and blurs it — nothing ever leaves the browser.

## What it detects

| Category | Risk weight |
|---|---|
| Aadhaar Number | 30 |
| PAN Number | 20 |
| Bank Account / Card Number | 20 |
| Face | 15 |
| Phone Number | 15 |
| QR Code | 10 |
| Email Address | 10 |
| IFSC Code | 8 |

## Feature set

- ✅ **OCR text extraction** — Tesseract.js (WASM, runs in a Web Worker)
- ✅ **Aadhaar / PAN / phone / email / bank account / IFSC detection** — rule-based pattern matcher over OCR word tokens
- ✅ **QR code detection** — jsQR against raw canvas pixel data, finds multiple codes per image
- ✅ **Face detection** — MediaPipe's browser-based (WASM/GPU) BlazeFace short-range model
- ✅ **One-click auto-blur** — or select exactly which findings to redact
- 🔥 **Privacy Risk Score (0–100)** — weighted, with diminishing returns per repeated category, so "3 phone numbers" isn't naively 3× the risk of one
- 🔥 **AI Explainability** — a deterministic, on-device sentence generator turns the findings into a plain-English explanation (not an LLM call — see `src/lib/riskScore.js`)
- 🔥 **Offline mode** — once the page and models are cached, disconnect from the internet and it still works
- 🔥 **"Before You Post" Chrome extension** — warns you on LinkedIn/X/Instagram/Facebook the moment you attach an image to a post

## Why everything runs in the browser (not a Python backend)

The brief this was built from suggested a FastAPI + OpenCV + MediaPipe(Python) + pyzbar backend. This build deliberately does **not** use that architecture for the primary app — running OCR (Tesseract.js), QR decoding (jsQR) and face detection (MediaPipe's WASM build) entirely client-side means:

- The "runs 100% on-device, nothing uploaded" claim is literally true and demoable (show the Network tab staying empty during a scan).
- Deployment is a single static site — no server to host, scale, or keep alive during judging.
- It works offline after first load, which a backend-dependent app can't claim.

A complete Python backend skeleton mirroring the same detection logic is included at [`backend/`](./backend) if you want to demo that path instead or alongside — see its own README for setup and honest notes on what was/wasn't verified in this delivery.

## Project structure

```
privacyguard-ai/
├── src/
│   ├── main.jsx / App.jsx / App.css     # app shell, page router (no react-router — simple state)
│   ├── index.css                         # design tokens
│   ├── pages/
│   │   ├── Home.jsx                      # landing page
│   │   ├── UploadPage.jsx                # step 1: upload + live scan progress
│   │   ├── ResultsPage.jsx               # step 2: redacted preview, per-item blur selection
│   │   └── ReportPage.jsx                # full privacy report + downloadable .txt
│   ├── components/
│   │   ├── Nav.jsx, Footer.jsx
│   │   ├── Uploader.jsx                  # drag-and-drop / click-to-upload
│   │   ├── RedactionCanvas.jsx           # before/after canvas viewer
│   │   └── RiskGauge.jsx                 # circular risk score + explanation
│   └── lib/
│       ├── ocr.js                        # Tesseract.js wrapper
│       ├── piiDetector.js                # Aadhaar/PAN/phone/email/bank/IFSC regex matcher
│       ├── qrDetector.js                 # jsQR wrapper, multi-code support
│       ├── faceDetector.js               # MediaPipe Tasks Vision face detector
│       ├── riskScore.js                  # risk scoring + AI explanation generator
│       ├── scanPipeline.js               # orchestrates all of the above
│       └── redact.js                     # canvas drawing / stamped redaction bars
├── extension/                             # Chrome MV3 "before you post" extension
│   ├── manifest.json, content.js, background.js, popup.html/js, banner.css
├── backend/                               # optional Python FastAPI Plan B
│   ├── main.py, requirements.txt, README.md
├── vercel.json / netlify.toml
└── README.md
```

## Run the web app locally

```bash
npm install
npm run dev       # http://localhost:5173
```

```bash
npm run build      # production build → dist/
npm run preview    # preview the production build locally
```

## Push to GitHub

```bash
cd privacyguard-ai
git init
git add .
git commit -m "PrivacyGuard AI: offline privacy protection suite"
git branch -M main
git remote add origin https://github.com/<your-username>/privacyguard-ai.git
git push -u origin main
```

## Deploy the web app

**Vercel (`vercel.json` included):**
```bash
npm i -g vercel
vercel        # first deploy
vercel --prod # promote to production
```
Or import the GitHub repo at [vercel.com/new](https://vercel.com/new) — it auto-detects Vite.

**Netlify (`netlify.toml` included):**
```bash
npm i -g netlify-cli
netlify deploy --build
netlify deploy --build --prod
```
Or drag-and-drop the `dist/` folder at [app.netlify.com/drop](https://app.netlify.com/drop) after `npm run build`.

**GitHub Pages:** set `base: "/privacyguard-ai/"` in `vite.config.js`, then push the built `dist/` folder to a `gh-pages` branch.

## Install the Chrome extension

1. Deploy the web app first (above), then open `extension/config.js` and set `PRIVACYGUARD_WEBAPP_URL` to your deployed URL.
2. Go to `chrome://extensions`, enable **Developer mode** (top right).
3. Click **Load unpacked**, select the `extension/` folder.
4. Visit LinkedIn, X, Instagram, or Facebook and attach an image to a post — the warning banner should appear.

**Current scope, honestly stated:** the extension detects the moment you attach an image and nudges you to check it — it opens the full web scanner in a new tab rather than running OCR/face detection inside the composer page itself (those sites' CSPs and constantly-changing DOM make in-page scanning a separate project). See `extension/content.js` for the exact reasoning and what a fuller version would need.

## AI Explainability — how it actually works

`riskScore.js` builds the explanation from the same category counts driving
the rest of the UI — e.g.:

> *"This image contains an Aadhaar number and a PAN card number. Sharing this
> image publicly may expose personal identity information. (Privacy Risk:
> 65/100 — High risk.)"*

This is a **deterministic template composer**, not an LLM call — everything
stays on-device and works fully offline. Be ready to explain this distinction
to judges; claiming "AI-generated explanation" without being able to say how
it works is the kind of thing that doesn't survive a follow-up question.

## Extending further

- **Unstructured PII (names, addresses):** load a small ONNX NER model via `@xenova/transformers` inside `src/lib/`, run it on OCR'd text, and merge its spans into the same match shape `detectPII()` already returns — `App.jsx` and `redact.js` don't need to change.
- **In-extension scanning:** bundle the detection libs into the extension itself (they're already dependency-light except MediaPipe's model download) so "Scan Now" redacts without leaving the composer page.
- **Batch/CLI scanning:** the Python backend in `backend/` is a natural base for a folder-scanning CLI tool.

## Hackathon pitch notes

- **Live demo flow:** upload a screenshot with a fake Aadhaar/PAN/phone visible → watch detections populate in real time → see the risk score animate up → read the plain-English explanation → download the redacted image.
- **Prove "on-device":** open dev tools → Network tab → run a scan → show it's empty (aside from the one-time model/OCR-data fetch on first load, which you can also demonstrate by then going offline and scanning again).
- **Anticipate the Python-backend question:** if asked why it's not backend-based, the answer is architecture, not laziness — see "Why everything runs in the browser" above.

## License

MIT — do whatever you want with it.
