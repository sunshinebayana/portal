// header-footer.js

function loadHeader() {
  document.querySelector("header").innerHTML = `
    <div class="logo-row">
      <img src="https://raw.githubusercontent.com/sunshinebayana/portal/main/logo-192.png" alt="Logo">
      <button class="home-btn" onclick="goHome()">🏠 Home</button>
    </div>
    <div class="title-tagline">
      <span>Sunshine Computer Training & STENO Classes, Bayana</span>
      <div class="tagline">Master Typing, Steno & Computer Skills 🚀</div>
    </div>
    <div class="nav-controls">
      <span class="welcome" id="welcomeMsg">Welcome, User!</span>
      <button class="btn" onclick="goBack()">⬅ Back</button>
      <button class="btn" onclick="logoutUser()">🚪 Logout</button>
    </div>
  `;
}

function loadFooter() {
  document.querySelector("footer").innerHTML =
    "@ 2025 AK Sharma · Sunshine Institute — RS-CIT Practice Portal";
}

// Page Load पर call करना
document.addEventListener("DOMContentLoaded", () => {
  if (document.querySelector("header")) loadHeader();
  if (document.querySelector("footer")) loadFooter();
});
