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

const STORAGE_KEYS = {
  custom: "lexicards.customCards.v2",
  legacyCustom: "lexicards.customCards.v1",
  learning: "lexicards.learning.v2",
  activity: "lexicards.activity.v2",
  preferences: "lexicards.preferences.v2",
};

const categoryLabels = {
  all: "все темы",
  career: "карьера",
  city: "город",
  communication: "общение",
  culture: "культура",
  custom: "мои",
  daily: "быт",
  emotions: "эмоции",
  emergency: "безопасность",
  food: "еда",
  grammar: "связки",
  health: "здоровье",
  home: "дом",
  internet: "интернет",
  media: "медиа",
  money: "деньги",
  nature: "природа",
  phrasal: "phrasal verbs",
  phrases: "фразы",
  shopping: "покупки",
  social: "отношения",
  study: "учеба",
  technology: "технологии",
  time: "время",
  transport: "транспорт",
  travel: "путешествия",
  work: "работа",
};

const modeProfiles = {
  smart: {
    label: "умная сессия · 20",
    title: "Продолжаем английский",
    description: "Новые слова вперемешку с теми, которые пора повторить.",
    limit: 20,
    repeatMisses: 1,
    shuffle: false,
    quiz: true,
  },
  sprint: {
    label: "быстрый спринт · 10",
    title: "Короткий спринт",
    description: "Десять случайных карточек для быстрого разогрева.",
    limit: 10,
    repeatMisses: 1,
    shuffle: true,
    quiz: true,
  },
  review: {
    label: "работа над ошибками",
    title: "Закрываем пробелы",
    description: "Только слова, на которых раньше были ошибки или низкая уверенность.",
    limit: null,
    repeatMisses: 2,
    shuffle: true,
    quiz: true,
  },
  favorites: {
    label: "избранное",
    title: "Личная подборка",
    description: "Карточки, которые вы отметили звездой.",
    limit: null,
    repeatMisses: 1,
    shuffle: true,
    quiz: true,
  },
  full: {
    label: "вся колода",
    title: "Большая тренировка",
    description: "Все подходящие карточки без ограничения по количеству.",
    limit: null,
    repeatMisses: 1,
    shuffle: false,
    quiz: true,
  },
  hard: {
    label: "без подсказок",
    title: "Сложный режим",
    description: "Только ручной ввод, а ошибки возвращаются в очередь дважды.",
    limit: 30,
    repeatMisses: 2,
    shuffle: true,
    quiz: false,
  },
};

const lessons = [
  {
    title: "A, an или the",
    level: "A1-A2",
    text: "A/an вводит предмет впервые. The указывает на конкретный предмет, уже понятный собеседнику.",
    examples: [
      ["I saw a dog.", "Я увидел какую-то собаку."],
      ["The dog was friendly.", "Эта собака была дружелюбной."],
      ["She is an engineer.", "Она инженер."],
    ],
  },
  {
    title: "Present Simple vs Continuous",
    level: "A1-A2",
    text: "Simple описывает привычку или факт. Continuous показывает действие, которое идет прямо сейчас или временно.",
    examples: [
      ["I work from home.", "Я обычно работаю из дома."],
      ["I am working now.", "Я сейчас работаю."],
      ["She is staying with friends.", "Она временно живет у друзей."],
    ],
  },
  {
    title: "Present Perfect",
    level: "A2-B1",
    text: "Используйте have/has + третью форму, когда важен результат к настоящему моменту, а точное время не названо.",
    examples: [
      ["I have finished the report.", "Я закончил отчет."],
      ["Have you ever been to London?", "Ты когда-нибудь был в Лондоне?"],
      ["She has not called yet.", "Она еще не позвонила."],
    ],
  },
  {
    title: "In, on и at",
    level: "A1-B1",
    text: "At - точка, on - поверхность или день, in - пространство или большой период. Это работает и для места, и для времени.",
    examples: [
      ["Meet me at the station.", "Встреть меня у станции."],
      ["The keys are on the table.", "Ключи на столе."],
      ["We travel in August.", "Мы путешествуем в августе."],
    ],
  },
  {
    title: "Модальные глаголы",
    level: "A2-B1",
    text: "После can, should, must и might ставится базовая форма глагола без to. Модальный глагол задает оттенок смысла.",
    examples: [
      ["You should rest.", "Тебе стоит отдохнуть."],
      ["We must leave now.", "Мы должны уйти сейчас."],
      ["It might rain.", "Возможно, пойдет дождь."],
    ],
  },
  {
    title: "Порядок слов",
    level: "A1-B1",
    text: "В утверждении обычно идет подлежащее, затем действие и дополнение. В вопросе вспомогательный глагол выходит вперед.",
    examples: [
      ["She reads the news every day.", "Она читает новости каждый день."],
      ["Do you know him?", "Ты его знаешь?"],
      ["Where did they go?", "Куда они пошли?"],
    ],
  },
  {
    title: "Phrasal verbs",
    level: "A2-B2",
    text: "Глагол с частицей часто получает новый смысл. Учите всю конструкцию целиком и сразу в короткой фразе.",
    examples: [
      ["Turn down the music.", "Сделай музыку тише."],
      ["I ran into an old friend.", "Я случайно встретил старого друга."],
      ["Do not give up.", "Не сдавайся."],
    ],
  },
  {
    title: "Живая связная речь",
    level: "B1-B2",
    text: "Служебные слова часто сокращаются, а согласные связываются с гласными. Слушайте всю фразу, а не отдельные слова.",
    examples: [
      ["What are you doing?", "В быстрой речи: Whaddaya doing?"],
      ["I want to go.", "Want to часто звучит близко к wanna."],
      ["Pick it up.", "Слова связываются: pick-it-up."],
    ],
  },
];

