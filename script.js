// script.js
import chapters from './chapters/chapters.js';

// Use the chapters object as needed

let currentQuestions = [];
let currentQuestionIndex = 0;
let userAnswers = [];
let skippedQuestions = [];
let time = 0;
let timerInterval;
let resultChart;

document.addEventListener("DOMContentLoaded", () => {
  const chaptersGrid = document.getElementById("chaptersGrid");
  Object.keys(chapters).forEach(chapter => {
    const button = document.createElement("button");
    button.className = "chapter-btn";
    button.textContent = chapter;
    // Inline event handler for chapter button
    button.onclick = () => startChapter(chapter);
    chaptersGrid.appendChild(button);
  });

  document.getElementById("helpOption").addEventListener("click", () => {
    window.location.href = "help.html";
  });

  // Redirect to about.html when "About" is clicked
  document.getElementById("aboutOption").addEventListener("click", () => {
    window.location.href = "about.html";
  });
});

function startChapter(chapterName) {
  document.getElementById("homeScreen").style.display = "none";
  document.getElementById("examContainer").style.display = "block";
  document.getElementById("preExamScreen").style.display = "block";
  document.getElementById("examContent").style.display = "none";
  document.getElementById("resultContainer").style.display = "none";
  
  clearInterval(timerInterval);
  document.querySelector(".question-container").style.display = "block";
  document.querySelector(".navigation-buttons").style.display = "flex";
  
  currentQuestions = chapters[chapterName];
  currentQuestionIndex = 0;
  userAnswers = Array(currentQuestions.length).fill(null);
  skippedQuestions = [];
  time = currentQuestions.length * 60;

  document.getElementById("paperTitle").textContent = `CHAPTER: ${chapterName}`;
  document.getElementById("totalQuestions").textContent = currentQuestions.length;
  document.getElementById("maxScore").textContent = currentQuestions.length;
  document.getElementById("progressBar").style.width = "0%";
  
  if (resultChart) {
    resultChart.destroy();
  }
}

function startExam() {
  const agreeCheckbox = document.getElementById("agreeCheckbox");
  if (!agreeCheckbox.checked) {
    alert("Please confirm that you have read and agree to the exam instructions.");
    return;
  }
  document.getElementById("preExamScreen").style.display = "none";
  document.getElementById("examContent").style.display = "block";
  clearInterval(timerInterval);
  timerInterval = setInterval(updateTimer, 1000);
  updateStatus();
  loadQuestion(currentQuestionIndex);
}

function backToHome() {
  clearInterval(timerInterval);
  document.getElementById("examContainer").style.display = "none";
  document.getElementById("homeScreen").style.display = "flex";
  document.getElementById("agreeCheckbox").checked = false;
}

function showHomeScreen() {
  clearInterval(timerInterval);
  document.getElementById("examContainer").style.display = "none";
  document.getElementById("homeScreen").style.display = "flex";
}

