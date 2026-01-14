import express from "express";
import fetch from "node-fetch";
import fs from "fs";
import cookieParser from "cookie-parser";
import { v4 as uuid } from "uuid";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());

// ---------- session ----------
app.use((req, res, next) => {
  if (!req.cookies.uid) {
    res.cookie("uid", uuid(), {
      httpOnly: true,
      sameSite: "lax"
    });
  }
  next();
});

function getUID(req) {
  return req.cookies.uid;
}

// ---------- storage ----------
const GLOBAL = "./global-repos.json";
const USERS = "./user-repos.json";

const read = f => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f)) : {});
const write = (f, d) => fs.writeFileSync(f, JSON.stringify(d, null, 2));

// ---------- helpers ----------
function validRepo(data) {
  return data && Array.isArray(data.apps);
}

// ---------- GET /api/repos ----------
app.get("/api/repos", (req, res) => {
  const uid = getUID(req);
  const globalRepos = read(GLOBAL).repos || [];
  const userRepos = (read(USERS)[uid] || []);

  res.json([...globalRepos, ...userRepos]);
});

// ---------- POST /api/import ----------
app.post("/api/import", async (req, res) => {
  const uid = getUID(req);
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "Missing url" });

  let data;
  try {
    const r = await fetch(url);
    if (!r.ok) throw 0;
    data = await r.json();
  } catch {
    return res.status(400).json({ error: "Invalid repo URL" });
  }

  if (!validRepo(data)) {
    return res.status(400).json({ error: "Invalid repo format" });
  }

  const users = read(USERS);
  users[uid] = users[uid] || [];

  if (users[uid].some(r => r.url === url)) {
    return res.status(409).json({ error: "Repo already imported" });
  }

  users[uid].push({ url, data });
  write(USERS, users);

  res.json({ ok: true });
});

// ---------- serve frontend ----------
app.use(express.static("public"));

app.listen(PORT, () =>
  console.log(`Running on http://localhost:${PORT}`)
);
