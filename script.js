<script>
  
    let testDuration = 0;
    let timerInterval;
    let timeRemaining;
    let questions = [];
    let currentIndex = 0;
    let userAnswers = [];
    let maxMarks = 0;

    function showMessage(msg, isError = false) {
      const msgDiv = document.getElementById('message');
      msgDiv.textContent = msg;
      msgDiv.style.color = isError ? 'red' : 'green';
    }

    function startTest() {
      showMessage('Loading test...');
      username = currentUser.username;
      google.script.run.withSuccessHandler(onTestData)
                       .withFailureHandler(e => showMessage('Error: ' + e.message, true))
                       .startTest(username, testCode);
    }

    function onTestData(data) {
      if (data.status === 'payment_pending') {
        showTestIntro();
        showMessage('You have not yet made the full payment. Contact Admin – Atendra Sharma M. 9929856121.', true);
        return;
      }
      if (data.status === 'ok') {
        testDuration = data.testDuration;
        questions = data.questions;
        userAnswers = new Array(questions.length).fill(null);
        timeRemaining = testDuration * 60;
        maxMarks = data.maxMarks || 0;
        showTestIntro();
        startTimer();
        showQuestion(0);
      }
    }

    function showTestIntro() {
      document.getElementById('intro').style.display = 'none';
      document.getElementById('testArea').style.display = 'block';
      document.getElementById('scoreboard').style.display = 'none';
      showMessage('');
    }

    function startTimer() {
      updateTimerDisplay();
      timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();
        if (timeRemaining <= 0) {
          clearInterval(timerInterval);
          alert('Time is up! Submitting test...');
          submitTest();
        }
      }, 1000);
    }

    function updateTimerDisplay() {
      let mins = Math.floor(timeRemaining / 60);
      let secs = timeRemaining % 60;
      document.getElementById('timer').textContent = `Time Left: ${mins}m ${secs}s`;
    }

    function showQuestion(index) {
      if (index < 0 || index >= questions.length) return;
      currentIndex = index;
      const q = questions[index];
      document.getElementById('questionNumber').textContent = `Question ${index + 1} of ${questions.length}`;
      document.getElementById('questionText').textContent = q[1];
      ['A','B','C','D'].forEach((opt,i) => {
        const optElem = document.getElementById('option'+opt);
        optElem.textContent = q[i+2];
        document.getElementById('input'+opt).checked = (userAnswers[index] === opt);
      });
      document.getElementById('prevBtn').disabled = (index === 0);
      let indicators = '';
      for (let i = 0; i < questions.length; i++) {
        let cls = (i === index) ? 'current' : (userAnswers[i] ? 'answered' : '');
        indicators += `<span class="${cls}" onclick="showQuestion(${i})">${i+1}</span> `;
      }
      document.getElementById('qIndicators').innerHTML = indicators;
    }

    function saveAndNext() {
      const selected = document.querySelector('input[name="options"]:checked');
      if (!selected) {
        showMessage('Please select an option before proceeding', true);
         setTimeout(() => { showMessage(''); }, 3000); // ✨ Auto-clear error message
        return;
      }
      userAnswers[currentIndex] = selected.value;
      if (currentIndex < questions.length - 1) {
        showQuestion(currentIndex + 1);
      } else {
        showMessage('You reached the last question. You can submit now.');
        setTimeout(() => { showMessage(''); }, 3000); // ✨ Auto-clear error message
      }
    }

    function prevQuestion() {
      if (currentIndex > 0) showQuestion(currentIndex - 1);
    }

    function submitTest() {
      clearInterval(timerInterval);
      let correct = 0, attempted = 0, obtainedMarks = 0;
      for (let i = 0; i < questions.length; i++) {
        if (userAnswers[i]) {
          attempted++;
          if (userAnswers[i] === questions[i][6]) {
            correct++;
            obtainedMarks += 2;
          }
        }
      }

      const resultData = {
        username, testCode, maxMarks,
        obtainedMarks, totalQuestions: questions.length,
        attempted, correct, testTime: testDuration,
        timeTaken: testDuration * 60 - timeRemaining
      };

      google.script.run.withSuccessHandler(showScoreBoard)
                       .withFailureHandler(e => showMessage('Error saving result: ' + e.message, true))
                       .submitTestResult(resultData);
    }

  function showScoreBoard(data) {
  if (!data || data.status !== 'success') {
    showMessage('Error submitting test result or result data missing.', true);
    return;
  }

  document.getElementById('testArea').style.display = 'none';
  const scoreboard = document.getElementById('scoreboard');
  scoreboard.style.display = 'block';
  scoreboard.classList.add('show');

  const summary = `
    

     <div style="max-width: 600px; margin: auto; text-align: center; font-family: 'Segoe UI', sans-serif; font-size: 15px; line-height: 1.6;">

  <p><strong>📄 Result:</strong> ${data.result || 'N/A'}</p>

  <div style="display: flex; justify-content: center; gap: 30px;">
    <span><strong>🔢 Max Marks:</strong> ${data.maxMarks ?? 0}</span>
    <span><strong>✅ Obtained Marks:</strong> ${data.obtainedMarks ?? 0}</span>
  </div>

  <div style="display: flex; justify-content: center; gap: 30px; margin-top: 8px;">
    <span><strong>❓ Total Questions:</strong> ${data.totalQuestions ?? 0}</span>
    <span><strong>✍️ Attempted:</strong> ${data.attempted ?? 0}</span>
  </div>

  <p style="margin-top: 10px;"><strong>✔️ Correct Answers:</strong> ${data.correct ?? 0}</p>

  <div style="display: flex; justify-content: center; gap: 30px; margin-top: 8px;">
    <span><strong>⏳ Test Time:</strong> ${data.testTime ?? 0} minutes</span>
    <span><strong>⌛ Time Taken:</strong> ${Math.floor(data.timeTaken / 60)}m ${data.timeTaken % 60}s</span>
  </div>

</div>

<div style="display: flex; justify-content: center; margin: 25px 0; font-family: 'Segoe UI', sans-serif;">
  <button onclick="showRanking()" style="
    padding: 14px 32px;
    font-size: 18px;
    font-weight: bold;
    background: linear-gradient(135deg, #a855f7, #ec4899);
    color: white;
    border: none;
    border-radius: 10px;
    box-shadow: 0 6px 18px rgba(236, 72, 153, 0.4);
    cursor: pointer;
    transition: all 0.3s ease;
    letter-spacing: 0.5px;
    text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.2);
  " 
  onmouseover="this.style.background='linear-gradient(135deg, #9333ea, #db2777)'"
  onmouseout="this.style.background='linear-gradient(135deg, #a855f7, #ec4899)'">
    🏆 View Overall Ranking
  </button>
</div>


      
    </div>

    
  `;

  document.getElementById('resultSummary').innerHTML = summary;

  //showMessage('Test submitted successfully!');
}

