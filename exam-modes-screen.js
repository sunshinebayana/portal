const code = localStorage.getItem("test_code") || "";
const mode = (localStorage.getItem("test_mode") || "").toLowerCase();
const username = (localStorage.getItem("test_username") || "").trim();
const fullname = localStorage.getItem("test_fullname") || "";

document.getElementById("modeLabel").textContent = mode ? `Mode: ${mode.charAt(0).toUpperCase() + mode.slice(1)}` : "";
document.getElementById("fullnameLabel").textContent = fullname ? `👤 ${fullname}` : "👤 Guest User";

let questions = [];
let currentQ = 0;
let score = 0;
let testDuration = 0;
let maxMarks = 0;
let timerInterval;
let attempted = [];

function updateQuizIndicator() {
  document.getElementById("quizIndicator").textContent =
    `Question ${currentQ + 1} of ${questions.length}`;
  renderQuestionNav();
}

function renderQuestionNav() {
  const nav = document.getElementById("questionNav");
  nav.innerHTML = "";
  for (let i = 0; i < questions.length; i++) {
    const btn = document.createElement("div");
    btn.textContent = i + 1;
    btn.className = "question-btn";
    if (attempted[i]) btn.classList.add("attempted");
    btn.onclick = () => {
      currentQ = i;
      if (mode === "exam") loadQuestionExamMode();
      else loadQuestionPracticeMode();
    };
    nav.appendChild(btn);
  }
}

function renderNavigationButtons() {
  return `
    <div class="button-row">
      <button onclick="prevQuestion()" ${currentQ === 0 ? 'disabled' : ''}>Previous</button>
      ${currentQ < questions.length - 1 ? `<button onclick="${mode==='exam'?'nextQuestionExam()':'checkPracticeAnswer()'}">Save & Next</button>` : ''}
      <button onclick="confirmSubmitExam()">Submit Test</button>
    </div>
  `;
}

function markAttempted() { attempted[currentQ] = true; }

function loadQuestionExamMode() {
  const qData = questions[currentQ];
  updateQuizIndicator();
  let html = `<div class="question">${currentQ + 1}. ${qData.question}</div><div class="options">`;
  qData.options.forEach((opt, idx) => {
    html += `<label><input type="radio" name="option" value="${idx}" ${attempted[currentQ] && qData.selected === idx ? 'checked' : ''}> ${opt}</label>`;
  });
  html += `</div>` + renderNavigationButtons();
  document.getElementById("quizArea").innerHTML = html;
}

function nextQuestionExam() {
  const answer = document.querySelector("input[name='option']:checked");
  if (!answer) { alert("Please select an answer!"); return; }
  const selectedIdx = parseInt(answer.value);
  questions[currentQ].selected = selectedIdx;
  markAttempted();
  const selectedLetter = String.fromCharCode(65 + selectedIdx);
  if (selectedLetter === (questions[currentQ].answer || "").trim().toUpperCase()) score++;
  currentQ++;
  loadQuestionExamMode();
}

function prevQuestion() {
  if (currentQ > 0) {
    currentQ--;
    if (mode === "exam") loadQuestionExamMode();
    else loadQuestionPracticeMode();
  }
}

function confirmSubmitExam() {
  if (confirm("Are you sure you want submit this test?")) {
    submitExam();
  }
}

function submitExam() {
  clearInterval(timerInterval);
  const answer = document.querySelector("input[name='option']:checked");
  if (answer) {
    const selectedLetter = String.fromCharCode(65 + parseInt(answer.value));
    if (selectedLetter === (questions[currentQ].answer || "").trim().toUpperCase()) score++;
  }
  document.getElementById("quizArea").innerHTML =
    `<h3>Exam Completed!</h3>
     <p>Your Score: ${score} / ${questions.length}</p>
     <p>Max Marks: ${maxMarks}, Duration: ${testDuration} mins</p>`;
  document.getElementById("quizIndicator").textContent = "";
  document.getElementById("questionNav").innerHTML = "";
}

