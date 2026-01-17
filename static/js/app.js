const reposArea = document.getElementById('repos');
const appsArea = document.getElementById('apps');
const backBtn = document.getElementById('backBtn');
const searchBar = document.getElementById('searchBar');
const searchInput = document.getElementById('searchInput');
const toast = document.getElementById('toast');
const importBtn = document.getElementById("importBtn");

let currentApps = [];
let viewingRepoUrl = null;
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
    renderApps(apps.slice(0,20));
    let loaded=20;
    window.onscroll=()=>{if(window.innerHeight+window.scrollY>=document.body.offsetHeight){if(loaded<apps.length){renderApps(apps.slice(loaded,loaded+20),true);loaded+=20;}}}
  }catch{
    appsArea.innerHTML=`<div class="loading-line">Error loading repo.</div>`;
  }
}

// render apps cards
function renderApps(apps,append=false){
  if(!apps||apps.length===0){if(!append) appsArea.innerHTML=`<div class="loading-line">No apps found.</div>`; return;}
  if(!append) appsArea.innerHTML="";
  apps.forEach(app=>{
    const latest=(app.versions&&app.versions.length)?app.versions[0]:{};
    const version=latest.version||app.version||"";
    const desc=app.subtitle||app.localizedDescription||latest.localizedDescription||"";
    const downloadURL=app.downloadURL||latest.downloadURL||"#";
    const sizeBytes=latest.size||app.size||0;
    let sizeText="Unknown";
    if(sizeBytes>1024*1024){sizeText=(sizeBytes/(1024*1024)).toFixed(2)+" MB";}
    else if(sizeBytes>1024){sizeText=(sizeBytes/1024).toFixed(2)+" KB";}
    else if(sizeBytes>0){sizeText=sizeBytes+" B";}
    const card=document.createElement("div");
    card.className="card";
    card.innerHTML=`
      <div class="icon"><img src="${app.iconURL||""}" alt=""></div>
      <div class="title">${app.name||""}</div>
      <div class="meta">
        ${version?`<span class="version">v${version}</span>`:""}
        <span class="size">${sizeText}</span>
      </div>
      <div class="subtitle">${desc}</div>
      <a class="download" href="${downloadURL}" target="_blank" rel="noopener">Download</a>
    `;
    appsArea.appendChild(card);
  });
}

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
});

// global search!
searchInput.addEventListener("input",()=>{
  const q=searchInput.value.toLowerCase();
  const allApps=[];
  document.querySelectorAll('.repo-card').forEach(c=>{
    const url=c.dataset.url;
    const useProxy=c.querySelector('.openBtn').dataset.useProxy==="true";
    allApps.push({url,useProxy});
  });
  const results=[];
  (async ()=>{
    for(const r of allApps){
      const repo=await fetchUserRepo(r.url,r.useProxy);
      if(repo&&repo.apps) results.push(...repo.apps);
    }
    const filtered=results.filter(app=>{
      const latest=(app.versions&&app.versions.length)?app.versions[0]:{};
      const fields=[app.name, app.subtitle, app.localizedDescription, app.developerName, app.bundleIdentifier, latest.localizedDescription];
      return fields.some(f=>f&&f.toLowerCase().includes(q));
    });
    renderApps(filtered);
  })();
});

// modal for import
const importModal=document.createElement("div");
importModal.id="importModal";
importModal.style.cssText=`
position: fixed; top: 60px; left: 50%; transform: translateX(-50%);
background: var(--card); color: var(--text); padding: 16px; border-radius: 14px;
box-shadow: var(--shadow); display: none; z-index: 10000; gap: 8px;
`;
importModal.innerHTML=`
<input id="importModalInput" type="url" placeholder="Paste repo JSON URL…" style="padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,0.06);width:250px;background:rgba(255,255,255,0.03);color:var(--text)">
<button id="importModalBtn" style="padding:8px 12px;border-radius:12px;border:0;background:var(--accent);color:#fff;font-weight:700;cursor:pointer">Import</button>
`;
document.body.appendChild(importModal);
const importModalInput=document.getElementById("importModalInput");
const importModalBtn=document.getElementById("importModalBtn");

importBtn.addEventListener("click",()=>{importModal.style.display=importModal.style.display==="none"?"flex":"none";importModal.style.alignItems="center";});

importModalBtn.addEventListener("click",async()=>{
  const url=importModalInput.value.trim();
  if(!url) return;
  showToast("Importing repo…");
  let repo=await fetchUserRepo(url);
  let useProxy=false;
  if(!repo){repo=await fetchUserRepo(url,true);useProxy=true;}
  if(!repo){showToast("Invalid repo",2000);return;}
  renderRepoCard(repo,url,useProxy,true);
  saveUserRepo({url,useProxy});
  importModalInput.value="";
  importModal.style.display="none";
  showToast("Repo imported!");
});

loadRepos().then(()=>{(async()=>{
  for(const r of getUserRepos()){
    const repo=await fetchUserRepo(r.url,r.useProxy);
    if(repo) renderRepoCard(repo,r.url,r.useProxy,true);
  }
})()});
