const reposArea = document.getElementById('repos');
const appsArea = document.getElementById('apps');
const backBtn = document.getElementById('backBtn');
const searchBar = document.getElementById('searchBar');
const searchInput = document.getElementById('searchInput');
const toast = document.getElementById('toast');
const importBtn = document.getElementById("importBtn");
const header = document.querySelector("header");

let currentApps = [];
let viewingRepoUrl = null;
let allAppsIndex = [];
let filteredApps = [];
let loaded = 0;
let lastScrollY = 0;

const proxy = "https://proxy-sooty-ten-88.vercel.app/api/proxy?url=";

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

/* ================= load global repos ================= */

async function loadRepos() {
  reposArea.style.display = "none";
  reposArea.innerHTML = `<div class="loading-line">Loading libraries…</div>`;

  try {
    const res = await fetch("https://gablilli.github.io/chocomilkyX/back/global-repos.json");
    const globals = await res.json();

    if (!globals.repos?.length) {
      reposArea.innerHTML = `<div class="loading-line">No libraries loaded.</div>`;
      reposArea.style.display = "block";
      return;
    }

    const reposData = await loadAllRepos(globals.repos);

    allAppsIndex = [];
    reposData.forEach(indexRepoApps);

    currentApps = allAppsIndex.slice();
    filteredApps = currentApps.slice();
    loaded = 0;

    reposArea.innerHTML = "";

    reposData.forEach((data, i) => {
      const repoMeta = globals.repos[i];
      const first = data.apps?.[0] || {};
      const icon = data.iconURL || first.iconURL || "";
      const name = data.name || first.name || "Unnamed Repo";
      const desc = data.description || first.subtitle || first.localizedDescription || "";

      const div = document.createElement("div");
      div.className = "repo-card";
      div.dataset.url = repoMeta.url;

      div.innerHTML = `
        <img src="${icon}" alt="">
        <div class="repo-info">
          <div class="repo-name">${name}</div>
          <div class="repo-desc">${desc}</div>
        </div>
        <div class="repo-actions">
          <button class="openBtn" data-url="${repoMeta.url}" data-use-proxy="${repoMeta.useProxy || false}">Open</button>
          <button class="copyBtn" data-url="${repoMeta.url}">Copy URL</button>
        </div>
      `;

      reposArea.appendChild(div);

      requestAnimationFrame(() => {
        setTimeout(() => div.classList.add("show"), i * 60);
      });
    });

    searchBar.style.display = "flex";
    reposArea.style.display = "block";
  } catch {
    reposArea.innerHTML = `<div class="loading-line">Failed to load libraries.</div>`;
    reposArea.style.display = "block";
  }
}

/* ================= local repos ================= */

function getUserRepos(){ return JSON.parse(localStorage.getItem("userRepos")||"[]") }
function saveUserRepo(r){
  const x=getUserRepos();
  if(!x.find(e=>e.url===r.url)){
    x.push(r);
    localStorage.setItem("userRepos",JSON.stringify(x));
  }
}
function removeUserRepo(url){
  localStorage.setItem("userRepos",JSON.stringify(getUserRepos().filter(r=>r.url!==url)));
}

async function fetchUserRepo(url,useProxy=false){
  try{
    const fetchUrl=useProxy?proxy+encodeURIComponent(url):url;
    const res=await fetch(fetchUrl);
    if(!res.ok) throw "";
    const data=await res.json();
    if(!Array.isArray(data.apps)) throw "";
    return data;
  }catch{return null}
}

/* ================= render repo card ================= */

