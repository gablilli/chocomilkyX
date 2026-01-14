import express from "express";
import fetch from "node-fetch";
import fs from "fs";
import cookieParser from "cookie-parser";
import { v4 as uuid } from "uuid";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());

// -------- session ----------
app.use((req, res, next) => {
  if (!req.cookies.uid) {
    res.cookie("uid", uuid(), { httpOnly: true, sameSite: "lax" });
  }
  next();
});

const getUID = req => req.cookies.uid;

// -------- storage ----------
const GLOBAL = "./global-repos.json";
const USERS = "./user-repos.json";

const read = f => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f)) : {});
const write = (f, d) => fs.writeFileSync(f, JSON.stringify(d, null, 2));

// -------- helpers ----------
async function loadRepoFromURL(url) {
  const r = await fetch(url, { timeout: 8000 });
  if (!r.ok) throw new Error("fetch failed");
  const json = await r.json();
  if (!json || !Array.isArray(json.apps)) throw new Error("invalid repo");
  return json;
}

// -------- GET /api/repos ----------
app.get("/api/repos", async (req, res) => {
  const uid = getUID(req);

  const globals = read(GLOBAL).repos || [];
  const users = read(USERS)[uid] || [];

  const globalResolved = [];
  for (const r of globals) {
    try {
      const data = await loadRepoFromURL(r.url);
      globalResolved.push({ url: r.url, data });
    } catch {
      globalResolved.push({
        url: r.url,
        data: { apps: [] }
      });
    }
  }

  res.json([...globalResolved, ...users]);
});

// -------- POST /api/import ----------
app.post("/api/import", async (req, res) => {
  const uid = getUID(req);
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "Missing url" });

  let data;
  try {
    data = await loadRepoFromURL(url);
  } catch {
    return res.status(400).json({ error: "Invalid repo" });
  }

  const users = read(USERS);
  users[uid] = users[uid] || [];

  if (users[uid].some(r => r.url === url)) {
    return res.status(409).json({ error: "Repo already exists" });
  }

  users[uid].push({ url, data });
  write(USERS, users);

  res.json({ ok: true });
});

app.listen(PORT, () =>
  console.log(`API running on http://localhost:${PORT}`)
);
