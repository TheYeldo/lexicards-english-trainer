import {
  addCustomCard,
  categoriesFor,
  checkTranslation,
  createSession,
  currentCard,
  defaultCards,
  levelsFor,
  progressSummary,
  rateCurrentCard,
} from "./deck.mjs";

const STORAGE_KEY = "lexicards.customCards.v1";
const categoryLabels = {
  all: "все",
  daily: "быт",
  emotions: "эмоции",
  food: "еда",
  phrases: "фразы",
  travel: "путешествия",
  work: "работа",
  grammar: "связки",
  health: "здоровье",
  home: "дом",
  internet: "интернет",
  media: "медиа",
  money: "деньги",
  nature: "природа",
  phrasal: "phrasal",
  shopping: "покупки",
  social: "общение",
  study: "учеба",
  custom: "мои",
};
const modeProfiles = {
  sprint: {
    label: "спринт 12",
    limit: 12,
    repeatMisses: 1,
    shuffle: true,
    quiz: true,
  },
  full: {
    label: "полная колода",
    limit: null,
    repeatMisses: 1,
    shuffle: false,
    quiz: true,
  },
  hard: {
    label: "жесткий",
    limit: null,
    repeatMisses: 2,
    shuffle: true,
    quiz: false,
  },
};

let cards = loadCards();
let filters = { category: "all", level: "all", mode: "full" };
let session = createSession(cards, sessionOptions());
let flipped = false;
let lastResult = null;

const elements = {
  answeredStat: document.querySelector("#answeredStat"),
  knownStat: document.querySelector("#knownStat"),
  reviewStat: document.querySelector("#reviewStat"),
  streakStat: document.querySelector("#streakStat"),
  remainingStat: document.querySelector("#remainingStat"),
  categoryFilter: document.querySelector("#categoryFilter"),
  levelFilter: document.querySelector("#levelFilter"),
  modeFilter: document.querySelector("#modeFilter"),
  restartButton: document.querySelector("#restartButton"),
  progressFill: document.querySelector("#progressFill"),
  flashcard: document.querySelector("#flashcard"),
  cardCategory: document.querySelector("#cardCategory"),
  cardLevel: document.querySelector("#cardLevel"),
  currentWord: document.querySelector("#currentWord"),
  cardExample: document.querySelector("#cardExample"),
  cardTranslation: document.querySelector("#cardTranslation"),
  cardExampleTranslation: document.querySelector("#cardExampleTranslation"),
  answerCount: document.querySelector("#answerCount"),
  answerForm: document.querySelector("#answerForm"),
  answerInput: document.querySelector("#answerInput"),
  resultLine: document.querySelector("#resultLine"),
  againButton: document.querySelector("#againButton"),
  flipButton: document.querySelector("#flipButton"),
  knownButton: document.querySelector("#knownButton"),
  speakButton: document.querySelector("#speakButton"),
  quizRow: document.querySelector("#quizRow"),
  queueList: document.querySelector("#queueList"),
  customCardForm: document.querySelector("#customCardForm"),
};

renderFilterOptions();
bindEvents();
render();

function bindEvents() {
  elements.categoryFilter.addEventListener("change", () => {
    filters = { ...filters, category: elements.categoryFilter.value };
    resetSession();
  });

  elements.levelFilter.addEventListener("change", () => {
    filters = { ...filters, level: elements.levelFilter.value };
    resetSession();
  });

  elements.modeFilter.addEventListener("change", () => {
    filters = { ...filters, mode: elements.modeFilter.value };
    resetSession();
  });

  elements.restartButton.addEventListener("click", resetSession);
  elements.flashcard.addEventListener("click", toggleCard);
  elements.flipButton.addEventListener("click", toggleCard);
  elements.againButton.addEventListener("click", () => rateAndRender("again"));
  elements.knownButton.addEventListener("click", () => rateAndRender("known"));
  elements.speakButton.addEventListener("click", speakCurrentWord);
  elements.answerForm.addEventListener("submit", handleAnswerSubmit);
  elements.quizRow.addEventListener("click", handleQuizClick);
  elements.customCardForm.addEventListener("submit", handleCustomCardSubmit);

  document.addEventListener("keydown", (event) => {
    if (event.target.matches("input, select, textarea")) {
      return;
    }

    if (event.code === "Space") {
      event.preventDefault();
      toggleCard();
    } else if (event.code === "ArrowLeft") {
      rateAndRender("again");
    } else if (event.code === "ArrowRight") {
      rateAndRender("known");
    }
  });
}