const intervalDays = [0, 1, 3, 7, 14, 30];
const defaultPreferences = { goal: 20, theme: "light", direction: "en-ru" };

let preferences = { ...defaultPreferences, ...loadJson(STORAGE_KEYS.preferences, {}) };
let learning = loadJson(STORAGE_KEYS.learning, {});
let activity = loadJson(STORAGE_KEYS.activity, {});
let cards = [...defaultCards, ...loadCustomCards()];
let filters = { category: "all", level: "all", mode: "smart" };
let libraryFilters = { search: "", category: "all", favoritesOnly: false };
let libraryVisible = 24;
let direction = ["en-ru", "ru-en", "listen"].includes(preferences.direction)
  ? preferences.direction
  : "en-ru";
let flipped = false;
let lastResult = null;
let lastAutoSpokenKey = "";
let toastTimer = null;
let session = createPracticeSession();

const elements = {
  viewTabs: [...document.querySelectorAll("[data-view]")],
  viewPanels: [...document.querySelectorAll("[data-view-panel]")],
  brandLink: document.querySelector("[data-nav-view]"),
  libraryCount: document.querySelector("#libraryCount"),
  todayCompact: document.querySelector("#todayCompact"),
  themeButton: document.querySelector("#themeButton"),
  sessionTitle: document.querySelector("#sessionTitle"),
  sessionLead: document.querySelector("#sessionLead"),
  answeredStat: document.querySelector("#answeredStat"),
  accuracyStat: document.querySelector("#accuracyStat"),
  reviewStat: document.querySelector("#reviewStat"),
  masteredStat: document.querySelector("#masteredStat"),
  modeFilter: document.querySelector("#modeFilter"),
  categoryFilter: document.querySelector("#categoryFilter"),
  levelFilter: document.querySelector("#levelFilter"),
  directionButtons: [...document.querySelectorAll("[data-direction]")],
  restartButton: document.querySelector("#restartButton"),
  sessionProgressLabel: document.querySelector("#sessionProgressLabel"),
  remainingStat: document.querySelector("#remainingStat"),
  progressFill: document.querySelector("#progressFill"),
  flashcard: document.querySelector("#flashcard"),
  cardCategory: document.querySelector("#cardCategory"),
  cardLevel: document.querySelector("#cardLevel"),
  favoriteButton: document.querySelector("#favoriteButton"),
  speakButton: document.querySelector("#speakButton"),
  promptLabel: document.querySelector("#promptLabel"),
  currentWord: document.querySelector("#currentWord"),
  cardExample: document.querySelector("#cardExample"),
  masteryLabel: document.querySelector("#masteryLabel"),
  masteryFill: document.querySelector("#masteryFill"),
  answerCount: document.querySelector("#answerCount"),
  answerLabel: document.querySelector("#answerLabel"),
  cardTranslation: document.querySelector("#cardTranslation"),
  cardExampleTranslation: document.querySelector("#cardExampleTranslation"),
  answerVariants: document.querySelector("#answerVariants"),
  answerForm: document.querySelector("#answerForm"),
  answerInput: document.querySelector("#answerInput"),
  resultLine: document.querySelector("#resultLine"),
  againButton: document.querySelector("#againButton"),
  hardButton: document.querySelector("#hardButton"),
  knownButton: document.querySelector("#knownButton"),
  knownInterval: document.querySelector("#knownInterval"),
  flipButton: document.querySelector("#flipButton"),
  quizRow: document.querySelector("#quizRow"),
  goalSelect: document.querySelector("#goalSelect"),
  goalRing: document.querySelector("#goalRing"),
  goalPercent: document.querySelector("#goalPercent"),
  goalCopy: document.querySelector("#goalCopy"),
  goalMessage: document.querySelector("#goalMessage"),
  weekChart: document.querySelector("#weekChart"),
  queueCount: document.querySelector("#queueCount"),
  queueList: document.querySelector("#queueList"),
  favoriteStat: document.querySelector("#favoriteStat"),
  librarySearch: document.querySelector("#librarySearch"),
  libraryCategory: document.querySelector("#libraryCategory"),
  favoritesOnly: document.querySelector("#favoritesOnly"),
  exportButton: document.querySelector("#exportButton"),
  importButton: document.querySelector("#importButton"),
  importInput: document.querySelector("#importInput"),
  newWordsStat: document.querySelector("#newWordsStat"),
  learningWordsStat: document.querySelector("#learningWordsStat"),
  masteredWordsStat: document.querySelector("#masteredWordsStat"),
  dueWordsStat: document.querySelector("#dueWordsStat"),
  libraryResultCount: document.querySelector("#libraryResultCount"),
  wordGrid: document.querySelector("#wordGrid"),
  loadMoreButton: document.querySelector("#loadMoreButton"),
  customCardForm: document.querySelector("#customCardForm"),
  lessonGrid: document.querySelector("#lessonGrid"),
  footerDeckCount: document.querySelector("#footerDeckCount"),
  toast: document.querySelector("#toast"),
};

