<script>
let currentTestCode = '';
let currentMode = '';
let currentUsername = '';

function startRscitTest(testCode, loadingMessage, selectedMode, username) {
  currentTestCode = testCode;
  currentMode = selectedMode;
  currentUsername = username;

  // Hide book chapter selection area (aapka <main>)
  document.querySelector('main').style.display = 'none';

  // Show loading message in blue
  showMessage(loadingMessage, 'blue');

  // Call mode specific preparations & start
  if (selectedMode === 'exam') {
    prepareExamMode();
    startTest();
  } else if (selectedMode === 'practice') {
    preparePracticeMode();
    PracticeTest.startTest();
  } else if (selectedMode === 'LearnD') {
    prepareLearnDigitalMode();
    LearnDigital.startTest();
  }
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

function prepareExamMode() {
  // Show test container, hide Learn Digital container
  document.getElementById('testArea').style.display = 'block';
  document.getElementById('learnDigitalArea').style.display = 'none';

  // Show exam buttons, hide others (add your logic)
}

function preparePracticeMode() {
  // Similar logic for practice mode
}

function prepareLearnDigitalMode() {
  // Show Learn Digital container, hide test container
}

function startTest() {
  google.script.run.withSuccessHandler(handleQuestions).startTest(currentUsername, currentTestCode);
}

function handleQuestions(response) {
  if (response.status === 'payment_pending') {
    showMessage("Payment pending. Please complete payment to start test.", 'red');
    // Payment flow ya redirect karein
  } else if (response.status === 'ok') {
    loadQuestions(response.questions);
    startTimer(response.testDuration);
  }
}

   
<script>