function handleAnswerSubmit(event) {
  event.preventDefault();
  const card = currentCard(session);
  if (!card) {
    return;
  }

  lastResult = checkTranslation(card, elements.answerInput.value);
  flipped = true;
  render();
}

function handleQuizClick(event) {
  const button = event.target.closest("button[data-answer]");
  const card = currentCard(session);
  if (!button || !card) {
    return;
  }

  elements.answerInput.value = button.dataset.answer;
  lastResult = checkTranslation(card, button.dataset.answer);
  flipped = true;
  render();
}

function handleCustomCardSubmit(event) {
  event.preventDefault();
  const formData = new FormData(elements.customCardForm);
  const draft = Object.fromEntries(formData.entries());

  cards = addCustomCard(cards, draft);
  saveCustomCards(cards);
  filters = {
    category: draft.category?.trim() || "custom",
    level: draft.level || "all",
    mode: filters.mode,
  };

  renderFilterOptions();
  resetSession();
  elements.customCardForm.reset();
  elements.customCardForm.elements.category.value = "custom";
}

function rateAndRender(rating) {
  if (!currentCard(session)) {
    return;
  }

  session = rateCurrentCard(session, rating);
  flipped = false;
  lastResult = null;
  elements.answerInput.value = "";
  render();
}

function toggleCard() {
  if (!currentCard(session)) {
    return;
  }

  flipped = !flipped;
  render();
}

function resetSession() {
  session = createSession(cards, sessionOptions());
  flipped = false;
  lastResult = null;
  elements.answerInput.value = "";
  render();
}

function render() {
  const card = currentCard(session);
  const summary = progressSummary(session);
  const mode = modeProfiles[filters.mode] ?? modeProfiles.full;

  elements.answeredStat.textContent = summary.answered;
  elements.knownStat.textContent = summary.known;
  elements.reviewStat.textContent = summary.needsReview;
  elements.streakStat.textContent = summary.streak;
  elements.remainingStat.textContent = summary.remaining;
  elements.progressFill.style.width = `${summary.total ? Math.round((summary.known / summary.total) * 100) : 0}%`;
  elements.flashcard.classList.toggle("is-flipped", flipped);
  elements.answerInput.placeholder = mode.quiz ? "введи перевод" : "жесткий режим: только ввод";

  if (!card) {
    renderEmptyState();
    renderQueue();
    return;
  }

  elements.cardCategory.textContent = labelCategory(card.category);
  elements.cardLevel.textContent = card.level;
  elements.currentWord.textContent = card.word;
  elements.cardExample.textContent = card.example || "Write your own example after you learn it.";
  elements.cardTranslation.textContent = card.translation;
  elements.cardExampleTranslation.textContent = card.exampleTranslation || "";
  elements.answerCount.textContent = `${1 + (card.answers?.length ?? 0)} ${wordForm(1 + (card.answers?.length ?? 0), "вариант", "варианта", "вариантов")}`;

  elements.answerInput.disabled = false;
  elements.againButton.disabled = false;
  elements.flipButton.disabled = false;
  elements.knownButton.disabled = false;
  elements.speakButton.disabled = false;

  renderResult();
  renderQuiz(card);
  renderQueue();
}

function renderEmptyState() {
  elements.cardCategory.textContent = "finish";
  elements.cardLevel.textContent = "✓";
  elements.currentWord.textContent = "Серия закрыта";
  elements.cardExample.textContent = "Перезапусти тренировку или добавь новую карточку.";
  elements.cardTranslation.textContent = "Готово";
  elements.cardExampleTranslation.textContent = "";
  elements.answerCount.textContent = "0 вариантов";
  elements.resultLine.textContent = "Все карточки из текущего фильтра прошли очередь.";
  elements.resultLine.className = "result-line good";
  elements.quizRow.innerHTML = "";

  elements.answerInput.disabled = true;
  elements.againButton.disabled = true;
  elements.flipButton.disabled = true;
  elements.knownButton.disabled = true;
  elements.speakButton.disabled = true;
}