initialize();

function initialize() {
  applyTheme();
  renderFilterOptions();
  renderLessons();
  bindEvents();
  render();

  const initialView = ["library", "guide"].includes(location.hash.slice(1))
    ? location.hash.slice(1)
    : "practice";
  switchView(initialView, false);
}

function bindEvents() {
  elements.viewTabs.forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.view));
  });

  elements.brandLink.addEventListener("click", (event) => {
    event.preventDefault();
    switchView("practice");
  });

  elements.themeButton.addEventListener("click", () => {
    preferences.theme = preferences.theme === "dark" ? "light" : "dark";
    savePreferences();
    applyTheme();
  });

  elements.categoryFilter.addEventListener("change", () => {
    filters.category = elements.categoryFilter.value;
    resetSession();
  });

  elements.levelFilter.addEventListener("change", () => {
    filters.level = elements.levelFilter.value;
    resetSession();
  });

  elements.modeFilter.addEventListener("change", () => {
    filters.mode = elements.modeFilter.value;
    resetSession();
  });

  elements.directionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      direction = button.dataset.direction;
      preferences.direction = direction;
      savePreferences();
      flipped = false;
      lastResult = null;
      lastAutoSpokenKey = "";
      elements.answerInput.value = "";
      render();
    });
  });

  elements.restartButton.addEventListener("click", resetSession);
  elements.flashcard.addEventListener("click", (event) => {
    if (!event.target.closest("button")) {
      toggleCard();
    }
  });
  elements.flipButton.addEventListener("click", toggleCard);
  elements.favoriteButton.addEventListener("click", () => {
    const card = currentCard(session);
    if (card) {
      toggleFavorite(card.id);
    }
  });
  elements.speakButton.addEventListener("click", speakCurrentWord);
  elements.againButton.addEventListener("click", () => rateAndRender("again"));
  elements.hardButton.addEventListener("click", () => rateAndRender("hard"));
  elements.knownButton.addEventListener("click", () => rateAndRender("known"));
  elements.answerForm.addEventListener("submit", handleAnswerSubmit);
  elements.quizRow.addEventListener("click", handleQuizClick);

  elements.goalSelect.addEventListener("change", () => {
    preferences.goal = Number(elements.goalSelect.value);
    savePreferences();
    renderDashboard();
  });

  elements.librarySearch.addEventListener("input", () => {
    libraryFilters.search = elements.librarySearch.value;
    libraryVisible = 24;
    renderLibrary();
  });
  elements.libraryCategory.addEventListener("change", () => {
    libraryFilters.category = elements.libraryCategory.value;
    libraryVisible = 24;
    renderLibrary();
  });
  elements.favoritesOnly.addEventListener("change", () => {
    libraryFilters.favoritesOnly = elements.favoritesOnly.checked;
    libraryVisible = 24;
    renderLibrary();
  });
  elements.loadMoreButton.addEventListener("click", () => {
    libraryVisible += 24;
    renderLibrary();
  });
  elements.wordGrid.addEventListener("click", handleWordGridClick);
  elements.customCardForm.addEventListener("submit", handleCustomCardSubmit);
  elements.exportButton.addEventListener("click", exportData);
  elements.importButton.addEventListener("click", () => elements.importInput.click());
  elements.importInput.addEventListener("change", importData);

  document.addEventListener("keydown", (event) => {
    const practiceActive = !document.querySelector("#practiceView").hidden;
    if (!practiceActive || event.target.matches("input, select, textarea, button")) {
      return;
    }

    if (event.code === "Space") {
      event.preventDefault();
      toggleCard();
    } else if (event.code === "ArrowLeft") {
      rateAndRender("again");
    } else if (event.code === "ArrowDown") {
      rateAndRender("hard");
    } else if (event.code === "ArrowRight") {
      rateAndRender("known");
    }
  });
}

