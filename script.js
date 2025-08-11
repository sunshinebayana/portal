let currentTestCode = '';
let currentMode = '';
let currentUsername = '';
let currentQuestions = [];
let currentQuestionIndex = 0;
let timerInterval = null;
let timeLeft = 0;

function startRscitTest(testCode, loadingMessage, selectedMode, username) {
  currentTestCode = testCode;
  currentMode = selectedMode;
  currentUsername = username;

  // Hide main content (book chapter selection area)
  document.querySelector('main').style.display = 'none';

  // Show loading message in blue
  showMessage(loadingMessage, 'blue');

  if (selectedMode === 'exam') {
    prepareExamMode();

    if (typeof google !== 'undefined' && google.script && google.script.run) {
      // GAS environment: use google.script.run
      startTest();
    } else {
      // Non-GAS environment: use REST API fetch
      fetchStartTestAPI(currentUsername, currentTestCode);
    }

  } else if (selectedMode === 'practice') {
    preparePracticeMode();

    if (typeof PracticeTest !== 'undefined' && typeof PracticeTest.startTest === 'function') {
      PracticeTest.startTest();
    } else {
      showMessage("Practice mode not implemented yet.", "orange");
    }

  } else if (selectedMode === 'LearnD') {
    prepareLearnDigitalMode();

    if (typeof LearnDigital !== 'undefined' && typeof LearnDigital.startTest === 'function') {
      LearnDigital.startTest();
    } else {
      showMessage("LearnD mode not implemented yet.", "orange");
    }
  }
}

// REST API call for starting test (when google.script.run not available)
function fetchStartTestAPI(username, testCode) {
  const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbx4Bx-4lSDrBsB1_i6E4reHBiKgKP1zhtVWryVoN8L90Bx72JHSNPaA12aV__fYbRA-/exec';

  fetch(`${GAS_WEB_APP_URL}?action=startTest&username=${encodeURIComponent(username)}&testCode=${encodeURIComponent(testCode)}`)
    .then(response => response.json())
    .then(handleQuestions)
    .catch(() => {
      showMessage("Error connecting to server. Please try again.", "red");
      // Show main again so user can retry
      document.querySelector('main').style.display = 'block';
    });
}


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

// Mode preparation functions
function prepareExamMode() {
  document.getElementById('testArea')?.style.display = 'block';
  document.getElementById('learnDigitalArea')?.style.display = 'none';

  // Show exam buttons container, hide others
  document.getElementById('examButtons')?.style.display = 'block';
  document.getElementById('practiceButtons')?.style.display = 'none';
  document.getElementById('learnDigitalButtons')?.style.display = 'none';
}

function preparePracticeMode() {
  document.getElementById('testArea')?.style.display = 'block';
  document.getElementById('learnDigitalArea')?.style.display = 'none';

  // Show practice buttons container, hide others
  document.getElementById('practiceButtons')?.style.display = 'block';
  document.getElementById('examButtons')?.style.display = 'none';
  document.getElementById('learnDigitalButtons')?.style.display = 'none';
}

function prepareLearnDigitalMode() {
  document.getElementById('testArea')?.style.display = 'none';
  document.getElementById('learnDigitalArea')?.style.display = 'block';

  // Show learn digital buttons container, hide others
  document.getElementById('learnDigitalButtons')?.style.display = 'block';
  document.getElementById('examButtons')?.style.display = 'none';
  document.getElementById('practiceButtons')?.style.display = 'none';
}

// Backend call to start test (GAS environment)
function startTest() {
  google.script.run.withSuccessHandler(handleQuestions).startTest(currentUsername, currentTestCode);
}

// Handle questions response from backend
function handleQuestions(response) {
  if (!response) {
    showMessage("No response from server.", "red");
    document.querySelector('main').style.display = 'block';
    return;
  }

  if (response.status === 'payment_pending') {
    showMessage("Payment pending. Please complete payment to start test.", 'red');
  } else if (response.status === 'ok') {
    currentQuestions = response.questions || [];
    currentQuestionIndex = 0;
    timeLeft = (response.testDuration || 0) * 60; // assuming testDuration in minutes, convert to seconds

    if (currentQuestions.length === 0) {
      showMessage("No questions found for this test.", "red");
      document.querySelector('main').style.display = 'block';
      return;
    }

    loadQuestion(currentQuestionIndex);
    startTimer(timeLeft);
  } else {
    showMessage("Error starting test. Please try again.", 'red');
    document.querySelector('main').style.display = 'block';
  }
}

// Load a single question on screen
function loadQuestion(index) {
  if (index < 0 || index >= currentQuestions.length) return;

  const questionObj = currentQuestions[index];
  const container = document.getElementById('questionContainer');
  if (!container) {
    console.warn("No questionContainer found in DOM.");
    return;
  }

  container.innerHTML = `
    <div>
      <h3>Question ${index + 1} of ${currentQuestions.length}</h3>
      <p>${questionObj.question}</p>
      <form id="optionsForm">
        <label><input type="radio" name="option" value="A"> A. ${questionObj.optionA}</label><br>
        <label><input type="radio" name="option" value="B"> B. ${questionObj.optionB}</label><br>
        <label><input type="radio" name="option" value="C"> C. ${questionObj.optionC}</label><br>
        <label><input type="radio" name="option" value="D"> D. ${questionObj.optionD}</label>
      </form>
    </div>
  `;

  updateQuestionIndicators();
}

