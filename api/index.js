import express from "express";
import fetch from "node-fetch";
import fs from "fs";

const app = express();
const PORT = 3000;
const STORE = "./repos.json";

app.use(express.json());

// ---------- helpers ----------
function loadRepos() {
  if (!fs.existsSync(STORE)) return [];
  return JSON.parse(fs.readFileSync(STORE, "utf8"));
}

function saveRepos(repos) {
  fs.writeFileSync(STORE, JSON.stringify(repos, null, 2));
}

function isValidRepo(data) {
  return (
    data &&
    Array.isArray(data.apps) &&
    data.apps.length > 0
  );
}

// ---------- GET /api/repos ----------
app.get("/api/repos", (req, res) => {
  res.json(loadRepos());
});

// ---------- POST /api/import ----------
app.post("/api/import", async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "Missing url" });
  }

  let repoJSON;

  try {
    const r = await fetch(url, {
      headers: { "User-Agent": "Choco-Importer/1.0" }
    });
    if (!r.ok) {
      return res.status(400).json({ error: "Failed to fetch repo" });
    }
    repoJSON = await r.json();
  } catch {
    return res.status(400).json({ error: "Invalid JSON or fetch error" });
  }

  if (!isValidRepo(repoJSON)) {
    return res.status(400).json({ error: "Invalid repo format" });
  }

  const repos = loadRepos();

  // evita duplicati
  if (repos.some(r => r.url === url)) {
    return res.status(409).json({ error: "Repo already exists" });
  }

  repos.push({
    url,
    data: repoJSON
  });

  saveRepos(repos);
  res.json({ ok: true });
});

// ---------- serve frontend ----------
app.use(express.static("public"));

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