function renderResult() {
  elements.resultLine.className = "result-line";
  if (!lastResult) {
    elements.resultLine.textContent = "";
    return;
  }

  if (lastResult.correct) {
    elements.resultLine.textContent = `Верно: ${lastResult.matched}`;
    elements.resultLine.classList.add("good");
  } else {
    elements.resultLine.textContent = `Пока нет: ${lastResult.expected}`;
    elements.resultLine.classList.add("bad");
  }
}

function renderQuiz(card) {
  const mode = modeProfiles[filters.mode] ?? modeProfiles.full;
  if (!mode.quiz) {
    elements.quizRow.innerHTML = `
      <p class="hard-mode-note">
        Варианты скрыты. Ошибка вернет карточку дважды, так что тут уже без прогулки.
      </p>
    `;
    return;
  }

  const choices = buildChoices(card);
  elements.quizRow.innerHTML = choices
    .map((choice) => `<button type="button" data-answer="${escapeHtml(choice)}">${escapeHtml(choice)}</button>`)
    .join("");
}

function renderQueue() {
  const rows = session.order.slice(session.index, session.index + 5).map((id) => {
    const card = session.cards.find((item) => item.id === id);
    if (!card) {
      return "";
    }
    return `
      <div class="queue-item">
        <strong>${escapeHtml(card.word)}</strong>
        <span>${escapeHtml(labelCategory(card.category))}</span>
      </div>
    `;
  });

  elements.queueList.innerHTML = rows.join("") || `
    <div class="queue-item">
      <strong>Пусто</strong>
      <span>смени фильтр</span>
    </div>
  `;
}

function renderFilterOptions() {
  fillSelect(elements.categoryFilter, categoriesFor(cards), labelCategory, filters.category);
  fillSelect(elements.levelFilter, levelsFor(cards), (level) => (level === "all" ? "все" : level), filters.level);
  fillSelect(elements.modeFilter, Object.keys(modeProfiles), (mode) => modeProfiles[mode].label, filters.mode);
}

function sessionOptions() {
  const mode = modeProfiles[filters.mode] ?? modeProfiles.full;
  const seed = `${filters.mode}:${filters.category}:${filters.level}:${new Date().toISOString().slice(0, 10)}`;

  return {
    category: filters.category,
    level: filters.level,
    limit: mode.limit,
    mode: filters.mode,
    repeatMisses: mode.repeatMisses,
    shuffleSeed: mode.shuffle ? seed : null,
  };
}

function fillSelect(select, values, labeler, selectedValue) {
  select.innerHTML = values
    .map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(labeler(value))}</option>`)
    .join("");
  select.value = values.includes(selectedValue) ? selectedValue : "all";
}

function buildChoices(card) {
  const seed = hashString(`${card.id}:${session.answered}`);
  const distractors = cards
    .filter((item) => item.id !== card.id)
    .map((item) => item.translation)
    .sort((left, right) => hashString(`${left}:${seed}`) - hashString(`${right}:${seed}`))
    .slice(0, 2);

  return seededShuffle([...new Set([card.translation, ...distractors])], seed);
}

function speakCurrentWord() {
  const card = currentCard(session);
  if (!card || !("speechSynthesis" in window)) {
    return;
  }

  const utterance = new SpeechSynthesisUtterance(card.word);
  utterance.lang = "en-US";
  utterance.rate = 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function loadCards() {
  return [...defaultCards, ...loadCustomCards()];
}

function loadCustomCards() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((card) => card.word && card.translation) : [];
  } catch {
    return [];
  }
}

function saveCustomCards(allCards) {
  const customCards = allCards.filter((card) => card.id.startsWith("custom-"));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customCards));
}

function labelCategory(category) {
  return categoryLabels[category] ?? category;
}

function wordForm(value, one, few, many) {
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return one;
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return few;
  }
  return many;
}

function seededShuffle(items, seed) {
  return [...items].sort((left, right) => hashString(`${left}:${seed}`) - hashString(`${right}:${seed}`));
}

function hashString(value) {
  return String(value)
    .split("")
    .reduce((hash, character) => {
      return (hash * 31 + character.charCodeAt(0)) >>> 0;
    }, 7);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