function loadQuestionPracticeMode() {
  const qData = questions[currentQ];
  updateQuizIndicator();
  let html = `<div class="question">${currentQ + 1}. ${qData.question}</div><div class="options">`;
  qData.options.forEach((opt, idx) => {
    html += `<label><input type="radio" name="option" value="${idx}"> ${opt}</label>`;
  });
  html += `</div>` + renderNavigationButtons() + `<div class="message" id="practiceMsg"></div>`;
  document.getElementById("quizArea").innerHTML = html;
}

function checkPracticeAnswer() {
  const answer = document.querySelector("input[name='option']:checked");
  if (!answer) { alert("Please select an answer!"); return; }
  markAttempted();
  const selectedLetter = String.fromCharCode(65 + parseInt(answer.value));
  const correctAnswer = (questions[currentQ].answer || "").trim().toUpperCase();
  if (selectedLetter === correctAnswer) {
    if (currentQ < questions.length - 1) {
      currentQ++;
      loadQuestionPracticeMode();
    } else {
      clearInterval(timerInterval);
      document.getElementById("quizArea").innerHTML =
        `<h3>✅ Practice Completed!</h3><p>You answered all questions correctly!</p>`;
      document.getElementById("quizIndicator").textContent = "";
      document.getElementById("questionNav").innerHTML = "";
    }
  } else {
    document.getElementById("practiceMsg").textContent = "❌ Galat Answer! Dubara try karein.";
  }
}

function closeTest() {
  if (confirm("Are you sure you want to close the test?")) {
    window.history.back();
  }
}

function startTimer(durationMinutes) {
  let timer = durationMinutes * 60;
  function updateTimer() {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    document.getElementById("timerDisplay").textContent =
      `⏳ Time Left: ${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    if (--timer < 0) {
      clearInterval(timerInterval);
      alert("⏳ Time is up! Submitting your test...");
      submitExam();
    }
  }
  updateTimer();
  timerInterval = setInterval(updateTimer, 1000);
}

const backendUrl = "https://script.google.com/macros/s/AKfycbx4Bx-4lSDrBsB1_i6E4reHBiKgKP1zhtVWryVoN8L90Bx72JHSNPaA12aV__fYbRA-/exec";

function initTest() {
  if (!username) {
    document.getElementById("quizArea").innerHTML = `<h3 style="color:red;">❌ User not found. Please login again.</h3>`;
    return;
  }

  fetch(`${backendUrl}?action=starttestwithpaymentcheck&username=${encodeURIComponent(username)}&testCode=${encodeURIComponent(code)}`)
    .then(res => res.json())
    .then(data => {
      if (!data.success) {
        document.getElementById("quizArea").innerHTML =
          `<h3 style="color:red;">⚠ ${data.message || "Error starting test."}</h3>`;
        return;
      }

      if ((data.paymentStatus || "").toLowerCase() !== "confirm") {
        document.getElementById("quizArea").innerHTML =
          `<h3 style="color:red;">💰 Your Payment is Pending. Please complete payment to start the test.</h3>`;
        return;
      }

      document.getElementById("examNameLabel").textContent = "";
      document.getElementById("examNameInTest").textContent = `Exam Name: ${data.examName || ""}`;
      testDuration = data.testDuration || 0;
      document.getElementById("examTimeInTest").textContent = testDuration;
      maxMarks = data.maxMarks || 0;

      questions = data.questions || [];
      attempted = new Array(questions.length).fill(false);
      if (!questions.length) {
        document.getElementById("quizArea").innerHTML = `<h3 style="color:red;">⚠ No questions found.</h3>`;
        return;
      }

      currentQ = 0;
      score = 0;
      startTimer(testDuration);

      if (mode === "exam") loadQuestionExamMode();
      else if (mode === "practice") loadQuestionPracticeMode();
      else document.getElementById("quizArea").innerHTML = `<h3 style="color:red;">⚠ Invalid test mode specified.</h3>`;
    })
    .catch(err => {
      console.error("Error loading test:", err);
      document.getElementById("quizArea").innerHTML =
        `<h3 style="color:red;">⚠ Error loading test. Please try again later.</h3>`;
    });
}

initTest();
