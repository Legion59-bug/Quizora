// Because we imported data.js first, the global variable `quizzes` is perfectly decoupled from our logic.
let currentQuiz = [];
let current = 0;
let score = 0;
let currentGenre = "";
let timerInterval;
const TIME_LIMIT = 15;

const genreMeta = {
  Technical: { icon: "fa-solid fa-laptop", color: "var(--tech-color)", bg: "var(--tech-bg)", desc: "Technology, Programming and more" },
  Sports: { icon: "fa-regular fa-futbol", color: "var(--sports-color)", bg: "var(--sports-bg)", desc: "Football, Cricket, Tennis and more" },
  Geographical: { icon: "fa-solid fa-globe", color: "var(--geo-color)", bg: "var(--geo-bg)", desc: "Countries, Capitals, Rivers and more" }
};

// Theme toggling
function toggleTheme() {
  document.body.classList.toggle('dark-mode');
  const icon = document.getElementById('theme-icon');
  if (document.body.classList.contains('dark-mode')) {
    icon.classList.remove('fa-sun');
    icon.classList.add('fa-moon');
  } else {
    icon.classList.remove('fa-moon');
    icon.classList.add('fa-sun');
  }
}

// Announcements to Screen Readers
function announceA11y(message) {
  const announcer = document.getElementById("a11y-announcer");
  if (announcer) {
    announcer.innerText = message;
  }
}

// Ensure init StartScreen is run instantly
document.addEventListener("DOMContentLoaded", () => {
  initStartScreen();
});

function initStartScreen() {
  const genresDiv = document.getElementById("genres-container");
  genresDiv.innerHTML = "";
  
  if (typeof quizzes === 'undefined') {
    announceA11y("Error: Data failed to load.");
    return;
  }

  Object.keys(quizzes).forEach((genre) => {
    const meta = genreMeta[genre] || { icon: "fa-solid fa-star", color: "var(--tech-color)", bg: "var(--tech-bg)", desc: "General knowledge" };
    
    // Creating the card
    const card = document.createElement("button");
    card.classList.add("genre-card");
    card.setAttribute("aria-label", `Start ${genre} Quiz`);
    card.style.backgroundColor = meta.bg;
    
    card.innerHTML = `
      <div class="card-icon" style="color: ${meta.color};">
        <i class="${meta.icon}"></i>
      </div>
      <h3>${genre}</h3>
      <p>${meta.desc}</p>
      <div class="card-btn" style="background-color: ${meta.color};">Start Quiz</div>
    `;
    
    card.onclick = () => startQuiz(genre);
    genresDiv.appendChild(card);
  });
}

function startQuiz(genre) {
  currentGenre = genre;
  
  // Clone and shuffle
  currentQuiz = [...quizzes[genre]].sort(() => Math.random() - 0.5);
  current = 0;
  score = 0;

  document.getElementById("start-screen").classList.add("hidden");
  document.getElementById("quiz-screen").classList.remove("hidden");
  
  announceA11y(`Starting ${genre} quiz.`);
  
  loadQuestion();
}

function updateProgressUI() {
  const progressPercent = (current / currentQuiz.length) * 100;
  document.getElementById("progress-bar").style.width = `${progressPercent}%`;
  document.getElementById("progress-text").innerText = `Question ${current + 1} of ${currentQuiz.length}`;
}

function loadQuestion() {
  const q = currentQuiz[current];

  // Refresh animations cleanly
  const contentDiv = document.getElementById("quiz-content");
  contentDiv.style.animation = 'none';
  contentDiv.offsetHeight; 
  contentDiv.style.animation = null;

  document.getElementById("question").innerText = q.question;
  announceA11y(`Question ${current + 1}: ${q.question}`);

  updateProgressUI();

  const answersDiv = document.getElementById("answers");
  answersDiv.innerHTML = "";

  q.answers.forEach((ans, index) => {
    const btn = document.createElement("button");
    btn.innerText = ans;
    btn.classList.add("option-btn");
    btn.onclick = () => selectAnswer(btn, index, q.correct);
    answersDiv.appendChild(btn);
  });

  setTimeout(() => {
    const firstOption = answersDiv.querySelector('.option-btn');
    if (firstOption) firstOption.focus();
  }, 50);

  startTimer(q.correct);
}

