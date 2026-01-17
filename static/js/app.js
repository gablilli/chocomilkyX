const reposArea = document.getElementById('repos');
const appsArea = document.getElementById('apps');
const backBtn = document.getElementById('backBtn');
const searchBar = document.getElementById('searchBar');
const searchInput = document.getElementById('searchInput');
const toast = document.getElementById('toast');
const importRepoInput = document.getElementById("importRepoInput");
const importRepoBtn = document.getElementById("importRepoBtn");

let currentApps = [];
let viewingRepoUrl = null;
const proxy = "https://proxy-sooty-ten-88.vercel.app/api/proxy?url=";

function showToast(msg, ms = 1500) {
  toast.textContent = msg;
  toast.style.display = 'block';
  clearTimeout(toast._t);
  toast._t = setTimeout(() => (toast.style.display = 'none'), ms);
}

// fetch functions
const fetchRepo = async (repo) => {
  const url = repo.useProxy ? proxy + encodeURIComponent(repo.url) : repo.url;
  try {
    const r = await fetch(url);
    return await r.json();
  } catch (err) {
    console.warn("Failed to fetch repo:", repo.url);
    return null;
  }
};

const loadAllRepos = async (repos) => {
  const results = await Promise.all(repos.map(fetchRepo));
  return results.filter(r => r);
};

// Load and render repos
async function loadRepos() {
  reposArea.innerHTML = `<div class="loading-line">Loading libraries…</div>`;
  try {
    const res = await fetch("https://gablilli.github.io/chocomilky-revived/back/global-repos.json");
    const globals = await res.json();
    if (!globals.repos || globals.repos.length === 0) {
      reposArea.innerHTML = `<div class="loading-line">No libraries loaded.</div>`;
      return;
    }

    const reposData = await loadAllRepos(globals.repos);
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
  } catch (err) {
    console.error(err);
    reposArea.innerHTML = `<div class="loading-line">Failed to load libraries.</div>`;
  }
}

// fetch personal repos
async function fetchUserRepo(url,useProxy=false){
  try{
    const fetchUrl=useProxy?proxy+encodeURIComponent(url):url;
    const res=await fetch(fetchUrl);
    if(!res.ok) throw "";
    const data=await res.json();
    if(!data.apps||!Array.isArray(data.apps)) throw "";
    return data;
  }catch(e){return null}
}

// personal repo card + remove
function renderRepoCard(repoData,repoUrl,useProxy=false,isUserRepo=true){
  const first=repoData.apps[0]||{};
  const icon=repoData.iconURL||first.iconURL||"";
  const name=repoData.name||first.name||"Unnamed Repo";
  const desc = data.description || first.subtitle || first.localizedDescription || "";
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

// local storage helpers
function getUserRepos(){return JSON.parse(localStorage.getItem("userRepos")||"[]")}
function saveUserRepo(r){
  const x=getUserRepos();
  if(!x.find(e=>e.url===r.url)){x.push(r);localStorage.setItem("userRepos",JSON.stringify(x))}
}
function removeUserRepo(url){
  localStorage.setItem("userRepos",JSON.stringify(getUserRepos().filter(r=>r.url!==url)))
}

//listener
importRepoBtn.addEventListener("click",async()=>{
  const url=importRepoInput.value.trim();
  if(!url) return;
  showToast("Importing repo…");
  let repo=await fetchUserRepo(url);
  let useProxy=false;
  if(!repo){repo=await fetchUserRepo(url,true);useProxy=true}
  if(!repo){showToast("Invalid repo",2000);return}
  renderRepoCard(repo,url,useProxy,true);
  saveUserRepo({url,useProxy});
  importRepoInput.value="";
  showToast("Repo imported!");
});

// Handlers
reposArea.addEventListener("click", (e) => {
  const btn = e.target.closest(".openBtn");
  if (!btn) return;
  const url = btn.dataset.url;
  const useProxy = btn.dataset.useProxy === "true";
  openRepo(url, useProxy);
});

// event delegation
reposArea.addEventListener("click", (e) => {
  const btn = e.target.closest(".copyBtn");
  if (!btn) return;
  navigator.clipboard.writeText(btn.dataset.url)
    .then(() => showToast("Copied URL"))
    .catch(() => alert("Copy failed"));
});

// remove button
reposArea.addEventListener("click",e=>{
  const btn=e.target.closest(".removeBtn");
  if(!btn) return;
  const card=btn.closest(".repo-card");
  removeUserRepo(card.dataset.url);
  card.remove();
  showToast("Repo removed");
});

async function openRepo(url, useProxy) {
  viewingRepoUrl = url;
  window.scrollTo({ top: 0, behavior: "auto" });
  reposArea.style.display = "none";
  backBtn.style.display = "block";
  searchBar.style.display = "flex";
  appsArea.innerHTML = "";
  // skeleton loader
  for(let i=0;i<10;i++){
    const s = document.createElement("div"); s.className="skeleton"; appsArea.appendChild(s);
  }

  try {
    const fetchUrl = useProxy ? proxy + encodeURIComponent(url) : url;
    const res = await fetch(fetchUrl);
    const repo = await res.json();
    const apps = repo.apps || [];
    currentApps = apps;
    renderApps(apps.slice(0,20)); // first twenties
    // infinite for the rest
    let loaded = 20;
    window.onscroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
        if(loaded < apps.length){
          renderApps(apps.slice(loaded, loaded+20), true);
          loaded += 20;
        }
      }
    };
  } catch (err) {
    console.error(err);
    appsArea.innerHTML = `<div class="loading-line">Error loading repo.</div>`;
  }
}

function renderApps(apps, append=false){
  if(!apps || apps.length===0){ if(!append) appsArea.innerHTML=`<div class="loading-line">No apps found.</div>`; return; }
  if(!append) appsArea.innerHTML="";
  apps.forEach(app=>{
    const latest=(app.versions&&app.versions.length)?app.versions[0]:{};
    const version=latest.version||app.version||"";
    const desc=app.subtitle||app.localizedDescription||latest.localizedDescription||"";
    const downloadURL=app.downloadURL||latest.downloadURL||"#";
    const card=document.createElement("div");
    card.className="card";
    card.innerHTML=`
      <div class="icon"><img src="${app.iconURL||""}" alt=""></div>
      <div class="title">${app.name||""}</div>
      <div class="subtitle">${desc}</div>
      <div class="version">${version?"Version "+version:""}</div>
      <a class="download" href="${downloadURL}" target="_blank" rel="noopener">Download</a>
    `;
    appsArea.appendChild(card);
  });
}

backBtn.addEventListener("click",()=>{
  viewingRepoUrl=null;
  appsArea.innerHTML="";
  reposArea.style.display="";
  backBtn.style.display="none";
  searchBar.style.display="none";
  window.scrollTo({ top: 0, behavior: "auto" });
  window.onscroll = null; // reset infinite scroll
});

searchInput.addEventListener("input",()=>{
  const q=searchInput.value.toLowerCase();
  const filtered=(currentApps||[]).filter(app=>{
    const latest=(app.versions&&app.versions.length)?app.versions[0]:{};
    const fields=[app.name, app.subtitle, app.localizedDescription, app.developerName, app.bundleIdentifier, latest.localizedDescription];
    return fields.some(f=>f&&f.toLowerCase().includes(q));
  });
  renderApps(filtered);
});

loadRepos().then(() => {
  (async ()=>{
    for(const r of getUserRepos()){
      const repo=await fetchUserRepo(r.url,r.useProxy);
      if(repo) renderRepoCard(repo,r.url,r.useProxy,true);
    }
  })();
});
