// protect.js

// 1. Disable Right Click
document.addEventListener("contextmenu", function (e) {
    e.preventDefault();
    alert("Right click disabled for security reasons.");
});

// 2. Disable Specific Keys (Ctrl+U, Ctrl+Shift+I, F12, Ctrl+S, etc.)
document.addEventListener("keydown", function (e) {
    if (
        (e.ctrlKey && e.key.toLowerCase() === "u") || // View Source
        (e.ctrlKey && e.key.toLowerCase() === "s") || // Save
        (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "i") || // Inspect
        (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "j") || // Console
        (e.ctrlKey && e.key.toLowerCase() === "c") || // Copy
        (e.key === "F12") // DevTools
    ) {
        e.preventDefault();
        alert("This action is disabled.");
    }
});

// 3. Prevent Copy / Cut / Paste
document.addEventListener("copy", function (e) {
    e.preventDefault();
    alert("Copying is disabled.");
});
document.addEventListener("cut", function (e) {
    e.preventDefault();
    alert("Cut is disabled.");
});
document.addEventListener("paste", function (e) {
    e.preventDefault();
    alert("Pasting is disabled.");
});

// 4. Redirect if accessed directly via URL
(function () {
    let allowedHost = "sunshinebayana.github.io";
    let loginURL = "https://sunshinebayana.github.io/portal/login.html";

    // Agar file direct URL se access ho aur referrer empty ho
    if (document.referrer === "" || window.location.hostname !== allowedHost) {
        window.location.href = loginURL;
    }
})();