function updateTimer() {
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  document.getElementById("time").textContent =
    `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  if (time <= 0) {
    finishExam();
  }
  time--;
}

function loadQuestion(index) {
  const container = document.getElementById("questionContainer");
  const question = currentQuestions[index];
  let html = `<div class="question-text">Q${index + 1}. ${question.question}</div>`;
  question.options.forEach((option, i) => {
    html += `
      <label class="option ${userAnswers[index] === i ? "selected" : ""}">
        <input type="radio" name="answer" value="${i}" ${userAnswers[index] === i ? "checked" : ""}>
        <span class="checkmark"></span>
        ${option}
      </label>
    `;
  });
  container.innerHTML = html;
  document.querySelectorAll(".option input").forEach(radio => {
    radio.addEventListener("change", (e) => {
      document.querySelectorAll(".option").forEach(opt => opt.classList.remove("selected"));
      e.target.parentElement.classList.add("selected");
    });
  });
}

function saveAndNext() {
  const selectedOption = document.querySelector('input[name="answer"]:checked');
  if (selectedOption) {
    userAnswers[currentQuestionIndex] = parseInt(selectedOption.value);
    updateStatus();
    nextQuestion();
  }
}

function skipQuestion() {
  if (!skippedQuestions.includes(currentQuestionIndex)) {
    skippedQuestions.push(currentQuestionIndex);
    updateStatus();
  }
  nextQuestion();
}

function updateStatus() {
  const attempted = userAnswers.filter(a => a !== null).length;
  const queue = skippedQuestions.length;
  document.getElementById("attempted").textContent = attempted;
  document.getElementById("queue").textContent = queue;
  updateProgressBar(attempted, currentQuestions.length);
}

function updateProgressBar(attempted, total) {
  const progressPercentage = total ? (attempted / total) * 100 : 0;
  document.getElementById("progressBar").style.width = progressPercentage + "%";
}

function nextQuestion() {
  let nextIndex = currentQuestionIndex + 1;
  while (nextIndex < currentQuestions.length &&
         (userAnswers[nextIndex] !== null || skippedQuestions.includes(nextIndex))) {
    nextIndex++;
  }
  if (nextIndex >= currentQuestions.length) {
    if (skippedQuestions.length > 0) {
      currentQuestionIndex = skippedQuestions.shift();
    } else {
      finishExam();
      return;
    }
  } else {
    currentQuestionIndex = nextIndex;
  }
  loadQuestion(currentQuestionIndex);
}

function finishExam() {
  clearInterval(timerInterval);
  document.querySelector(".question-container").style.display = "none";
  document.querySelector(".navigation-buttons").style.display = "none";
  const resultContainer = document.getElementById("resultContainer");
  resultContainer.style.display = "block";
  
  // Calculate score based on correct answers
  const score = userAnswers.reduce((acc, answer, index) =>
    answer === currentQuestions[index].correct ? acc + 1 : acc, 0);
  
  // Update review section for incorrect answers
  let reviewHtml = "<h3>Incorrect Questions:</h3>";
  const incorrectQuestions = currentQuestions.map((q, idx) => ({ q, idx }))
    .filter(({ q, idx }) =>
      userAnswers[idx] !== q.correct || userAnswers[idx] === null
    );
  if (incorrectQuestions.length === 0) {
    reviewHtml += `<p>All answers are correct! Well done!</p>`;
  } else {
    incorrectQuestions.forEach(({ q, idx }) => {
      reviewHtml += `
        <div class="question-review">
          <p><strong>Q${idx + 1}:</strong> ${q.question}</p>
          <p>Your answer: ${userAnswers[idx] !== null ? q.options[userAnswers[idx]] : "Skipped"}</p>
          <p>Correct answer: ${q.options[q.correct]}</p>
        </div>
      `;
    });
  }
  document.getElementById("review").innerHTML = reviewHtml;
  
  // Render chart using Chart.js (if available)
  renderResultChart(score, currentQuestions.length - score);
  
  // Update the result screen with pass/fail
  showResult(score, currentQuestions.length);
}

function renderResultChart(correct, incorrect) {
  // Check if Chart.js is available. This helps offline if Chart.js is not loaded.
  if (typeof Chart === "undefined") {
    console.warn("Chart.js library is not loaded. Skipping chart rendering.");
    return;
  }
  
  const ctx = document.getElementById("resultChart").getContext("2d");
  if (resultChart) {
    resultChart.destroy();
  }
  resultChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Correct', 'Incorrect'],
      datasets: [{
        data: [correct, incorrect],
        backgroundColor: ['#6ddc9c', '#e74c3c']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
        title: { display: true, text: 'Exam Performance' }
      }
    }
  });
}

function showResult(score, maxScore) {
  const resultContainer = document.getElementById('resultContainer');
  const scoreSpan = document.getElementById('score');
  const maxScoreSpan = document.getElementById('maxScore');
  const resultTitle = document.getElementById('resultTitle');
  const resultStatus = document.getElementById('resultStatus');
  const resultImage = document.getElementById('resultImage');

  // Set the score values
  scoreSpan.textContent = score;
  maxScoreSpan.textContent = maxScore;

  // Calculate pass/fail ratio
  const passRatio = 0.5;
  const userRatio = score / maxScore;

  // Determine pass or fail using a variable
  const passFail = (userRatio >= passRatio) ? "pass" : "fail";

  // Update the result based on passFail value
  if (passFail === "pass") {
    resultTitle.textContent = 'Congratulations! You have passed the test.';
    resultStatus.textContent = 'PASS';
    resultStatus.style.color = '#abebc6'; // green text for pass
    resultImage.src = 'assets/flower.png';
  } else {
    resultTitle.textContent = 'Sorry, you have failed.';
    resultStatus.textContent = 'FAIL';
    resultStatus.style.color = '#ff4c4c'; // red text for fail
    resultImage.src = 'assets/fail.png';
  }

  // Ensure the result container is visible
  resultContainer.style.display = 'block';
}

// Expose functions to the global scope so that inline HTML event handlers can access them
window.startChapter = startChapter;
window.startExam = startExam;
window.backToHome = backToHome;
window.showHomeScreen = showHomeScreen;
window.saveAndNext = saveAndNext;
window.skipQuestion = skipQuestion;
