const reposArea = document.getElementById('repos');
const appsArea = document.getElementById('apps');
const backBtn = document.getElementById('backBtn');
const searchBar = document.getElementById('searchBar');
const searchInput = document.getElementById('searchInput');
const toast = document.getElementById('toast');
const importBtn = document.getElementById("importBtn");
const header = document.querySelector("header");
const sortSelect = document.getElementById("sortSelect");
let currentSort = "newest";

let currentApps = [];
let viewingRepoUrl = null;
let allAppsIndex = [];
allAppsIndex._keys = new Set();
let filteredApps = [];
let loaded = 0;
let lastScrollY = 0;

const proxy = "https://chocomilkyX.vercel.app/api/proxy?url=";

/* ================= app detail =================== */

const appInfoModal = document.createElement("div");
appInfoModal.id = "appInfoModal";

appInfoModal.innerHTML = `
  <div class="appinfo-box">
    <button class="close" aria-label="Close"></button>
    <div class="appinfo-header">
      <img class="appicon">
      <div>
        <h2 class="appname"></h2>
        <div class="developer"></div>
      </div>
    </div>

    <div class="meta-grid"></div>

    <div class="description"></div>

    <div class="screenshots"></div>

    <div class="permissions"></div>
  </div>
`;

document.body.appendChild(appInfoModal);

function openAppInfo(app) {
  const latest = app.versions?.[0] || app;

  appInfoModal.querySelector(".appicon").src = app.iconURL || "";
  appInfoModal.querySelector(".appname").textContent = app.name || "";
  appInfoModal.querySelector(".versions")?.remove();
  appInfoModal.querySelector(".developer").textContent =
    app.developerName?.trim() || app.__repoName || "Unknown developer";

  const meta = appInfoModal.querySelector(".meta-grid");
  meta.innerHTML = `
    <div><span>Bundle ID</span>${app.bundleIdentifier || app.bundleID || "-"}</div>
    <div><span>Version</span>${latest.version || "-"}</div>
    <div><span>Published</span>${latest.versionDate || latest.date || "-"}</div>
    <div><span>Size</span>${
      latest.size ? ((latest.size)/1024/1024).toFixed(2)+" MB" : "-"
    }</div>
  `;

  appInfoModal.querySelector(".description").textContent =
    app.localizedDescription || "No description provided.";

  const shotsWrap = appInfoModal.querySelector(".screenshots");
  shotsWrap.innerHTML = "";
  shotsWrap.className = "screenshots";
  
  const shots =
    app.screenshots?.iphone ||
    app.screenshotURLs ||
    [];

  shots.forEach(s => {
    const src = typeof s === "string" ? s : s.imageURL;
    const img = new Image();
    img.src = src;
    img.alt = app.name || "Screenshot";
    shotsWrap.appendChild(img);
    img.onerror = () => {};
  });

  /* previous versions */
  const versionsWrap = document.createElement("div");
  versionsWrap.className = "versions";
  const versions = app.versions || [];
  
  if (versions.length > 1) {
    versionsWrap.innerHTML = `<h3>Previous Versions</h3>`;
  
    versions.slice(0, 5).forEach(v => {
      const row = document.createElement("div");
      row.className = "version-row";
  
      row.innerHTML = `
        <span class="version-badge">${v.version}</span>
        <a class="download" href="${v.downloadURL}" target="_blank">Download</a>
      `;
  
      versionsWrap.appendChild(row);
    });
  
    appInfoModal.querySelector(".appinfo-box").appendChild(versionsWrap);
  }

  const permWrap = appInfoModal.querySelector(".permissions");
  const ent = app.appPermissions?.entitlements || [];
  permWrap.innerHTML = ent.length
    ? `<h3>Permissions</h3>` + ent.map(e => `<span>${e}</span>`).join("")
    : "";

  appInfoModal.classList.add("show");
}

/* close handlers */
appInfoModal.addEventListener("click", e => {
  if (e.target === appInfoModal) {
    appInfoModal.classList.remove("show");
  }
});

/* X */
appInfoModal.querySelector(".close").addEventListener("click", () => {
  appInfoModal.classList.remove("show");
});

window.addEventListener("keydown", e => {
  if (e.key === "Escape" && appInfoModal.classList.contains("show")) {
    appInfoModal.classList.remove("show");
  }
});

/* ================= pwa =================== */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js");
  });
}

/* ================= toast ================= */

function showToast(msg, ms = 1500) {
  toast.textContent = msg;
  toast.style.display = 'block';
  clearTimeout(toast._t);
  toast._t = setTimeout(() => (toast.style.display = 'none'), ms);
}

/* ================= header scroll ================= */

window.addEventListener("scroll", () => {
  if (window.scrollY > lastScrollY + 12) {
    header.classList.add("unpin");
  } else if (window.scrollY < lastScrollY - 8) {
    header.classList.remove("unpin");
  }
  lastScrollY = window.scrollY;
});

/* ================= fetch repos ================= */

const fetchRepo = async (repo) => {
  const url = repo.useProxy ? proxy + encodeURIComponent(repo.url) : repo.url;
  try {
    const r = await fetch(url);
    return await r.json();
  } catch { return null; }
};

