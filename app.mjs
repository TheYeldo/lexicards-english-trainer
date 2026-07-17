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
    topic: "grammar",
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
    topic: "grammar",
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
    topic: "grammar",
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
    topic: "grammar",
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
    topic: "grammar",
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
    topic: "grammar",
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
    topic: "vocabulary",
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
    topic: "speaking",
    level: "B1-B2",
    text: "Служебные слова часто сокращаются, а согласные связываются с гласными. Слушайте всю фразу, а не отдельные слова.",
    examples: [
      ["What are you doing?", "В быстрой речи: Whaddaya doing?"],
      ["I want to go.", "Want to часто звучит близко к wanna."],
      ["Pick it up.", "Слова связываются: pick-it-up."],
    ],
  },
  {
    title: "Past Simple vs Present Perfect",
    topic: "grammar",
    level: "A2-B1",
    text: "Past Simple привязан к законченному моменту в прошлом. Present Perfect связывает прошлое с настоящим и не называет точное время.",
    examples: [
      ["I visited Rome in 2024.", "Я посетил Рим в 2024 году."],
      ["I have visited Rome twice.", "Я дважды бывал в Риме."],
      ["She has just arrived.", "Она только что приехала."],
    ],
  },
  {
    title: "Will, going to и планы",
    topic: "grammar",
    level: "A2-B1",
    text: "Will подходит для решения в момент речи и прогноза. Going to показывает намерение, а Present Continuous - уже согласованный план.",
    examples: [
      ["I will answer the phone.", "Я отвечу на звонок."],
      ["We are going to move.", "Мы собираемся переехать."],
      ["I am meeting Anna at six.", "Я встречаюсь с Анной в шесть."],
    ],
  },
  {
    title: "Условные предложения",
    topic: "grammar",
    level: "B1-B2",
    text: "First Conditional говорит о реальном будущем. Second Conditional описывает воображаемую или маловероятную ситуацию.",
    examples: [
      ["If it rains, we will stay home.", "Если пойдет дождь, мы останемся дома."],
      ["If I had more time, I would travel.", "Если бы у меня было больше времени, я бы путешествовал."],
      ["If you heat ice, it melts.", "Если нагреть лед, он тает."],
    ],
  },
  {
    title: "Much, many, few и little",
    topic: "grammar",
    level: "A2-B1",
    text: "Many и few идут с исчисляемыми существительными. Much и little - с неисчисляемыми. A few и a little означают небольшое, но достаточное количество.",
    examples: [
      ["We have a few questions.", "У нас есть несколько вопросов."],
      ["There is little time left.", "Осталось мало времени."],
      ["How much water do you need?", "Сколько воды тебе нужно?"],
    ],
  },
  {
    title: "Gerund или infinitive",
    topic: "grammar",
    level: "B1-B2",
    text: "После enjoy, avoid и finish обычно ставится форма -ing. После want, decide и plan используется to + глагол.",
    examples: [
      ["I enjoy learning languages.", "Мне нравится изучать языки."],
      ["She decided to leave early.", "Она решила уйти пораньше."],
      ["We finished preparing dinner.", "Мы закончили готовить ужин."],
    ],
  },
  {
    title: "Сравнения без ошибок",
    topic: "grammar",
    level: "A2-B1",
    text: "Короткие прилагательные получают -er/-est. С длинными используются more/most. Не забывайте неправильные формы good и bad.",
    examples: [
      ["This route is shorter.", "Этот маршрут короче."],
      ["It is the most useful option.", "Это самый полезный вариант."],
      ["Today is better than yesterday.", "Сегодня лучше, чем вчера."],
    ],
  },
  {
    title: "Ложные друзья переводчика",
    topic: "vocabulary",
    level: "B1-B2",
    text: "Похожие на русские слова могут иметь другой смысл. Проверяйте такие пары в контексте, а не переводите по форме.",
    examples: [
      ["Actually means in fact.", "Actually означает «на самом деле», а не «актуально»."],
      ["A magazine is a journal.", "Magazine - это журнал, а не магазин."],
      ["Accurate means exact.", "Accurate означает точный, а не аккуратный."],
    ],
  },
  {
    title: "Вежливый английский",
    topic: "speaking",
    level: "A2-B2",
    text: "Could, would и мягкие вводные фразы делают просьбы естественнее. Это особенно важно в работе, поездках и переписке.",
    examples: [
      ["Could you help me, please?", "Не могли бы вы мне помочь?"],
      ["Would you mind closing the door?", "Вы не могли бы закрыть дверь?"],
      ["I am afraid I cannot agree.", "Боюсь, я не могу согласиться."],
    ],
  },
];

