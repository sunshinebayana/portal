// ================== HEADER + FOOTER ==================

// ✅ Inject CSS for header & footer (desktop + mobile responsive)
const style = document.createElement("style");
style.textContent = `
  :root{
    --primary:#0d1b4c;
    --secondary:#f8bbd0;
    --accent:#e91e63;
    --bg:#fff;
    --muted:#6b7280;
    --radius:12px;
  }
  header{
    background:var(--primary);
    color:#fff;
    padding:10px 16px;
    display:flex;
    align-items:center;
    justify-content:space-between;
    box-shadow:0 2px 6px rgba(0,0,0,0.15);
    position:sticky;
    top:0;
    z-index:1000;
    flex-wrap:wrap;
    gap:10px;
  }
  .logo-row{display:flex;align-items:center;gap:12px;}
  .logo-row img{height:38px;}
  .home-btn,.btn{
    background:var(--secondary);
    color:var(--primary);
    border:none;
    padding:6px 12px;
    font-size:14px;
    font-weight:600;
    border-radius:8px;
    cursor:pointer;
    transition:.3s;
  }
  .home-btn:hover,.btn:hover{background:var(--accent);color:#fff;}
  .title-tagline{flex:1;text-align:center;}
  .title-tagline span{display:block;font-weight:600;font-size:18px;}
  .title-tagline .tagline{font-size:13px;color:var(--secondary);margin-top:2px;}
  .nav-controls{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:center;}
  .welcome{font-size:14px;font-weight:500;}
  footer{
    background:var(--primary);
    color:#fff;
    text-align:center;
    padding:10px;
    font-size:13px;
    margin-top:auto;
  }
  @media (max-width: 600px) {
    header{flex-direction: column;align-items: center;text-align:center;}
    .logo-row{justify-content:center;}
    .title-tagline span{font-size:16px;}
    .title-tagline .tagline{font-size:12px;}
    .nav-controls{justify-content:center;}
  }
`;
document.head.appendChild(style);

// ✅ Header Loader (Updated: Welcome and Home swapped)
function loadHeader() {
  const header = document.querySelector("header");
  if (!header) return;
  header.innerHTML = `
    <div class="logo-row">
      <img src="https://raw.githubusercontent.com/sunshinebayana/portal/main/logo-192.png" alt="Logo">
      <span class="welcome" id="welcomeMsg">Welcome, User!</span>
    </div>
    <div class="title-tagline">
      <span>Sunshine Computer Training & STENO Classes, Bayana</span>
      <div class="tagline">Master Typing, Steno & Computer Skills 🚀</div>
    </div>
    <div class="nav-controls">
      <button class="home-btn" onclick="goHome()">🏠 Home</button>
      <button class="btn" onclick="goBack()">⬅ Back</button>
      <button class="btn" onclick="logoutUser()">🚪 Logout</button>
    </div>
  `;

  // ✅ Set Welcome Message dynamically
  const userData = JSON.parse(localStorage.getItem("userData"));
  if (userData && userData.fullname) {
    document.getElementById("welcomeMsg").textContent = `Welcome, ${userData.fullname}!`;
  }
}

// ✅ Footer Loader
function loadFooter() {
  const footer = document.querySelector("footer");
  if (!footer) return;
  footer.innerHTML = "@2025 AK Sharma (Online Test & Practice Web Portal)";
}

// ✅ Common Functions
function goHome() { location.href = "dashboard.html"; }


function logoutUser() {
  const userData = JSON.parse(localStorage.getItem("userData"));
  if (userData && userData.username) {
    const logoutUrl = `${BASE_URL}?action=logout&username=${encodeURIComponent(userData.username)}`;
    fetch(logoutUrl).catch(err => console.error("Logout error:", err));
  }
  localStorage.clear();
  location.replace("login.html");
}

// ✅ Auto Init
document.addEventListener("DOMContentLoaded", () => {
  loadHeader();
  loadFooter();
});