const loadAllRepos = async (repos) => {
  const results = await Promise.all(repos.map(fetchRepo));
  return results.filter(r => r);
};

/* ================= index apps ================= */

function indexRepoApps(repo) {
  repo.apps?.forEach(app => {
    const key = `${app.name}|${repo.name}`;
    if (allAppsIndex._keys.has(key)) return;

    allAppsIndex.push({
      ...app,
      __repoName: repo.name || "Repo"
    });

    allAppsIndex._keys.add(key);
  });
}

/* ================= utility sorting ================ */

function getAppDate(app) {
  if (app.fullDate) return Number(app.fullDate);
  const d =
    app.versionDate ||
    app.versions?.[0]?.versionDate;
  return d ? new Date(d).getTime() : 0;
}

function getAppSize(app) {
  return app.versions?.[0]?.size || app.size || 0;
}

function getAppVersion(app) {
  return app.versions?.[0]?.version || app.version || "";
}

function sortApps(apps) {
  const arr = apps.slice();

  switch (currentSort) {
    case "oldest":
      return arr.sort((a,b)=>getAppDate(a)-getAppDate(b));

    case "size_desc":
      return arr.sort((a,b)=>getAppSize(b)-getAppSize(a));

    case "size_asc":
      return arr.sort((a,b)=>getAppSize(a)-getAppSize(b));

    case "version":
      return arr.sort((a,b)=>
        String(getAppVersion(b))
          .localeCompare(getAppVersion(a), undefined, {numeric:true})
      );

    default: // newest
      return arr.sort((a,b)=>getAppDate(b)-getAppDate(a));
  }
}

/* sorting listener */
sortSelect.addEventListener("change", () => {
  currentSort = sortSelect.value;
  applySearch();
});

/* helper for showing version when its time */
function toggleVersionSort({ show, inRepo = false, hasQuery = false }) {
  const opt = sortSelect.querySelector('option[value="version"]');
  if (opt) opt.style.display = (inRepo && !hasQuery) ? "none" : "";

  if (!show && sortSelect.value === "version") {
    currentSort = "newest";
    sortSelect.value = "newest";
  }

  if (show) {
    sortSelect.classList.add("show");
  } else {
    sortSelect.classList.remove("show");
  }
}

/* ================= render grouped repos ================= */
function renderGroupedRepos() {
  reposArea.innerHTML = "";

  const grouped = {};
  const repos = [...getUserRepos(), ...(window.globalRepos || [])];

  repos.forEach(r => {
    const category = r.category || "general";
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push(r);
  });

  const categoryOrder = ["developer", "community", "general"];

  Object.keys(grouped)
    .sort((a,b)=>{
      const ai = categoryOrder.indexOf(a);
      const bi = categoryOrder.indexOf(b);
      if(ai===-1 && bi===-1) return a.localeCompare(b);
      if(ai===-1) return 1;
      if(bi===-1) return -1;
      return ai-bi;
    })
    .forEach(category => {
      const title = document.createElement("div");
      title.className = "repo-category-title";
      title.textContent = category.charAt(0).toUpperCase() + category.slice(1);
      reposArea.appendChild(title);

      grouped[category].forEach(r => {
        const repoData = r.data || r;
        renderRepoCard(repoData, r.url, r.useProxy || false, true);
      });
    });

  reposArea.style.display = "";
}

/* ================= search + infinite scroll ================= */
function renderNextBatch() {
  const batchSize = 20;
  const nextApps = filteredApps.slice(loaded, loaded + batchSize);
  renderApps(nextApps, loaded > 0);
  loaded += nextApps.length;
}

function applySearch() {
  const q = searchInput.value.trim().toLowerCase();
  const isGlobalSearch = !viewingRepoUrl;
  const hasQuery = q.length > 0;
  const base = viewingRepoUrl ? currentApps : allAppsIndex;

  if (!q) {
    if (isGlobalSearch) {
      renderGroupedRepos();
      filteredApps = [];
      loaded = 0;
      window.onscroll = null;
      toggleVersionSort({ show: false });
      return;
    }

    filteredApps = sortApps(base);
    loaded = 0;
    appsArea.innerHTML = "";
    renderNextBatch();
    toggleVersionSort({ show: true, inRepo: true, hasQuery: false });
    return;
  }

  if (!viewingRepoUrl) reposArea.style.display = "none";

  filteredApps = sortApps(base.filter(a => a.name?.toLowerCase().includes(q)));
  loaded = 0;
  appsArea.innerHTML = "";
  renderNextBatch();
  toggleVersionSort({ show: true, inRepo: viewingRepoUrl, hasQuery: true });

  window.onscroll = () => {
    if(window.innerHeight + window.scrollY >= document.body.offsetHeight - 120){
      if(loaded < filteredApps.length) renderNextBatch();
    }
  };
}

let searchTimeout;
searchInput.addEventListener("input",()=>{
  clearTimeout(searchTimeout);
  searchTimeout=setTimeout(applySearch,250);
});
