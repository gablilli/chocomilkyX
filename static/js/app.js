const reposArea = document.getElementById('repos');
const appsArea = document.getElementById('apps');
const backBtn = document.getElementById('backBtn');
const searchBar = document.getElementById('searchBar');
const searchInput = document.getElementById('searchInput');
const toast = document.getElementById('toast');
const importBtn = document.getElementById("importBtn");

let currentApps = [];
let viewingRepoUrl = null;
let allAppsIndex = [];
let filteredApps = [];
let loaded = 0;
const proxy = "https://proxy-sooty-ten-88.vercel.app/api/proxy?url=";

// toast
function showToast(msg, ms = 1500) {
  toast.textContent = msg;
  toast.style.display = 'block';
  clearTimeout(toast._t);
  toast._t = setTimeout(() => (toast.style.display = 'none'), ms);
}

// fetch repo JSON
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

// Load global repos
async function loadRepos() {
  reposArea.innerHTML = `<div class="loading-line">Loading libraries…</div>`;
  try {
    const res = await fetch("https://gablilli.github.io/chocomilkyX/back/global-repos.json");
    const globals = await res.json();
    if (!globals.repos || globals.repos.length === 0) {
      reposArea.innerHTML = `<div class="loading-line">No libraries loaded.</div>`;
      return;
    }
    const reposData = await loadAllRepos(globals.repos);
    allAppsIndex = [];
    reposData.forEach(indexRepoApps);
    currentApps = allAppsIndex.slice();
    filteredApps = currentApps.slice();
    loaded = 0;

    let out = "";
    for (let i = 0; i < reposData.length; i++) {
      const data = reposData[i];
      const repoMeta = globals.repos[i];
      const first = (data.apps && data.apps[0]) || {};
      const icon = data.iconURL || first.iconURL || "";
      const name = data.name || first.name || "Unnamed Repo";
      const desc = data.description || first.subtitle || first.localizedDescription || "";
      out += `
        <div class="repo-card" data-url="${repoMeta.url}">
          <img src="${icon}" alt="">
          <div class="repo-info">
            <div class="repo-name">${name}</div>
            <div class="repo-desc">${desc}</div>
          </div>
          <div class="repo-actions">
            <button class="openBtn" data-url="${repoMeta.url}" data-use-proxy="${repoMeta.useProxy || false}">Open</button>
            <button class="copyBtn" data-url="${repoMeta.url}">Copy URL</button>
          </div>
        </div>
      `;
    }
    reposArea.innerHTML = out;
    searchBar.style.display = "flex"; // always show search
  } catch {
    reposArea.innerHTML = `<div class="loading-line">Failed to load libraries.</div>`;
  }
}

// localstorage for personal repos
function getUserRepos(){return JSON.parse(localStorage.getItem("userRepos")||"[]")}
function saveUserRepo(r){
  const x=getUserRepos();
  if(!x.find(e=>e.url===r.url)){x.push(r);localStorage.setItem("userRepos",JSON.stringify(x))}
}
function removeUserRepo(url){
  localStorage.setItem("userRepos",JSON.stringify(getUserRepos().filter(r=>r.url!==url)))
}

// fetch personal repo JSON
async function fetchUserRepo(url,useProxy=false){
  try{
    const fetchUrl=useProxy?proxy+encodeURIComponent(url):url;
    const res=await fetch(fetchUrl);
    if(!res.ok) throw "";
    const data=await res.json();
    if(!data.apps||!Array.isArray(data.apps)) throw "";
    return data;
  }catch{return null}
}

// render single repo card
function renderRepoCard(repoData,repoUrl,useProxy=true,isUserRepo=true){
  const first=repoData.apps[0]||{};
  const icon=repoData.iconURL||first.iconURL||"";
  const name=repoData.name||first.name||"Unnamed Repo";
  const desc = repoData.description || first.subtitle || first.localizedDescription || "";
  const div=document.createElement("div");
  div.className="repo-card";
  div.dataset.url=repoUrl;
  div.innerHTML=`
    <img src="${icon}">
    <div class="repo-info">
      <div class="repo-name">${name}</div>
      <div class="repo-desc">${desc}</div>
    </div>
    <div class="repo-actions">
      <button class="openBtn" data-url="${repoUrl}" data-use-proxy="${useProxy}">Open</button>
      <button class="copyBtn" data-url="${repoUrl}">Copy</button>
      ${isUserRepo?`<button class="removeBtn">Remove</button>`:""}
    </div>`;
  reposArea.prepend(div);
}