function renderRepoCard(repoData,repoUrl,useProxy=true,isUserRepo=true){
  const first=repoData.apps[0]||{};
  const icon=repoData.iconURL||first.iconURL||"";
  const name=repoData.name||first.name||"Unnamed Repo";
  const desc=repoData.description||first.subtitle||first.localizedDescription||"";

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
    </div>
  `;

  reposArea.prepend(div);
  requestAnimationFrame(() => div.classList.add("show"));
}

/* ================= open repo ================= */

async function openRepo(url,useProxy){
  viewingRepoUrl = url;
  searchInput.value = "";
  window.scrollTo({ top: 0 });

  reposArea.style.display="none";
  appsArea.innerHTML="";

  for(let i=0;i<8;i++){
    const s=document.createElement("div");
    s.className="skeleton";
    appsArea.appendChild(s);
  }

  try{
    const fetchUrl=useProxy?proxy+encodeURIComponent(url):url;
    const res=await fetch(fetchUrl);
    const repo=await res.json();

    currentApps=repo.apps||[];
    applySearch();
    
    backBtn.style.display="inline-flex";

    window.onscroll=()=>{
      if(window.innerHeight+window.scrollY>=document.body.offsetHeight-120){
        if(loaded<filteredApps.length) renderNextBatch();
      }
    };

  }catch{
    appsArea.innerHTML=`<div class="loading-line">Error loading repo.</div>`;
  }
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
  const base = viewingRepoUrl ? currentApps : allAppsIndex;

  if (!q) {
    if (!viewingRepoUrl) {
      reposArea.style.display = "";
      appsArea.innerHTML = "";
      [...reposArea.children].forEach((el,i)=>{
        el.classList.remove("show");
        requestAnimationFrame(()=>setTimeout(()=>el.classList.add("show"),i*60));
      });
      filteredApps=[];
      loaded=0;
      window.onscroll=null;
      return;
    }

    filteredApps = base.slice();
    loaded = 0;
    appsArea.innerHTML = "";
    renderNextBatch();
    return;
  }

  if (!viewingRepoUrl) reposArea.style.display = "none";

  filteredApps = base.filter(a => a.name?.toLowerCase().includes(q));
  loaded = 0;
  appsArea.innerHTML = "";
  renderNextBatch();
}

let searchTimeout;
searchInput.addEventListener("input",()=>{
  clearTimeout(searchTimeout);
  searchTimeout=setTimeout(applySearch,250);
});

/* ================= render apps ================= */

function renderApps(apps, append=false) {
  if (!apps.length) {
    if (!append) appsArea.innerHTML=`<div class="loading-line">No apps found.</div>`;
    return;
  }

  if (!append) appsArea.innerHTML = "";

  apps.forEach((app, i) => {
    const latest = (app.versions && app.versions.length) ? app.versions[0] : {};
    const version = latest.version || app.version || "";
    const desc = app.subtitle || app.localizedDescription || latest.localizedDescription || "";
    const downloadURL = app.downloadURL || latest.downloadURL || "#";
    const sizeBytes = latest.size || app.size || 0;

    let sizeText = "Unknown";
    if (sizeBytes > 1024*1024) sizeText = (sizeBytes/(1024*1024)).toFixed(2)+" MB";
    else if (sizeBytes > 1024) sizeText = (sizeBytes/1024).toFixed(2)+" KB";
    else if (sizeBytes > 0) sizeText = sizeBytes+" B";

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="icon">
        <img loading="lazy" src="${app.iconURL || ''}" alt="">
      </div>
      <div class="title">${app.name || ""}</div>
      <div class="meta">
        ${version ? `<span class="version">v${version}</span>` : ""}
        <span class="size">${sizeText}</span>
      </div>
      ${app.__repoName ? `<div class="repo-meta">From: ${app.__repoName}</div>` : ""}
      <div class="subtitle">${desc}</div>
      <a class="download" href="${downloadURL}" target="_blank">Download</a>
    `;

    appsArea.appendChild(card);
    requestAnimationFrame(() => {
      setTimeout(() => card.classList.add("show"), i * 70);
    });
  });
}

/* ================= events ================= */

reposArea.addEventListener("click",e=>{
  const btn=e.target.closest(".openBtn");
  if(btn) openRepo(btn.dataset.url,btn.dataset.useProxy==="true");
});

reposArea.addEventListener("click",e=>{
  const btn=e.target.closest(".copyBtn");
  if(btn) navigator.clipboard.writeText(btn.dataset.url).then(()=>showToast("Copied URL"));
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
  filteredApps=[];
  loaded=0;

  [...reposArea.children].forEach((el,i)=>{
    el.classList.remove("show");
    requestAnimationFrame(()=>setTimeout(()=>el.classList.add("show"),i*60));
  });
});

/* ================= index apps ================= */

function indexRepoApps(repo){
  repo.apps?.forEach(app=>{
    allAppsIndex.push({...app,__repoName:repo.name||"Repo"});
  });
}

/* import stuff */
const importModal = document.createElement("div");
importModal.id = "importModal";

importModal.innerHTML = `
  <div class="box">
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

const importModalInput = document.getElementById("importModalInput");
const importModalBtn = document.getElementById("importModalBtn");

/* ================= helper modal ================= */
function openImportModal() {
  importModal.style.display = "flex";
  requestAnimationFrame(() => importModal.classList.add("show"));
  importModalInput.focus();
}

function closeImportModal() {
  importModal.classList.remove("show");
  setTimeout(() => importModal.style.display = "none", 250);
}

/* ================= events modal ================= */
importBtn.addEventListener("click", openImportModal);

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

  importModalInput.value = "";
  closeImportModal();
  showToast("Repo imported!");
});

importModal.addEventListener("click", e => {
  if (e.target === importModal) {
    closeImportModal();
  }
});

window.addEventListener("keydown", e => {
  if (e.key === "Escape") closeImportModal();
});
/* ================= boot ================= */

loadRepos().then(async()=>{
  for(const r of getUserRepos()){
    const repo=await fetchUserRepo(r.url,r.useProxy);
    if(repo){
      renderRepoCard(repo,r.url,r.useProxy,true);
      indexRepoApps(repo);
    }
  }
});
