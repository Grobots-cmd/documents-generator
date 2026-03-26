const express = require("express");
const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");

const app = express();
app.use(express.json({ limit: "5mb" }));


const API_KEY = process.env.API_KEY;
if (API_KEY) {
  app.use((req, res, next) => {
    const auth = req.headers["authorization"];
    if (!auth || auth !== `Bearer ${API_KEY}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    next();
  });
}

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.post("/compile", async (req, res) => {
  const { latex } = req.body;
  if (!latex || typeof latex !== "string") {
    return res.status(400).json({ error: "Missing 'latex' string in request body" });
  }

  const jobId = crypto.randomUUID();
  const tmpDir = path.join(os.tmpdir(), `latex-${jobId}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  const texFile = path.join(tmpDir, "document.tex");
  const pdfFile = path.join(tmpDir, "document.pdf");
  const logFile = path.join(tmpDir, "document.log");

  fs.writeFileSync(texFile, latex, "utf8");

  try {
    await runLatex(texFile, tmpDir);

    if (!fs.existsSync(pdfFile)) {
      const log = fs.existsSync(logFile) ? fs.readFileSync(logFile, "utf8") : "No log available";
      return res.status(500).json({ error: "Compilation failed — PDF not produced", log });
    }

    const pdfBuffer = fs.readFileSync(pdfFile);
    res.set("Content-Type", "application/pdf");
    res.set("Content-Disposition", "attachment; filename=document.pdf");
    res.send(pdfBuffer);
  } catch (err) {
    const log = fs.existsSync(logFile) ? fs.readFileSync(logFile, "utf8").slice(-3000) : err.message;
    res.status(500).json({ error: "LaTeX compilation error", log });
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

function runLatex(texFile, cwd) {
  return new Promise((resolve, reject) => {
    // Run pdflatex twice for proper cross-references
    execFile(
      "pdflatex",
      [
        "-interaction=nonstopmode",
        "-halt-on-error",
        "-output-directory", cwd,
        texFile,
      ],
      { cwd, timeout: 30000, maxBuffer: 10 * 1024 * 1024 },
      (err, stdout, stderr) => {
        if (err) {
          reject(new Error(stderr || stdout || err.message));
        } else {
          resolve();
        }
      }
    );
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ LaTeX service running on port ${PORT}`);
});