// open repo
async function openRepo(url,useProxy){
  viewingRepoUrl = url;
  searchInput.value = "";
  window.scrollTo({ top: 0 });
  reposArea.style.display="none";
  backBtn.style.display="block";
  appsArea.innerHTML="";
  for(let i=0;i<10;i++){
    const s=document.createElement("div"); s.className="skeleton"; appsArea.appendChild(s);
  }
  try{
    const fetchUrl=useProxy?proxy+encodeURIComponent(url):url;
    const res=await fetch(fetchUrl);
    const repo=await res.json();
    const apps=repo.apps||[];
    currentApps=apps;
    applySearch();
    window.onscroll=()=> {
      if(window.innerHeight+window.scrollY>=document.body.offsetHeight) {
        if(loaded<filteredApps.length) renderNextBatch();
      }
    };
  }catch{
    appsArea.innerHTML=`<div class="loading-line">Error loading repo.</div>`;
  }
}

// search + scroll
function renderNextBatch() {
  const batchSize = 20;
  const nextApps = filteredApps.slice(loaded, loaded + batchSize);
  renderApps(nextApps, loaded > 0, viewingRepoUrl !== null);
  loaded += nextApps.length;
}

function applySearch() {
  const q = searchInput.value.toLowerCase();
  const appsToFilter = viewingRepoUrl ? currentApps : allAppsIndex;

  if (!q) {
    if (!viewingRepoUrl) {
      reposArea.style.display = "";
      appsArea.innerHTML = "";
      filteredApps = [];
      loaded = 0;
      window.onscroll = null;
      return;
    }
    filteredApps = appsToFilter.slice();
    loaded = 0;
    appsArea.innerHTML = "";
    renderNextBatch();
    return;
  }

  if (!viewingRepoUrl) reposArea.style.display = "none";

  filteredApps = appsToFilter.filter(app => app.name && app.name.toLowerCase().includes(q));

  loaded = 0;
  appsArea.innerHTML = "";
  renderNextBatch();

  window.onscroll = () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
      if (loaded < filteredApps.length) renderNextBatch();
    }
  };
}

let searchTimeout;
searchInput.addEventListener("input", () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(applySearch, 250);
});

// render apps cards
function renderApps(apps, append = false, showRepo = false) {
  if (!apps || apps.length === 0) {
    if (!append) appsArea.innerHTML = `<div class="loading-line">No apps found.</div>`;
    return;
  }
  if (!append) appsArea.innerHTML = "";

  apps.forEach(app => {
    const latest = (app.versions && app.versions.length) ? app.versions[0] : {};
    const version = latest.version || app.version || "";
    const desc = app.subtitle || app.localizedDescription || latest.localizedDescription || "";
    const downloadURL = app.downloadURL || latest.downloadURL || "#";
    const sizeBytes = latest.size || app.size || 0;
    let sizeText = "Unknown";
    if (sizeBytes > 1024*1024) sizeText = (sizeBytes/(1024*1024)).toFixed(2)+" MB";
    else if (sizeBytes > 1024) sizeText = (sizeBytes/1024).toFixed(2)+" KB";
    else if (sizeBytes > 0) sizeText = sizeBytes+" B";
    const repoNameHtml = app.__repoName ? `<div class="repo-meta">From: ${app.__repoName}</div>` : "";

    const card = document.createElement("div");
    card.className = "card";
    card.style.opacity = 0;
    card.style.transition = "opacity 0.4s ease";
    card.innerHTML = `
      <div class="icon"><img loading="lazy" src="${app.iconURL || ''}" alt=""></div>
      <div class="title">${app.name || ""}</div>
      <div class="meta">
        ${version ? `<span class="badge version">v${version}</span>` : ""}
        <span class="badge size">${sizeText}</span>
      </div>
      ${repoNameHtml}
      <div class="subtitle">${desc}</div>
      <a class="download" href="${downloadURL}" target="_blank" rel="noopener">Download</a>
    `;
    appsArea.appendChild(card);

    // fadein
    setTimeout(() => card.style.opacity = 1, 20);
  });
}