const quizQuestions = [
  {
    prompt: "I ___ coffee every morning.",
    options: ["drink", "drinks", "am drinking"],
    answer: "drink",
    explanation: "Регулярное действие требует Present Simple. С I используется базовая форма drink.",
  },
  {
    prompt: "Look! It ___ outside.",
    options: ["is raining", "rains", "rained"],
    answer: "is raining",
    explanation: "Look указывает на действие прямо сейчас, поэтому нужен Present Continuous.",
  },
  {
    prompt: "I ___ this film already.",
    options: ["have seen", "saw", "am seeing"],
    answer: "have seen",
    explanation: "Already и важный сейчас результат обычно требуют Present Perfect.",
  },
  {
    prompt: "We ___ Paris last year.",
    options: ["visited", "have visited", "visit"],
    answer: "visited",
    explanation: "Last year - законченное время в прошлом, поэтому используется Past Simple.",
  },
  {
    prompt: "There isn't ___ milk left.",
    options: ["much", "many", "a few"],
    answer: "much",
    explanation: "Milk - неисчисляемое существительное. В отрицании с ним используется much.",
  },
  {
    prompt: "If it rains, we ___ at home.",
    options: ["will stay", "stayed", "would stay"],
    answer: "will stay",
    explanation: "Реальное условие о будущем: if + Present Simple, затем will + глагол.",
  },
  {
    prompt: "She is ___ than her brother.",
    options: ["taller", "more tall", "tallest"],
    answer: "taller",
    explanation: "Короткое прилагательное tall образует сравнительную форму с окончанием -er.",
  },
  {
    prompt: "I enjoy ___ English.",
    options: ["learning", "to learn", "learn"],
    answer: "learning",
    explanation: "После enjoy используется герундий, то есть форма глагола с -ing.",
  },
  {
    prompt: "Could you tell me where ___?",
    options: ["the station is", "is the station", "the station"],
    answer: "the station is",
    explanation: "В косвенном вопросе сохраняется порядок слов утверждения: подлежащее перед глаголом.",
  },
  {
    prompt: "I need ___ umbrella.",
    options: ["an", "a", "the"],
    answer: "an",
    explanation: "Umbrella начинается с гласного звука, поэтому перед ним ставится an.",
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
let lessonTopic = "all";
let quizRun = 0;
let quizState = createQuizState();
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
  lessonCountStat: document.querySelector("#lessonCountStat"),
  exampleCountStat: document.querySelector("#exampleCountStat"),
  quizBestStat: document.querySelector("#quizBestStat"),
  dayStreakStat: document.querySelector("#dayStreakStat"),
  wordDayLevel: document.querySelector("#wordDayLevel"),
  wordDayWord: document.querySelector("#wordDayWord"),
  wordDayTranslation: document.querySelector("#wordDayTranslation"),
  wordDayExample: document.querySelector("#wordDayExample"),
  wordDayExampleTranslation: document.querySelector("#wordDayExampleTranslation"),
  wordDaySpeakButton: document.querySelector("#wordDaySpeakButton"),
  wordDayFavoriteButton: document.querySelector("#wordDayFavoriteButton"),
  wordDayPracticeButton: document.querySelector("#wordDayPracticeButton"),
  quizProgress: document.querySelector("#quizProgress"),
  quizProgressFill: document.querySelector("#quizProgressFill"),
  quizBody: document.querySelector("#quizBody"),
  lessonTopicButtons: [...document.querySelectorAll("[data-lesson-topic]")],
  lessonGrid: document.querySelector("#lessonGrid"),
  footerDeckCount: document.querySelector("#footerDeckCount"),
  toast: document.querySelector("#toast"),
};

initialize();

function initialize() {
  applyTheme();
  renderFilterOptions();
  renderGuide();
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
  elements.lessonTopicButtons.forEach((button) => {
    button.addEventListener("click", () => {
      lessonTopic = button.dataset.lessonTopic;
      renderLessons();
    });
  });
  elements.wordDaySpeakButton.addEventListener("click", () => speakText(wordOfDay().word));
  elements.wordDayFavoriteButton.addEventListener("click", () => {
    toggleFavorite(wordOfDay().id);
    renderWordOfDay();
  });
  elements.wordDayPracticeButton.addEventListener("click", startWordOfDayPractice);
  elements.quizBody.addEventListener("click", handleGuideQuizClick);

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
  if (selected === "guide") {
    renderGuide();
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
  renderGuideStats();
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
  if (!card) {
    return;
  }
  speakText(card.word);
}

function speakText(text) {
  if (!("speechSynthesis" in window)) {
    showToast("Озвучка недоступна в этом браузере");
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
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

function renderGuide() {
  renderGuideStats();
  renderWordOfDay();
  renderGuideQuiz();
  renderLessons();
}

function renderGuideStats() {
  const exampleCount = lessons.reduce((total, lesson) => total + lesson.examples.length, 0);
  const best = Math.max(0, Math.min(quizQuestions.length, Number(preferences.quizBest) || 0));
  elements.lessonCountStat.textContent = lessons.length;
  elements.exampleCountStat.textContent = exampleCount;
  elements.quizBestStat.textContent = `${best}/${quizQuestions.length}`;
  elements.dayStreakStat.textContent = studyDayStreak();
}

function renderWordOfDay() {
  const card = wordOfDay();
  const favorite = Boolean(cardState(card.id).favorite);
  elements.wordDayLevel.textContent = `${card.level} · ${labelCategory(card.category)}`;
  elements.wordDayWord.textContent = card.word;
  elements.wordDayTranslation.textContent = card.translation;
  elements.wordDayExample.textContent = card.example;
  elements.wordDayExampleTranslation.textContent = card.exampleTranslation || "";
  elements.wordDayFavoriteButton.textContent = favorite ? "В избранном" : "В избранное";
  elements.wordDayFavoriteButton.classList.toggle("is-favorite", favorite);
}

function wordOfDay() {
  return cards[hashString(localDateKey()) % cards.length];
}

function startWordOfDayPractice() {
  const card = wordOfDay();
  filters = { category: card.category, level: "all", mode: "smart" };
  direction = "en-ru";
  preferences.direction = direction;
  savePreferences();
  renderFilterOptions();
  resetSession();
  switchView("practice");
  showToast(`Тема «${labelCategory(card.category)}» готова к тренировке`);
}

function createQuizState() {
  return {
    questions: seededShuffle(quizQuestions, `${localDateKey()}:${quizRun}`),
    index: 0,
    score: 0,
    selected: null,
    answered: false,
    finished: false,
  };
}

function renderGuideQuiz() {
  const total = quizState.questions.length;
  const completed = quizState.finished ? total : quizState.index + (quizState.answered ? 1 : 0);
  elements.quizProgress.textContent = quizState.finished ? `${quizState.score} / ${total}` : `${quizState.index + 1} / ${total}`;
  elements.quizProgressFill.style.width = `${Math.round((completed / total) * 100)}%`;

  if (quizState.finished) {
    const percentage = Math.round((quizState.score / total) * 100);
    const message = percentage >= 80
      ? "Сильный результат. База уже уверенная."
      : percentage >= 50
        ? "Неплохо. Объяснения подскажут, что повторить."
        : "Хорошая диагностика. Пройдите уроки и попробуйте еще раз.";
    elements.quizBody.innerHTML = `
      <div class="quiz-result">
        <span>${percentage}%</span>
        <h3>${quizState.score} из ${total}</h3>
        <p>${escapeHtml(message)}</p>
        <button class="primary-button" type="button" data-quiz-action="restart">Пройти еще раз</button>
      </div>
    `;
    return;
  }

  const question = quizState.questions[quizState.index];
  elements.quizBody.innerHTML = `
    <div class="quiz-question">
      <p>${escapeHtml(question.prompt)}</p>
      <div class="guide-quiz-options">
        ${question.options
          .map((option) => {
            const correct = quizState.answered && option === question.answer;
            const wrong = quizState.answered && option === quizState.selected && option !== question.answer;
            const className = correct ? "correct" : wrong ? "wrong" : "";
            return `<button class="${className}" type="button" data-quiz-option="${escapeHtml(option)}" ${quizState.answered ? "disabled" : ""}>${escapeHtml(option)}</button>`;
          })
          .join("")}
      </div>
      ${quizState.answered ? `
        <div class="quiz-explanation ${quizState.selected === question.answer ? "good" : "bad"}">
          <strong>${quizState.selected === question.answer ? "Верно" : `Правильно: ${escapeHtml(question.answer)}`}</strong>
          <p>${escapeHtml(question.explanation)}</p>
        </div>
        <button class="secondary-button quiz-next" type="button" data-quiz-action="next">
          ${quizState.index === total - 1 ? "Показать результат" : "Следующий вопрос"}
        </button>
      ` : ""}
    </div>
  `;
}

function handleGuideQuizClick(event) {
  const optionButton = event.target.closest("button[data-quiz-option]");
  if (optionButton && !quizState.answered && !quizState.finished) {
    const question = quizState.questions[quizState.index];
    quizState.selected = optionButton.dataset.quizOption;
    quizState.answered = true;
    if (quizState.selected === question.answer) {
      quizState.score += 1;
    }
    renderGuideQuiz();
    return;
  }

  const actionButton = event.target.closest("button[data-quiz-action]");
  if (!actionButton) {
    return;
  }

  if (actionButton.dataset.quizAction === "restart") {
    quizRun += 1;
    quizState = createQuizState();
    renderGuideQuiz();
    return;
  }

  if (actionButton.dataset.quizAction === "next" && quizState.answered) {
    if (quizState.index === quizState.questions.length - 1) {
      quizState.finished = true;
      preferences.quizBest = Math.max(Number(preferences.quizBest) || 0, quizState.score);
      savePreferences();
      renderGuideStats();
    } else {
      quizState.index += 1;
      quizState.selected = null;
      quizState.answered = false;
    }
    renderGuideQuiz();
  }
}

function renderLessons() {
  elements.lessonTopicButtons.forEach((button) => {
    const active = button.dataset.lessonTopic === lessonTopic;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  const visibleLessons = lessons
    .map((lesson, index) => ({ lesson, index }))
    .filter(({ lesson }) => lessonTopic === "all" || lesson.topic === lessonTopic);

  elements.lessonGrid.innerHTML = visibleLessons
    .map(({ lesson, index }) => `
      <article class="lesson-card">
        <div class="lesson-top">
          <span class="lesson-number">${String(index + 1).padStart(2, "0")}</span>
          <div class="lesson-tags">
            <span>${escapeHtml(topicLabel(lesson.topic))}</span>
            <span class="lesson-level">${escapeHtml(lesson.level)}</span>
          </div>
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

function topicLabel(topic) {
  return { grammar: "грамматика", vocabulary: "слова", speaking: "речь" }[topic] ?? topic;
}

function studyDayStreak() {
  const date = new Date();
  if (!(activity[localDateKey(date)]?.answered > 0)) {
    date.setDate(date.getDate() - 1);
  }
  let streak = 0;
  while (activity[localDateKey(date)]?.answered > 0) {
    streak += 1;
    date.setDate(date.getDate() - 1);
  }
  return streak;
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
