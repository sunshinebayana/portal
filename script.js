// Global variables
let currentTestCode = '';
let currentMode = 'practice'; // default mode
let currentUsername = '';
let currentQuestions = [];
let currentQuestionIndex = 0;
let timerInterval = null;
let timeLeft = 0;
let userAnswers = {}; // { questionIndex: 'A' | 'B' | 'C' | 'D' }

// Check login and get user data from localStorage
(function initUser() {
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  if (isLoggedIn !== "true") {
    location.replace("login.html");
  }

  const userData = JSON.parse(localStorage.getItem("userData")) || {};
  if (userData.fullname) {
    document.getElementById("welcomeMsg").textContent = `Welcome, ${userData.fullname}!`;
  }
  currentUsername = userData.username || "guest";
})();

// Mode toggle function
function switchMode(mode) {
  currentMode = mode;
  document.getElementById("practiceModeBtn").classList.toggle("active-mode", mode === "practice");
  document.getElementById("examModeBtn").classList.toggle("active-mode", mode === "exam");
}

// Start test handler (called by buttons)
function startTest(testCode) {
  currentTestCode = testCode;

  // Hide main area (you can implement a loader message here)
  document.querySelector('main').style.display = 'none';

  // Check if google.script.run exists (GAS environment)
  if (typeof google !== "undefined" && google.script && google.script.run) {
    google.script.run.withSuccessHandler(handleQuestions).startTest(currentUsername, currentTestCode);
  } else {
    // Outside GAS - fallback to fetch API
    fetchStartTestAPI(currentUsername, currentTestCode);
  }
}

// Fetch API fallback for starting test (outside GAS)
function fetchStartTestAPI(username, testCode) {
  const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbx4Bx-4lSDrBsB1_i6E4reHBiKgKP1zhtVWryVoN8L90Bx72JHSNPaA12aV__fYbRA-/exec';

  showMessage(`Loading ${testCode}_RSCIT...`, 'blue');

  fetch(`${GAS_WEB_APP_URL}?action=startTest&username=${encodeURIComponent(username)}&testCode=${encodeURIComponent(testCode)}`)
    .then(resp => resp.json())
    .then(handleQuestions)
    .catch(() => {
      showMessage("Error connecting to server. Please try again.", "red");
      document.querySelector('main').style.display = 'block';
    });
}

// Show temporary message on screen
function showMessage(msg, color) {
  let msgBox = document.getElementById('messageBox');
  if (!msgBox) {
    msgBox = document.createElement('div');
    msgBox.id = 'messageBox';
    msgBox.style.position = 'fixed';
    msgBox.style.top = '10px';
    msgBox.style.right = '10px';
    msgBox.style.padding = '10px 15px';
    msgBox.style.borderRadius = '5px';
    msgBox.style.zIndex = 1000;
    document.body.appendChild(msgBox);
  }
  msgBox.style.backgroundColor = color;
  msgBox.style.color = 'white';
  msgBox.textContent = msg;
  msgBox.style.display = 'block';

  setTimeout(() => {
    msgBox.style.display = 'none';
  }, 4000);
}

// Handler for question list response
function handleQuestions(response) {
  if (!response) {
    showMessage("Invalid response from server.", 'red');
    document.querySelector('main').style.display = 'block';
    return;
  }

  if (response.status === 'payment_pending') {
    showMessage("Payment pending. Please complete payment to start test.", 'red');
    document.querySelector('main').style.display = 'block';
    return;
  }

  if (response.status === 'ok') {
    currentQuestions = response.questions || [];
    currentQuestionIndex = 0;
    userAnswers = {};
    timeLeft = (response.testDuration || 10) * 60; // default 10 min if missing
    showTestArea();
    loadQuestion(currentQuestionIndex);
    startTimer(timeLeft);
  } else {
    showMessage("Error starting test. Please try again.", 'red');
    document.querySelector('main').style.display = 'block';
  }
}

// Show test UI (you should create this area in your HTML or dynamically)
function showTestArea() {
  // For demo: just alert and reload main content (you should implement test UI!)
  alert('Test started! Implement test UI here.');
  document.querySelector('main').style.display = 'block';
}

// Load question to UI (demo placeholder)
function loadQuestion(index) {
  // TODO: Implement question display logic
  console.log('Loading question:', index, currentQuestions[index]);
}

// Timer functions
function startTimer(seconds) {
  timeLeft = seconds;
  if (timerInterval) clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      showMessage("Time's up! Submitting test...", 'red');
      // submitTest();  // implement submitTest when you build full test UI
    }
  }, 1000);
}

// Back button handler
function goBack() {
  location.href = "rs-cit-module.html";
}

// Logout handler
function logoutUser() {
  const userData = JSON.parse(localStorage.getItem("userData"));
  if (userData && userData.username) {
    const logoutUrl = `https://script.google.com/macros/s/AKfycbx4Bx-4lSDrBsB1_i6E4reHBiKgKP1zhtVWryVoN8L90Bx72JHSNPaA12aV__fYbRA-/exec?action=logout&username=${encodeURIComponent(userData.username)}`;
    fetch(logoutUrl).catch(err => console.error("Logout error:", err));
  }
  localStorage.clear();
  location.replace("login.html");
}
