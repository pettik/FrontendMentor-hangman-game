export const MAX_MISTAKES = 8;
export const ALPHABET = Object.freeze(Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ"));

/** Match Latin letters with or without accents; punctuation never needs a guess. */
export function normalizeLetter(value) {
  return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
}

export function isGuessable(character) {
  return /^[A-Z]$/.test(normalizeLetter(character));
}

export function createRound(category, word) {
  if (typeof word !== "string" || !Array.from(word).some(isGuessable)) {
    throw new TypeError("A word must contain at least one playable letter.");
  }
  return { category, word, guesses: [], mistakes: 0, status: "playing" };
}

/** Pure transition: duplicate/invalid guesses and finished rounds are no-ops. */
export function guessLetter(round, input) {
  const letter = normalizeLetter(input);
  if (round.status !== "playing" || !/^[A-Z]$/.test(letter) || round.guesses.includes(letter)) {
    return round;
  }
  const guesses = [...round.guesses, letter];
  const letters = Array.from(round.word).filter(isGuessable).map(normalizeLetter);
  const mistakes = round.mistakes + Number(!letters.includes(letter));
  const won = letters.every((character) => guesses.includes(character));
  const status = won ? "won" : mistakes >= MAX_MISTAKES ? "lost" : "playing";
  return { ...round, guesses, mistakes, status };
}

export function describePuzzle(round) {
  return round.word.split(/\s+/).map((word, index) => {
    const letters = Array.from(word).map((character) => {
      if (!isGuessable(character)) return character;
      return round.guesses.includes(normalizeLetter(character)) ? character.toUpperCase() : "blank";
    });
    return `Word ${index + 1}: ${letters.join(", ")}.`;
  }).join(" ");
}

/** Tracks selections for this visit without mutating the supplied JSON. */
export function createWordPicker(data, random = Math.random) {
  const source = data?.categories;
  if (!source || typeof source !== "object" || Array.isArray(source) || !Object.keys(source).length) {
    throw new TypeError("The word list must contain categories.");
  }
  const categories = new Map();
  for (const [category, entries] of Object.entries(source)) {
    if (!category.trim() || !Array.isArray(entries) || !entries.length || entries.some((entry) =>
      typeof entry?.name !== "string" || !Array.from(entry.name).some(isGuessable))) {
      throw new TypeError(`Invalid words in category: ${category}`);
    }
    const words = [...new Set(entries.map((entry) => entry.name))];
    const played = new Set(entries.filter((entry) => entry.selected).map((entry) => entry.name));
    categories.set(category, { words, played });
  }
  return {
    categories: [...categories.keys()],
    remaining(category) {
      const pool = categories.get(category);
      return pool ? pool.words.filter((word) => !pool.played.has(word)).length : 0;
    },
    next(category) {
      const pool = categories.get(category);
      if (!pool) throw new RangeError(`Unknown category: ${category}`);
      const available = pool.words.filter((word) => !pool.played.has(word));
      if (!available.length) return null;
      const value = random();
      if (!Number.isFinite(value) || value < 0 || value >= 1) {
        throw new RangeError("Random must return a number from 0 (inclusive) to 1 (exclusive).");
      }
      const word = available[Math.floor(value * available.length)];
      pool.played.add(word);
      return word;
    },
  };
}