<!-------------------------------------------------------------->
    function showRanking() {
      google.script.run.withSuccessHandler(renderRanking)
                       .withFailureHandler(e => showMessage('Error fetching ranking: ' + e.message, true))
                       .getOnlineRanking(testCode);
    }
<!-------------------------------------------------------------->
  
  function renderRanking(rankings) {
  const newWin = window.open('', '_blank');

  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  let html = `
    <html>
    <head>
      <title>Overall Ranking</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          background: #f4f4f4;
        }
        h2 {
          text-align: center;
          color: #2c3e50;
          margin-bottom: 10px;
        }
        .date-and-close {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .date {
          font-size: 14px;
          color: #555;
        }
        .close-button {
          background-color: #dc2626;
          color: #fff;
          border: none;
          padding: 6px 12px;
          border-radius: 5px;
          font-size: 13px;
          cursor: pointer;
          margin-top: 5px;
        }
        .close-button:hover {
          background-color: #b91c1c;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        th, td {
          padding: 6px;
          border: 1px solid #ccc;
          text-align: center;
        }
        th {
          background-color: #007BFF;
          color: white;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .highlight {
          background-color: #fff8b3;
          font-weight: bold;
        }
        @media screen and (max-width: 600px) {
          .date-and-close {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
        }
      </style>
    </head>
    <body>
      <h2>RS-CIT Learner's Overall Online Ranking</h2>
      <div class="date-and-close">
        <div class="date"><strong>${formattedDate}</strong></div>
        <button class="close-button" onclick="window.close()">❌ Close Tab</button>
      </div>
  `;

  if (!rankings || rankings.length === 0) {
    html += `<p style="text-align:center;">No ranking data available for today.</p>`;
  } else {
    html += `
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Full Name</th>
            <th>Max Marks</th>
            <th>Obtained</th>
            <th>Result</th>
            <th>Test Time</th>
            <th>Time Taken</th>
          </tr>
        </thead>
        <tbody>
    `;

    rankings.forEach(r => {
      const isCurrentUser = r.username && username &&
        r.username.trim().toLowerCase() === username.trim().toLowerCase();
      const rowClass = isCurrentUser ? 'highlight' : '';
      html += `
        <tr class="${rowClass}">
          <td>${r.rank}</td>
          <td>${r.fullName}</td>
          <td>${r.maxMarks}</td>
          <td>${r.obtainedMarks}</td>
          <td>${r.result}</td>
          <td>${r.testTime} min</td>
          <td>${Math.floor(r.timeTaken / 60)}m ${r.timeTaken % 60}s</td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
    `;
  }

  html += `</body></html>`;

  newWin.document.write(html);
  newWin.document.close();
}

<!-------------------------------------------------------------->

function Close() {
  // Current screen ko clear karne ke liye
  document.body.innerHTML = '';
  }


<!-------------------------------------------------------------->
function goToHomeScreen() {
  // Sabhi screens ko hide karo
  const allScreens = document.querySelectorAll('.screen');
  allScreens.forEach(screen => screen.style.display = 'none');

  // Scoreboard ko hide karo
  const scoreboard = document.getElementById('scoreboard');
  if (scoreboard) {
    scoreboard.style.display = 'none';
  }

  // Result summary clear karo
  const result = document.getElementById('resultSummary');
  if (result) {
    result.innerHTML = '';
  }

  // Agar koi input field ho toh clear karo (optional)
  const userInput = document.getElementById('userInput');
  if (userInput) {
    userInput.value = '';
  }

  // Home screen show karo
  const home = document.getElementById('homeScreen');
  if (home) {
    home.style.display = 'block';
  }
}
<!-------------------------------------------------------------->
<!----- Chatbot Coding --->

<!-------------------------------------------------------------->
 const PracticeTest = (() => {
 // let testCode = 'T2';    // Update dynamically if needed
  let testDuration = 0;
  let timerInterval;
  let timeRemaining;
  let questions = [];
  let currentIndex = 0;
  let userAnswers = [];
  let maxMarks = 0;
  let totalIncorrectAttempts = 0;
  let flag = 0;

  function showMessage(msg, isError = false) {
    const msgDiv = document.getElementById('message');
    msgDiv.textContent = msg;
    msgDiv.style.color = isError ? 'red' : 'green';
  }

  function startTest() {
    showMessage('Loading test...');
    username = currentUser.username;
    google.script.run
      .withSuccessHandler(onTestData)
      .withFailureHandler(e => showMessage('Error: ' + e.message, true))
       .startTest(username, testCode);
  }

  function onTestData(data) {
    if (data.status === 'payment_pending') {
      showTestIntro();
      showMessage('Payment pending. Contact Admin.', true);
      return;
    }
    if (data.status === 'ok') {
      testDuration = data.testDuration;
      questions = data.questions;
      userAnswers = new Array(questions.length).fill(null);
      timeRemaining = testDuration * 60;
      maxMarks = data.maxMarks || 0;
      showTestIntro();
      startTimer();
      showQuestion(0);
    }
  }

  function showTestIntro() {
    document.getElementById('intro').style.display = 'none';
    document.getElementById('testArea').style.display = 'block';
    document.getElementById('scoreboard').style.display = 'none';
    showMessage('');
  }

  function startTimer() {
    updateTimerDisplay();
    timerInterval = setInterval(() => {
      timeRemaining--;
      updateTimerDisplay();
      if (timeRemaining <= 0) {
        clearInterval(timerInterval);
        alert('Time is up! Submitting test...');
        submitTest();
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    let mins = Math.floor(timeRemaining / 60);
    let secs = timeRemaining % 60;
    document.getElementById('timer').textContent = `Time Left: ${mins}m ${secs}s`;
  }

  function showQuestion(index) {
    if (index < 0 || index >= questions.length) return;
    currentIndex = index;
    const q = questions[index];
    document.getElementById('questionNumber').textContent = `Question ${index + 1} of ${questions.length}`;
    document.getElementById('questionText').textContent = q[1];
    ['A', 'B', 'C', 'D'].forEach((opt, i) => {
      document.getElementById('option' + opt).textContent = q[i + 2];
      document.getElementById('input' + opt).checked = (userAnswers[index] === opt);
    });
    document.getElementById('prevBtn').disabled = (index === 0);

    let indicators = '';
    for (let i = 0; i < questions.length; i++) {
      let cls = (i === index) ? 'current' : (userAnswers[i] ? 'answered' : '');
      indicators += `<span class="${cls}" onclick="PracticeTest.showQuestion(${i})">${i + 1}</span> `;
    }
    document.getElementById('qIndicators').innerHTML = indicators;
  }

  function saveAndNext() {
    const selected = document.querySelector('input[name="options"]:checked');
    if (!selected) {
      showMessage('Please select an option before proceeding', true);
       setTimeout(() => { showMessage(''); }, 2500); // ✨ Auto-clear error message
      return;
    }
    const selectedValue = selected.value;
    const correctAnswer = questions[currentIndex][6];
    if (selectedValue === correctAnswer) {
      userAnswers[currentIndex] = selectedValue;
      showMessage("✅ Correct! Moving to next...");
      setTimeout(() => {
        showMessage('');
        if (currentIndex < questions.length - 1) {
          showQuestion(currentIndex + 1);
        } else {
          showMessage('Last question reached. You can submit now.');
          setTimeout(() => { showMessage(''); }, 2500); // ✨ Auto-clear error message
        }
      }, 1000);
    } else {
      totalIncorrectAttempts++;
      showMessage("❌ Incorrect. Try again.", true);
      setTimeout(() => { showMessage(''); }, 2500); // ✨ Auto-clear error message
    }
  }

function showMessage(msg, isError = false) {
  const messageElement = document.getElementById('message');
  messageElement.innerText = msg;

  // Inline styling
  messageElement.style.fontSize = '30px';      // Large font size
  messageElement.style.fontWeight = 'bold';    // Bold text
  messageElement.style.color = isError ? 'red' : 'green'; // Red for error, green for success
  messageElement.style.margin = '10px 0';      // Some spacing
  messageElement.style.textAlign = 'center';   // Center aligned
}

  function prevQuestion() {
    if (currentIndex > 0) showQuestion(currentIndex - 1);
  }

  function submitTest() {
    clearInterval(timerInterval);
    let correct = 0, attempted = 0, obtainedMarks = 0;
    flag = -1;
    for (let i = 0; i < questions.length; i++) {
      if (userAnswers[i]) {
        attempted++;
        if (userAnswers[i] === questions[i][6]) {
          correct++;
          obtainedMarks += 2;  // or use maxMarks/totalQuestions logic if needed
        }
      }
    }

    const resultData = {
      username,
      testCode,
      maxMarks,
      obtainedMarks,
      totalQuestions: questions.length,
      attempted,
      correct,
      testTime: testDuration,
      timeTaken: testDuration * 60 - timeRemaining,
      totalIncorrectAttempts,
      flag
    };

    google.script.run
      .withSuccessHandler(showScoreBoard)
      .withFailureHandler(e => showMessage('Error saving result: ' + e.message, true))
      .submitTestResult(resultData);
  }

  function showScoreBoard(data) {
    if (!data || data.status !== 'success') {
      showMessage('Result submission error.', true);
      return;
    }

    document.getElementById('testArea').style.display = 'none';
    document.getElementById('scoreboard').style.display = 'block';

    document.getElementById('resultSummary').innerHTML = `
      <p>Result: ${data.result || 'N/A'}</p>
      <p>Max Marks: ${data.maxMarks ?? 0}</p>
      <p>Obtained Marks: ${data.obtainedMarks ?? 0}</p>
      <p>Total Questions: ${data.totalQuestions ?? 0}</p>
      <p>Attempted: ${data.attempted ?? 0}</p>
      <p>Correct Answers: ${data.correct ?? 0}</p>
      <p>Test Time: ${data.testTime ?? 0} minutes</p>
      <p>Time Taken: ${Math.floor(data.timeTaken / 60)}m ${data.timeTaken % 60}s</p>
      <p><strong>Total Incorrect Attempts: ${totalIncorrectAttempts}</strong></p>
      
    `;
    //showMessage('Test submitted successfully!');
  }

  // Expose public functions
  return {
    startTest,
    saveAndNext,
    prevQuestion,
    showQuestion,
    submitTest
  };
})();


// Disable copy/paste/select to protect content
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('keydown', e => {
  if ((e.ctrlKey && (e.key === 'c' || e.key === 'C'))) e.preventDefault();
});
document.addEventListener('copy', e => e.preventDefault());
document.addEventListener('selectstart', e => e.preventDefault());

<!------------------------------------------------------------------------------->
const LearnDigital = (() => {
  let questions = [];
  let currentIndex = 0;
  let userAnswers = [];

  // ✅ Message System
  function showMessage(msg, isError = false) {
    const msgDiv = document.getElementById('message');
    msgDiv.textContent = msg;
    msgDiv.style.color = isError ? 'red' : 'green';
    msgDiv.style.fontSize = '20px';
    msgDiv.style.fontWeight = 'bold';
    msgDiv.style.textAlign = 'center';
  }

  // ✅ Start Test with User Status Check (Old Logic)
  function startTest() {
    showMessage('Loading...');
    const username = currentUser.username;

    google.script.run
      .withSuccessHandler(onTestData)
      .withFailureHandler(e => showMessage('❌ Error: ' + e.message, true))
      .startTest(username, testCode); // 👈 Old backend logic
  }

  // ✅ On Receiving Data from Server
  function onTestData(data) {
    if (data.status === 'payment_pending') {
      showMessage('🛑 Payment pending. Please contact admin.', true);
      return;
    }

    if (data.status === 'ok') {
      questions = data.questions;
      userAnswers = new Array(questions.length).fill(null);
      currentIndex = 0;

      document.getElementById('learnDigitalArea').style.display = 'block';
      showMessage('');
      showQuestion(0);
    } else {
      showMessage('❌ Invalid access.', true);
    }
  }

  // ✅ Display Question
  function showQuestion(index) {
    if (index < 0 || index >= questions.length) return;

    currentIndex = index;
    const q = questions[index]; // q = [id, questionText, optA, optB, optC, optD, correct]

    document.getElementById('learnQNo').textContent = `Question ${index + 1} of ${questions.length}`;
    document.getElementById('learnQText').textContent = q[1];

    ['A', 'B', 'C', 'D'].forEach((opt, i) => {
      const span = document.getElementById('lOption' + opt);
      const input = document.getElementById('lInput' + opt);
      const label = input?.parentElement;

      if (span) span.textContent = q[i + 2];
      if (input) input.checked = (userAnswers[index] === opt);
      if (label) label.classList.remove('correct'); // remove old highlight
    });

    // Indicators
    let indicators = '';
    for (let i = 0; i < questions.length; i++) {
      let cls = (i === index) ? 'active' : (userAnswers[i] ? 'answered' : '');
      indicators += `<button class="${cls}" onclick="LearnDigital.showQuestion(${i})">${i + 1}</button>`;
    }
    document.getElementById('learnIndicators').innerHTML = indicators;
  }

  // ✅ Save & Next
  function saveAndNext() {
    const selected = document.querySelector('input[name="lOptions"]:checked');
    if (selected) {
      userAnswers[currentIndex] = selected.value;
    }
    if (currentIndex < questions.length - 1) {
      showQuestion(currentIndex + 1);
    }
  }

  // ✅ Previous
  function prevQuestion() {
    if (currentIndex > 0) {
      showQuestion(currentIndex - 1);
    }
  }

  // ✅ Show Correct Answer
  function showAnswer() {
    const correct = questions[currentIndex][6];
    const input = document.getElementById('lInput' + correct);
    if (input && input.parentElement) {
      input.parentElement.classList.add('correct');
    }
  }

function speakQuestion() {
  if (!questions || !questions[currentIndex]) return;

  const question = questions[currentIndex][1];
  const correctOption = questions[currentIndex][6];
  const optionMap = { A: 2, B: 3, C: 4, D: 5 };
  const answerText = questions[currentIndex][optionMap[correctOption]];

  const finalText = `${question}. इस प्रश्न का उत्तर है: ${answerText}`;

  const speakNow = (voice) => {
    const utterance = new SpeechSynthesisUtterance(finalText);
    utterance.lang = 'hi-IN';
    utterance.rate = 0.95;
    utterance.pitch = 1;
    if (voice) utterance.voice = voice;
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  };

  // Wait for voices to be loaded if not yet
  let voices = speechSynthesis.getVoices();
  if (voices.length === 0) {
    speechSynthesis.onvoiceschanged = () => {
      voices = speechSynthesis.getVoices();
      const hindiVoice = voices.find(v =>
        v.lang.includes('hi') || v.name.toLowerCase().includes('hindi') || v.name.toLowerCase().includes('india')
      );
      speakNow(hindiVoice);
    };
  } else {
    const hindiVoice = voices.find(v =>
      v.lang.includes('hi') || v.name.toLowerCase().includes('hindi') || v.name.toLowerCase().includes('india')
    );
    speakNow(hindiVoice);
  }
}




  function closeViewer() {
  document.getElementById('learnDigitalArea').style.display = 'none';
  document.getElementById('testArea').style.display = 'none';
  document.getElementById('learning-menu-container').style.display = 'block';
}

  return {
    startTest,
    showQuestion,
    saveAndNext,
    prevQuestion,
    showAnswer,
    speakQuestion,
    closeViewer
  };
})();

<!----------------------------------->
  function startRscitTest(testCode, message, mode) {
    document.getElementById('testArea').style.display = 'block';
    window.testCode = testCode;
    console.log(message);

    if(mode === 'exam'){
      prepareExamMode();
      startTest();
    } else if(mode === 'practice'){
      preparePracticeMode();
      PracticeTest.startTest();
    } else if (mode === 'LearnD') {
      prepareLearnDigitalMode();
      LearnDigital.startTest();
    }
  }

  function prepareExamMode() {
    document.querySelector('.exam-btns').style.display = 'flex';
    document.querySelector('.practice-btns').style.display = 'none';
    document.querySelector('.learndigital-btns').style.display = 'none';
  }

  function preparePracticeMode() {
    document.querySelector('.exam-btns').style.display = 'none';
    document.querySelector('.practice-btns').style.display = 'flex';
    document.querySelector('.learndigital-btns').style.display = 'none';
  }

  function prepareLearnDigitalMode() {
    document.querySelector('.exam-btns').style.display = 'none';
    document.querySelector('.practice-btns').style.display = 'none';
    document.querySelector('.learndigital-btns').style.display = 'flex';
  }

  function toggleConfirmBox(id) {
    document.getElementById(id).style.display = 'block';
  }
  function hideConfirmBox(id) {
    document.getElementById(id).style.display = 'none';
  }
  function goToHomeScreen() {
    document.getElementById('testArea').style.display = 'none';
  }
<script>
