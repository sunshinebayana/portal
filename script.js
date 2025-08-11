window.currentTestCode = '';
window.currentMode = '';
window.currentUsername = '';
window.currentQuestions = [];
window.currentQuestionIndex = 0;
window.timerInterval = null;
window.timeLeft = 0;
window.userAnswers = {};

window.startRscitTest = function(testCode, loadingMessage, selectedMode, username) {
  window.currentTestCode = testCode;
  window.currentMode = selectedMode;
  window.currentUsername = username;

  document.querySelector('main').style.display = 'none';

  showMessage(loadingMessage, 'blue');

  if (selectedMode === 'exam') {
    prepareExamMode();
    window.startTest(); // this will auto detect google.script.run
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
};

window.fetchStartTestAPI = function(username, testCode) {
  const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbx4Bx-4lSDrBsB1_i6E4reHBiKgKP1zhtVWryVoN8L90Bx72JHSNPaA12aV__fYbRA-/exec';

  fetch(`${GAS_WEB_APP_URL}?action=startTest&username=${encodeURIComponent(username)}&testCode=${encodeURIComponent(testCode)}`)
    .then(response => response.json())
    .then(handleQuestions)
    .catch(() => {
      showMessage("Error connecting to server. Please try again.", "red");
      document.querySelector('main').style.display = 'block';
    });
};

window.showMessage = function(msg, color) {
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
};

window.prepareExamMode = function() {
  if (document.getElementById('testArea')) document.getElementById('testArea').style.display = 'block';
  if (document.getElementById('learnDigitalArea')) document.getElementById('learnDigitalArea').style.display = 'none';

  if (document.getElementById('examButtons')) document.getElementById('examButtons').style.display = 'block';
  if (document.getElementById('practiceButtons')) document.getElementById('practiceButtons').style.display = 'none';
  if (document.getElementById('learnDigitalButtons')) document.getElementById('learnDigitalButtons').style.display = 'none';
};

window.preparePracticeMode = function() {
  if (document.getElementById('testArea')) document.getElementById('testArea').style.display = 'block';
  if (document.getElementById('learnDigitalArea')) document.getElementById('learnDigitalArea').style.display = 'none';

  if (document.getElementById('practiceButtons')) document.getElementById('practiceButtons').style.display = 'block';
  if (document.getElementById('examButtons')) document.getElementById('examButtons').style.display = 'none';
  if (document.getElementById('learnDigitalButtons')) document.getElementById('learnDigitalButtons').style.display = 'none';
};

window.prepareLearnDigitalMode = function() {
  if (document.getElementById('testArea')) document.getElementById('testArea').style.display = 'none';
  if (document.getElementById('learnDigitalArea')) document.getElementById('learnDigitalArea').style.display = 'block';

  if (document.getElementById('learnDigitalButtons')) document.getElementById('learnDigitalButtons').style.display = 'block';
  if (document.getElementById('examButtons')) document.getElementById('examButtons').style.display = 'none';
  if (document.getElementById('practiceButtons')) document.getElementById('practiceButtons').style.display = 'none';
};

// ** FIXED HERE **
window.startTest = function() {
  if (typeof google !== 'undefined' && google.script && google.script.run) {
    google.script.run.withSuccessHandler(handleQuestions).startTest(window.currentUsername, window.currentTestCode);
  } else {
    fetchStartTestAPI(window.currentUsername, window.currentTestCode);
  }
};

window.handleQuestions = function(response) {
  if (response.status === 'payment_pending') {
    showMessage("Payment pending. Please complete payment to start test.", 'red');
  } else if (response.status === 'ok') {
    window.currentQuestions = response.questions;
    window.currentQuestionIndex = 0;
    window.timeLeft = response.testDuration * 60;

    loadQuestion(window.currentQuestionIndex);
    startTimer(window.timeLeft);
  } else {
    showMessage("Error starting test. Please try again.", 'red');
  }
};

window.loadQuestion = function(index) {
  if (index < 0 || index >= window.currentQuestions.length) return;

  const questionObj = window.currentQuestions[index];
  const container = document.getElementById('questionContainer');
  if (!container) return;

  container.innerHTML = `
    <div>
      <h3>Question ${index + 1} of ${window.currentQuestions.length}</h3>
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
};

window.updateQuestionIndicators = function() {
  const indicatorsContainer = document.getElementById('questionIndicators');
  if (!indicatorsContainer) return;

  let indicatorsHtml = '';
  window.currentQuestions.forEach((q, idx) => {
    let answered = isQuestionAnswered(idx);
    let classes = 'indicator';
    if (idx === window.currentQuestionIndex) classes += ' current';
    if (answered) classes += ' answered';

    indicatorsHtml += `<span class="${classes}" data-index="${idx}">${idx + 1}</span> `;
  });
  indicatorsContainer.innerHTML = indicatorsHtml;

  indicatorsContainer.querySelectorAll('span.indicator').forEach(span => {
    span.onclick = () => {
      saveAnswer();
      window.currentQuestionIndex = parseInt(span.dataset.index);
      loadQuestion(window.currentQuestionIndex);
    };
  });
};

window.isQuestionAnswered = function(index) {
  return window.userAnswers.hasOwnProperty(index);
};

window.saveAnswer = function() {
  const form = document.getElementById('optionsForm');
  if (!form) return;

  const selectedOption = form.option.value;
  if (selectedOption) {
    window.userAnswers[window.currentQuestionIndex] = selectedOption;
  }
};

window.goToPrevious = function() {
  if (window.currentQuestionIndex > 0) {
    saveAnswer();
    window.currentQuestionIndex--;
    loadQuestion(window.currentQuestionIndex);
  } else {
    showMessage("You are on the first question.", 'orange');
  }
};

window.goToNext = function() {
  saveAnswer();
  if (window.currentQuestionIndex < window.currentQuestions.length - 1) {
    window.currentQuestionIndex++;
    loadQuestion(window.currentQuestionIndex);
  } else {
    showMessage("You are on the last question.", 'orange');
  }
};

window.submitTest = function() {
  saveAnswer();

  for (let i = 0; i < window.currentQuestions.length; i++) {
    if (!isQuestionAnswered(i)) {
      showMessage(`Please answer question ${i + 1} before submitting.`, 'red');
      window.currentQuestionIndex = i;
      loadQuestion(window.currentQuestionIndex);
      return;
    }
  }

  let correctCount = 0;
  for (let i = 0; i < window.currentQuestions.length; i++) {
    if (window.userAnswers[i] === window.currentQuestions[i].correctAnswer) {
      correctCount++;
    }
  }
  let totalMarks = correctCount * 2;

  let resultData = {
    username: window.currentUsername,
    testCode: window.currentTestCode,
    answers: window.userAnswers,
    correctCount: correctCount,
    totalMarks: totalMarks,
    totalQuestions: window.currentQuestions.length,
    timeTaken: (window.timeLeftInitial - window.timeLeft) 
  };

  if (typeof google !== 'undefined' && google.script && google.script.run) {
    google.script.run.withSuccessHandler(showResult).submitTestResult(resultData);
  } else {
    showMessage("Submit via REST API not implemented yet.", "orange");
  }
  stopTimer();
};

window.timeLeftInitial = 0;

window.startTimer = function(durationInSeconds) {
  window.timeLeftInitial = durationInSeconds;
  window.timeLeft = durationInSeconds;

  updateTimerDisplay();

  window.timerInterval = setInterval(() => {
    window.timeLeft--;
    if (window.timeLeft <= 0) {
      clearInterval(window.timerInterval);
      showMessage("Time's up! Auto-submitting test...", 'red');
      submitTest();
    }
    updateTimerDisplay();
  }, 1000);
};

window.stopTimer = function() {
  if (window.timerInterval) {
    clearInterval(window.timerInterval);
    window.timerInterval = null;
  }
};

window.updateTimerDisplay = function() {
  let timerBox = document.getElementById('timerBox');
  if (!timerBox) return;

  let minutes = Math.floor(window.timeLeft / 60);
  let seconds = window.timeLeft % 60;
  timerBox.textContent = `Time Left: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

window.showResult = function(resultSummary) {
  if (document.getElementById('testArea')) document.getElementById('testArea').style.display = 'none';
  if (document.getElementById('resultArea')) document.getElementById('resultArea').style.display = 'block';

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
};

window.goHome = function() {
  window.currentTestCode = '';
  window.currentMode = '';
  window.currentUsername = '';
  window.currentQuestions = [];
  window.currentQuestionIndex = 0;
  window.userAnswers = {};

  if (document.getElementById('resultArea')) document.getElementById('resultArea').style.display = 'none';
  if (document.getElementById('testArea')) document.getElementById('testArea').style.display = 'none';
  if (document.querySelector('main')) document.querySelector('main').style.display = 'block';
};

window.viewRanking = function() {
  window.open(`https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?mode=ranking&testCode=${window.currentTestCode}&username=${window.currentUsername}`, '_blank');
};
