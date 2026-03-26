# LaTeX Compilation Microservice

Simple Express.js server that compiles LaTeX source to PDF using `pdflatex`.

## Deploy to Railway (recommended)

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub**
2. Select this repo, set the **root directory** to `latex-service/`
3. Railway auto-detects the `Dockerfile` and builds it
4. Set environment variable: `API_KEY=your-secret-key`
5. Copy the public URL → paste into your main app's `.env` as `LATEX_SERVICE_URL`

## Deploy to Render

1. Go to [render.com](https://render.com) → **New Web Service**
2. Connect repo, set **Root Directory** to `latex-service`
3. Build Command: `docker build -t latex-service .`
4. Runtime: **Docker**

## Local Testing

```bash
cd latex-service
npm install
# Requires pdflatex installed locally:
# Windows: MiKTeX (https://miktex.org)
# Linux:   apt install texlive-full
node index.js
```

Test with curl:
```bash
curl -X POST http://localhost:3001/compile \
  -H "Content-Type: application/json" \
  -d '{"latex": "\\documentclass{article}\\begin{document}Hello World\\end{document}"}' \
  --output test.pdf
```

## API

**POST /compile**

Request body: `{ "latex": "<latex source string>" }`

Response: PDF binary (application/pdf) or `{ "error": "...", "log": "..." }` on failure.

**GET /health**

Returns `{ "status": "ok" }`