function switchView(view, updateHash = true) {
  const selected = ["practice", "library", "guide"].includes(view) ? view : "practice";
  elements.viewTabs.forEach((button) => {
    const active = button.dataset.view === selected;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });
  elements.viewPanels.forEach((panel) => {
    const active = panel.dataset.viewPanel === selected;
    panel.hidden = !active;
    panel.classList.toggle("is-active", active);
  });

  if (selected === "library") {
    renderLibrary();
  }
  if (updateHash) {
    history.replaceState(null, "", `#${selected}`);
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function createPracticeSession() {
  const profile = modeProfiles[filters.mode] ?? modeProfiles.smart;
  const selectedCards = selectCardsForSession();
  const seed = `${filters.mode}:${filters.category}:${filters.level}:${localDateKey()}:${selectedCards.length}`;

  return createSession(selectedCards, {
    limit: profile.limit,
    mode: filters.mode,
    repeatMisses: profile.repeatMisses,
    shuffleSeed: profile.shuffle ? seed : null,
  });
}

function selectCardsForSession() {
  const today = localDateKey();
  const base = cards.filter((card) => {
    const categoryMatch = filters.category === "all" || card.category === filters.category;
    const levelMatch = filters.level === "all" || card.level === filters.level;
    return categoryMatch && levelMatch;
  });

  if (filters.mode === "favorites") {
    return base.filter((card) => Boolean(learning[card.id]?.favorite));
  }

  if (filters.mode === "review") {
    return base.filter((card) => {
      const state = learning[card.id];
      return state && state.attempts > 0 && (state.correct < state.attempts || state.box < 3);
    });
  }

  if (filters.mode !== "smart") {
    return base;
  }

  const due = base
    .filter((card) => {
      const state = learning[card.id];
      return state?.attempts > 0 && state.due <= today;
    })
    .sort((left, right) => learning[left.id].due.localeCompare(learning[right.id].due));
  const fresh = base.filter((card) => !learning[card.id]?.attempts);
  const later = base.filter((card) => {
    const state = learning[card.id];
    return state?.attempts > 0 && state.due > today;
  });

  return [...due, ...seededShuffle(fresh, today), ...seededShuffle(later, `${today}:later`)];
}

function resetSession() {
  session = createPracticeSession();
  flipped = false;
  lastResult = null;
  lastAutoSpokenKey = "";
  elements.answerInput.value = "";
  render();
}

function rateAndRender(rating) {
  const card = currentCard(session);
  if (!card) {
    return;
  }

  recordRating(card.id, rating);
  session = rateCurrentCard(session, rating);
  flipped = false;
  lastResult = null;
  elements.answerInput.value = "";
  render();
}

function recordRating(cardId, rating) {
  const today = localDateKey();
  const previous = cardState(cardId);
  let box = previous.box;
  let days = 0;

  if (rating === "again") {
    box = Math.max(0, box - 1);
  } else if (rating === "hard") {
    box = Math.max(1, box);
    days = 1;
  } else {
    box = Math.min(5, box + 1);
    days = intervalDays[box];
  }

  learning[cardId] = {
    ...previous,
    attempts: previous.attempts + 1,
    correct: previous.correct + (rating === "known" ? 1 : 0),
    box,
    due: addDaysKey(today, days),
    lastReviewed: today,
  };

  const todayActivity = activity[today] ?? { answered: 0, known: 0 };
  activity[today] = {
    answered: todayActivity.answered + 1,
    known: todayActivity.known + (rating === "known" ? 1 : 0),
  };

  saveJson(STORAGE_KEYS.learning, learning);
  saveJson(STORAGE_KEYS.activity, activity);
}

function handleAnswerSubmit(event) {
  event.preventDefault();
  const card = currentCard(session);
  if (!card) {
    return;
  }

  lastResult = checkCurrentAnswer(card, elements.answerInput.value);
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
  lastResult = checkCurrentAnswer(card, button.dataset.answer);
  flipped = true;
  render();
}

function checkCurrentAnswer(card, value) {
  if (direction !== "ru-en") {
    return checkTranslation(card, value);
  }

  const correct = normalizeText(value) === normalizeText(card.word);
  return {
    correct,
    expected: card.word,
    matched: correct ? card.word : null,
  };
}

function toggleCard() {
  if (!currentCard(session)) {
    return;
  }
  flipped = !flipped;
  renderPractice();
}

function render() {
  renderDashboard();
  renderPractice();
  renderLibrarySummary();
  elements.libraryCount.textContent = cards.length;
  elements.footerDeckCount.textContent = `${cards.length} карточек · прогресс хранится на этом устройстве`;
}

function renderDashboard() {
  const today = localDateKey();
  const todayActivity = activity[today] ?? { answered: 0, known: 0 };
  const goal = [10, 20, 30, 50].includes(Number(preferences.goal)) ? Number(preferences.goal) : 20;
  const percent = Math.min(100, Math.round((todayActivity.answered / goal) * 100));
  const accuracy = todayActivity.answered
    ? Math.round((todayActivity.known / todayActivity.answered) * 100)
    : 0;
  const due = cards.filter((card) => isDue(card.id, today)).length;
  const mastered = cards.filter((card) => cardState(card.id).box >= 4).length;
  const favorites = cards.filter((card) => Boolean(learning[card.id]?.favorite)).length;
  const profile = modeProfiles[filters.mode] ?? modeProfiles.smart;

  elements.todayCompact.textContent = todayActivity.answered;
  elements.answeredStat.textContent = session.answered;
  elements.accuracyStat.textContent = `${accuracy}%`;
  elements.reviewStat.textContent = due;
  elements.masteredStat.textContent = mastered;
  elements.favoriteStat.textContent = favorites;
  elements.sessionTitle.textContent = profile.title;
  elements.sessionLead.textContent = profile.description;
  elements.goalSelect.value = String(goal);
  elements.goalRing.style.setProperty("--goal-progress", `${percent}%`);
  elements.goalPercent.textContent = `${percent}%`;
  elements.goalCopy.textContent = `${todayActivity.answered} из ${goal}`;
  elements.goalMessage.textContent = goalMessage(percent, goal - todayActivity.answered);
  renderWeekChart();
}

function renderPractice() {
  const card = currentCard(session);
  const summary = progressSummary(session);
  const profile = modeProfiles[filters.mode] ?? modeProfiles.smart;
  const completed = Math.min(session.index, session.order.length);
  const progress = session.order.length ? Math.round((completed / session.order.length) * 100) : 0;

  elements.directionButtons.forEach((button) => {
    const active = button.dataset.direction === direction;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  elements.sessionProgressLabel.textContent = `${completed} из ${session.order.length}`;
  elements.remainingStat.textContent = `${summary.remaining} ${wordForm(summary.remaining, "в очереди", "в очереди", "в очереди")}`;
  elements.progressFill.style.width = `${progress}%`;
  elements.flashcard.classList.toggle("is-flipped", flipped);
  elements.flipButton.textContent = flipped ? "Скрыть ответ" : "Показать ответ";

  if (!card) {
    renderEmptyState();
    renderQueue();
    return;
  }

  const view = cardView(card);
  const state = cardState(card.id);
  const variants = view.answers;
  const nextBox = Math.min(5, state.box + 1);
  const nextDays = intervalDays[nextBox];

  elements.cardCategory.textContent = labelCategory(card.category);
  elements.cardLevel.textContent = card.level;
  elements.promptLabel.textContent = view.promptLabel;
  elements.currentWord.textContent = view.front;
  elements.cardExample.textContent = view.frontExample || "Контекст появится после ответа.";
  elements.answerLabel.textContent = view.answerLabel;
  elements.cardTranslation.textContent = view.back;
  elements.cardExampleTranslation.textContent = view.backExample || "";
  elements.answerCount.textContent = `${variants.length} ${wordForm(variants.length, "вариант", "варианта", "вариантов")}`;
  elements.answerVariants.innerHTML = variants
    .slice(1)
    .map((answer) => `<span>${escapeHtml(answer)}</span>`)
    .join("");
  elements.masteryLabel.textContent = masteryText(state);
  elements.masteryFill.style.width = `${(state.box / 5) * 100}%`;
  elements.favoriteButton.classList.toggle("is-favorite", Boolean(state.favorite));
  elements.favoriteButton.querySelector("span").textContent = state.favorite ? "★" : "☆";
  elements.favoriteButton.setAttribute(
    "aria-label",
    state.favorite ? "Убрать из избранного" : "Добавить в избранное",
  );
  elements.knownInterval.textContent = nextDays === 1 ? "через 1 день" : `через ${nextDays} дней`;
  elements.answerInput.placeholder = answerPlaceholder();

  setPracticeDisabled(false);
  renderResult();
  renderQuiz(card, profile);
  renderQueue();
  scheduleAutoSpeech(card);
}

function renderEmptyState() {
  const isSpecialEmpty = ["favorites", "review"].includes(filters.mode) && session.answered === 0;
  elements.cardCategory.textContent = "готово";
  elements.cardLevel.textContent = "✓";
  elements.promptLabel.textContent = isSpecialEmpty ? "Подборка пока пуста" : "Сессия завершена";
  elements.currentWord.textContent = isSpecialEmpty ? "Выберите другую сессию" : "Отличная работа";
  elements.cardExample.textContent = isSpecialEmpty
    ? "Добавьте слова в избранное или сначала пройдите обычную тренировку."
    : "Прогресс сохранен. Следующая умная сессия соберется автоматически.";
  elements.answerLabel.textContent = "Результат";
  elements.cardTranslation.textContent = "Готово";
  elements.cardExampleTranslation.textContent = "";
  elements.answerCount.textContent = "0 вариантов";
  elements.answerVariants.innerHTML = "";
  elements.masteryLabel.textContent = "очередь закрыта";
  elements.masteryFill.style.width = "100%";
  elements.resultLine.textContent = isSpecialEmpty ? "Смените режим или фильтр." : "Все карточки этой сессии пройдены.";
  elements.resultLine.className = "result-line good";
  elements.quizRow.innerHTML = "";
  elements.favoriteButton.classList.remove("is-favorite");
  elements.favoriteButton.querySelector("span").textContent = "☆";
  setPracticeDisabled(true);
}

function setPracticeDisabled(disabled) {
  elements.answerInput.disabled = disabled;
  elements.againButton.disabled = disabled;
  elements.hardButton.disabled = disabled;
  elements.knownButton.disabled = disabled;
  elements.flipButton.disabled = disabled;
  elements.speakButton.disabled = disabled;
  elements.favoriteButton.disabled = disabled;
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
    elements.resultLine.textContent = `Правильный ответ: ${lastResult.expected}`;
    elements.resultLine.classList.add("bad");
  }
}

function renderQuiz(card, profile) {
  if (!profile.quiz) {
    elements.quizRow.innerHTML = `
      <p class="hard-mode-note">В этом режиме варианты ответа скрыты. Ошибка добавит карточку в очередь еще два раза.</p>
    `;
    return;
  }

  elements.quizRow.innerHTML = buildChoices(card)
    .map((choice) => `<button type="button" data-answer="${escapeHtml(choice)}">${escapeHtml(choice)}</button>`)
    .join("");
}

function renderQueue() {
  const ids = session.order.slice(session.index, session.index + 5);
  elements.queueCount.textContent = Math.max(session.order.length - session.index, 0);
  elements.queueList.innerHTML = ids
    .map((id, index) => {
      const card = session.cards.find((item) => item.id === id);
      if (!card) {
        return "";
      }
      const title = direction === "ru-en" ? card.translation : card.word;
      return `
        <div class="queue-item">
          <span class="queue-index">${String(index + 1).padStart(2, "0")}</span>
          <strong>${escapeHtml(title)}</strong>
          <span>${escapeHtml(card.level)}</span>
        </div>
      `;
    })
    .join("");

  if (!elements.queueList.innerHTML) {
    elements.queueList.innerHTML = `
      <div class="queue-item">
        <span class="queue-index">00</span><strong>Очередь пуста</strong><span>готово</span>
      </div>
    `;
  }
}

function cardView(card) {
  if (direction === "ru-en") {
    return {
      promptLabel: "Переведи на английский",
      front: card.translation,
      frontExample: card.exampleTranslation,
      answerLabel: "English",
      back: card.word,
      backExample: card.example,
      answers: [card.word],
    };
  }

  if (direction === "listen") {
    return {
      promptLabel: "Аудио на английском",
      front: "♪",
      frontExample: `${card.level} · ${labelCategory(card.category)}`,
      answerLabel: "Перевод",
      back: card.translation,
      backExample: card.exampleTranslation,
      answers: [card.translation, ...(card.answers ?? [])],
    };
  }

  return {
    promptLabel: "Переведи на русский",
    front: card.word,
    frontExample: card.example,
    answerLabel: "Перевод",
    back: card.translation,
    backExample: card.exampleTranslation,
    answers: [card.translation, ...(card.answers ?? [])],
  };
}

function buildChoices(card) {
  const answerKey = direction === "ru-en" ? "word" : "translation";
  const correct = card[answerKey];
  const sameCategory = cards.filter((item) => item.id !== card.id && item.category === card.category);
  const others = cards.filter((item) => item.id !== card.id && item.category !== card.category);
  const pool = [...sameCategory, ...others];
  const seed = hashString(`${card.id}:${direction}:${session.answered}`);
  const distractors = seededShuffle(pool, seed)
    .map((item) => item[answerKey])
    .filter((value, index, values) => value !== correct && values.indexOf(value) === index)
    .slice(0, 2);
  return seededShuffle([correct, ...distractors], seed + 11);
}

function answerPlaceholder() {
  if (direction === "ru-en") {
    return "введите слово на английском";
  }
  if (direction === "listen") {
    return "введите перевод услышанного";
  }
  return "введите перевод";
}

function speakCurrentWord() {
  const card = currentCard(session);
  if (!card || !("speechSynthesis" in window)) {
    showToast("Озвучка недоступна в этом браузере");
    return;
  }

  const utterance = new SpeechSynthesisUtterance(card.word);
  utterance.lang = "en-US";
  utterance.rate = 0.88;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function scheduleAutoSpeech(card) {
  if (direction !== "listen") {
    return;
  }
  const key = `${card.id}:${session.index}`;
  if (key === lastAutoSpokenKey) {
    return;
  }
  lastAutoSpokenKey = key;
  window.setTimeout(() => {
    if (currentCard(session)?.id === card.id && direction === "listen") {
      speakCurrentWord();
    }
  }, 180);
}

function renderWeekChart() {
  const today = new Date();
  const days = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    const key = localDateKey(date);
    days.push({ key, label: weekdayLabel(date), value: activity[key]?.answered ?? 0, today: offset === 0 });
  }
  const max = Math.max(1, ...days.map((day) => day.value));
  elements.weekChart.innerHTML = days
    .map((day) => {
      const height = day.value ? Math.max(12, Math.round((day.value / max) * 56)) : 4;
      return `
        <div class="week-day${day.today ? " is-today" : ""}" title="${day.value} карточек">
          <i style="height:${height}px"></i><span>${escapeHtml(day.label)}</span>
        </div>
      `;
    })
    .join("");
}

function renderFilterOptions() {
  const categories = categoriesFor(cards);
  const levels = levelsFor(cards);
  fillSelect(elements.categoryFilter, categories, labelCategory, filters.category);
  fillSelect(elements.levelFilter, levels, (level) => (level === "all" ? "все" : level), filters.level);
  fillSelect(elements.modeFilter, Object.keys(modeProfiles), (mode) => modeProfiles[mode].label, filters.mode);
  fillSelect(elements.libraryCategory, categories, labelCategory, libraryFilters.category);

  if (!categories.includes(filters.category)) {
    filters.category = "all";
  }
  if (!categories.includes(libraryFilters.category)) {
    libraryFilters.category = "all";
  }
}

function renderLibrarySummary() {
  const today = localDateKey();
  const fresh = cards.filter((card) => !cardState(card.id).attempts).length;
  const mastered = cards.filter((card) => cardState(card.id).box >= 4).length;
  const studying = cards.length - fresh - mastered;
  const due = cards.filter((card) => isDue(card.id, today)).length;
  elements.newWordsStat.textContent = fresh;
  elements.learningWordsStat.textContent = studying;
  elements.masteredWordsStat.textContent = mastered;
  elements.dueWordsStat.textContent = due;
}

function renderLibrary() {
  renderLibrarySummary();
  const query = normalizeText(libraryFilters.search);
  const filtered = cards.filter((card) => {
    const categoryMatch = libraryFilters.category === "all" || card.category === libraryFilters.category;
    const favoriteMatch = !libraryFilters.favoritesOnly || Boolean(learning[card.id]?.favorite);
    const haystack = normalizeText(
      [card.word, card.translation, card.example, card.exampleTranslation, ...(card.answers ?? [])].join(" "),
    );
    return categoryMatch && favoriteMatch && (!query || haystack.includes(query));
  });

  elements.libraryResultCount.textContent = `${filtered.length} ${wordForm(filtered.length, "слово", "слова", "слов")}`;
  elements.wordGrid.innerHTML = filtered.slice(0, libraryVisible).map(renderWordCard).join("");
  elements.loadMoreButton.hidden = filtered.length <= libraryVisible;

  if (!filtered.length) {
    elements.wordGrid.innerHTML = `
      <article class="word-card">
        <div class="word-card-tags"><span>ничего не найдено</span></div>
        <h3>Попробуйте другой запрос</h3>
        <p class="word-translation">или снимите часть фильтров</p>
      </article>
    `;
  }
}

function renderWordCard(card) {
  const state = cardState(card.id);
  const favorite = Boolean(state.favorite);
  const custom = card.id.startsWith("custom-");
  return `
    <article class="word-card">
      <div class="word-card-top">
        <div class="word-card-tags">
          <span>${escapeHtml(labelCategory(card.category))}</span><span>${escapeHtml(card.level)}</span>
        </div>
        <div class="word-card-tools">
          ${custom ? `<button type="button" data-delete="${escapeHtml(card.id)}" aria-label="Удалить карточку" title="Удалить">×</button>` : ""}
          <button class="${favorite ? "is-favorite" : ""}" type="button" data-favorite="${escapeHtml(card.id)}" aria-label="${favorite ? "Убрать из избранного" : "Добавить в избранное"}" title="Избранное">${favorite ? "★" : "☆"}</button>
        </div>
      </div>
      <h3>${escapeHtml(card.word)}</h3>
      <p class="word-translation">${escapeHtml(card.translation)}</p>
      <p class="word-example">${escapeHtml(card.example || "Пример пока не добавлен.")}</p>
      <div class="word-progress">
        <span>${escapeHtml(masteryText(state))}</span>
        <div aria-hidden="true"><i style="width:${(state.box / 5) * 100}%"></i></div>
      </div>
    </article>
  `;
}

function handleWordGridClick(event) {
  const favoriteButton = event.target.closest("button[data-favorite]");
  if (favoriteButton) {
    toggleFavorite(favoriteButton.dataset.favorite);
    renderLibrary();
    return;
  }

  const deleteButton = event.target.closest("button[data-delete]");
  if (!deleteButton) {
    return;
  }
  const card = cards.find((item) => item.id === deleteButton.dataset.delete);
  if (!card || !window.confirm(`Удалить карточку «${card.word}»?`)) {
    return;
  }
  cards = cards.filter((item) => item.id !== card.id);
  delete learning[card.id];
  saveCustomCards();
  saveJson(STORAGE_KEYS.learning, learning);
  renderFilterOptions();
  resetSession();
  renderLibrary();
  showToast("Карточка удалена");
}

function toggleFavorite(cardId) {
  const state = cardState(cardId);
  learning[cardId] = { ...state, favorite: !state.favorite };
  saveJson(STORAGE_KEYS.learning, learning);
  renderDashboard();
  renderPractice();
  renderLibrarySummary();
}

function handleCustomCardSubmit(event) {
  event.preventDefault();
  const draft = Object.fromEntries(new FormData(elements.customCardForm).entries());
  cards = addCustomCard(cards, draft);
  saveCustomCards();
  renderFilterOptions();
  elements.customCardForm.reset();
  elements.customCardForm.elements.category.value = "custom";
  libraryFilters.category = "custom";
  elements.libraryCategory.value = "custom";
  libraryVisible = 24;
  resetSession();
  renderLibrary();
  showToast("Карточка добавлена в словарь");
}

function exportData() {
  const payload = {
    version: 2,
    exportedAt: new Date().toISOString(),
    customCards: cards.filter((card) => card.id.startsWith("custom-")),
    learning,
    activity,
    preferences,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `lexicards-backup-${localDateKey()}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showToast("Резервная копия создана");
}

async function importData() {
  const [file] = elements.importInput.files;
  if (!file) {
    return;
  }

  try {
    const payload = JSON.parse(await file.text());
    if (!payload || !Array.isArray(payload.customCards) || typeof payload.learning !== "object") {
      throw new Error("invalid backup");
    }
    const customCards = payload.customCards.filter((card) => card?.word && card?.translation);
    learning = payload.learning ?? {};
    activity = payload.activity ?? {};
    preferences = { ...defaultPreferences, ...(payload.preferences ?? {}) };
    saveJson(STORAGE_KEYS.custom, customCards);
    saveJson(STORAGE_KEYS.learning, learning);
    saveJson(STORAGE_KEYS.activity, activity);
    savePreferences();
    cards = [...defaultCards, ...customCards];
    direction = preferences.direction;
    applyTheme();
    renderFilterOptions();
    resetSession();
    renderLibrary();
    showToast("Данные восстановлены");
  } catch {
    showToast("Не удалось прочитать файл резервной копии");
  } finally {
    elements.importInput.value = "";
  }
}

function renderLessons() {
  elements.lessonGrid.innerHTML = lessons
    .map((lesson, index) => `
      <article class="lesson-card">
        <div class="lesson-top">
          <span class="lesson-number">${String(index + 1).padStart(2, "0")}</span>
          <span class="lesson-level">${escapeHtml(lesson.level)}</span>
        </div>
        <h2>${escapeHtml(lesson.title)}</h2>
        <p>${escapeHtml(lesson.text)}</p>
        <div class="lesson-examples">
          ${lesson.examples
            .map(([english, russian]) => `
              <div class="lesson-example"><strong>${escapeHtml(english)}</strong><span>${escapeHtml(russian)}</span></div>
            `)
            .join("")}
        </div>
      </article>
    `)
    .join("");
}

function cardState(cardId) {
  const raw = learning[cardId] ?? {};
  return {
    attempts: Number(raw.attempts) || 0,
    correct: Number(raw.correct) || 0,
    box: Math.max(0, Math.min(5, Number(raw.box) || 0)),
    due: typeof raw.due === "string" ? raw.due : localDateKey(),
    lastReviewed: typeof raw.lastReviewed === "string" ? raw.lastReviewed : null,
    favorite: Boolean(raw.favorite),
  };
}

function isDue(cardId, today = localDateKey()) {
  const state = cardState(cardId);
  return state.attempts > 0 && state.due <= today;
}

function masteryText(state) {
  if (!state.attempts) {
    return "новое слово";
  }
  if (state.box >= 4) {
    return "освоено";
  }
  if (state.due <= localDateKey()) {
    return "пора повторить";
  }
  return `уровень ${state.box} из 5`;
}

function goalMessage(percent, remaining) {
  if (percent >= 100) {
    return "Цель выполнена. Отличный темп.";
  }
  if (percent >= 70) {
    return `Еще ${Math.max(remaining, 0)} - и цель закрыта.`;
  }
  if (percent > 0) {
    return `Осталось ${Math.max(remaining, 0)} карточек.`;
  }
  return "Сегодняшняя серия еще впереди.";
}

function applyTheme() {
  const theme = preferences.theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = theme;
  elements.themeButton.querySelector("span").textContent = theme === "dark" ? "☾" : "☼";
}

function savePreferences() {
  saveJson(STORAGE_KEYS.preferences, preferences);
}

function loadCustomCards() {
  const current = loadJson(STORAGE_KEYS.custom, null);
  const legacy = loadJson(STORAGE_KEYS.legacyCustom, []);
  const source = Array.isArray(current) ? current : legacy;
  return source.filter((card) => card?.word && card?.translation);
}

function saveCustomCards() {
  const custom = cards.filter((card) => card.id.startsWith("custom-"));
  saveJson(STORAGE_KEYS.custom, custom);
}

function loadJson(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key));
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function fillSelect(select, values, labeler, selectedValue) {
  select.innerHTML = values
    .map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(labeler(value))}</option>`)
    .join("");
  select.value = values.includes(selectedValue) ? selectedValue : "all";
}

function labelCategory(category) {
  return categoryLabels[category] ?? category;
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDaysKey(key, amount) {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + amount);
  return localDateKey(date);
}

function weekdayLabel(date) {
  return ["вс", "пн", "вт", "ср", "чт", "пт", "сб"][date.getDay()];
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

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .toLocaleLowerCase("ru-RU")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function seededShuffle(items, seed) {
  return [...items].sort((left, right) => {
    const leftValue = typeof left === "object" ? left.id ?? JSON.stringify(left) : left;
    const rightValue = typeof right === "object" ? right.id ?? JSON.stringify(right) : right;
    return hashString(`${leftValue}:${seed}`) - hashString(`${rightValue}:${seed}`);
  });
}

function hashString(value) {
  return String(value)
    .split("")
    .reduce((hash, character) => (hash * 31 + character.charCodeAt(0)) >>> 0, 7);
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => elements.toast.classList.remove("is-visible"), 2400);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