function startTimer(correctIndex) {
  clearInterval(timerInterval);
  let timeLeft = TIME_LIMIT;
  const timerDiv = document.getElementById("timer");
  timerDiv.innerText = `${timeLeft}s`;
  timerDiv.classList.remove("danger");

  timerInterval = setInterval(() => {
    timeLeft--;
    timerDiv.innerText = `${timeLeft}s`;

    if (timeLeft === 5) {
      timerDiv.classList.add("danger");
      announceA11y("Five seconds remaining!");
    } else if (timeLeft <= 0) {
      clearInterval(timerInterval);
      handleTimeOut(correctIndex);
    }
  }, 1000);
}

function handleTimeOut(correctIndex) {
  announceA11y("Time's up!");
  
  const allBtns = document.getElementById("answers").querySelectorAll(".option-btn");
  allBtns.forEach(b => b.disabled = true);

  allBtns[correctIndex].classList.add("correct");
  
  current++;
  updateProgressUI();
  current--; 

  setTimeout(() => {
    nextQuestion();
  }, 1200);
}

function selectAnswer(btn, selectedIndex, correctIndex) {
  clearInterval(timerInterval); 

  const allBtns = document.getElementById("answers").querySelectorAll(".option-btn");
  allBtns.forEach(b => b.disabled = true);

  if (selectedIndex === correctIndex) {
    btn.classList.add("correct");
    announceA11y("Correct!");
    score++;
  } else {
    btn.classList.add("wrong");
    allBtns[correctIndex].classList.add("correct");
    announceA11y("Incorrect.");
  }
  
  current++;
  updateProgressUI();
  current--;

  setTimeout(() => {
    nextQuestion();
  }, 1200);
}

function nextQuestion() {
  current++;
  if (current < currentQuiz.length) {
    loadQuestion();
  } else {
    showResults();
  }
}

function getFeedbackString(scoreVar, totalVar) {
  const percentage = (scoreVar / totalVar) * 100;
  if (percentage === 100) return "Flawless Victory! 🌟";
  if (percentage >= 80) return "Great Job! 🎉";
  if (percentage >= 50) return "Well Done! 👍";
  return "Keep Practicing! 💪";
}

function showResults() {
  document.getElementById("progress-bar").style.width = `100%`;

  document.getElementById("quiz-screen").classList.add("hidden");
  document.getElementById("result-screen").classList.remove("hidden");

  document.getElementById("final-score").innerText = score;
  document.getElementById("total-questions").innerText = currentQuiz.length;

  const feedbackText = getFeedbackString(score, currentQuiz.length);
  document.getElementById("score-feedback").innerText = feedbackText;
  announceA11y(`Quiz complete. You scored ${score} out of ${currentQuiz.length}. ${feedbackText}`);
  
  const storageKey = `quiz_highscore_${currentGenre}`;
  let highScore = localStorage.getItem(storageKey) || 0;
  
  if (score > highScore) {
      highScore = score;
      localStorage.setItem(storageKey, highScore);
  }
  document.getElementById("high-score").innerText = highScore;

  if (score > 0 && typeof confetti === 'function') {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#10b981', '#f97316', '#a78bfa']
    });
  }
  
  setTimeout(() => {
    document.getElementById("restart-btn").focus();
  }, 100);
}

// About Modal Logic
function openAboutModal() {
  const modal = document.getElementById("about-modal");
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  // Close when clicking outside modal content
  modal.onclick = (e) => {
    if (e.target === modal) {
      closeAboutModal();
    }
  };
  announceA11y("Opened About the Maker modal.");
}

function closeAboutModal() {
  const modal = document.getElementById("about-modal");
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
  announceA11y("Closed About the Maker modal.");
}