// Question indicators showing answered and current question
function updateQuestionIndicators() {
  const indicatorsContainer = document.getElementById('questionIndicators');
  if (!indicatorsContainer) return;

  let indicatorsHtml = '';
  currentQuestions.forEach((q, idx) => {
    // Check if user has answered this question
    let answered = isQuestionAnswered(idx);
    let classes = 'indicator';
    if (idx === currentQuestionIndex) classes += ' current';
    if (answered) classes += ' answered';

    indicatorsHtml += `<span class="${classes}" data-index="${idx}">${idx + 1}</span> `;
  });
  indicatorsContainer.innerHTML = indicatorsHtml;

  // Add click handler to indicators for navigation
  indicatorsContainer.querySelectorAll('span.indicator').forEach(span => {
    span.onclick = () => {
      saveAnswer();
      currentQuestionIndex = parseInt(span.dataset.index);
      loadQuestion(currentQuestionIndex);
    };
  });
}

// Check if question is answered
let userAnswers = {}; // key: question index, value: 'A'/'B'/'C'/'D'

function isQuestionAnswered(index) {
  return userAnswers.hasOwnProperty(index);
}

// Save currently selected answer
function saveAnswer() {
  const form = document.getElementById('optionsForm');
  if (!form) return;

  const selectedOption = form.option?.value;
  if (selectedOption) {
    userAnswers[currentQuestionIndex] = selectedOption;
  }
}

// Navigation buttons handlers
function goToPrevious() {
  if (currentQuestionIndex > 0) {
    saveAnswer();
    currentQuestionIndex--;
    loadQuestion(currentQuestionIndex);
  } else {
    showMessage("You are on the first question.", 'orange');
  }
}

function goToNext() {
  saveAnswer();
  if (currentQuestionIndex < currentQuestions.length - 1) {
    currentQuestionIndex++;
    loadQuestion(currentQuestionIndex);
  } else {
    showMessage("You are on the last question.", 'orange');
  }
}

function submitTest() {
  saveAnswer();

  // Check if any question is unanswered
  for (let i = 0; i < currentQuestions.length; i++) {
    if (!isQuestionAnswered(i)) {
      showMessage(`Please answer question ${i + 1} before submitting.`, 'red');
      currentQuestionIndex = i;
      loadQuestion(currentQuestionIndex);
      return;
    }
  }

  // Calculate marks etc.
  let correctCount = 0;
  for (let i = 0; i < currentQuestions.length; i++) {
    if (userAnswers[i] === currentQuestions[i].correctAnswer) {
      correctCount++;
    }
  }
  let totalMarks = correctCount * 2; // 2 marks per correct answer

  let resultData = {
    username: currentUsername,
    testCode: currentTestCode,
    answers: userAnswers,
    correctCount: correctCount,
    totalMarks: totalMarks,
    totalQuestions: currentQuestions.length,
    timeTaken: (timeLeftInitial - timeLeft) // seconds
  };

  if (typeof google !== 'undefined' && google.script && google.script.run) {
    google.script.run.withSuccessHandler(showResult).submitTestResult(resultData);
  } else {
    showMessage("Submit test functionality only works in GAS environment.", "red");
  }
  stopTimer();
}

// Timer functions
let timeLeftInitial = 0;

function startTimer(durationInSeconds) {
  timeLeftInitial = durationInSeconds;
  timeLeft = durationInSeconds;

  updateTimerDisplay();

  timerInterval = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      showMessage("Time's up! Auto-submitting test...", 'red');
      submitTest();
    }
    updateTimerDisplay();
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateTimerDisplay() {
  let timerBox = document.getElementById('timerBox');
  if (!timerBox) return;

  let minutes = Math.floor(timeLeft / 60);
  let seconds = timeLeft % 60;
  timerBox.textContent = `Time Left: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Show test result summary
function showResult(resultSummary) {
  // Hide test area, show result area
  document.getElementById('testArea').style.display = 'none';
  document.getElementById('resultArea').style.display = 'block';

  // Display result summary details
  const resultContainer = document.getElementById('resultContainer');
  if (!resultContainer) return;

  resultContainer.innerHTML = `
    <h3>Test Result</h3>
    <p>Marks: ${resultSummary.marks} / ${resultSummary.maxMarks}</p>
    <p>Correct Answers: ${resultSummary.correctCount}</p>
    <p>Attempted Questions: ${resultSummary.attemptedCount}</p>
    <p>Time Taken: ${resultSummary.timeTaken} seconds</p>
    <button onclick="goHome()">Back to Home</button>
    <button onclick="viewRanking()">View Overall Ranking</button>
  `;
}

function goHome() {
  // Reset all variables and UI
  currentTestCode = '';
  currentMode = '';
  currentUsername = '';
  currentQuestions = [];
  currentQuestionIndex = 0;
  userAnswers = {};

  document.getElementById('resultArea').style.display = 'none';
  document.getElementById('testArea').style.display = 'none';
  document.querySelector('main').style.display = 'block';
}

function viewRanking() {
  window.open(`https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?mode=ranking&testCode=${currentTestCode}&username=${currentUsername}`, '_blank');
}