// icon fallback
document.addEventListener('error', function(e){
  if(e.target.tagName.toLowerCase() === 'img'){
    e.target.src = 'https://i.sstatic.net/y3igBw0w.jpg';
  }
}, true);

// events
reposArea.addEventListener("click",e=>{
  const btn=e.target.closest(".openBtn");
  if(btn) return openRepo(btn.dataset.url,btn.dataset.useProxy==="true");
});

reposArea.addEventListener("click",e=>{
  const btn=e.target.closest(".copyBtn");
  if(btn) return navigator.clipboard.writeText(btn.dataset.url).then(()=>showToast("Copied URL")).catch(()=>alert("Copy failed"));
});

reposArea.addEventListener("click",e=>{
  const btn=e.target.closest(".removeBtn");
  if(btn){
    const card=btn.closest(".repo-card");
    removeUserRepo(card.dataset.url);
    card.remove();
    showToast("Repo removed");
  }
});

backBtn.addEventListener("click",()=>{
  viewingRepoUrl=null;
  appsArea.innerHTML="";
  reposArea.style.display="";
  backBtn.style.display="none";
  window.onscroll=null;
  filteredApps = [];
  loaded = 0;
});

// search!
function indexRepoApps(repo) {
  if (!repo.apps || !Array.isArray(repo.apps)) return;

  repo.apps.forEach(app => {
    allAppsIndex.push({
      ...app,
      __repoName: repo.name || "Repo"
    });
  });
}

// create the modal
const importModal = document.createElement("div");
importModal.id = "importModal";
importModal.style.cssText = `
position: fixed;
inset: 0;
background: rgba(0,0,0,0.55);
backdrop-filter: blur(10px);
display: none;
align-items: center;
justify-content: center;
z-index: 10000;
`;

importModal.innerHTML = `
  <div class="box" style="
    background: var(--card);
    padding: 20px;
    border-radius: 16px;
    box-shadow: var(--shadow);
    display: flex;
    gap: 10px;
    width: min(90%, 360px);
  ">
    <input id="importModalInput" type="url"
      placeholder="Paste repo JSON URL…"
      style="
        flex:1;
        padding:12px;
        border-radius:12px;
        border:1px solid rgba(255,255,255,0.06);
        background:rgba(255,255,255,0.03);
        color:var(--text)
      ">
    <button id="importModalBtn"
      style="
        padding:12px 16px;
        border-radius:12px;
        border:0;
        background:var(--accent);
        color:#fff;
        font-weight:700;
        cursor:pointer
      ">
      Import
    </button>
  </div>
`;

document.body.appendChild(importModal);

// fade
importModal.style.opacity = 0;
importModal.style.transition = "opacity 0.3s";

// open modal
importBtn.addEventListener("click", () => {
  importModal.style.display = "flex";
  importModalInput.focus();
  // timeout for the transition
  setTimeout(() => importModal.style.opacity = 1, 10);
});

// close modal
importModal.addEventListener("click", e => {
  if (e.target === importModal) {
    importModal.style.opacity = 0;
    setTimeout(() => importModal.style.display = "none", 300);
  }
});

// esc close
window.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    importModal.style.opacity = 0;
    setTimeout(() => importModal.style.display = "none", 300);
  }
});

// close with fadee after import
importModalBtn.addEventListener("click", async () => {
  const url = importModalInput.value.trim();
  if (!url) return;
  showToast("Importing repo…");
  let repo = await fetchUserRepo(url);
  let useProxy = false;
  if (!repo) {
    repo = await fetchUserRepo(url, true);
    useProxy = true;
  }
  if (!repo) {
    showToast("Invalid repo", 2000);
    return;
  }
  renderRepoCard(repo, url, useProxy, true);
  saveUserRepo({ url, useProxy });

  // fade out
  importModal.style.opacity = 0;
  setTimeout(() => importModal.style.display = "none", 300);

  importModalInput.value = "";
  showToast("Repo imported!");
});

loadRepos().then(() => {
  (async () => {
    for (const r of getUserRepos()) {
      const repo = await fetchUserRepo(r.url, r.useProxy);
      if (repo) {
        renderRepoCard(repo, r.url, r.useProxy, true);
        indexRepoApps(repo);
      }
    }
  })();
});

