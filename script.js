// DOM Elements
const selectionView = document.getElementById('selection-view');
const quizView = document.getElementById('quiz-view');
const professorsList = document.getElementById('professors-list');
const resetBtn = document.getElementById('reset-btn');
const questionsContainer = document.getElementById('questions-container');
const courseTitle = document.getElementById('course-title');
const retryBtn = document.getElementById('retry-btn');
const scoreDisplay = document.getElementById('score-display');

// State
let currentQuestions = [];
let currentCourseData = null;
let currentScore = 0;
let answeredCount = 0;

// Initialize
init();

async function init() {
    loadStructureFromStaticData();

    resetBtn.addEventListener('click', () => {
        showSelectionView();
    });

    retryBtn.addEventListener('click', () => {
        if (currentCourseData) startQuiz(currentCourseData);
    });
}

function showSelectionView() {
    selectionView.classList.remove('hidden');
    quizView.classList.add('hidden');
    resetBtn.classList.add('hidden');
    window.scrollTo(0, 0);
}

function showQuizView() {
    selectionView.classList.add('hidden');
    quizView.classList.remove('hidden');
    resetBtn.classList.remove('hidden');
    window.scrollTo(0, 0);
}

function loadStructureFromStaticData() {
    const structure = {};

    // Iterate over all global variables to find DATA_*
    Object.keys(window).forEach(key => {
        if (key.startsWith('DATA_')) {
            const data = window[key];
            if (data && data.professor && data.courses) {
                const profName = data.professor;
                // Map courses to their IDs (filenames)
                structure[profName] = data.courses.map(c => c.id);
            }
        }
    });

    renderSelection(structure);
}

function renderSelection(structure) {
    professorsList.innerHTML = '';

    // Sort professors alphabetically
    const sortedProfessors = Object.keys(structure).sort();

    if (sortedProfessors.length === 0) {
        professorsList.innerHTML = '<p class="error">Aucune donnée chargée. Vérifiez les fichiers JS dans public/data.</p>';
        return;
    }

    for (const prof of sortedProfessors) {
        const courses = structure[prof];
        const card = document.createElement('div');
        card.className = 'prof-card';

        let coursesHtml = courses.map(courseId => {
            // Find the course title if possible, or use the ID
            const profKey = Object.keys(window).find(k => window[k]?.professor === prof);
            const courseData = window[profKey]?.courses.find(c => c.id === courseId);
            const displayName = courseData?.title || courseId.replace('.txt', '');

            return `
            <li class="course-item" onclick="loadCourse('${prof}', '${courseId}')">
                <span class="course-name">${displayName}</span>
                <span class="arrow">→</span>
            </li>
        `}).join('');

        if (courses.length === 0) coursesHtml = '<li style="color:#94a3b8; font-style:italic; padding:10px;">Aucun cours disponible</li>';

        card.innerHTML = `
            <div class="prof-name">
                <div class="prof-icon">${prof.charAt(0).toUpperCase()}</div>
                ${prof}
            </div>
            <ul class="course-list">
                ${coursesHtml}
            </ul>
        `;

        professorsList.appendChild(card);
    }
}

window.loadCourse = (prof, courseId) => {
    console.log(`Loading course: ${prof} - ${courseId}`);

    // Find the data object
    const profKey = Object.keys(window).find(k => window[k]?.professor === prof);
    const staticData = window[profKey];

    if (staticData) {
        const courseData = staticData.courses.find(c => c.id === courseId);
        if (courseData) {
            currentCourseData = courseData;
            startQuiz(courseData);
            return;
        }
    }

    alert("Impossible de charger le cours sélectionné.");
    console.error(`Course not found for ${prof} / ${courseId}`);
};

function startQuiz(data) {
    courseTitle.textContent = data.title || "QCM";
    const allQuestions = data.questions;

    // Randomize and pick 20
    const shuffled = allQuestions.sort(() => 0.5 - Math.random());
    currentQuestions = shuffled.slice(0, 20);

    currentScore = 0;
    answeredCount = 0;
    updateStats();

    renderQuestions(currentQuestions);
    showQuizView();
}

function renderQuestions(questions) {
    questionsContainer.innerHTML = '';

    questions.forEach((q, index) => {
        const qEl = document.createElement('div');
        qEl.className = 'question-card';

        // Options HTML
        const optionsHtml = q.options.map((opt) => {
            // Extract letter (A, B, C, D)
            const letterMatch = opt.match(/^([A-Z])\./);
            const letter = letterMatch ? letterMatch[1] : '?';
            const text = opt.replace(/^[A-Z]\.\s*/, '');

            return `
                <button class="option-btn" data-letter="${letter}" onclick="handleAnswer(${index}, '${letter}', this)">
                    <strong>${letter}.</strong> ${text}
                </button>
            `;
        }).join('');

        qEl.innerHTML = `
            <div class="q-text"><span style="color:var(--primary); font-weight:bold;">${index + 1}.</span> ${q.text.replace(/^\d+\.\s*/, '')}</div>
            <div class="options-group" id="q-options-${index}">
                ${optionsHtml}
            </div>
            <div class="justification" id="q-just-${index}">
                <strong>Réponse : ${q.answer}</strong><br>
                ${q.justification || ''}
            </div>
        `;

        questionsContainer.appendChild(qEl);
    });
}

window.handleAnswer = (qIndex, selectedLetter, btnElement) => {
    // Prevent multiple answers
    const container = document.getElementById(`q-options-${qIndex}`);
    if (container.classList.contains('answered')) return;

    container.classList.add('answered');

    const question = currentQuestions[qIndex];
    const isCorrect = selectedLetter === question.answer;

    // Visual feedback for selected button
    if (isCorrect) {
        btnElement.classList.add('correct');
        currentScore++;
    } else {
        btnElement.classList.add('wrong');
        // Highlight correct one
        const buttons = container.querySelectorAll('.option-btn');
        buttons.forEach(btn => {
            if (btn.dataset.letter === question.answer) {
                btn.classList.add('correct');
            }
        });
    }

    // Disable all buttons
    const buttons = container.querySelectorAll('.option-btn');
    buttons.forEach(b => b.disabled = true);

    // Show justification
    const justEl = document.getElementById(`q-just-${qIndex}`);
    justEl.classList.add('visible');

    answeredCount++;
    updateStats();
};

function updateStats() {
    scoreDisplay.textContent = `Score: ${currentScore}/${currentQuestions.length}`;
}
