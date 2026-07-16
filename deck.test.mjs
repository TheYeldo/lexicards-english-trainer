import test from "node:test";
import assert from "node:assert/strict";

async function loadDeckModule() {
  try {
    return await import(`./deck.mjs?cache=${Date.now()}`);
  } catch (error) {
    assert.fail(`deck module should exist and export learning functions: ${error.message}`);
  }
}

const sampleCards = [
  {
    id: "arrive",
    word: "arrive",
    translation: "прибывать",
    answers: ["приезжать"],
    example: "We arrive at seven.",
    category: "travel",
    level: "A1",
  },
  {
    id: "gate",
    word: "gate",
    translation: "выход на посадку",
    answers: ["гейт"],
    example: "The gate opens soon.",
    category: "travel",
    level: "A2",
  },
  {
    id: "tiny",
    word: "tiny",
    translation: "крошечный",
    answers: ["маленький"],
    example: "This is a tiny detail.",
    category: "daily",
    level: "A1",
  },
];

test("createSession filters by category and exposes progress", async () => {
  const { createSession, currentCard, progressSummary } = await loadDeckModule();

  const session = createSession(sampleCards, { category: "travel" });

  assert.deepEqual(session.order, ["arrive", "gate"]);
  assert.equal(currentCard(session).word, "arrive");
  assert.deepEqual(progressSummary(session), {
    answered: 0,
    total: 2,
    known: 0,
    needsReview: 0,
    streak: 0,
    remaining: 2,
  });
});

test("defaultCards has enough material for a real session", async () => {
  const { defaultCards, categoriesFor, levelsFor } = await loadDeckModule();

  assert.ok(defaultCards.length >= 160, `expected at least 160 cards, got ${defaultCards.length}`);
  assert.ok(categoriesFor(defaultCards).length >= 14);
  assert.deepEqual(levelsFor(defaultCards), ["all", "A2", "B1", "A1", "B2"]);
});

test("createSession can shuffle and limit a practice sprint", async () => {
  const { createSession } = await loadDeckModule();
  const first = createSession(sampleCards, { limit: 2, shuffleSeed: "today" });
  const second = createSession(sampleCards, { limit: 2, shuffleSeed: "today" });

  assert.equal(first.cards.length, 2);
  assert.equal(first.order.length, 2);
  assert.deepEqual(first.order, second.order);
  assert.equal(first.limit, 2);
  assert.equal(first.shuffleSeed, "today");
});

test("rateCurrentCard can add extra repeats for tough mode", async () => {
  const { createSession, rateCurrentCard } = await loadDeckModule();
  const session = createSession(sampleCards, { category: "travel", repeatMisses: 2 });

  const afterAgain = rateCurrentCard(session, "again");

  assert.deepEqual(afterAgain.order, ["arrive", "gate", "arrive", "arrive"]);
  assert.deepEqual(afterAgain.reviewIds, ["arrive"]);
  assert.equal(afterAgain.repeatMisses, 2);
});

test("rateCurrentCard repeats missed cards without mutating the old session", async () => {
  const { createSession, currentCard, rateCurrentCard } = await loadDeckModule();
  const session = createSession(sampleCards, { category: "travel" });

  const afterAgain = rateCurrentCard(session, "again");

  assert.deepEqual(session.order, ["arrive", "gate"]);
  assert.deepEqual(afterAgain.order, ["arrive", "gate", "arrive"]);
  assert.deepEqual(afterAgain.reviewIds, ["arrive"]);
  assert.equal(afterAgain.answered, 1);
  assert.equal(afterAgain.streak, 0);
  assert.equal(currentCard(afterAgain).id, "gate");

  const afterKnown = rateCurrentCard(afterAgain, "known");

  assert.deepEqual(afterKnown.knownIds, ["gate"]);
  assert.equal(afterKnown.answered, 2);
  assert.equal(afterKnown.streak, 1);
  assert.equal(currentCard(afterKnown).id, "arrive");
});

test("checkTranslation accepts answer variants case-insensitively", async () => {
  const { checkTranslation } = await loadDeckModule();

  assert.deepEqual(checkTranslation(sampleCards[0], "  ПРИЕЗЖАТЬ! "), {
    correct: true,
    expected: "прибывать",
    matched: "приезжать",
  });
  assert.deepEqual(checkTranslation(sampleCards[0], "лететь"), {
    correct: false,
    expected: "прибывать",
    matched: null,
  });
});

test("addCustomCard normalizes user cards and keeps existing cards immutable", async () => {
  const { addCustomCard } = await loadDeckModule();

  const updated = addCustomCard(sampleCards, {
    word: " Keep up ",
    translation: "продолжать",
    example: "Keep up the good work.",
    category: "phrases",
    level: "A2",
  });

  assert.equal(sampleCards.length, 3);
  assert.equal(updated.length, 4);
  assert.deepEqual(updated.at(-1), {
    id: "custom-keep-up",
    word: "Keep up",
    translation: "продолжать",
    answers: ["продолжать"],
    example: "Keep up the good work.",
    category: "phrases",
    level: "A2",
  });
});
